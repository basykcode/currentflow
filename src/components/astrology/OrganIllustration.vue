<script setup lang="ts">
withDefaults(
  defineProps<{
    organKey?: string
  }>(),
  { organKey: 'heart' },
)
</script>

<template>
  <div class="organ-illustration" aria-hidden="true" :data-organ="organKey">
    <svg viewBox="0 0 220 220">
      <circle class="orbit orbit-outer" cx="110" cy="110" r="82" />
      <circle class="orbit orbit-inner" cx="110" cy="110" r="56" />
      <path class="current-line" d="M22 118c34-28 62-28 88 0s54 28 88 0" />
      <path
        class="organ-shape"
        d="M110 154c-29-19-48-39-48-67 0-18 11-31 28-31 10 0 17 5 20 13 4-8 11-13 21-13 17 0 27 13 27 31 0 28-18 48-48 67Z"
      />
      <path class="inner-line" d="M91 83c8 7 12 15 11 25M129 83c-8 7-12 15-11 25" />
      <circle class="accent" cx="45" cy="160" r="5" />
    </svg>
  </div>
</template>

<style scoped>
.organ-illustration {
  width: min(100%, 14rem);
  aspect-ratio: 1;
  color: var(--jade);
}

svg {
  width: 100%;
  height: 100%;
}

.orbit,
.current-line,
.inner-line {
  fill: none;
  stroke: currentColor;
}

.orbit {
  opacity: 0.22;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
}

.orbit-inner {
  opacity: 0.12;
}

.current-line {
  opacity: 0.42;
  stroke-linecap: round;
  stroke-width: 2;
}

.organ-shape {
  fill: var(--jade-wash);
  stroke: var(--jade-deep);
  stroke-width: 2;
}

.inner-line {
  stroke: var(--jade-deep);
  stroke-linecap: round;
  stroke-width: 2;
}

.accent {
  fill: var(--cinnabar);
}
</style>
