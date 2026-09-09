<script setup lang="ts">
import { ChevronLeft, ChevronRight, Info, Play } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Title, TitleDetails } from '../../../shared/types'
import { matchStreamingApp } from '../../../shared/streamingApps'
import { getNewReleases, getTitleDetails } from '../api/tmdb'
import { launchApp } from '../api/appLauncher'
import { useSelection } from '../composables/selection'
import { refreshFocus, registerRow } from '../composables/spatialNav'

const ROTATE_INTERVAL = 7000
const ROTATE_CANDIDATES = 8

const props = defineProps<{
  highlightedItem?: Title | null
  fill?: boolean
}>()

const isControlled = computed(() => props.highlightedItem !== undefined)

const { select } = useSelection()

const hero = ref<Title | null>(null)
const heroDetails = ref<TitleDetails | null>(null)

const slides = ref<Title[]>([])
const slideIndex = ref(0)
let rotateTimer: ReturnType<typeof setInterval> | null = null

function stopRotation(): void {
  if (rotateTimer) {
    clearInterval(rotateTimer)
    rotateTimer = null
  }
}

function goToSlide(index: number): void {
  if (!slides.value.length) return
  slideIndex.value = (index + slides.value.length) % slides.value.length
  setHero(slides.value[slideIndex.value])
}

function startRotation(): void {
  stopRotation()
  if (slides.value.length < 2) return
  rotateTimer = setInterval(() => goToSlide(slideIndex.value + 1), ROTATE_INTERVAL)
}

function prevSlide(): void {
  goToSlide(slideIndex.value - 1)
  startRotation()
}

function nextSlide(): void {
  goToSlide(slideIndex.value + 1)
  startRotation()
}

const watchOption = computed(() => {
  if (!heroDetails.value) return null

  for (const provider of heroDetails.value.providers) {
    const app = matchStreamingApp(provider.name)
    if (app) return app
  }

  return null
})

const showSlideNav = computed(() => !isControlled.value && slides.value.length > 1)

// A linha de foco vai [◀ slide, Assistir agora?, Mais informações, slide ▶],
// mas os dois primeiros são condicionais — calcula o índice de cada botão
// dinamicamente em vez de cravar posições fixas.
const actionIndices = computed(() => {
  let next = 0
  const prev = showSlideNav.value ? next++ : -1
  const watchNowIdx = watchOption.value ? next++ : -1
  const info = next++
  const nextSlideIdx = showSlideNav.value ? next++ : -1
  return { prev, watchNow: watchNowIdx, info, next: nextSlideIdx }
})

const actionRefs = ref<HTMLElement[]>([])

function setActionRef(el: Element | null, index: number): void {
  if (index < 0) return
  if (el instanceof HTMLElement) actionRefs.value[index] = el
}

let unregisterActionRow: (() => void) | null = null
let heroRequestId = 0

async function loadHeroDetails(title: Title): Promise<void> {
  const requestId = ++heroRequestId
  try {
    const details = await getTitleDetails(title.id, title.mediaType)
    if (requestId === heroRequestId) heroDetails.value = details
  } catch {
    if (requestId === heroRequestId) heroDetails.value = null
  }
}

function setHero(title: Title): void {
  hero.value = title
  heroDetails.value = null
  loadHeroDetails(title)
}

// A linha registra já no mount (preservando a ordem: o banner é sempre o
// primeiro conteúdo da página). O problema é que os botões só existem no
// DOM depois que `hero` deixa de ser null (são v-if="hero"), então a
// tentativa de auto-foco inicial (que só acontece uma vez) pode encontrar
// a linha vazia. Por isso, assim que `hero` fica disponível, pedimos pro
// spatialNav tentar focar de novo — mas só se nada mais já tiver foco.
watch(hero, async (value) => {
  if (value) {
    await nextTick()
    refreshFocus()
  }
})

watch(
  () => props.highlightedItem,
  (item) => {
    if (item) setHero(item)
  }
)

onMounted(async () => {
  unregisterActionRow = registerRow(() => actionRefs.value)

  if (props.highlightedItem) {
    setHero(props.highlightedItem)
  }

  try {
    const page = await getNewReleases()
    slides.value = page.items.slice(0, ROTATE_CANDIDATES)
    if (!hero.value && slides.value[0]) {
      slideIndex.value = 0
      setHero(slides.value[0])
    }
    if (!isControlled.value) startRotation()
  } catch {
    // sem lista de rotação; segue com o hero vindo de highlightedItem, se houver
  }
})

