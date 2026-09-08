<script setup lang="ts">
import { getPopularTv, getTopRatedTv, getTrendingTv } from '../api/tmdb'
import CategoryView from './CategoryView.vue'

const rows = [
  { label: 'Em alta', fetch: getTrendingTv },
  { label: 'Populares', fetch: getPopularTv },
  { label: 'Mais bem avaliadas', fetch: getTopRatedTv }
]
</script>

<template>
  <CategoryView :rows="rows" />
</template>
