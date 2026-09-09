<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { ref } from 'vue'
import { useEmblaRow } from '../composables/useEmblaRow'

defineProps<{
  tabs: { id: string; label: string }[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const tabRefs = ref<HTMLElement[]>([])

function setTabRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) tabRefs.value[index] = el
}

const { emblaRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useEmblaRow(
  { align: 'start', containScroll: 'trimSnaps', dragFree: true },
  tabRefs
)

function setEmblaRef(el: Element | null): void {
  emblaRef.value = (el as HTMLElement) ?? undefined
}
</script>

<template>
  <div class="tabs-wrapper">
    <button
      v-if="canScrollPrev"
      type="button"
      class="nav-arrow nav-arrow-prev"
      aria-label="Anterior"
      @click="scrollPrev"
    >
      <ChevronLeft :size="18" />
    </button>

    <div :ref="(el) => setEmblaRef(el as Element | null)" class="tabs-viewport">
      <div class="tabs-container">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          :ref="(el) => setTabRef(el as Element | null, index)"
          type="button"
          class="tab"
          :class="{ active: modelValue === tab.id }"
          tabindex="0"
          @click="emit('update:modelValue', tab.id)"
          @keydown.enter="emit('update:modelValue', tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <button
      v-if="canScrollNext"
      type="button"
      class="nav-arrow nav-arrow-next"
      aria-label="Próximo"
      @click="scrollNext"
    >
      <ChevronRight :size="18" />
    </button>
  </div>
</template>

<style scoped>
.tabs-wrapper {
  position: relative;
  padding: 28px 48px 16px 32px;
}

.tabs-viewport {
  overflow: hidden;
  padding: 6px 10px;
  margin: -6px -10px;
}

.tabs-container {
  display: flex;
  gap: 10px;
}

.tab {
  flex: 0 0 auto;
  padding: 8px 18px;
  border: none;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--ev-c-text-2);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.tab:hover {
  color: var(--ev-c-text-1);
}

.tab:focus-visible {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px #a60866;
}

.tab.active {
  background-color: #a60866;
  color: #fff;
}

.nav-arrow {
  position: absolute;
  top: 0;
  bottom: 16px;
  z-index: 2;
  width: 32px;
  border: none;
  background: linear-gradient(to right, var(--ev-c-black) 30%, transparent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.nav-arrow-prev {
  left: 32px;
}

.nav-arrow-next {
  right: 48px;
  justify-content: flex-end;
  background: linear-gradient(to left, var(--ev-c-black) 30%, transparent);
}
</style>
