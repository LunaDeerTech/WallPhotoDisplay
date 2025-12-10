import fs from 'fs/promises'
import path from 'path'
import type { Request, Response } from 'express'

const CONFIG_PATH = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'data/config.json')
console.log('Config path resolved to:', CONFIG_PATH)

const DEFAULT_CONFIG = {
  siteName: 'Wall Photo Display',
  siteDescription: 'A multi-user photo wall application',
  menuTitle: '照片墙',
  menuIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
}

export const getConfig = async (req: Request, res: Response) => {
  try {
    let config = DEFAULT_CONFIG
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8')
      // Strip BOM if present
      const jsonContent = data.replace(/^\uFEFF/, '')
      config = { ...DEFAULT_CONFIG, ...JSON.parse(jsonContent) }
    } catch (error: any) {
      console.error('Error reading config file:', error)
      // If file doesn't exist, use default and create file
      if (error.code === 'ENOENT') {
        console.log('Config file not found, creating default...')
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
        await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
      } else {
        // For other errors (e.g. JSON parse), log and return default
        console.warn('Using default config due to read error')
      }
    }
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
