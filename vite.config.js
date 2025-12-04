import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Wall Photo Display - 照片墙',
        short_name: 'Wall Photo Display',
        description: '多用户照片墙系统 - PWA应用',
        theme_color: '#4a90d9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'zh-CN',
        categories: ['photo', 'social'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: '浏览照片',
            short_name: '浏览',
            description: '浏览照片墙',
            url: '/',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 跳过等待，立即激活新 Service Worker
        skipWaiting: true,
        clientsClaim: true,
        // 运行时缓存策略
        runtimeCaching: [
          {
            // API 请求使用 NetworkFirst 策略
            urlPattern: /\/api\/(photos|tags)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 天
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 上传的图片使用 CacheFirst 策略
            urlPattern: /\/uploads\/photos\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photo-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 天
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 外部图片资源
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 天
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      // 开发模式下也启用 PWA
      devOptions: {
        enabled: false, // 开发时可设为 true 进行测试
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
