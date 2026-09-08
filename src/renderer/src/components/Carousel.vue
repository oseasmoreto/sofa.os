<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Title } from '../../../shared/types'
import { useSelection } from '../composables/selection'
import { registerRow } from '../composables/spatialNav'

defineProps<{
  label: string
  items: Title[]
}>()

const emit = defineEmits<{ loadMore: [] }>()

const { select } = useSelection()
const posterBase = 'https://image.tmdb.org/t/p/w300'

const cardRefs = ref<HTMLElement[]>([])

function setCardRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) cardRefs.value[index] = el
}

const SCROLL_THRESHOLD = 400

function onScroll(event: Event): void {
  const el = event.target as HTMLDivElement
  if (el.scrollWidth - el.scrollLeft - el.clientWidth < SCROLL_THRESHOLD) {
    emit('loadMore')
  }
}

let unregister: (() => void) | null = null

onMounted(() => {
  unregister = registerRow(() => cardRefs.value)
})

onUnmounted(() => {
  unregister?.()
})
</script>

<template>
  <section class="carousel">
    <h2 class="label">{{ label }}</h2>
    <div class="row" @scroll="onScroll">
      <div
        v-for="(item, index) in items"
        :key="`${item.mediaType}-${item.id}`"
        :ref="(el) => setCardRef(el as Element | null, index)"
        class="card"
        role="button"
        tabindex="0"
        @click="select(item)"
        @keydown.enter="select(item)"
      >
        <img
          v-if="item.posterPath"
          class="poster"
          :src="`${posterBase}${item.posterPath}`"
          :alt="item.title"
          loading="lazy"
        />
        <div v-else class="poster poster-fallback">{{ item.title }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.carousel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  margin: 0;
  padding: 0 48px 0 32px;
  font-size: 20px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.row {
  display: flex;
  gap: 16px;
  padding: 0 48px 0 32px;
  overflow-x: auto;
}

.card {
  flex: 0 0 auto;
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
  transition: transform 150ms ease;
}

.card:hover {
  transform: scale(1.05);
}

.card:focus-visible {
  transform: scale(1.08);
  outline: none;
  box-shadow: 0 0 0 3px #a60866;
}

.poster {
  width: 160px;
  height: 240px;
  border-radius: 10px;
  object-fit: cover;
  background-color: var(--ev-c-black-soft);
  -webkit-user-drag: none;
}

.poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: var(--ev-c-text-2);
}
</style>
