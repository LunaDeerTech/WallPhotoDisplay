import db from '../config/database.js'

export interface VerificationEntity {
  id: number
  email: string
  code: string
  ip_address: string | null
  expires_at: string
  created_at: string
}

const Verification = {
  /**
   * Create a new verification code
   */
  create(email: string, code: string, ipAddress: string | null, expiresInMinutes: number = 10): void {
    const stmt = db.prepare(`
      INSERT INTO email_verifications (email, code, ip_address, expires_at)
      VALUES (?, ?, ?, datetime('now', '+' || ? || ' minutes'))
    `)
    
    stmt.run(email, code, ipAddress, expiresInMinutes)
  },

  /**
   * Find valid verification code
   */
  findValid(email: string, code: string): VerificationEntity | undefined {
    const stmt = db.prepare(`
      SELECT * FROM email_verifications 
      WHERE email = ? AND code = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `)
    
    return stmt.get(email, code) as VerificationEntity | undefined
  },

  /**
   * Check rate limit (e.g., max 1 code per minute for same email or IP)
   */
  checkRateLimit(email: string, ipAddress: string | null): boolean {
    // Check last minute for email
    const emailStmt = db.prepare(`
      SELECT COUNT(*) as count FROM email_verifications 
      WHERE email = ? AND created_at > datetime('now', '-1 minute')
    `)
    const emailCount = (emailStmt.get(email) as { count: number }).count
    if (emailCount > 0) return false

    // Check last minute for IP if provided
    if (ipAddress) {
      const ipStmt = db.prepare(`
        SELECT COUNT(*) as count FROM email_verifications 
        WHERE ip_address = ? AND created_at > datetime('now', '-1 minute')
      `)
      const ipCount = (ipStmt.get(ipAddress) as { count: number }).count
      if (ipCount > 0) return false
    }

    return true
  },

  /**
   * Delete used codes for email
   */
  deleteByEmail(email: string): void {
    const stmt = db.prepare('DELETE FROM email_verifications WHERE email = ?')
    stmt.run(email)
  },

  /**
   * Clean up expired codes
   */
  cleanup(): void {
    const stmt = db.prepare("DELETE FROM email_verifications WHERE expires_at <= datetime('now')")
    stmt.run()
  }
}

export default Verification
