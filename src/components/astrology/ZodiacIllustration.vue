<script setup lang="ts">
import { computed } from 'vue'

import { resolveGanZhiZodiac, type GanZhiAnimal } from '@/domain/astrology/ganZhi'

const props = defineProps<{
  ganZhi: string
}>()

const ASSET_ANIMAL_NAMES: Readonly<Record<GanZhiAnimal, string>> = {
  rat: 'rat',
  ox: 'ox',
  tiger: 'tiger',
  rabbit: 'rabbit',
  dragon: 'dragon',
  snake: 'snake',
  horse: 'horse',
  goat: 'sheep',
  monkey: 'monkey',
  rooster: 'rooster',
  dog: 'dog',
  pig: 'pig',
}

const zodiac = computed(() => resolveGanZhiZodiac(props.ganZhi))
const assetAnimal = computed(() => ASSET_ANIMAL_NAMES[zodiac.value.animal])
const imageSource = computed(
  () => `/media/zodiac/${assetAnimal.value}/${assetAnimal.value}_${zodiac.value.element}.avif`,
)
</script>

<template>
  <img
    class="zodiac-illustration"
    :src="imageSource"
    alt=""
    aria-hidden="true"
    decoding="async"
    :data-zodiac-animal="zodiac.animal"
    :data-zodiac-element="zodiac.element"
  />
</template>

<style scoped>
.zodiac-illustration {
  display: block;
  width: min(100%, var(--zodiac-illustration-size, 8rem));
  height: auto;
  opacity: var(--zodiac-illustration-opacity, 0.74);
  filter: saturate(0.88) contrast(0.96) drop-shadow(0 0.35rem 0.8rem rgb(0 8 24 / 24%));
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
</style>
