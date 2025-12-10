<template>
  <div class="about-system">
    <div class="header">
      <h2>关于系统</h2>
      <p class="subtitle">Wall Photo Display</p>
    </div>

    <div class="content-section">
      <div class="info-card">
        <h3>项目介绍</h3>
        <p class="description">
          Wall Photo Display 是一个多用户照片墙 PWA 应用，旨在提供优雅的照片展示和管理体验。
          前端采用 Vue 3 + TypeScript 构建，后端使用 Express.js 提供服务。
        </p>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="info-subsection">
            <h4>版本信息</h4>
            <div class="version-info">
              <div class="info-row">
                <span class="label">当前版本</span>
                <span class="value">v1.0.0</span>
              </div>
              <div class="info-row">
                <span class="label">构建时间</span>
                <span class="value">2025-12-10</span>
              </div>
            </div>
          </div>

          <div class="info-subsection">
            <h4>技术栈</h4>
            <div class="tech-tags">
              <span class="tag">Vue 3</span>
              <span class="tag">TypeScript</span>
              <span class="tag">Vite</span>
              <span class="tag">Express</span>
              <span class="tag">SQLite</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <h3>开源信息</h3>
        <div class="opensource-info">
          <p>本项目已在 GitHub 开源，欢迎 Star 和 Fork。</p>
          <div class="license-info">
            <span class="label">开源协议：</span>
            <span class="value">GNU GPLv3</span>
          </div>
          <a href="https://github.com/LunaDeerTech/WallPhotoDisplay" target="_blank" class="github-link">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            LunaDeerTech/WallPhotoDisplay
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>&copy; 2025 Wall Photo Display. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No special logic needed for now
</script>

<style scoped>
.about-system {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.info-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.info-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.info-card p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-lg) 0;
}

.info-subsection h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: var(--color-text-secondary);
}

.info-row .value {
  font-family: monospace;
  color: var(--color-text-primary);
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
}

.opensource-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.license-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.95rem;
}

.license-info .label {
  color: var(--color-text-secondary);
}

.license-info .value {
  color: var(--color-text-primary);
  font-weight: 500;
  background: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
  width: fit-content;
}

.github-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.footer {
  margin-top: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
}
</style>
