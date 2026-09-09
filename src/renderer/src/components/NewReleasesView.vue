<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import type { Title } from '../../../shared/types'
import { getNewReleases } from '../api/tmdb'
import HeroBanner from './HeroBanner.vue'
import CategoryView from './CategoryView.vue'

const rows = [{ label: 'Lançamentos', fetch: getNewReleases }]

const highlighted = ref<Title | null>(null)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function onItemFocus(title: Title): void {
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    highlighted.value = title
  }, 200)
}

onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
})
</script>

<template>
  <div class="releases-view">
    <HeroBanner fill :highlighted-item="highlighted">
      <CategoryView :rows="rows" @item-focus="onItemFocus" />
    </HeroBanner>
  </div>
</template>

<style scoped>
.releases-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
