<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { Title, TitlePage } from '../../../shared/types'
import { useSelection } from '../composables/selection'
import { registerRow } from '../composables/spatialNav'

const props = defineProps<{
  fetch: (page: number) => Promise<TitlePage>
}>()

const { select } = useSelection()

const ROWS_PER_BATCH = 4
const MIN_BATCH_SIZE = 21

const items = ref<Title[]>([])
const buffer = ref<Title[]>([])
const tmdbPage = ref(0)
const hasMoreFromApi = ref(true)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)

const containerRef = ref<HTMLDivElement | null>(null)
const cardRefs = ref<HTMLElement[]>([])
const columnCount = ref(1)

function setCardRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) cardRefs.value[index] = el
}

const CARD_WIDTH = 160
const CARD_GAP = 16
const HORIZONTAL_PADDING = 80

function computeColumnCount(): void {
  const el = containerRef.value
  if (!el) return
  const usableWidth = el.clientWidth - HORIZONTAL_PADDING
  columnCount.value = Math.max(1, Math.floor((usableWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
}

let registeredRows = 0
const unregisterFns: (() => void)[] = []

function registerNewRows(): void {
  const totalRows = Math.ceil(items.value.length / columnCount.value)
  for (let rowIndex = registeredRows; rowIndex < totalRows; rowIndex++) {
    const start = rowIndex * columnCount.value
    const end = start + columnCount.value
    unregisterFns.push(registerRow(() => cardRefs.value.slice(start, end)))
  }
  registeredRows = totalRows
}

async function fetchNextTmdbPage(): Promise<void> {
  const nextPage = tmdbPage.value + 1
  const result = await props.fetch(nextPage)
  buffer.value = [...buffer.value, ...result.items]
  tmdbPage.value = nextPage
  hasMoreFromApi.value = result.hasMore
}

async function loadMore(): Promise<void> {
  if (loadingMore.value) return
  if (!hasMoreFromApi.value && buffer.value.length === 0) return

  const batchSize = Math.max(columnCount.value * ROWS_PER_BATCH, MIN_BATCH_SIZE)

  loadingMore.value = true
  try {
    while (buffer.value.length < batchSize && hasMoreFromApi.value) {
      await fetchNextTmdbPage()
    }

    const releaseCount = Math.min(batchSize, buffer.value.length)
    items.value = [...items.value, ...buffer.value.slice(0, releaseCount)]
    buffer.value = buffer.value.slice(releaseCount)

    await nextTick()
    registerNewRows()
  } catch {
    hasMoreFromApi.value = false
  } finally {
    loadingMore.value = false
  }
}

function onScroll(): void {
  const el = containerRef.value
  if (!el) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 600) {
    loadMore()
  }
}

onMounted(async () => {
  computeColumnCount()
  try {
    await loadMore()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar catálogo do TMDb'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  unregisterFns.forEach((unregister) => unregister())
})
</script>

<template>
  <div ref="containerRef" class="category-grid" @scroll="onScroll">
    <div v-if="loading" class="centered">
      <img class="logo" src="../assets/sofaos.svg" alt="sofa.OS" />
    </div>
    <p v-else-if="error" class="centered status">{{ error }}</p>
    <div v-else class="grid">
      <div
        v-for="(item, index) in items"
        :key="`${item.mediaType}-${item.id}`"
        :ref="(el) => setCardRef(el as Element | null, index)"
        class="card"
        role="button"
        tabindex="0"
        @click="select(item)"
        @keydown.enter="select(item)"
      >
        <img
          v-if="item.posterPath"
          class="poster"
          :src="`https://image.tmdb.org/t/p/w300${item.posterPath}`"
          :alt="item.title"
          loading="lazy"
        />
        <div v-else class="poster poster-fallback">{{ item.title }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-grid {
  flex: 1;
  overflow-y: auto;
  padding: 14px 48px 40px 32px;
  margin-top: -6px;
}

.centered {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  width: 320px;
  max-width: 60vw;
  height: auto;
  -webkit-user-drag: none;
}

.status {
  font-size: 18px;
  color: #ff6b6b;
  text-align: center;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  flex: 0 0 auto;
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
  transition: transform 150ms ease;
}

.card:hover {
  transform: scale(1.05);
  z-index: 1;
}

.card:focus-visible {
  transform: scale(1.08);
  outline: none;
  box-shadow: 0 0 0 3px #a60866;
  z-index: 2;
}

.poster {
  width: 160px;
  height: 240px;
  border-radius: 10px;
  object-fit: cover;
  background-color: var(--ev-c-black-soft);
  -webkit-user-drag: none;
}

.poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: var(--ev-c-text-2);
}
</style>
