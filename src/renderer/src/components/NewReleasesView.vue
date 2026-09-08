<script setup lang="ts">
import { getNewReleases } from '../api/tmdb'
import CategoryView from './CategoryView.vue'

const rows = [{ label: 'Lançamentos', fetch: getNewReleases }]
</script>

<template>
  <CategoryView :rows="rows" />
</template>
