<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Title } from '../../../shared/types'
import { getPopularMovies, getTopRatedMovies, getTrending } from '../api/tmdb'
import Carousel from './Carousel.vue'

const trending = ref<Title[]>([])
const popular = ref<Title[]>([])
const topRated = ref<Title[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const [trendingResult, popularResult, topRatedResult] = await Promise.all([
      getTrending(),
      getPopularMovies(),
      getTopRatedMovies()
    ])
    trending.value = trendingResult
    popular.value = popularResult
    topRated.value = topRatedResult
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar catálogo do TMDb'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="discover">
    <div v-if="loading" class="centered">
      <img class="logo" src="../assets/sofaos.svg" alt="sofa.OS" />
    </div>
    <p v-else-if="error" class="centered status">{{ error }}</p>
    <template v-else>
      <Carousel label="Em alta" :items="trending" />
      <Carousel label="Populares" :items="popular" />
      <Carousel label="Mais bem avaliados" :items="topRated" />
    </template>
  </div>
</template>

<style scoped>
.discover {
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
