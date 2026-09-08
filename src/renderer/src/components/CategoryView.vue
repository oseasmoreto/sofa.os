<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Title } from '../../../shared/types'
import Carousel from './Carousel.vue'

const props = defineProps<{
  rows: { label: string; fetch: () => Promise<Title[]> }[]
}>()

const results = ref<Title[][]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    results.value = await Promise.all(props.rows.map((row) => row.fetch()))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar catálogo do TMDb'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="category-view">
    <div v-if="loading" class="centered">
      <img class="logo" src="../assets/sofaos.svg" alt="sofa.OS" />
    </div>
    <p v-else-if="error" class="centered status">{{ error }}</p>
    <template v-else>
      <Carousel
        v-for="(row, index) in rows"
        :key="row.label"
        :label="row.label"
        :items="results[index] ?? []"
      />
    </template>
  </div>
</template>

<style scoped>
.category-view {
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
