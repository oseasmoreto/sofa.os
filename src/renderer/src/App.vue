<script setup lang="ts">
import { ref } from 'vue'
import WindowControls from './components/WindowControls.vue'
import Sidebar, { type SidebarView } from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
import Discover from './components/Discover.vue'
import WatchlistView from './components/WatchlistView.vue'
import TitleDetailsView from './components/TitleDetailsView.vue'
import { useSelection } from './composables/selection'
import { useSpatialNavigation } from './composables/spatialNav'

const { selectedTitle, clear } = useSelection()
useSpatialNavigation()

const activeView = ref<SidebarView>('home')
</script>

<template>
  <WindowControls />
  <div class="app-shell">
    <Sidebar v-model="activeView" />
    <div class="main-column">
      <TopBar />
      <Discover v-if="activeView === 'home'" />
      <WatchlistView v-else-if="activeView === 'watchlist'" />
    </div>
  </div>
  <TitleDetailsView v-if="selectedTitle" :title="selectedTitle" @close="clear" />
</template>
