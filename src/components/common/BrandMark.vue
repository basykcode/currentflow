<script setup lang="ts">
import currentFlowLogoUrl from '@/assets/brand/current-flow-logo.png'
</script>

<template>
  <img
    class="brand-mark"
    :src="currentFlowLogoUrl"
    alt=""
    aria-hidden="true"
    width="512"
    height="502"
    draggable="false"
  />
</template>

<style scoped>
.brand-mark {
  display: block;
  width: 2.9rem;
  height: auto;
  max-height: calc(var(--app-header-content-height) - 1rem);
  object-fit: contain;
  user-select: none;
}

@media (max-width: 900px) {
  .brand-mark {
    width: 2.65rem;
  }
}
</style>
