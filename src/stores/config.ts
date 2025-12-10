import { defineStore } from 'pinia'
import { ref } from 'vue'
import configApi from '@/api/config'
import type { SystemConfig } from '@/types'

export const useConfigStore = defineStore('config', () => {
    const config = ref<SystemConfig>({
        siteName: 'Wall Photo Display',
        siteDescription: 'A multi-user photo wall application',
        menuTitle: '照片墙',
        menuIconUrl: '',
        forceLogin: false
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
