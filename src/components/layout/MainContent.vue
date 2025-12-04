<template>
  <main class="main-content">
    <div class="content-body">
      <!-- PhotoWaterfall component will be added here -->
      <div class="placeholder">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>照片墙正在加载...</p>
      </div>
    </div>
  </main>
</template>

<script setup>
// import { usePhotosStore } from '@/stores/photos'
// import { useSettingsStore } from '@/stores/settings'

// const photosStore = usePhotosStore()
// const settingsStore = useSettingsStore()
</script>

<style scoped>
.main-content {
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  /* Leave space for floating sidebar on left */
  padding-left: calc(var(--sidebar-width) + var(--spacing-lg) * 2);
}

.content-body {
  min-height: 100vh;
  padding: var(--spacing-lg);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - var(--spacing-lg) * 2);
  color: var(--color-text-muted);
  gap: var(--spacing-lg);
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  opacity: 0.3;
  stroke-width: 1;
}

.placeholder p {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

/* Wider screens with expanded sidebar */
@media (min-width: 1400px) {
  .main-content {
    padding-left: calc(var(--sidebar-expanded-width) + var(--spacing-lg) * 2);
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .main-content {
    padding-left: 0;
  }

  .content-body {
    padding: var(--spacing-md);
    /* Account for bottom navigation bar */
    padding-bottom: calc(var(--spacing-md) + 80px);
  }

  .placeholder {
    height: calc(100vh - 80px - var(--spacing-md) * 2);
  }

  .placeholder-icon {
    width: 64px;
    height: 64px;
  }
}
</style>
