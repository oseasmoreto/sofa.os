<script setup lang="ts">
import { getPopularMovies, getTopRatedMovies, getTrendingMovies } from '../api/tmdb'
import CategoryView from './CategoryView.vue'

const rows = [
  { label: 'Em alta', fetch: getTrendingMovies },
  { label: 'Populares', fetch: getPopularMovies },
  { label: 'Mais bem avaliados', fetch: getTopRatedMovies }
]
</script>

<template>
  <CategoryView :rows="rows" />
</template>
