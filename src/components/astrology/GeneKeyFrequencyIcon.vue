<script setup lang="ts">
defineProps<{
  band: 'shadow' | 'gift' | 'siddhi'
}>()
</script>

<template>
  <svg
    class="gene-key-frequency-icon"
    viewBox="0 0 16 16"
    aria-hidden="true"
    :data-frequency-band="band"
  >
    <path v-if="band === 'shadow'" d="M2.5 3.25h11L8 13Z" />
    <path v-else-if="band === 'gift'" d="M8 3 13.5 12.75h-11Z" />
    <template v-else>
      <path d="M8 1.8 13.4 11H2.6Z" />
      <path d="m8 14.2-5.4-9.2h10.8Z" />
      <circle cx="8" cy="8" r="1.65" />
    </template>
  </svg>
</template>

<style scoped>
.gene-key-frequency-icon {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.25;
}
</style>
