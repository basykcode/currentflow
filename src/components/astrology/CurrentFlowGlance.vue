<script setup lang="ts">
import { computed, ref } from 'vue'

import type { CurrentFlowSnapshot } from '@/domain/astrology/types'
import {
  presentLunarHomeInstrument,
  presentSolarHomeInstrument,
  type CelestialCurrentSnapshot,
  type CelestialDetailsTarget,
} from '@/domain/current-flow/celestial-instruments'
import type { TemporalClockEvent } from '@/domain/time/chu-zheng-ke'

import CelestialCurrentDetails from './CelestialCurrentDetails.vue'
import CelestialCurrentHeader from './CelestialCurrentHeader.vue'
import CurrentFlowOltr from './CurrentFlowOltr.vue'
import PrincipalGlanceGrid from './PrincipalGlanceGrid.vue'

const props = withDefaults(
  defineProps<{
    snapshot: CurrentFlowSnapshot
    celestial?: CelestialCurrentSnapshot | undefined
    timezone: string
    sectionLabel?: string
    lastTemporalEvent?: TemporalClockEvent
    selectedTimeJump?: boolean
  }>(),
  {
    sectionLabel: 'The Current Flow',
    lastTemporalEvent: 'minute-passage',
    selectedTimeJump: false,
  },
)

const emit = defineEmits<{
  openOrganDetails: []
}>()

const details = ref<{ open: (target: CelestialDetailsTarget) => Promise<void> } | null>(null)
const lunar = computed(() => props.celestial?.lunarHome ?? presentLunarHomeInstrument(null))
const solar = computed(() => props.celestial?.solarHome ?? presentSolarHomeInstrument(null))
const openDetails = (target: CelestialDetailsTarget) => {
  void details.value?.open(target)
}
</script>

<template>
  <section
    class="current-flow-glance"
    aria-labelledby="current-flow-heading"
    :data-moment-signature-instant="snapshot.generatedAtIso"
    :data-celestial-instant="celestial?.instantUtc"
  >
    <CelestialCurrentHeader
      class="glance-header"
      data-glance-section="header"
      :lunar="lunar"
      :solar="solar"
      :timezone="timezone"
      :section-label="sectionLabel"
      :selected-time-jump="selectedTimeJump"
      :instant-utc="snapshot.generatedAtIso"
      :live-clock="!selectedTimeJump"
      @open-lunar-details="openDetails(lunar.detailsTarget)"
      @open-solar-details="openDetails(solar.detailsTarget)"
    />

    <CurrentFlowOltr data-glance-section="oltr" :bundle="snapshot.guidance" />

    <PrincipalGlanceGrid
      class="glance-principal"
      data-glance-section="principal"
      :snapshot="snapshot"
      :last-temporal-event="lastTemporalEvent"
      @open-organ-details="emit('openOrganDetails')"
    />

    <CelestialCurrentDetails
      ref="details"
      :lunar="lunar"
      :solar="solar"
      :snapshot="celestial"
      @retry="() => undefined"
    />
  </section>
</template>

