<script setup lang="ts">
import type {
  LunarHomeInstrumentViewModel,
  SolarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

import LunarCurrentInstrument from './LunarCurrentInstrument.vue'
import SolarCurrentInstrument from './SolarCurrentInstrument.vue'
import YinClock from './YinClock.vue'

withDefaults(
  defineProps<{
    lunar: LunarHomeInstrumentViewModel
    solar: SolarHomeInstrumentViewModel
    timezone: string
    sectionLabel?: string
    selectedTimeJump?: boolean
    compact?: boolean
  }>(),
  { sectionLabel: 'The Current Flow', selectedTimeJump: false, compact: false },
)

const emit = defineEmits<{
  openLunarDetails: []
  openSolarDetails: []
}>()
</script>

<template>
  <header
    class="celestial-current-header"
    :class="{ 'celestial-current-header--compact': compact }"
    data-celestial-current-header
  >
    <LunarCurrentInstrument
      class="celestial-current-header__moon"
      :view-model="lunar"
      :interpolate-marker="!selectedTimeJump"
      alignment="left"
      :compact="compact"
      @open-details="emit('openLunarDetails')"
    />

    <div class="celestial-current-header__center">
      <h1 id="current-flow-heading">{{ sectionLabel }}</h1>
      <YinClock :timezone="timezone" :compact="compact" />
    </div>

    <SolarCurrentInstrument
      class="celestial-current-header__sun"
      :view-model="solar"
      :interpolate-marker="!selectedTimeJump"
      alignment="right"
      :compact="compact"
      @open-details="emit('openSolarDetails')"
    />
  </header>
</template>

<style scoped>
.celestial-current-header {
  --celestial-instrument-size: clamp(5.4rem, 9vw, 7.25rem);

  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(min-content, auto) minmax(0, 1fr);
  grid-template-areas: 'moon center sun';
  align-items: center;
  gap: clamp(0.7rem, 2vw, 2rem);
  min-width: 0;
}

.celestial-current-header__moon {
  grid-area: moon;
  justify-self: start;
}

.celestial-current-header__center {
  grid-area: center;
  display: grid;
  justify-items: center;
  gap: clamp(0.2rem, 0.7dvh, 0.45rem);
  min-width: 0;
  text-align: center;
}

.celestial-current-header__sun {
  grid-area: sun;
  justify-self: end;
}

h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.35rem, 3vw, 1.9rem);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1;
  text-wrap: balance;
}

.celestial-current-header--compact {
  --celestial-instrument-size: clamp(3.6rem, 18vw, 5.25rem);

  grid-template-columns: minmax(0, 1fr) minmax(7.3rem, 1.08fr) minmax(0, 1fr);
  gap: clamp(0.18rem, 1.3vw, 0.45rem);
  align-items: start;
}

.celestial-current-header--compact h1 {
  font-size: clamp(1.05rem, 4.7vw, 1.38rem);
}

@media (max-width: 767px) {
  .celestial-current-header {
    --celestial-instrument-size: clamp(3.6rem, 18vw, 5.25rem);

    grid-template-columns: minmax(0, 1fr) minmax(7.3rem, 1.08fr) minmax(0, 1fr);
    gap: clamp(0.18rem, 1.3vw, 0.45rem);
    align-items: start;
  }

  .celestial-current-header__moon,
  .celestial-current-header__sun {
    align-self: start;
  }

  .celestial-current-header__center :deep(.yin-clock__time) {
    font-size: clamp(1.55rem, 7vw, 1.75rem);
  }

  h1 {
    font-size: clamp(1.05rem, 4.7vw, 1.38rem);
  }
}

@media (max-width: 767px) and (max-height: 720px) {
  .celestial-current-header {
    --celestial-instrument-size: clamp(3.35rem, 16vw, 4.35rem);
  }

  .celestial-current-header__center {
    gap: 0.08rem;
  }

  .celestial-current-header__center :deep(.yin-clock__metadata) {
    display: none;
  }
}
</style>
