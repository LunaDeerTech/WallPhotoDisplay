import { defineStore } from 'pinia'
import { ref } from 'vue'
import configApi from '@/api/config'
import type { SystemConfig } from '@/types'

export const useConfigStore = defineStore('config', () => {
    const config = ref<SystemConfig>({
        siteName: 'Wall Photo Display',
        siteDescription: 'A multi-user photo wall application',
        menuTitle: '照片墙',
        menuIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
    })

    const isLoading = ref(false)

    async function fetchConfig() {
        isLoading.value = true
        try {
            const data = await configApi.getConfig()
            if (data) {
                config.value = data
                updateDocumentTitle()
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
        } finally {
            isLoading.value = false
        }
    }
    
    async function updateConfig(newConfig: Partial<SystemConfig>) {
        try {
            console.log('Sending config update:', newConfig)
            const data = await configApi.updateConfig(newConfig)
            console.log('Received updated config:', data)
            config.value = data
            updateDocumentTitle()
            return true
        } catch (error) {
            console.error('Failed to update config:', error)
            return false
        }
    }

    function updateDocumentTitle() {
        document.title = config.value.siteName
    }

    return {
        config,
        isLoading,
        fetchConfig,
        updateConfig
    }
})
