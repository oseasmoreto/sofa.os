<script setup lang="ts">
import { Power, Minus, Plus } from 'lucide-vue-next'
import { closeWindow, minimizeWindow, toggleMaximizeWindow } from '../api/windowControls'
</script>

<template>
  <div class="window-controls">
    <button type="button" class="control close" aria-label="Fechar" @click="closeWindow">
      <Power :size="8" :stroke-width="3" />
    </button>
    <button type="button" class="control minimize" aria-label="Minimizar" @click="minimizeWindow">
      <Minus :size="8" :stroke-width="3" />
    </button>
    <button
      type="button"
      class="control maximize"
      aria-label="Maximizar"
      @click="toggleMaximizeWindow"
    >
      <Plus :size="8" :stroke-width="3" />
    </button>
  </div>
</template>

<style scoped>
.window-controls {
  position: fixed;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 1000;
  -webkit-app-region: no-drag;
}

.control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.12);
  color: transparent;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.control:hover {
  color: rgba(0, 0, 0, 0.6);
}

.control.close:hover {
  background-color: #ff5f57;
}

.control.minimize:hover {
  background-color: #febc2e;
}

.control.maximize:hover {
  background-color: #28c840;
}
</style>
