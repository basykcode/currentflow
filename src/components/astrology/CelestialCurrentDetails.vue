<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'

import ChineseTermInline from '@/components/common/ChineseTermInline.vue'
import {
  CELESTIAL_INSTRUMENT_METHODOLOGY,
  type CelestialDetailsTarget,
  type LunarHomeInstrumentViewModel,
  type SolarHomeInstrumentViewModel,
} from '@/domain/current-flow/celestial-instruments'

const props = defineProps<{
  lunar: LunarHomeInstrumentViewModel
  solar: SolarHomeInstrumentViewModel
}>()

const emit = defineEmits<{
  retry: [target: CelestialDetailsTarget]
}>()

const openState = ref(false)
const target = ref<CelestialDetailsTarget>({ kind: 'lunar-current' })
const dialog = ref<HTMLElement | null>(null)
const titleId = `${useId()}-celestial-details-title`
let returnFocus: HTMLElement | null = null

const isLunar = computed(() => target.value.kind === 'lunar-current')
const status = computed(() => (isLunar.value ? props.lunar.status : props.solar.status))
const title = computed(() => (isLunar.value ? 'Lunar Current details' : 'Seasonal Current details'))
const warnings = computed(() => (isLunar.value ? props.lunar.warnings : props.solar.warnings))

const formatDegrees = (degrees: number | null) =>
  degrees === null ? 'Unavailable' : `${degrees.toFixed(3)}°`

const formatFraction = (fraction: number | null) =>
  fraction === null ? 'Unavailable' : `${Math.round(fraction * 100)}%`

const open = async (nextTarget: CelestialDetailsTarget) => {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  target.value = nextTarget
  openState.value = true
  await nextTick()
  dialog.value?.focus()
}

const close = async () => {
  openState.value = false
  await nextTick()
  returnFocus?.focus()
  returnFocus = null
}

defineExpose({ open, close })
</script>

