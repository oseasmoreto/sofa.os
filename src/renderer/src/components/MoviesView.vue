<script setup lang="ts">
import { computed, ref } from 'vue'
import { MOVIE_GENRES } from '../../../shared/genres'
import {
  getMoviesByGenre,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies
} from '../api/tmdb'
import CategoryTabs from './CategoryTabs.vue'
import CategoryGrid from './CategoryGrid.vue'

const tabs = [
  { id: 'trending', label: 'Em alta', fetch: getTrendingMovies },
  { id: 'popular', label: 'Populares', fetch: getPopularMovies },
  { id: 'top_rated', label: 'Mais bem avaliados', fetch: getTopRatedMovies },
  ...MOVIE_GENRES.map((genre) => ({
    id: `genre-${genre.id}`,
    label: genre.label,
    fetch: (page?: number) => getMoviesByGenre(genre.id, page)
  }))
]

const activeTabId = ref(tabs[0].id)
const activeTab = computed(() => tabs.find((tab) => tab.id === activeTabId.value) ?? tabs[0])
</script>

<template>
  <div class="movies-view">
    <CategoryTabs v-model="activeTabId" :tabs="tabs" />
    <CategoryGrid :key="activeTabId" :fetch="activeTab.fetch" />
  </div>
</template>

<style scoped>
.movies-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
