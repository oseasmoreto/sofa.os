<script setup lang="ts">
import { getPopularMovies, getTopRatedMovies, getTrending } from '../api/tmdb'
import CategoryView from './CategoryView.vue'

const rows = [
  { label: 'Em alta', fetch: getTrending },
  { label: 'Populares', fetch: getPopularMovies },
  { label: 'Mais bem avaliados', fetch: getTopRatedMovies }
]
</script>

<template>
  <CategoryView :rows="rows" />
</template>
