import request from '@/utils/request'
import type { SystemConfig, ApiResponse } from '@/types'

export default {
  async getConfig(): Promise<SystemConfig> {
    const res = await request.get('/config') as unknown as ApiResponse<SystemConfig>
    return res.data
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await request.put('/config', config) as unknown as ApiResponse<SystemConfig>
    return res.data
  }
}
