import request from '@/utils/request'
import type { SystemConfig, ApiResponse } from '@/types'

export default {
  async getConfig(): Promise<SystemConfig> {
    const res = await request.get('/config') as unknown as ApiResponse<SystemConfig>
    if (!res.data) throw new Error(res.error || 'Failed to load system config')
    return res.data
  },
  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await request.put('/config', config) as unknown as ApiResponse<SystemConfig>
    if (!res.data) throw new Error(res.error || 'Failed to update system config')
    return res.data
  }
}
