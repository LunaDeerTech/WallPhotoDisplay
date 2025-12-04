<template>
  <div class="app">
    <MainContent />
    <Sidebar @open-dialog="handleOpenDialog" />
    
    <!-- Global dialogs will be added here -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import MainContent from './components/layout/MainContent.vue'

const handleOpenDialog = (dialogName) => {
  console.log('Open dialog:', dialogName)
  // Dialog handling will be implemented later
}
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
</style>