onUnmounted(() => {
  unregisterActionRow?.()
  stopRotation()
})

function watchNow(): void {
  if (!hero.value || !watchOption.value) return
  launchApp(watchOption.value.id, hero.value.title).catch((error: unknown) => {
    console.error(`Falha ao abrir ${watchOption.value?.name}:`, error)
  })
}

function moreInfo(): void {
  if (hero.value) select(hero.value)
}
</script>

<template>
  <div class="hero" :class="{ 'hero-fill': fill }">
    <Transition name="hero-fade">
      <div
        :key="hero?.id ?? 'empty'"
        class="hero-bg"
        :style="{
          backgroundImage:
            hero && hero.backdropPath
              ? `url(https://image.tmdb.org/t/p/w1280${hero.backdropPath})`
              : undefined
        }"
      />
    </Transition>

    <button
      v-if="showSlideNav"
      :ref="(el) => setActionRef(el as Element | null, actionIndices.prev)"
      type="button"
      class="hero-nav hero-nav-prev"
      tabindex="0"
      aria-label="Lançamento anterior"
      @click="prevSlide"
    >
      <ChevronLeft :size="26" />
    </button>
    <button
      v-if="showSlideNav"
      :ref="(el) => setActionRef(el as Element | null, actionIndices.next)"
      type="button"
      class="hero-nav hero-nav-next"
      tabindex="0"
      aria-label="Próximo lançamento"
      @click="nextSlide"
    >
      <ChevronRight :size="26" />
    </button>

    <div v-if="hero" class="hero-content">
      <h1 class="hero-title">{{ hero.title }}</h1>
      <p class="hero-overview">{{ hero.overview }}</p>

      <div v-if="heroDetails && heroDetails.providers.length" class="hero-providers">
        <span class="hero-providers-label">Onde assistir</span>
        <img
          v-for="provider in heroDetails.providers"
          :key="provider.id"
          class="hero-provider-logo"
          :src="`https://image.tmdb.org/t/p/w92${provider.logoPath}`"
          :alt="provider.name"
          :title="provider.name"
        />
      </div>

      <div class="hero-actions">
        <button
          v-if="watchOption"
          :ref="(el) => setActionRef(el as Element | null, actionIndices.watchNow)"
          type="button"
          class="btn btn-primary"
          tabindex="0"
          @click="watchNow"
        >
          <Play :size="18" fill="currentColor" />
          Assistir agora
        </button>
        <button
          :ref="(el) => setActionRef(el as Element | null, actionIndices.info)"
          type="button"
          class="btn btn-secondary"
          tabindex="0"
          @click="moreInfo"
        >
          <Info :size="18" />
          Mais informações
        </button>
      </div>

      <div v-if="showSlideNav" class="hero-dots">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          type="button"
          class="hero-dot"
          :class="{ active: index === slideIndex }"
          :aria-label="`Ir para ${slide.title}`"
          @click="
            () => {
              goToSlide(index)
              startRotation()
            }
          "
        />
      </div>
    </div>

    <div v-if="$slots.default" class="hero-extra">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  flex: 0 0 auto;
  height: 420px;
  margin: 8px 48px 24px 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: var(--ev-c-black-soft);
  overflow: hidden;
}

.hero-fill {
  flex: 1;
  min-height: 0;
  height: auto;
  margin: 0;
  border-radius: 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center 20%;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 500ms ease;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(to top, rgba(10, 10, 12, 1) 0%, rgba(10, 10, 12, 0.55) 32%, transparent 60%),
    linear-gradient(to right, rgba(10, 10, 12, 0.85) 0%, transparent 60%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 620px;
  padding: 0 48px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}

.hero-nav:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.hero-nav:focus-visible {
  box-shadow: 0 0 0 3px #a60866;
}

.hero-nav-prev {
  left: 16px;
}

.hero-nav-next {
  right: 16px;
}

.hero-dots {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.hero-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background-color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}

.hero-dot:hover {
  background-color: rgba(255, 255, 255, 0.6);
}

.hero-dot.active {
  background-color: #fff;
  transform: scale(1.3);
}

.hero-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.hero-overview {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-providers {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-providers-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.hero-provider-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.btn:focus-visible {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px #fff;
}

.btn-primary {
  background-color: #fff;
  color: #111;
}

.btn-primary:hover {
  background-color: #e6e6e6;
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.28);
}

.hero-extra {
  position: relative;
  z-index: 2;
}

.hero-extra :deep(.category-view) {
  padding-bottom: 24px;
  overflow: visible;
}
</style>
