<script setup lang="ts">
import { Bookmark, Film, Home, Sparkles, Tv } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  focusGrid,
  pauseSpatialNavigation,
  resumeSpatialNavigation,
  setLeftEdgeHandler
} from '../composables/spatialNav'

export type SidebarView = 'home' | 'movies' | 'series' | 'releases' | 'watchlist'

const props = defineProps<{ modelValue: SidebarView }>()
const emit = defineEmits<{ 'update:modelValue': [SidebarView] }>()

const navItems: { id: SidebarView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Filmes', icon: Film },
  { id: 'series', label: 'Séries', icon: Tv },
  { id: 'releases', label: 'Lançamentos', icon: Sparkles },
  { id: 'watchlist', label: 'Minha Lista', icon: Bookmark }
]

const itemRefs = ref<HTMLElement[]>([])
const focusedIndex = ref(0)

function setItemRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) itemRefs.value[index] = el
}

function focusItem(index: number): void {
  const clamped = Math.min(Math.max(index, 0), navItems.length - 1)
  focusedIndex.value = clamped
  itemRefs.value[clamped]?.focus()
}

function selectItem(index: number): void {
  focusedIndex.value = index
  emit('update:modelValue', navItems[index].id)
}

function onFocusIn(index: number): void {
  focusedIndex.value = index
  pauseSpatialNavigation()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusItem(focusedIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusItem(focusedIndex.value - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    resumeSpatialNavigation()
    focusGrid()
  }
}

function enterFromGrid(): void {
  pauseSpatialNavigation()
  focusItem(focusedIndex.value)
}

onMounted(() => {
  setLeftEdgeHandler(enterFromGrid)
})

onUnmounted(() => {
  setLeftEdgeHandler(null)
})
</script>

<template>
  <nav class="sidebar" @keydown="onKeydown">
    <img class="mark" src="/favicon.svg" alt="sofa.OS" />
    <button
      v-for="(item, index) in navItems"
      :key="item.id"
      :ref="(el) => setItemRef(el as Element | null, index)"
      type="button"
      class="nav-item"
      :class="{ active: props.modelValue === item.id }"
      tabindex="0"
      @click="selectItem(index)"
      @keydown.enter="selectItem(index)"
      @focus="onFocusIn(index)"
    >
      <component :is="item.icon" :size="22" :stroke-width="2" />
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.sidebar {
  flex: 0 0 96px;
  width: 96px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 0 24px;
  background-color: rgba(255, 255, 255, 0.03);
}

.mark {
  width: 32px;
  height: 32px;
  margin-bottom: 20px;
  -webkit-user-drag: none;
}

.nav-item {
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--ev-c-text-2);
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.nav-item .label {
  font-size: 11px;
  font-weight: 600;
}

.nav-item:hover {
  color: var(--ev-c-text-1);
}

.nav-item:focus-visible {
  box-shadow: 0 0 0 3px #a60866;
}

.nav-item.active {
  background-color: rgba(166, 8, 102, 0.25);
  color: var(--ev-c-text-1);
}
</style>
