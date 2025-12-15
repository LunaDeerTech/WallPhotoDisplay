import fs from 'fs/promises'
import path from 'path'
import type { Request, Response } from 'express'

const CONFIG_PATH = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'data/config.json')
console.log('Config path resolved to:', CONFIG_PATH)

const DEFAULT_CONFIG = {
  siteName: 'Wall Photo Display',
  siteDescription: 'A multi-user photo wall application',
  menuTitle: '照片墙',
  menuIconUrl: '',
  forceLogin: false,
  uploadReview: false,
  allowRegistration: false,
  smtpHost: '',
  smtpPort: 465,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpSecure: true
}

export const loadConfig = async () => {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8')
    // Strip BOM if present
    const jsonContent = data.replace(/^\uFEFF/, '')
    return { ...DEFAULT_CONFIG, ...JSON.parse(jsonContent) }
  } catch (error: any) {
    // If file doesn't exist, use default and create file
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
        await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
      } catch (e) {
        console.error('Error creating default config:', e)
      }
      return DEFAULT_CONFIG
    }
    console.warn('Using default config due to read error:', error)
    return DEFAULT_CONFIG
  }
}

export const getConfig = async (_: Request, res: Response) => {
  try {
    const config = await loadConfig()
    res.json({ success: true, data: config })
  } catch (error) {
    console.error('Fatal error in getConfig:', error)
    res.status(500).json({ success: false, error: 'Failed to load configuration' })
  }
}

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const newConfig = req.body
    console.log('Updating config with:', newConfig)
    
    // Merge with existing to ensure no keys are lost if partial update
    let currentConfig = DEFAULT_CONFIG
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8')
      currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(data) }
    } catch (e) {
      // ignore
    }

    const updatedConfig = { ...currentConfig, ...newConfig }

    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
    await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2))
    
    res.json({ success: true, data: updatedConfig })
  } catch (error) {
    console.error('Error updating config:', error)
    res.status(500).json({ success: false, error: 'Failed to update configuration' })
  }
}
