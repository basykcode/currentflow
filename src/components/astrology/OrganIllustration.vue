<script setup lang="ts">
import { computed } from 'vue'

import type { OrganKey } from '@/domain/astrology/types'

import { ORGAN_ICONS } from './organIcons'

const props = withDefaults(
  defineProps<{
    organKey?: OrganKey
  }>(),
  { organKey: 'heart' },
)

const icon = computed(() => ORGAN_ICONS[props.organKey])
</script>

<template>
  <div class="organ-illustration" aria-hidden="true" :data-organ="organKey">
    <svg viewBox="0 0 120 120">
      <circle class="halo" cx="60" cy="60" r="52" />
      <path
        v-for="(path, index) in icon.silhouette"
        :key="`silhouette-${index}`"
        class="silhouette"
        :d="path"
      />
      <path
        v-for="(path, index) in icon.details"
        :key="`detail-${index}`"
        class="detail"
        :d="path"
      />
      <path class="water-line water-line--upper" d="M20 103c13-8 27-8 40 0s27 8 40 0" />
      <path class="water-line" d="M28 110c10-5 21-5 32 0s21 5 32 0" />
    </svg>
  </div>
</template>

<style scoped>
.organ-illustration {
  width: min(100%, 13rem);
  aspect-ratio: 1;
  color: var(--jade);
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.halo {
  fill: color-mix(in srgb, var(--jade-wash) 66%, transparent);
  stroke: color-mix(in srgb, var(--jade) 24%, transparent);
  stroke-dasharray: 2 7;
}

.silhouette,
.detail,
.water-line {
  vector-effect: non-scaling-stroke;
}

.silhouette {
  fill: color-mix(in srgb, var(--jade-wash) 78%, transparent);
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.detail {
  fill: none;
  stroke: var(--jade-deep);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.water-line {
  fill: none;
  opacity: 0.5;
  stroke: var(--cinnabar);
  stroke-linecap: round;
  stroke-width: 1.4;
}

.water-line--upper {
  opacity: 0.28;
}
</style>
