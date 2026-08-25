<script setup lang="ts">
import ChineseTermInline from '@/components/common/ChineseTermInline.vue'

defineProps<{
  lineOne: string
  lineTwo: {
    readonly characters: string
    readonly pinyin: string
    readonly english: string
  } | null
  lineTwoFallback: string
  lineThree: string
}>()
</script>

<template>
  <span class="celestial-instrument-text">
    <span class="instrument-value" data-primary-value="phase-or-season">{{ lineOne }}</span>
    <span class="instrument-value" data-primary-value="traditional-state">
      <ChineseTermInline
        v-if="lineTwo"
        :characters="lineTwo.characters"
        :pinyin="lineTwo.pinyin"
        :english="lineTwo.english"
        density="compact"
      />
      <span v-else>{{ lineTwoFallback }}</span>
    </span>
    <span class="instrument-value instrument-value--movement" data-primary-value="movement">
      {{ lineThree }}
    </span>
  </span>
</template>

<style scoped>
.celestial-instrument-text {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
  color: var(--ink-soft);
  line-height: 1.18;
}

.instrument-value {
  display: block;
  min-width: 0;
  font-size: clamp(0.59rem, 1vw, 0.74rem);
  text-wrap: balance;
}

.instrument-value:first-child {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(0.68rem, 1.15vw, 0.86rem);
  font-weight: 600;
}

.instrument-value--movement {
  color: var(--jade-deep);
  font-size: clamp(0.58rem, 0.95vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.015em;
}

@media (max-width: 767px) {
  .celestial-instrument-text {
    gap: 0.12rem;
  }

  .instrument-value,
  .instrument-value--movement {
    font-size: max(0.56rem, 2.25vw);
  }

  .instrument-value:first-child {
    font-size: max(0.62rem, 2.5vw);
  }
}
</style>
