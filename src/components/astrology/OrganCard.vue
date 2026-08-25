<script setup lang="ts">
import { computed } from 'vue'

import type { OrganMoment } from '@/domain/astrology/types'

import OrganIllustration from './OrganIllustration.vue'

const props = withDefaults(
  defineProps<{
    organ: OrganMoment
    density?: 'glance' | 'standard'
  }>(),
  { density: 'standard' },
)

const emit = defineEmits<{
  select: []
}>()

const compactTimeRange = computed(() => props.organ.timeRangeLabel.split('·')[0]?.trim())
</script>

<template>
  <article class="organ-card" :class="`organ-card--${density}`" :data-density="density">
    <button
      class="card-action"
      type="button"
      :aria-label="`Open details for ${organ.nameEnglish}, active ${compactTimeRange}`"
      @click="emit('select')"
      @keydown.enter="emit('select')"
      @keydown.space.prevent="emit('select')"
    ></button>
    <div class="organ-copy">
      <p class="scope">
        {{ density === 'glance' ? 'Internal State' : 'Organ hour · active period' }}
      </p>
      <div v-if="density === 'glance'" class="organ-glance-focus">
        <OrganIllustration :organ-key="organ.key" />
        <div v-if="organ.chuZhengKe" class="chu-zheng-ke">
          <p class="chu-zheng-ke__eyebrow">Chu · Zheng · Ke</p>
          <p class="chu-zheng-ke__name">
            <span lang="zh-Hant">{{ organ.chuZhengKe.nameChinese }}</span>
            <span aria-hidden="true"> ~ </span>
            <span lang="zh-Latn-pinyin">{{ organ.chuZhengKe.namePinyin }}</span>
          </p>
          <p class="chu-zheng-ke__bounds">
            {{ organ.chuZhengKe.timeRangeLabel }} · {{ organ.chuZhengKe.meaningEnglish }}
          </p>
          <p class="chu-zheng-ke__cultivation">
            <strong>{{ organ.chuZhengKe.cultivationPhase }}</strong>
            <span>{{ organ.chuZhengKe.cultivationGuidance }}</span>
          </p>
        </div>
      </div>
      <h2>{{ organ.nameEnglish }}</h2>
      <p v-if="organ.nameChinese" class="chinese" lang="zh">{{ organ.nameChinese }}</p>
      <p class="time-range">
        {{ density === 'glance' ? compactTimeRange : organ.timeRangeLabel }}
      </p>
      <div v-if="density !== 'glance'" class="provenance">
        <span class="status-text">{{ organ.status }}</span>
        <span>{{ organ.sourceLabel }}</span>
      </div>
    </div>
    <OrganIllustration v-if="density !== 'glance'" :organ-key="organ.key" />
  </article>
</template>

<style scoped>
.organ-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(9rem, 0.75fr);
  min-height: 20rem;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: clamp(1.1rem, 2.5vw, 1.8rem);
  box-shadow: var(--shadow-soft);
}

.card-action {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  background: transparent;
}

.card-action:focus-visible {
  outline-offset: -4px;
}

.organ-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.scope {
  margin-bottom: 0.65rem;
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

h2 {
  margin-bottom: 0.1rem;
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.chinese {
  color: var(--ink-soft);
  font-size: 1rem;
}

.time-range {
  margin: auto 0 1rem;
  color: var(--ink-soft);
  font-size: 0.86rem;
  overflow-wrap: anywhere;
}

.provenance {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-top: 1px solid var(--line);
  padding-top: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.3;
}

.status-text {
  flex: 0 0 auto;
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.provenance > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.organ-illustration {
  align-self: center;
  justify-self: end;
}

.organ-card--glance {
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
  border-radius: var(--glance-card-radius, var(--radius-md));
  padding: var(--glance-card-padding, 0.65rem);
  box-shadow: 0 8px 24px rgb(0 8 24 / 18%);
  text-align: center;
}

.organ-card--glance .organ-copy {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  height: 100%;
  justify-items: center;
}

.organ-card--glance .scope {
  margin: 0 0 0.2rem;
  font-size: var(--glance-scope-size, 0.59rem);
  line-height: 1.15;
  text-align: center;
}

.organ-card--glance h2 {
  margin: 0;
  font-size: var(--glance-organ-title-size, 0.94rem);
  line-height: 1.05;
  text-align: center;
}

.organ-card--glance .chinese {
  margin: 0.08rem 0 0;
  font-size: var(--glance-chinese-size, 0.66rem);
  line-height: 1;
  text-align: center;
}

.organ-card--glance .time-range {
  margin: 0.3rem 0 0;
  font-size: var(--glance-meta-size, 0.64rem);
  line-height: 1.15;
  text-align: center;
}

.organ-card--glance .organ-illustration {
  width: min(100%, var(--glance-organ-size, 7.5rem));
  align-self: auto;
  justify-self: auto;
}

.organ-glance-focus {
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.25rem, 0.9vw, 0.5rem);
  padding: clamp(0.25rem, 1vw, 0.6rem) 0.15rem;
  text-align: center;
}

.chu-zheng-ke {
  display: grid;
  justify-items: center;
  max-width: 30rem;
  color: var(--ink-soft);
}

.chu-zheng-ke p {
  margin: 0;
}

.chu-zheng-ke__eyebrow {
  color: var(--jade);
  font-size: clamp(0.48rem, 1.15vw, 0.62rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.15;
  text-transform: uppercase;
}

.chu-zheng-ke__name {
  margin-top: 0.12rem !important;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(0.72rem, 1.8vw, 1rem);
  line-height: 1.1;
}

.chu-zheng-ke__bounds {
  margin-top: 0.14rem !important;
  color: var(--ink-faint);
  font-size: clamp(0.48rem, 1.12vw, 0.65rem);
  line-height: 1.2;
}

.chu-zheng-ke__cultivation {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.12rem 0.3rem;
  margin-top: 0.28rem !important;
  font-size: clamp(0.52rem, 1.2vw, 0.68rem);
  line-height: 1.25;
  text-wrap: balance;
}

.chu-zheng-ke__cultivation strong {
  color: var(--jade);
  font-weight: 800;
}

.chu-zheng-ke__cultivation span {
  color: var(--ink-soft);
}

@media (max-width: 500px) {
  .organ-card:not(.organ-card--glance) {
    grid-template-columns: 1fr 7rem;
    min-height: 17rem;
  }

  .organ-card:not(.organ-card--glance) .time-range {
    margin-top: 1.5rem;
  }
}
</style>
