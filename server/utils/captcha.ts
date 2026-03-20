import crypto from 'crypto'

interface CaptchaEntry {
  text: string
  expiresAt: number
}

// In-memory storage for captcha codes
const captchaStore = new Map<string, CaptchaEntry>()

// Cleanup interval (every 60 seconds)
setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of captchaStore) {
    if (entry.expiresAt <= now) {
      captchaStore.delete(id)
    }
  }
}, 60_000)

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const CAPTCHA_LENGTH = 4
const CAPTCHA_TTL = 5 * 60 * 1000 // 5 minutes

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomColor(minBrightness: number = 0, maxBrightness: number = 150): string {
  const r = randomInt(minBrightness, maxBrightness)
  const g = randomInt(minBrightness, maxBrightness)
  const b = randomInt(minBrightness, maxBrightness)
  return `rgb(${r},${g},${b})`
}

/**
 * Generate a random captcha text
 */
function generateText(): string {
  let text = ''
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    text += CAPTCHA_CHARS[randomInt(0, CAPTCHA_CHARS.length - 1)]
  }
  return text
}

/**
 * Generate an SVG captcha image
 */
function generateSvg(text: string): string {
  const width = 150
  const height = 50

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`

  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f0f0f0"/>`

  // Noise lines
  for (let i = 0; i < 5; i++) {
    const x1 = randomInt(0, width)
    const y1 = randomInt(0, height)
    const x2 = randomInt(0, width)
    const y2 = randomInt(0, height)
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${randomColor(100, 200)}" stroke-width="${randomInt(1, 2)}"/>`
  }

  // Noise dots
  for (let i = 0; i < 30; i++) {
    const cx = randomInt(0, width)
    const cy = randomInt(0, height)
    svg += `<circle cx="${cx}" cy="${cy}" r="${randomInt(1, 2)}" fill="${randomColor(100, 200)}"/>`
  }

  // Characters
  const charWidth = width / (CAPTCHA_LENGTH + 1)
  for (let i = 0; i < text.length; i++) {
    const x = charWidth * (i + 0.5) + randomInt(-5, 5)
    const y = height / 2 + randomInt(-5, 8)
    const rotation = randomInt(-25, 25)
    const fontSize = randomInt(24, 32)
    const color = randomColor(0, 120)
    svg += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" transform="rotate(${rotation},${x},${y})">${text[i]}</text>`
  }

  // Bezier curve noise
  for (let i = 0; i < 2; i++) {
    const startX = randomInt(0, 20)
    const startY = randomInt(10, height - 10)
    const cpX1 = randomInt(30, 70)
    const cpY1 = randomInt(0, height)
    const cpX2 = randomInt(80, 120)
    const cpY2 = randomInt(0, height)
    const endX = randomInt(width - 20, width)
    const endY = randomInt(10, height - 10)
    svg += `<path d="M${startX},${startY} C${cpX1},${cpY1} ${cpX2},${cpY2} ${endX},${endY}" stroke="${randomColor(80, 180)}" stroke-width="1.5" fill="none"/>`
  }

  svg += '</svg>'
  return svg
}

/**
 * Generate a new captcha and store it
 * @returns The captcha ID and SVG image
 */
export function createCaptcha(): { id: string; svg: string } {
  const id = crypto.randomUUID()
  const text = generateText()
  const svg = generateSvg(text)

  captchaStore.set(id, {
    text: text.toLowerCase(), // case-insensitive comparison
    expiresAt: Date.now() + CAPTCHA_TTL
  })

  return { id, svg }
}

/**
 * Verify a captcha answer
 * @param id - Captcha ID
 * @param answer - User's answer
 * @returns true if correct and not expired
 */
export function verifyCaptcha(id: string, answer: string): boolean {
  if (!id || !answer) return false

  const entry = captchaStore.get(id)
  if (!entry) return false

  // Delete immediately (one-time use)
  captchaStore.delete(id)

  // Check expiration
  if (entry.expiresAt <= Date.now()) return false

  // Case-insensitive comparison
  return entry.text === answer.toLowerCase()
}
