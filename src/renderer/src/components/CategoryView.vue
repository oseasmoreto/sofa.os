<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Title, TitlePage } from '../../../shared/types'
import Carousel from './Carousel.vue'

const props = defineProps<{
  rows: { label: string; fetch: (page: number) => Promise<TitlePage> }[]
}>()

const emit = defineEmits<{ itemFocus: [Title] }>()

interface RowState {
  items: Title[]
  page: number
  hasMore: boolean
  loadingMore: boolean
}

const rowStates = ref<RowState[]>(
  props.rows.map(() => ({ items: [], page: 0, hasMore: true, loadingMore: false }))
)
const loading = ref(true)
const error = ref<string | null>(null)

async function loadMore(index: number): Promise<void> {
  const state = rowStates.value[index]
  if (!state || state.loadingMore || !state.hasMore) return

  state.loadingMore = true
  try {
    const nextPage = state.page + 1
    const result = await props.rows[index].fetch(nextPage)
    state.items = [...state.items, ...result.items]
    state.page = nextPage
    state.hasMore = result.hasMore
  } catch {
    state.hasMore = false
  } finally {
    state.loadingMore = false
  }
}

onMounted(async () => {
  try {
    await Promise.all(props.rows.map((_, index) => loadMore(index)))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar catálogo do TMDb'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="category-view">
    <div v-if="loading" class="centered">
      <img class="logo" src="../assets/sofaos.svg" alt="sofa.OS" />
    </div>
    <p v-else-if="error" class="centered status">{{ error }}</p>
    <template v-else>
      <Carousel
        v-for="(row, index) in rows"
        :key="row.label"
        :label="row.label"
        :items="rowStates[index].items"
        @load-more="loadMore(index)"
        @item-focus="emit('itemFocus', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.category-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 8px 0 40px;
  overflow-y: auto;
}

.centered {
  flex: 1;
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
  padding: 0 64px;
  font-size: 18px;
  color: #ff6b6b;
  text-align: center;
}
</style>
