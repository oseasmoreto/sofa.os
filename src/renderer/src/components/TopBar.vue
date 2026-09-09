<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { streamingApps } from '../../../shared/streamingApps'
import { registerRow } from '../composables/spatialNav'
import { launchApp } from '../api/appLauncher'

const iconRefs = ref<HTMLElement[]>([])

function setIconRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) iconRefs.value[index] = el
}

function open(appId: string): void {
  launchApp(appId).catch((error: unknown) => {
    console.error(`Falha ao abrir o app ${appId}:`, error)
  })
}

let unregister: (() => void) | null = null

onMounted(() => {
  unregister = registerRow(() => iconRefs.value)
})

onUnmounted(() => {
  unregister?.()
})
</script>

<template>
  <nav class="top-bar">
    <div
      v-for="(app, index) in streamingApps"
      :key="app.id"
      :ref="(el) => setIconRef(el as Element | null, index)"
      class="app-icon"
      :style="{ backgroundColor: app.color }"
      :title="app.name"
      role="button"
      tabindex="0"
      @click="open(app.id)"
      @keydown.enter="open(app.id)"
    >
      <img
        v-if="app.icon"
        :src="app.icon"
        :alt="app.name"
        class="app-icon-logo"
        :class="{ 'app-icon-logo--cover': app.iconFit === 'cover' }"
      />
      <span v-else class="app-icon-label">{{ app.initials }}</span>
    </div>
  </nav>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 48px 0 32px;
}

.app-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  outline: none;
  cursor: pointer;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.app-icon:focus-visible {
  transform: scale(1.1);
  box-shadow:
    0 0 0 3px #fff,
    0 4px 14px rgba(0, 0, 0, 0.4);
}

.app-icon-label {
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.5px;
}

.app-icon-logo {
  width: 60%;
  height: 60%;
  object-fit: contain;
  -webkit-user-drag: none;
  pointer-events: none;
}

.app-icon-logo--cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
}
</style>