<style scoped>
.current-flow-glance {
  --glance-gap: clamp(0.35rem, 1vw, 0.55rem);
  --glance-card-padding: clamp(0.48rem, 1.5vw, 0.9rem);
  --glance-card-radius: clamp(0.65rem, 1.5vw, 1rem);
  --glance-compact-glyph-size: clamp(3rem, 6vw, 4.25rem);
  --glance-featured-glyph-size: clamp(4.2rem, 7vw, 5.25rem);
  --glance-hour-glyph-size: clamp(3.65rem, 6vw, 4.6rem);
  --glance-organ-size: clamp(4.25rem, 12vw, 7.5rem);
  --glance-scope-size: clamp(0.58rem, 1.4vw, 0.7rem);
  --glance-meta-size: clamp(0.58rem, 1.4vw, 0.72rem);
  --glance-number-size: clamp(0.76rem, 1.8vw, 0.92rem);
  --glance-compact-title-size: clamp(0.7rem, 1.25vw, 0.9rem);
  --glance-featured-title-size: clamp(0.9rem, 1.65vw, 1.15rem);
  --glance-title-size: clamp(0.78rem, 1.45vw, 1rem);
  --glance-organ-title-size: clamp(0.88rem, 1.7vw, 1.2rem);
  --glance-chinese-size: clamp(0.64rem, 1.45vw, 0.82rem);
  --glance-oltr-size: clamp(0.8rem, 2.1vw, 1.12rem);
  --glance-oltr-padding: clamp(0.48rem, 1vw, 0.65rem);

  display: grid;
  grid-template-rows: auto auto auto;
  gap: var(--glance-gap);
  min-height: 0;
  padding-block: clamp(0.55rem, 1.6dvh, 1.1rem)
    max(clamp(0.65rem, 1.8dvh, 1.1rem), env(safe-area-inset-bottom));
}

@media (max-width: 767px) {
  .current-flow-glance {
    --glance-oltr-size: clamp(0.72rem, 3vw, 0.78rem);
    --glance-oltr-padding: 0.28rem;

    padding-top: 0.35rem;
  }
}

.glance-header {
  min-width: 0;
}

.glance-principal {
  min-width: 0;
}

@media (max-width: 767px) and (max-height: 720px) {
  .current-flow-glance {
    --glance-gap: 0.3rem;
    --glance-card-padding: 0.36rem;
    --glance-card-radius: 0.62rem;
    --glance-compact-glyph-size: 2.85rem;
    --glance-featured-glyph-size: calc(var(--glance-compact-glyph-size) * 1.6);
    --glance-hour-glyph-size: calc(var(--glance-compact-glyph-size) * 1.25);
    --glance-organ-size: 4rem;
    --glance-scope-size: 0.55rem;
    --glance-meta-size: 0.55rem;
    --glance-number-size: 0.58rem;
    --glance-compact-title-size: 0.65rem;
    --glance-featured-title-size: 0.88rem;
    --glance-title-size: 0.74rem;
    --glance-organ-title-size: 0.82rem;
    --glance-chinese-size: 0.59rem;
    --glance-oltr-size: 0.8rem;
    --glance-oltr-padding: 0.4rem;

    padding-block: 0.35rem max(0.55rem, env(safe-area-inset-bottom));
  }
}

@media (min-width: 768px) {
  .current-flow-glance {
    min-height: auto;
    padding-block: clamp(0.65rem, 1.5dvh, 1.15rem) clamp(1rem, 2.5vw, 2rem);
  }
}

@media (min-width: 768px) and (max-height: 900px) {
  .current-flow-glance {
    --glance-gap: 0.32rem;
    --glance-card-padding: 0.35rem;
    --glance-compact-glyph-size: 2.7rem;
    --glance-featured-glyph-size: 3.2rem;
    --glance-hour-glyph-size: 3rem;
    --glance-compact-zodiac-size: 3.8rem;
    --glance-horizontal-zodiac-size: 2.8rem;
    --glance-organ-size: 2.8rem;
    --glance-scope-size: 0.55rem;
    --glance-meta-size: 0.58rem;
    --glance-number-size: 0.72rem;
    --glance-compact-title-size: 0.7rem;
    --glance-featured-title-size: 0.82rem;
    --glance-title-size: 0.78rem;
    --glance-organ-title-size: 0.86rem;
    --glance-chinese-size: 0.6rem;
    --glance-oltr-size: 0.8rem;
    --glance-oltr-padding: 0.2rem;

    padding-block: 0.15rem max(0.35rem, env(safe-area-inset-bottom));
  }
}

@media (min-width: 1051px) and (max-height: 780px) {
  .current-flow-glance {
    --glance-gap: 0.32rem;
    --glance-oltr-padding: 0.2rem;

    padding-top: 0.15rem;
  }
}
</style>
