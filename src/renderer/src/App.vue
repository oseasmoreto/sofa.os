<script setup lang="ts">
import WindowControls from './components/WindowControls.vue'
import TopBar from './components/TopBar.vue'
import Discover from './components/Discover.vue'
import TitleDetailsView from './components/TitleDetailsView.vue'
import { useSelection } from './composables/selection'
import { useSpatialNavigation } from './composables/spatialNav'

const { selectedTitle, clear } = useSelection()
useSpatialNavigation()
</script>

<template>
  <WindowControls />
  <div class="app-shell">
    <TopBar />
    <Discover />
  </div>
  <TitleDetailsView v-if="selectedTitle" :title="selectedTitle" @close="clear" />
</template>
