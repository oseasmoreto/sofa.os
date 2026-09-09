<script setup lang="ts">
import {
  AlertTriangle,
  Bookmark,
  Check,
  Download,
  Film,
  Home,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Tv
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  focusGrid,
  pauseSpatialNavigation,
  resetPosition,
  resumeSpatialNavigation,
  setLeftEdgeHandler
} from '../composables/spatialNav'
import { closeWindow } from '../api/windowControls'
import { useUpdater } from '../composables/useUpdater'
import { getAppVersion } from '../api/updater'

export type SidebarView = 'home' | 'movies' | 'series' | 'releases' | 'search' | 'watchlist'

// Sem a barra inicial (que funcionaria em dev mas quebra no app empacotado,
// que abre via file:// — caminho começando com "/" vira raiz do disco, não
// da pasta do app). Como binding dinâmica, o compilador do Vue não tenta
// resolver isso como import relativo ao componente (o que falharia, já que
// o arquivo real está em public/, não ao lado do Sidebar.vue).
const markIcon = 'favicon.svg'

const props = defineProps<{ modelValue: SidebarView }>()
const emit = defineEmits<{ 'update:modelValue': [SidebarView] }>()

const navItems: { id: SidebarView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Filmes', icon: Film },
  { id: 'series', label: 'Séries', icon: Tv },
  { id: 'releases', label: 'Lançamentos', icon: Sparkles },
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'watchlist', label: 'Minha Lista', icon: Bookmark }
]

const itemRefs = ref<HTMLElement[]>([])
const focusedIndex = ref(0)

// Só pra saber de olho na TV/print qual build está de fato instalada, sem
// precisar abrir o Finder — útil pra cruzar com a versão publicada no
// GitHub Release quando algo parece desatualizado.
const appVersion = ref('')

getAppVersion()
  .then((version) => {
    appVersion.value = version
  })
  .catch(() => {
    appVersion.value = ''
  })

const { status: updateStatus, check: checkForUpdates, openDownload } = useUpdater()

const updateLabel = computed(() => {
  switch (updateStatus.value.state) {
    case 'checking':
      return 'Verificando…'
    case 'available':
      return 'Nova versão'
    case 'not-available':
      return 'Atualizado'
    case 'error':
      return 'Falha'
    default:
      return 'Atualizar'
  }
})

const updateIcon = computed(() => {
  switch (updateStatus.value.state) {
    case 'available':
      return Download
    case 'not-available':
      return Check
    case 'error':
      return AlertTriangle
    default:
      return RefreshCw
  }
})

// Instalação automática (Squirrel.Mac) exige certificado de assinatura pago
// da Apple pra funcionar de ponta a ponta — sem ele, a checagem de
// consistência entre versões falha mesmo com assinatura ad-hoc. Por isso,
// ao detectar versão nova, o botão só abre a página de download da release
// (reinstalação continua manual, igual já era antes de existir esse botão).
function onUpdateActivate(): void {
  if (updateStatus.value.state === 'available') {
    openDownload()
  } else if (updateStatus.value.state !== 'checking') {
    checkForUpdates()
  }
}

function setItemRef(el: Element | null, index: number): void {
  if (el instanceof HTMLElement) itemRefs.value[index] = el
}

function focusItem(index: number): void {
  const clamped = Math.min(Math.max(index, 0), itemRefs.value.length - 1)
  focusedIndex.value = clamped
  itemRefs.value[clamped]?.focus()
}

function selectItem(index: number): void {
  focusedIndex.value = index
  emit('update:modelValue', navItems[index].id)
  resetPosition()
  resumeSpatialNavigation()
}

function onFocusIn(index: number): void {
  focusedIndex.value = index
  pauseSpatialNavigation()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    event.stopPropagation()
    focusItem(focusedIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    event.stopPropagation()
    focusItem(focusedIndex.value - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    // Sem isso, o mesmo evento continua borbulhando até o listener global
    // do spatialNav (agora reativado por resumeSpatialNavigation()), que
    // processaria essa mesma seta de novo e pularia uma coluna a mais.
    event.stopPropagation()
    resumeSpatialNavigation()
    focusGrid()
  }
}

function enterFromGrid(): void {
  pauseSpatialNavigation()
  focusItem(focusedIndex.value)
}

onMounted(() => {
  setLeftEdgeHandler(enterFromGrid)
})

onUnmounted(() => {
  setLeftEdgeHandler(null)
})
</script>

<template>
  <nav class="sidebar" @keydown="onKeydown">
    <img class="mark" :src="markIcon" alt="sofa.OS" />
    <button
      v-for="(item, index) in navItems"
      :key="item.id"
      :ref="(el) => setItemRef(el as Element | null, index)"
      type="button"
      class="nav-item"
      :class="{ active: props.modelValue === item.id }"
      tabindex="0"
      @click="selectItem(index)"
      @focus="onFocusIn(index)"
    >
      <component :is="item.icon" :size="22" :stroke-width="2" />
      <span class="label">{{ item.label }}</span>
    </button>

    <button
      :ref="(el) => setItemRef(el as Element | null, navItems.length)"
      type="button"
      class="nav-item nav-item-update"
      :class="{ 'is-error': updateStatus.state === 'error' }"
      tabindex="0"
      @click="onUpdateActivate"
      @focus="onFocusIn(navItems.length)"
    >
      <component :is="updateIcon" :size="22" :stroke-width="2" />
      <span class="label">{{ updateLabel }}</span>
    </button>

    <button
      :ref="(el) => setItemRef(el as Element | null, navItems.length + 1)"
      type="button"
      class="nav-item nav-item-close"
      tabindex="0"
      @click="closeWindow"
      @focus="onFocusIn(navItems.length + 1)"
    >
      <Power :size="22" :stroke-width="2" />
      <span class="label">Fechar</span>
    </button>

    <span v-if="appVersion" class="version">v{{ appVersion }}</span>
  </nav>
</template>

<style scoped>
.sidebar {
  flex: 0 0 96px;
  width: 96px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 0 24px;
  background-color: rgba(255, 255, 255, 0.03);
}

.mark {
  width: 32px;
  height: 32px;
  margin-bottom: 20px;
  -webkit-user-drag: none;
}

.nav-item {
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--ev-c-text-2);
  cursor: pointer;
  outline: none;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.nav-item .label {
  font-size: 11px;
  font-weight: 600;
}

.nav-item:hover {
  color: var(--ev-c-text-1);
}

.nav-item:focus-visible {
  box-shadow: 0 0 0 3px #a60866;
}

.nav-item.active {
  background-color: rgba(166, 8, 102, 0.25);
  color: var(--ev-c-text-1);
}

.nav-item-update {
  margin-top: auto;
}

.nav-item-update.is-error {
  color: #ff8a8a;
}

.nav-item-close:hover {
  color: #ff6b6b;
}

.nav-item-close:focus-visible {
  box-shadow: 0 0 0 3px #ff5f57;
}

.version {
  margin-top: 8px;
  font-size: 10px;
  color: var(--ev-c-text-3);
}
</style>
