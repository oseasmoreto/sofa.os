<script setup lang="ts">
import { ref } from 'vue'
import Sidebar, { type SidebarView } from './components/Sidebar.vue'
import HomeView from './components/HomeView.vue'
import MoviesView from './components/MoviesView.vue'
import SeriesView from './components/SeriesView.vue'
import NewReleasesView from './components/NewReleasesView.vue'
import SearchView from './components/SearchView.vue'
import WatchlistView from './components/WatchlistView.vue'
import TitleDetailsView from './components/TitleDetailsView.vue'
import { useSelection } from './composables/selection'
import { useSpatialNavigation } from './composables/spatialNav'

const { selectedTitle, clear } = useSelection()
useSpatialNavigation()

const activeView = ref<SidebarView>('home')
</script>

<template>
  <div class="app-shell">
    <Sidebar v-model="activeView" />
    <div class="main-column">
      <HomeView v-if="activeView === 'home'" />
      <MoviesView v-else-if="activeView === 'movies'" />
      <SeriesView v-else-if="activeView === 'series'" />
      <NewReleasesView v-else-if="activeView === 'releases'" />
      <SearchView v-else-if="activeView === 'search'" />
      <WatchlistView v-else-if="activeView === 'watchlist'" />
    </div>
  </div>
  <TitleDetailsView v-if="selectedTitle" :title="selectedTitle" @close="clear" />
</template>
