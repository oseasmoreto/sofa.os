<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Star, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Title, TitleDetails, WatchProvider } from '../../../shared/types'
import { matchStreamingApp, type StreamingApp } from '../../../shared/streamingApps'
import { getTitleDetails } from '../api/tmdb'
import { launchApp } from '../api/appLauncher'
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '../api/watchlist'
import { pauseSpatialNavigation, resumeSpatialNavigation } from '../composables/spatialNav'

const props = defineProps<{ title: Title }>()
const emit = defineEmits<{ close: [] }>()

const overlayRef = ref<HTMLDivElement | null>(null)
const details = ref<TitleDetails | null>(null)
const loadingExtras = ref(true)

const actionableProviders = computed(() => {
  if (!details.value) return []

  return details.value.providers
    .map((provider) => ({ provider, app: matchStreamingApp(provider.name) }))
    .filter((entry): entry is { provider: WatchProvider; app: StreamingApp } => Boolean(entry.app))
})

const providerRefs = ref<HTMLElement[]>([])
const focusedProviderIndex = ref(0)

function setProviderRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) providerRefs.value[index] = el
}

function focusProvider(index: number): void {
  if (!actionableProviders.value.length) return
  const clamped = Math.min(Math.max(index, 0), actionableProviders.value.length - 1)
  focusedProviderIndex.value = clamped
  providerRefs.value[clamped]?.focus()
}

function launchProvider(app: StreamingApp): void {
  launchApp(app.id, props.title.title).catch((error: unknown) => {
    console.error(`Falha ao abrir ${app.name}:`, error)
  })
}

const [castEmblaRef, castEmblaApi] = emblaCarouselVue({
  align: 'start',
  containScroll: 'trimSnaps',
  dragFree: true
})
const castCanScrollPrev = ref(false)
const castCanScrollNext = ref(false)

function setCastEmblaRef(el: Element | null): void {
  castEmblaRef.value = (el as HTMLElement) ?? undefined
}

function updateCastScrollState(): void {
  castCanScrollPrev.value = castEmblaApi.value?.canScrollPrev() ?? false
  castCanScrollNext.value = castEmblaApi.value?.canScrollNext() ?? false
}

function castScrollPrev(): void {
  castEmblaApi.value?.scrollPrev()
}

function castScrollNext(): void {
  castEmblaApi.value?.scrollNext()
}

const inWatchlist = ref(false)

async function refreshWatchlistStatus(): Promise<void> {
  try {
    const list = await getWatchlist()
    inWatchlist.value = list.some(
      (item) => item.id === props.title.id && item.mediaType === props.title.mediaType
    )
  } catch {
    inWatchlist.value = false
  }
}

function toggleWatchlist(): void {
  const wasInWatchlist = inWatchlist.value
  inWatchlist.value = !wasInWatchlist

  const action = wasInWatchlist
    ? removeFromWatchlist(props.title.id, props.title.mediaType)
    : addToWatchlist({ ...props.title })

  action.catch((error: unknown) => {
    inWatchlist.value = wasInWatchlist
    console.error('Falha ao atualizar a lista:', error)
  })
}

