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
