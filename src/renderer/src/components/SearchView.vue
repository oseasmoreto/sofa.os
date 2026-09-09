<script setup lang="ts">
import { Delete, X } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import { searchMulti } from '../api/tmdb'
import { registerRow } from '../composables/spatialNav'
import CategoryGrid from './CategoryGrid.vue'

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]

const query = ref('')
const committedQuery = ref('')

const keyRefs = ref<HTMLElement[][]>(KEYBOARD_ROWS.map(() => []))
const actionRefs = ref<HTMLElement[]>([])

function setKeyRef(el: Element | null, rowIndex: number, colIndex: number): void {
  if (el instanceof HTMLElement) keyRefs.value[rowIndex][colIndex] = el
}

function setActionRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) actionRefs.value[index] = el
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function commitQuery(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    committedQuery.value = query.value.trim()
  }, 500)
}

function pressKey(key: string): void {
  query.value += key
  commitQuery()
}

function pressSpace(): void {
  query.value += ' '
  commitQuery()
}

function pressBackspace(): void {
  query.value = query.value.slice(0, -1)
  commitQuery()
}

function pressClear(): void {
  query.value = ''
  commitQuery()
}

function fetchResults(page: number): ReturnType<typeof searchMulti> {
  return searchMulti(committedQuery.value, page)
}

const unregisterFns: (() => void)[] = []

onMounted(() => {
  KEYBOARD_ROWS.forEach((_, rowIndex) => {
    unregisterFns.push(registerRow(() => keyRefs.value[rowIndex]))
  })
  unregisterFns.push(registerRow(() => actionRefs.value))
})

onUnmounted(() => {
  unregisterFns.forEach((unregister) => unregister())
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="search-view">
    <div class="search-panel">
      <div class="search-input">
        <span v-if="query" class="search-input-text">{{ query }}</span>
        <span v-else class="search-input-placeholder">Buscar filmes e séries…</span>
      </div>

      <div class="keyboard">
        <div v-for="(row, rowIndex) in KEYBOARD_ROWS" :key="rowIndex" class="keyboard-row">
          <button
            v-for="(key, colIndex) in row"
            :key="key"
            :ref="(el) => setKeyRef(el as Element | null, rowIndex, colIndex)"
            type="button"
            class="key"
            tabindex="0"
            @click="pressKey(key)"
            @keydown.enter="pressKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row keyboard-actions">
          <button
            :ref="(el) => setActionRef(el as Element | null, 0)"
            type="button"
            class="key key-wide"
            tabindex="0"
            @click="pressSpace"
            @keydown.enter="pressSpace"
          >
            Espaço
          </button>
          <button
            :ref="(el) => setActionRef(el as Element | null, 1)"
            type="button"
            class="key"
            tabindex="0"
            aria-label="Apagar"
            @click="pressBackspace"
            @keydown.enter="pressBackspace"
          >
            <Delete :size="18" />
          </button>
          <button
            :ref="(el) => setActionRef(el as Element | null, 2)"
            type="button"
            class="key"
            tabindex="0"
            aria-label="Limpar"
            @click="pressClear"
            @keydown.enter="pressClear"
          >
            <X :size="18" />
          </button>
        </div>
      </div>
    </div>

    <CategoryGrid v-if="committedQuery" :key="committedQuery" :fetch="fetchResults" />
    <div v-else class="empty">
      <p>Digite algo no teclado pra buscar filmes e séries.</p>
    </div>
  </div>
</template>

<style scoped>
.search-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px 48px 24px 32px;
}

.search-input {
  padding: 14px 20px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.06);
  font-size: 20px;
  max-width: 560px;
}

.search-input-text {
  color: var(--ev-c-text-1);
}

.search-input-placeholder {
  color: var(--ev-c-text-2);
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.keyboard-row {
  display: flex;
  gap: 10px;
}

.key {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--ev-c-text-1);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}

.key:hover {
  background-color: rgba(255, 255, 255, 0.14);
}

.key:focus-visible {
  transform: scale(1.08);
  box-shadow: 0 0 0 3px #a60866;
}

.key-wide {
  width: 200px;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48px;
}

.empty p {
  color: var(--ev-c-text-2);
  font-size: 16px;
  text-align: center;
}
</style>
