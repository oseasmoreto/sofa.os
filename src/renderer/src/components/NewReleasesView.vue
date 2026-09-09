<script setup lang="ts">
import { Info, Play } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Title, TitleDetails } from '../../../shared/types'
import { matchStreamingApp } from '../../../shared/streamingApps'
import { getNewReleases, getTitleDetails } from '../api/tmdb'
import { launchApp } from '../api/appLauncher'
import { useSelection } from '../composables/selection'
import { registerRow } from '../composables/spatialNav'
import CategoryView from './CategoryView.vue'

const { select } = useSelection()

const rows = [{ label: 'Lançamentos', fetch: getNewReleases }]

const hero = ref<Title | null>(null)
const heroDetails = ref<TitleDetails | null>(null)

const watchOption = computed(() => {
  if (!heroDetails.value) return null

  for (const provider of heroDetails.value.providers) {
    const app = matchStreamingApp(provider.name)
    if (app) return app
  }

  return null
})

const actionRefs = ref<HTMLElement[]>([])

function setActionRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) actionRefs.value[index] = el
}

let unregister: (() => void) | null = null
let heroRequestId = 0
let hoverTimer: ReturnType<typeof setTimeout> | null = null

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

function onItemFocus(title: Title): void {
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => setHero(title), 200)
}

onMounted(async () => {
  unregister = registerRow(() => actionRefs.value)

  try {
    const page = await getNewReleases()
    if (page.items[0]) setHero(page.items[0])
  } catch {
    hero.value = null
  }
})

onUnmounted(() => {
  unregister?.()
  if (hoverTimer) clearTimeout(hoverTimer)
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
  <div class="releases-view">
    <div
      class="hero"
      :style="{
        backgroundImage:
          hero && hero.backdropPath
            ? `url(https://image.tmdb.org/t/p/w1280${hero.backdropPath})`
            : undefined
      }"
    >
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
            :ref="(el) => setActionRef(el as Element | null, 0)"
            type="button"
            class="btn btn-primary"
            tabindex="0"
            @click="watchNow"
            @keydown.enter="watchNow"
          >
            <Play :size="18" fill="currentColor" />
            Assistir agora
          </button>
          <button
            :ref="(el) => setActionRef(el as Element | null, watchOption ? 1 : 0)"
            type="button"
            class="btn btn-secondary"
            tabindex="0"
            @click="moreInfo"
            @keydown.enter="moreInfo"
          >
            <Info :size="18" />
            Mais informações
          </button>
        </div>
      </div>

      <div class="hero-rows">
        <CategoryView :rows="rows" @item-focus="onItemFocus" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.releases-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.hero {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background-color: var(--ev-c-black-soft);
  background-size: cover;
  background-position: center 20%;
  transition: background-image 300ms ease;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(10, 10, 12, 1) 0%, rgba(10, 10, 12, 0.55) 32%, transparent 60%),
    linear-gradient(to right, rgba(10, 10, 12, 0.85) 0%, transparent 60%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 620px;
  padding: 0 48px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-title {
  margin: 0;
  font-size: 44px;
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

.hero-rows {
  position: relative;
  z-index: 1;
}

.hero-rows :deep(.category-view) {
  padding-bottom: 24px;
  overflow: visible;
}
</style>
