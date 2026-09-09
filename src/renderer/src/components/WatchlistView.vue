<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { WatchlistItem } from '../../../shared/types'
import { getWatchlist } from '../api/watchlist'
import Carousel from './Carousel.vue'

const items = ref<WatchlistItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    items.value = await getWatchlist()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="watchlist-view">
    <p v-if="loading" class="status">Carregando sua lista…</p>
    <p v-else-if="!items.length" class="status">
      Sua lista está vazia. Adicione títulos pelo ícone de marcador na tela de detalhes.
    </p>
    <Carousel v-else label="Minha Lista" :items="items" />
  </div>
</template>

<style scoped>
.watchlist-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 0 40px;
  overflow-y: auto;
}

.status {
  padding: 0 48px 0 32px;
  color: var(--ev-c-text-2);
  font-size: 16px;
}
</style>
