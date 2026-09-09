<script setup lang="ts">
import { computed, ref } from 'vue'
import { TV_GENRES } from '../../../shared/genres'
import { getPopularTv, getTopRatedTv, getTrendingTv, getTvByGenre } from '../api/tmdb'
import CategoryTabs from './CategoryTabs.vue'
import CategoryGrid from './CategoryGrid.vue'

const tabs = [
  { id: 'trending', label: 'Em alta', fetch: getTrendingTv },
  { id: 'popular', label: 'Populares', fetch: getPopularTv },
  { id: 'top_rated', label: 'Mais bem avaliadas', fetch: getTopRatedTv },
  ...TV_GENRES.map((genre) => ({
    id: `genre-${genre.id}`,
    label: genre.label,
    fetch: (page?: number) => getTvByGenre(genre.id, page)
  }))
]

const activeTabId = ref(tabs[0].id)
const activeTab = computed(() => tabs.find((tab) => tab.id === activeTabId.value) ?? tabs[0])
</script>

<template>
  <div class="series-view">
    <CategoryTabs v-model="activeTabId" :tabs="tabs" />
    <CategoryGrid :key="activeTabId" :fetch="activeTab.fetch" />
  </div>
</template>

<style scoped>
.series-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
