<template>
  <svg class="brand-mark" viewBox="0 0 44 32" role="img" aria-label="Current flowing line mark">
    <path d="M3 9c7-6 13-6 19 0s12 6 19 0" />
    <path d="M3 22c7-6 13-6 19 0s12 6 19 0" />
    <circle cx="4" cy="28" r="2" />
  </svg>
</template>

<style scoped>
.brand-mark {
  width: 2.4rem;
  height: auto;
  overflow: visible;
}

path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2.4;
}

circle {
  fill: var(--cinnabar);
}
</style>
