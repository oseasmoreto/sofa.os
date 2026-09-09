<script setup lang="ts">
import { getPopularMovies, getTopRatedMovies, getTrending } from '../api/tmdb'
import CategoryView from './CategoryView.vue'
import HeroBanner from './HeroBanner.vue'
import TopBar from './TopBar.vue'

const rows = [
  { label: 'Em alta', fetch: getTrending },
  { label: 'Populares', fetch: getPopularMovies },
  { label: 'Mais bem avaliados', fetch: getTopRatedMovies }
]
</script>

<template>
  <div class="home-view">
    <HeroBanner />
    <TopBar />
    <CategoryView :rows="rows" />
  </div>
</template>

<style scoped>
.home-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
