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
    instantUtc?: string | undefined
    liveClock?: boolean
  }>(),
  {
    sectionLabel: 'The Current Flow',
    selectedTimeJump: false,
    compact: false,
    liveClock: true,
  },
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
      :timezone="timezone"
      @open-details="emit('openLunarDetails')"
    />

    <div class="celestial-current-header__center">
      <h1 id="current-flow-heading" :aria-label="sectionLabel">
        <template v-if="sectionLabel === 'The Current Flow'">
          <span class="current-flow-title__current">The Current</span>
          <span class="current-flow-title__flow">
            <i aria-hidden="true" data-current-flow-tilde>~</i>
            <span>Flow</span>
            <i aria-hidden="true" data-current-flow-tilde>~</i>
          </span>
        </template>
        <span v-else>{{ sectionLabel }}</span>
      </h1>
      <YinClock
        :timezone="timezone"
        :compact="compact"
        :instant-utc="instantUtc"
        :live="liveClock"
      />
    </div>

    <SolarCurrentInstrument
      class="celestial-current-header__sun"
      :view-model="solar"
      :interpolate-marker="!selectedTimeJump"
      alignment="right"
      :compact="compact"
      :timezone="timezone"
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
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.2em;
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.35rem, 3vw, 1.9rem);
  font-weight: 600;
  font-variation-settings: var(--font-serif-variation-settings);
  letter-spacing: -0.025em;
  line-height: 1;
  white-space: nowrap;
}

.current-flow-title__flow {
  display: inline-flex;
  align-items: baseline;
  justify-self: center;
  gap: 0.18em;
}

.current-flow-title__flow i {
  color: var(--cinnabar);
  font-family: inherit;
  font-style: normal;
  font-weight: 600;
}

.celestial-current-header--compact {
  --celestial-instrument-size: clamp(3.15rem, 14vw, 3.9rem);

  grid-template-columns: minmax(0, 1fr) minmax(7.3rem, 1.08fr) minmax(0, 1fr);
  gap: clamp(0.18rem, 1.3vw, 0.45rem);
  align-items: start;
}

.celestial-current-header--compact h1 {
  display: grid;
  gap: 0;
  font-size: clamp(1.05rem, 4.7vw, 1.38rem);
}

@media (max-width: 767px) {
  .celestial-current-header {
    --celestial-instrument-size: clamp(50px, 14vw, 62px);

    grid-template-columns: minmax(0, 1fr) minmax(7.3rem, 1.08fr) minmax(0, 1fr);
    gap: clamp(0.18rem, 1.3vw, 0.45rem);
    align-items: start;
  }

  .celestial-current-header__moon,
  .celestial-current-header__sun {
    align-self: start;
    justify-self: stretch;
  }

  .celestial-current-header__center :deep(.yin-clock__time) {
    font-size: clamp(1.55rem, 7vw, 1.75rem);
  }

  h1 {
    display: grid;
    gap: 0;
    font-size: clamp(1.05rem, 4.7vw, 1.38rem);
  }
}

@media (max-width: 767px) and (max-height: 720px) {
  .celestial-current-header {
    --celestial-instrument-size: clamp(48px, 13vw, 56px);
  }

  .celestial-current-header__center {
    gap: 0.08rem;
  }

  .celestial-current-header__center :deep(.yin-clock__metadata) {
    display: none;
  }
}

@media (max-width: 359px) {
  .celestial-current-header,
  .celestial-current-header--compact {
    --celestial-instrument-size: clamp(40px, 13vw, 44px);

    grid-template-columns: minmax(0, 1fr) minmax(110px, 1.08fr) minmax(0, 1fr);
    gap: 2px;
  }
}
</style>
