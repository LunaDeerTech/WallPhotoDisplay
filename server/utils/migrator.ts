import db, { initTables } from '../config/database.js'
import User from '../models/User.js'

interface Migration {
  name: string
  up: () => void
}

/**
 * Migration definitions
 * Add new migrations to the end of this array
 */
const migrations: Migration[] = [
  {
    name: '001_add_status_to_photos',
    up: () => {
      // Check if column exists to make it idempotent
      const photoColumns = db.pragma('table_info(photos)') as Array<{ name: string }>
      const hasStatus = photoColumns.some(col => col.name === 'status')
      
      if (!hasStatus) {
        console.log('Adding status column to photos table...')
        db.exec("ALTER TABLE photos ADD COLUMN status VARCHAR(20) DEFAULT 'approved'")
      }
    }
  },
  {
    name: '002_add_email_to_users',
    up: () => {
      // 1. Add email and email_verified columns to users table
      const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>
      
      if (!userColumns.some(col => col.name === 'email')) {
        console.log('Adding email column to users table...')
        // SQLite does not support adding UNIQUE columns via ALTER TABLE
        db.exec("ALTER TABLE users ADD COLUMN email VARCHAR(255)")
        db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        db.exec("UPDATE users SET email = 'admin@email.com' WHERE username = 'admin' AND email IS NULL")
      }
      
      if (!userColumns.some(col => col.name === 'email_verified')) {
        console.log('Adding email_verified column to users table...')
        db.exec("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0")
        db.exec("UPDATE users SET email_verified = 1 WHERE username = 'admin'")
      }

      // 2. Create email_verifications table
      console.log('Creating email_verifications table...')
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(6) NOT NULL,
          ip_address VARCHAR(45),
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Add index for faster lookups
      db.exec('CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)')
    }
  },
  {
    name: '003_add_ban_fields_to_users',
    up: () => {
      // Add ban-related fields to users table
      const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>

      if (!userColumns.some(col => col.name === 'is_banned')) {
        console.log('Adding is_banned column to users table...')
        db.exec("ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT 0")
        db.exec("UPDATE users SET is_banned = 0")
      }

      if (!userColumns.some(col => col.name === 'banned_reason')) {
        console.log('Adding banned_reason column to users table...')
        db.exec("ALTER TABLE users ADD COLUMN banned_reason VARCHAR(500)")
      }

      if (!userColumns.some(col => col.name === 'banned_at')) {
        console.log('Adding banned_at column to users table...')
        db.exec("ALTER TABLE users ADD COLUMN banned_at DATETIME")
      }

      if (!userColumns.some(col => col.name === 'banned_by')) {
        console.log('Adding banned_by column to users table...')
        db.exec("ALTER TABLE users ADD COLUMN banned_by INTEGER")
        db.exec("CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned)")
      }
    }
  }
]

/**
 * Initialize database and run all pending migrations
 */
export function runMigrations() {
  console.log('Initializing database and checking for migrations...')
  
  // 1. Initialize base tables
  initTables()

  // 2. Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 3. Run migrations
  let appliedCount = 0

  for (const migration of migrations) {
    // Check if migration has already been applied
    const row = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migration.name)
    
    if (!row) {
      console.log(`Applying migration: ${migration.name}`)
      try {
        // Run migration in a transaction
        const runMigration = db.transaction(() => {
          migration.up()
          db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name)
        })
        
        runMigration()
        console.log(`✓ Migration ${migration.name} applied successfully`)
        appliedCount++
      } catch (error) {
        console.error(`✗ Failed to apply migration ${migration.name}:`, error)
        throw error // Stop migration process on error
      }
    }
  }

  if (appliedCount > 0) {
    console.log(`Successfully applied ${appliedCount} migrations`)
  } else {
    console.log('Database schema is up to date')
  }

  // 4. Ensure default admin user exists
  ensureDefaultAdmin()
}

function ensureDefaultAdmin() {
  const defaultAdmin = {
    username: 'admin',
    password: 'admin123',
    displayName: '管理员',
    role: 'admin' as const
  }

  try {
    if (!User.existsByUsername(defaultAdmin.username)) {
      console.log('Creating default admin user...')
      const admin = User.create(defaultAdmin)
      if (admin) {
        console.log('✓ Default admin user created')
        console.log(`  Username: ${admin.username}`)
        console.log(`  Password: ${defaultAdmin.password}`)
        console.log('  ⚠️  Please change the password after first login!')
      }
    }
  } catch (error) {
    console.error('✗ Failed to check/create default admin:', error)
    // Don't throw here, allow server to start even if admin creation fails (e.g. DB issues)
    // But usually if DB is broken, previous steps would have failed.
  }
}
