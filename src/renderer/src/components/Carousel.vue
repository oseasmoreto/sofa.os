<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import type { Title } from '../../../shared/types'
import { useSelection } from '../composables/selection'
import { useEmblaRow } from '../composables/useEmblaRow'

const props = defineProps<{
  label: string
  items: Title[]
}>()

const emit = defineEmits<{ loadMore: []; itemFocus: [Title] }>()

const { select } = useSelection()
const posterBase = 'https://image.tmdb.org/t/p/w300'

const cardRefs = ref<HTMLElement[]>([])

function setCardRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) cardRefs.value[index] = el
}

const { emblaRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext, reInit } = useEmblaRow(
  { align: 'start', containScroll: 'trimSnaps', dragFree: true },
  cardRefs,
  () => emit('loadMore')
)

function setEmblaRef(el: Element | null): void {
  emblaRef.value = (el as HTMLElement) ?? undefined
}

watch(
  () => props.items.length,
  async () => {
    await nextTick()
    reInit()
  }
)
</script>

<template>
  <section class="carousel">
    <h2 v-if="label" class="label">{{ label }}</h2>
    <div class="carousel-wrapper">
      <button
        v-if="canScrollPrev"
        type="button"
        class="nav-arrow nav-arrow-prev"
        aria-label="Anterior"
        @click="scrollPrev"
      >
        <ChevronLeft :size="24" />
      </button>

      <div :ref="(el) => setEmblaRef(el as Element | null)" class="embla-viewport">
        <div class="embla-container">
          <div
            v-for="(item, index) in items"
            :key="`${item.mediaType}-${item.id}`"
            class="embla-slide"
          >
            <div
              :ref="(el) => setCardRef(el as Element | null, index)"
              class="card"
              role="button"
              tabindex="0"
              @click="select(item)"
              @keydown.enter="select(item)"
              @focus="emit('itemFocus', item)"
              @mouseenter="emit('itemFocus', item)"
            >
              <img
                v-if="item.posterPath"
                class="poster"
                :src="`${posterBase}${item.posterPath}`"
                :alt="item.title"
                loading="lazy"
              />
              <div v-else class="poster poster-fallback">{{ item.title }}</div>
              <span v-if="!item.availableInBR" class="unavailable-badge">Indisponível no BR</span>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="canScrollNext"
        type="button"
        class="nav-arrow nav-arrow-next"
        aria-label="Próximo"
        @click="scrollNext"
      >
        <ChevronRight :size="24" />
      </button>
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

.carousel-wrapper {
  position: relative;
}

.embla-viewport {
  overflow: hidden;
  padding: 14px 48px 14px 32px;
  margin: -14px 0;
}

.embla-container {
  display: flex;
  gap: 16px;
}

.embla-slide {
  flex: 0 0 auto;
  min-width: 0;
}

.card {
  position: relative;
  flex: 0 0 auto;
  width: 160px;
  cursor: pointer;
  border-radius: 10px;
  transition: transform 150ms ease;
}

.unavailable-badge {
  position: absolute;
  left: 6px;
  bottom: 6px;
  right: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  background-color: rgba(20, 20, 22, 0.85);
  color: #ff8a8a;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  pointer-events: none;
}

.card:hover {
  transform: scale(1.05);
  z-index: 1;
}

.card:focus-visible {
  transform: scale(1.08);
  outline: none;
  box-shadow: 0 0 0 3px #a60866;
  z-index: 2;
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

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.nav-arrow:hover {
  background-color: rgba(0, 0, 0, 0.85);
}

.nav-arrow-prev {
  left: 8px;
}

.nav-arrow-next {
  right: 8px;
}
</style>
