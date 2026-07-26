<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import HexagramInspector from '@/components/hexagrams/HexagramInspector.vue'
import { usePreferencesStore } from '@/stores/preferences'

usePreferencesStore()

const route = useRoute()
const showAppHeader = computed(() => route.meta['immersive'] !== true)
</script>

<template>
  <AppHeader v-if="showAppHeader" />
  <main id="main-content">
    <RouterView v-slot="{ Component }">
      <Transition name="route" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <HexagramInspector />
</template>