<template>
  <div v-if="openState" class="celestial-details-backdrop" @click.self="close">
    <section
      ref="dialog"
      class="celestial-details panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      data-celestial-current-details
      @keydown.esc="close"
    >
      <header>
        <div>
          <p class="eyebrow">Calculated conditions</p>
          <h2 :id="titleId">{{ title }}</h2>
        </div>
        <button
          class="quiet-button"
          type="button"
          aria-label="Close celestial details"
          @click="close"
        >
          Close
        </button>
      </header>

      <p class="availability" :data-status="status">Data status: {{ status }}</p>

      <template v-if="isLunar">
        <dl class="celestial-facts">
          <div>
            <dt>Astronomical phase</dt>
            <dd>{{ lunar.phaseName }}</dd>
          </div>
          <div>
            <dt>Elongation</dt>
            <dd>{{ formatDegrees(lunar.elongationDegrees) }}</dd>
          </div>
          <div>
            <dt>Illumination</dt>
            <dd>{{ formatFraction(lunar.illuminationFraction) }}</dd>
          </div>
          <div>
            <dt>Lunation progress</dt>
            <dd>{{ formatFraction(lunar.lunationProgress) }}</dd>
          </div>
          <div>
            <dt>Direction</dt>
            <dd>
              {{ lunar.waxing === null ? 'Unavailable' : lunar.waxing ? 'Waxing' : 'Waning' }}
            </dd>
          </div>
          <div>
            <dt>Cantong qi node</dt>
            <dd>
              <ChineseTermInline
                v-if="lunar.cantongQi"
                :characters="lunar.cantongQi.character"
                :pinyin="lunar.cantongQi.pinyin"
                :english="lunar.cantongQi.englishLabel"
              />
              <span v-else>Unavailable</span>
            </dd>
          </div>
          <div>
            <dt>Current Flow semantic movement</dt>
            <dd>{{ lunar.yinYangMovement ?? 'Unavailable' }}</dd>
          </div>
        </dl>

        <div class="methodology-grid">
          <article>
            <h3>Astronomical calculation</h3>
            <p>{{ lunar.methodology.astronomyMethodId }}</p>
          </article>
          <article>
            <h3>Chinese calendar classification</h3>
            <p>{{ lunar.methodology.calendarMethodId }}</p>
            <p>{{ lunar.methodology.cantongQiMethodId }}</p>
          </article>
          <article>
            <h3>Current Flow visual mapping</h3>
            <p>{{ CELESTIAL_INSTRUMENT_METHODOLOGY.lunarRing }}</p>
            <p>{{ lunar.methodology.presenterVersion }}</p>
          </article>
        </div>
      </template>

      <template v-else>
        <dl class="celestial-facts">
          <div>
            <dt>Chinese season</dt>
            <dd>{{ solar.season ?? 'Unavailable' }}</dd>
          </div>
          <div>
            <dt>Solar longitude</dt>
            <dd>{{ formatDegrees(solar.solarLongitudeDegrees) }}</dd>
          </div>
          <div>
            <dt>Solar Term</dt>
            <dd>
              <ChineseTermInline
                v-if="solar.solarTerm"
                :characters="solar.solarTerm.chineseTraditional"
                :pinyin="solar.solarTerm.pinyin"
                :english="solar.solarTerm.contextualEnglish"
              />
              <span v-else>Unavailable</span>
            </dd>
          </div>
          <div>
            <dt>Branch month</dt>
            <dd>
              <ChineseTermInline
                v-if="solar.branchMonth"
                :characters="solar.branchMonth.character"
                :pinyin="solar.branchMonth.pinyin"
                :english="solar.branchMonth.animalEnglish"
              />
              <span v-else>Unavailable</span>
            </dd>
          </div>
          <div>
            <dt>Current Flow semantic movement</dt>
            <dd>{{ solar.yinYangMovement ?? 'Unavailable' }}</dd>
          </div>
        </dl>

        <div class="methodology-grid">
          <article>
            <h3>Astronomical calculation</h3>
            <p>{{ solar.methodology.astronomyMethodId }}</p>
          </article>
          <article>
            <h3>Chinese calendar classification</h3>
            <p>{{ solar.methodology.solarTermTableVersion }}</p>
            <p>{{ solar.methodology.seasonMethodVersion }}</p>
          </article>
          <article>
            <h3>Current Flow semantic gloss</h3>
            <p>{{ solar.methodology.yinYangMovementVersion }}</p>
          </article>
          <article>
            <h3>Current Flow visual mapping</h3>
            <p>{{ CELESTIAL_INSTRUMENT_METHODOLOGY.solarRing }}</p>
            <p>{{ solar.methodology.presenterVersion }}</p>
          </article>
        </div>
      </template>

      <aside v-if="warnings.length" class="warnings" aria-label="Availability notes">
        <h3>Availability notes</h3>
        <ul>
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </aside>

      <button
        v-if="status === 'unavailable'"
        class="quiet-button retry-button"
        type="button"
        @click="emit('retry', target)"
      >
        Retry data source
      </button>
    </section>
  </div>
</template>

<style scoped>
.celestial-details-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  align-items: end;
  overflow-y: auto;
  background: var(--backdrop);
  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
}

.celestial-details {
  width: min(100%, 50rem);
  max-height: min(52rem, calc(100dvh - 2rem));
  margin-inline: auto;
  overflow-y: auto;
  padding: clamp(1rem, 3vw, 1.75rem);
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

h2,
h3,
p {
  margin-bottom: 0;
}

.eyebrow {
  margin-bottom: 0.25rem;
}

.availability {
  width: fit-content;
  margin-top: 1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.24rem 0.6rem;
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}

.celestial-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.75rem;
  margin-block: 1.25rem;
}

.celestial-facts div,
.methodology-grid article,
.warnings {
  border: 1px solid color-mix(in srgb, var(--line) 78%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 72%, transparent);
  padding: 0.75rem;
}

dt,
.methodology-grid h3,
.warnings h3 {
  color: var(--ink-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

dd {
  margin: 0.2rem 0 0;
  color: var(--ink);
}

.methodology-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.75rem;
}

.methodology-grid p,
.warnings li {
  margin-top: 0.35rem;
  color: var(--ink-soft);
  font-size: 0.76rem;
  overflow-wrap: anywhere;
}

.warnings {
  margin-top: 1rem;
}

.warnings ul {
  margin-bottom: 0;
  padding-left: 1.2rem;
}

.retry-button {
  margin-top: 1rem;
}

@media (min-width: 700px) {
  .celestial-details-backdrop {
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .celestial-details-backdrop,
  .celestial-details {
    scroll-behavior: auto;
  }
}
</style>