async function loadExtrasAndFocus(): Promise<void> {
  loadingExtras.value = true
  details.value = null
  try {
    details.value = await getTitleDetails(props.title.id, props.title.mediaType)
  } catch {
    details.value = null
  } finally {
    loadingExtras.value = false
  }

  await nextTick()
  castEmblaApi.value?.reInit()
  updateCastScrollState()

  if (actionableProviders.value.length) {
    focusProvider(0)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (!actionableProviders.value.length) return

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusProvider(focusedProviderIndex.value + 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusProvider(focusedProviderIndex.value - 1)
  }
}

onMounted(() => {
  overlayRef.value?.focus()
  pauseSpatialNavigation()
  loadExtrasAndFocus()
  refreshWatchlistStatus()

  const api = castEmblaApi.value
  if (api) {
    api.on('select', updateCastScrollState)
    api.on('reInit', updateCastScrollState)
  }
})

onUnmounted(() => {
  resumeSpatialNavigation()
})

watch(
  () => props.title,
  () => {
    loadExtrasAndFocus()
    refreshWatchlistStatus()
  }
)
</script>

<template>
  <div
    ref="overlayRef"
    class="overlay"
    tabindex="0"
    @keydown="onKeydown"
    @click.self="emit('close')"
  >
    <div class="panel">
      <button type="button" class="close-button" aria-label="Fechar" @click="emit('close')">
        <X :size="18" :stroke-width="2.5" />
      </button>

      <div class="content">
        <img
          v-if="title.posterPath"
          class="poster"
          :src="`https://image.tmdb.org/t/p/w500${title.posterPath}`"
          :alt="title.title"
        />
        <div v-else class="poster poster-fallback">{{ title.title }}</div>

        <div class="info">
          <div class="title-row">
            <h1 class="title">{{ title.title }}</h1>
            <button
              type="button"
              class="bookmark-button"
              :class="{ active: inWatchlist }"
              :aria-label="inWatchlist ? 'Remover da lista' : 'Adicionar à lista'"
              :title="inWatchlist ? 'Remover da lista' : 'Adicionar à lista'"
              @click="toggleWatchlist"
            >
              <component
                :is="inWatchlist ? BookmarkCheck : Bookmark"
                :size="20"
                :stroke-width="2.2"
              />
            </button>
          </div>
          <p class="meta">
            <span class="rating"
              ><Star :size="16" :stroke-width="2.5" /> {{ title.voteAverage.toFixed(1) }}</span
            >
            <span v-if="title.releaseDate">{{ title.releaseDate.slice(0, 4) }}</span>
          </p>
          <p class="overview">{{ title.overview || 'Sem sinopse disponível.' }}</p>

          <p v-if="loadingExtras" class="empty">Carregando elenco e streamings…</p>

          <div v-show="!loadingExtras && (details?.cast.length ?? 0) > 0" class="section">
            <h2 class="section-label">Elenco</h2>
            <div class="cast-wrapper">
              <button
                v-if="castCanScrollPrev"
                type="button"
                class="cast-nav-arrow cast-nav-arrow-prev"
                aria-label="Anterior"
                @click="castScrollPrev"
              >
                <ChevronLeft :size="16" />
              </button>

              <div :ref="(el) => setCastEmblaRef(el as Element | null)" class="cast-viewport">
                <div class="cast-container">
                  <div v-for="member in details?.cast ?? []" :key="member.id" class="cast-member">
                    <img
                      v-if="member.profilePath"
                      class="cast-photo"
                      :src="`https://image.tmdb.org/t/p/w185${member.profilePath}`"
                      :alt="member.name"
                    />
                    <div v-else class="cast-photo cast-photo-fallback" />
                    <span class="cast-name">{{ member.name }}</span>
                  </div>
                </div>
              </div>

              <button
                v-if="castCanScrollNext"
                type="button"
                class="cast-nav-arrow cast-nav-arrow-next"
                aria-label="Próximo"
                @click="castScrollNext"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>

          <div v-show="!loadingExtras && details" class="section">
            <h2 class="section-label">Onde assistir</h2>
            <div v-if="details && details.providers.length" class="providers-row">
              <template v-for="provider in details.providers" :key="provider.id">
                <button
                  v-if="matchStreamingApp(provider.name)"
                  :ref="
                    (el) =>
                      setProviderRef(
                        el as Element | null,
                        actionableProviders.findIndex((entry) => entry.provider.id === provider.id)
                      )
                  "
                  type="button"
                  class="provider-button"
                  :title="`Assistir em ${provider.name}`"
                  @click="launchProvider(matchStreamingApp(provider.name)!)"
                >
                  <img
                    class="provider-logo"
                    :src="`https://image.tmdb.org/t/p/w92${provider.logoPath}`"
                    :alt="provider.name"
                  />
                </button>
                <img
                  v-else
                  class="provider-logo provider-logo-disabled"
                  :src="`https://image.tmdb.org/t/p/w92${provider.logoPath}`"
                  :alt="provider.name"
                  :title="`${provider.name} (abertura não suportada ainda)`"
                />
              </template>
            </div>
            <p v-else class="empty">Não disponível em streaming no Brasil no momento.</p>
            <p class="attribution">Dados de "onde assistir" fornecidos por TMDB e JustWatch.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.72);
  outline: none;
}

.panel {
  position: relative;
  width: min(1100px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  background-color: var(--ev-c-black-soft);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--ev-c-text-1);
  cursor: pointer;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.content {
  display: flex;
  gap: 40px;
  padding: 48px;
}

.poster {
  flex: 0 0 260px;
  width: 260px;
  height: 390px;
  border-radius: 14px;
  object-fit: cover;
  -webkit-user-drag: none;
}

.poster-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
  font-size: 16px;
  color: var(--ev-c-text-2);
  background-color: var(--ev-c-black-mute);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title {
  margin: 0;
  font-size: 32px;
  color: var(--ev-c-text-1);
}

.bookmark-button {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--ev-c-text-1);
  cursor: pointer;
  outline: none;
  transition: background-color 150ms ease;
}

.bookmark-button:hover,
.bookmark-button:focus-visible {
  background-color: rgba(255, 255, 255, 0.2);
}

.bookmark-button.active {
  background-color: #a60866;
  color: #fff;
}

.meta {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--ev-c-text-2);
  font-size: 15px;
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffc857;
  font-weight: 700;
}

.overview {
  margin: 0;
  color: var(--ev-c-text-1);
  line-height: 1.5;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.cast-wrapper {
  position: relative;
}

.cast-viewport {
  overflow: hidden;
  padding-bottom: 4px;
}

.cast-container {
  display: flex;
  gap: 16px;
}

.cast-nav-arrow {
  position: absolute;
  top: 0;
  bottom: 4px;
  z-index: 2;
  width: 28px;
  border: none;
  background: linear-gradient(to right, var(--ev-c-black-soft) 40%, transparent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.cast-nav-arrow-prev {
  left: 0;
}

.cast-nav-arrow-next {
  right: 0;
  justify-content: flex-end;
  background: linear-gradient(to left, var(--ev-c-black-soft) 40%, transparent);
}

.cast-member {
  flex: 0 0 auto;
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.cast-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--ev-c-black-mute);
}

.cast-photo-fallback {
  background-color: var(--ev-c-black-mute);
}

.cast-name {
  font-size: 11px;
  text-align: center;
  color: var(--ev-c-text-2);
}

.providers-row {
  display: flex;
  gap: 10px;
}

.provider-button {
  padding: 0;
  border: none;
  border-radius: 10px;
  background: none;
  cursor: pointer;
  outline: none;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.provider-button:hover {
  transform: scale(1.08);
}

.provider-button:focus-visible {
  transform: scale(1.1);
  box-shadow: 0 0 0 3px #a60866;
  border-radius: 10px;
}

.provider-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  display: block;
}

.provider-logo-disabled {
  opacity: 0.35;
}

.empty {
  margin: 0;
  color: var(--ev-c-text-2);
  font-size: 14px;
}

.attribution {
  margin: 0;
  font-size: 11px;
  color: var(--ev-c-text-3);
}
</style>
