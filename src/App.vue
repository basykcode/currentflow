<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import { usePreferencesStore } from '@/stores/preferences'

usePreferencesStore()
</script>

<template>
  <AppHeader />
  <main id="main-content">
    <RouterView v-slot="{ Component }">
      <Transition name="route" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
</template>
