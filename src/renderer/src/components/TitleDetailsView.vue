<script setup lang="ts">
import { Star, X } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Title, TitleDetails } from '../../../shared/types'
import { getTitleDetails } from '../api/tmdb'
import { pauseSpatialNavigation, resumeSpatialNavigation } from '../composables/spatialNav'

const props = defineProps<{ title: Title }>()
const emit = defineEmits<{ close: [] }>()

const overlayRef = ref<HTMLDivElement | null>(null)
const details = ref<TitleDetails | null>(null)
const loadingExtras = ref(true)

async function loadExtras(): Promise<void> {
  loadingExtras.value = true
  details.value = null
  try {
    details.value = await getTitleDetails(props.title.id, props.title.mediaType)
  } catch {
    details.value = null
  } finally {
    loadingExtras.value = false
  }
}

function handleWatchClick(): void {
  console.log('Abrir app de streaming ainda não implementado')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  loadExtras()
  overlayRef.value?.focus()
  pauseSpatialNavigation()
})

onUnmounted(() => {
  resumeSpatialNavigation()
})

watch(() => props.title, loadExtras)
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
          <h1 class="title">{{ title.title }}</h1>
          <p class="meta">
            <span class="rating"
              ><Star :size="16" :stroke-width="2.5" /> {{ title.voteAverage.toFixed(1) }}</span
            >
            <span v-if="title.releaseDate">{{ title.releaseDate.slice(0, 4) }}</span>
          </p>
          <p class="overview">{{ title.overview || 'Sem sinopse disponível.' }}</p>

          <p v-if="loadingExtras" class="empty">Carregando elenco e streamings…</p>
          <template v-else-if="details">
            <div v-if="details.cast.length" class="section">
              <h2 class="section-label">Elenco</h2>
              <div class="cast-row">
                <div v-for="member in details.cast" :key="member.id" class="cast-member">
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

            <div class="section">
              <h2 class="section-label">Onde assistir</h2>
              <div v-if="details.providers.length" class="providers-row">
                <img
                  v-for="provider in details.providers"
                  :key="provider.id"
                  class="provider-logo"
                  :src="`https://image.tmdb.org/t/p/w92${provider.logoPath}`"
                  :alt="provider.name"
                  :title="provider.name"
                />
              </div>
              <p v-else class="empty">Não disponível em streaming no Brasil no momento.</p>
              <p class="attribution">Dados de "onde assistir" fornecidos por TMDB e JustWatch.</p>
            </div>

            <button
              v-if="details.providers.length"
              type="button"
              class="watch-button"
              @click="handleWatchClick"
            >
              Assistir em {{ details.providers[0].name }}
            </button>
          </template>
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

.title {
  margin: 0;
  font-size: 32px;
  color: var(--ev-c-text-1);
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

.cast-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
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

.provider-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
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

.watch-button {
  align-self: flex-start;
  margin-top: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 24px;
  background-color: #a60866;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.watch-button:hover {
  background-color: #8a0655;
}
</style>
