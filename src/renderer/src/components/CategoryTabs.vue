<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { registerRow } from '../composables/spatialNav'

defineProps<{
  tabs: { id: string; label: string }[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const tabRefs = ref<HTMLElement[]>([])

function setTabRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) tabRefs.value[index] = el
}

let unregister: (() => void) | null = null

onMounted(() => {
  unregister = registerRow(() => tabRefs.value)
})

onUnmounted(() => {
  unregister?.()
})
</script>

<template>
  <div class="tabs">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :ref="(el) => setTabRef(el as Element | null, index)"
      type="button"
      class="tab"
      :class="{ active: modelValue === tab.id }"
      tabindex="0"
      @click="emit('update:modelValue', tab.id)"
      @keydown.enter="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 10px;
  padding: 0 48px 16px 32px;
  overflow-x: auto;
}

.tab {
  flex: 0 0 auto;
  padding: 8px 18px;
  border: none;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--ev-c-text-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.tab:hover {
  color: var(--ev-c-text-1);
}

.tab:focus-visible {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px #a60866;
}

.tab.active {
  background-color: #a60866;
  color: #fff;
}
</style>
