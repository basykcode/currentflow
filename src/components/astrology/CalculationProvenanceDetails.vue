<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import type { CurrentFlowSnapshot, TemporalHexagram } from '@/domain/astrology/types'
import {
  MACRO_PRESENTATION,
  MICRO_PRESENTATION,
  type TemporalClockEvent,
} from '@/domain/time/chu-zheng-ke'

import ShichenFlowTimeline from './ShichenFlowTimeline.vue'

const props = withDefaults(
  defineProps<{
    snapshot: CurrentFlowSnapshot
    lastTemporalEvent?: TemporalClockEvent
  }>(),
  { lastTemporalEvent: 'minute-passage' },
)

const disclosure = ref<HTMLDetailsElement | null>(null)
const summary = ref<HTMLElement | null>(null)
const temporalItems = () => [
  props.snapshot.temporal.year,
  props.snapshot.temporal.day,
  props.snapshot.temporal.month,
  props.snapshot.temporal.hour,
]

const itemKey = (item: TemporalHexagram) => `${item.scope}-${item.hexagram.number ?? 'unknown'}`
const mappingSystemLabel = (item: TemporalHexagram) =>
  item.mappingSystem === 'liu-shi-jiazi-peigua' ? '六十甲子配卦' : 'Interface fixture'
const isDevelopment = import.meta.env.DEV
const organName = computed(() => props.snapshot.organ.nameEnglish.replace(/ period$/i, ''))
const elementLabel = computed(
  () => props.snapshot.organ.element[0]?.toUpperCase() + props.snapshot.organ.element.slice(1),
)
const macro = computed(() => MACRO_PRESENTATION[props.snapshot.organ.hourPhase.macroHour])
const micro = computed(() => MICRO_PRESENTATION[props.snapshot.organ.hourPhase.microHour])
const accessibleSummary = computed(
  () =>
    `${organName.value} Organ System, ${props.snapshot.organ.shichen.animalEnglish} Shíchen. ` +
    `Macro Hour: ${macro.value.pinyin}, ${macro.value.english}. ` +
    `Micro Hour: Phase ${props.snapshot.organ.hourPhase.microHour}, ${micro.value.english}. ` +
    `Next: ${props.snapshot.organ.nextShichen.animalEnglish} Shíchen.`,
)

const open = async () => {
  if (!disclosure.value) return
  disclosure.value.open = true
  await nextTick()
  disclosure.value.scrollIntoView({ block: 'start' })
  summary.value?.focus({ preventScroll: true })
}

defineExpose({ open })
</script>

<template>
  <section id="current-flow-calculation-details" class="calculated-from">
    <details ref="disclosure">
      <summary ref="summary">
        <span>
          <small>Methodology and provenance</small>
          <strong>Calculated From</strong>
        </span>
        <span aria-hidden="true">＋</span>
      </summary>

      <div class="details-body">
        <div class="temporal-details">
          <article v-for="item in temporalItems()" :key="itemKey(item)">
            <header>
              <p>{{ item.scope }} hexagram</p>
              <span>{{ item.status }}</span>
            </header>
            <h3>
              {{ item.hexagram.number }} · {{ item.hexagram.nameEnglish }}
              <span v-if="item.hexagram.nameChinese" lang="zh-Hant">
                {{ item.hexagram.nameChinese }}
              </span>
            </h3>
            <dl>
              <div>
                <dt>Pillar</dt>
                <dd>
                  {{ item.label }}<template v-if="item.ganZhi"> · {{ item.ganZhi }}</template>
                </dd>
              </div>
              <div>
                <dt>Exact bounds</dt>
                <dd>{{ item.timeBoundsLabel }}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{{ item.sourceLabel }}</dd>
              </div>
              <div>
                <dt>Numbering</dt>
                <dd>King Wen · canonical 1–64 ID</dd>
              </div>
              <div>
                <dt>Mapping</dt>
                <dd>{{ mappingSystemLabel(item) }} · {{ item.mappingVersion }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <article class="organ-details">
          <header>
            <p>Organ System · Shíchen temporal flow</p>
            <span>{{ snapshot.organ.status }}</span>
          </header>
          <h3>
            {{ organName }} · {{ elementLabel }}
            <span v-if="snapshot.organ.nameChinese" lang="zh-Hant">
              {{ snapshot.organ.nameChinese }}
            </span>
          </h3>
          <p class="organ-shichen-summary">
            <span lang="zh-Hant">{{ snapshot.organ.shichen.branchChinese }}</span>
            {{ snapshot.organ.shichen.branchPinyin }} ·
            {{ snapshot.organ.shichen.animalEnglish }} Hour → next
            <span lang="zh-Hant">{{ snapshot.organ.nextShichen.branchChinese }}</span>
            {{ snapshot.organ.nextShichen.animalEnglish }} Hour
          </p>
          <ShichenFlowTimeline
            :phase="snapshot.organ.hourPhase"
            :next-shichen="snapshot.organ.nextShichen"
            :accessible-summary="accessibleSummary"
            density="detailed"
            :last-event="lastTemporalEvent"
          />
          <dl>
            <div>
              <dt>Active range</dt>
              <dd>{{ snapshot.organ.timeRangeLabel }}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{{ snapshot.organ.sourceLabel }}</dd>
            </div>
            <div>
              <dt>Macro Hour</dt>
              <dd>
                <span lang="zh-Hant">{{ snapshot.organ.hourPhase.chineseMacroLabel }}</span>
                {{ macro.pinyin }} · {{ macro.english }}
              </dd>
            </div>
            <div>
              <dt>Micro Hour</dt>
              <dd>
                Phase {{ snapshot.organ.hourPhase.microHour }} ·
                <span lang="zh-Hant">{{ snapshot.organ.hourPhase.chineseKeLabel }}</span> ·
                {{ micro.english }}
              </dd>
            </div>
            <div>
              <dt>Selected model</dt>
              <dd>
                96-kè Chū–Zhèng–Kè model · {{ snapshot.organ.hourPhase.methodologyId }} · version
                {{ snapshot.organ.hourPhase.methodologyVersion }}
              </dd>
            </div>
            <div>
              <dt>Active time basis</dt>
              <dd>{{ snapshot.organ.hourPhase.timeBasis }}</dd>
            </div>
            <div>
              <dt>Authoritative Shíchen bounds</dt>
              <dd>
                {{ snapshot.organ.hourPhase.shichenStartUtc }} →
                {{ snapshot.organ.hourPhase.shichenEndUtc }}
              </dd>
            </div>
            <div>
              <dt>Guidance boundary</dt>
              <dd>
                Macro Hour affects maturity and guidance validity. Micro Hour is observational and
                does not independently change guidance in v1.
              </dd>
            </div>
            <div>
              <dt>Warnings</dt>
              <dd>
                {{
                  snapshot.organ.hourPhase.warnings.length > 0
                    ? snapshot.organ.hourPhase.warnings.join(' ')
                    : 'No active time-basis warning.'
                }}
              </dd>
            </div>
          </dl>

          <section
            v-if="isDevelopment"
            class="temporal-debug"
            aria-label="Development temporal debug"
          >
            <h4>Development temporal debug</h4>
            <dl>
              <div>
                <dt>Shíchen ID</dt>
                <dd>{{ snapshot.organ.shichen.id }}</dd>
              </div>
              <div>
                <dt>Shíchen UTC</dt>
                <dd>
                  {{ snapshot.organ.hourPhase.shichenStartUtc }} →
                  {{ snapshot.organ.hourPhase.shichenEndUtc }}
                </dd>
              </div>
              <div>
                <dt>Time basis</dt>
                <dd>{{ snapshot.organ.hourPhase.timeBasis }}</dd>
              </div>
              <div>
                <dt>Elapsed basis</dt>
                <dd>{{ snapshot.organ.hourPhase.shichenElapsedBasisMinutes }}</dd>
              </div>
              <div>
                <dt>Elapsed whole</dt>
                <dd>{{ snapshot.organ.hourPhase.shichenElapsedWholeMinutes }}</dd>
              </div>
              <div>
                <dt>Macro</dt>
                <dd>
                  {{ snapshot.organ.hourPhase.macroHour }} ·
                  {{ snapshot.organ.hourPhase.macroSemantic }}
                </dd>
              </div>
              <div>
                <dt>Micro</dt>
                <dd>
                  {{ snapshot.organ.hourPhase.microHour }} ·
                  {{ snapshot.organ.hourPhase.chineseKeLabel }}
                </dd>
              </div>
              <div>
                <dt>Timeline position</dt>
                <dd>{{ snapshot.organ.hourPhase.timelinePosition }}</dd>
              </div>
              <div>
                <dt>Next minute</dt>
                <dd>{{ snapshot.organ.hourPhase.nextMinuteBoundaryUtc }}</dd>
              </div>
              <div>
                <dt>Next Micro</dt>
                <dd>{{ snapshot.organ.hourPhase.nextMicroBoundaryUtc }}</dd>
              </div>
              <div>
                <dt>Next Macro</dt>
                <dd>{{ snapshot.organ.hourPhase.nextMacroBoundaryUtc }}</dd>
              </div>
              <div>
                <dt>Next Shíchen</dt>
                <dd>{{ snapshot.organ.hourPhase.nextShichenBoundaryUtc }}</dd>
              </div>
              <div>
                <dt>Last event</dt>
                <dd>{{ lastTemporalEvent ?? 'minute-passage' }}</dd>
              </div>
              <div>
                <dt>Guidance validity</dt>
                <dd>
                  {{ snapshot.guidance.validityWindow.validUntilUtc }} ·
                  {{ snapshot.guidance.validityWindow.boundaryReason }}
                </dd>
              </div>
            </dl>
          </section>
        </article>

        <article class="provider-details">
          <header>
            <p>Calculation provider</p>
            <span>{{ snapshot.status }}</span>
          </header>
          <h3>{{ snapshot.provenance.providerId }} · {{ snapshot.provenance.modelVersion }}</h3>
          <p class="mapping-version">Mapping snapshot: {{ snapshot.provenance.mappingVersion }}</p>
          <div class="provider-grid">
            <div>
              <h4>Factors</h4>
              <ul>
                <li v-for="factor in snapshot.provenance.factors" :key="factor">{{ factor }}</li>
              </ul>
            </div>
            <div>
              <h4>Limits and conventions</h4>
              <ul>
                <li v-for="note in snapshot.provenance.notes" :key="note">{{ note }}</li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </details>
  </section>
</template>

<style scoped>
.calculated-from {
  scroll-margin-top: calc(var(--app-header-total-height) + 1rem);
  margin-top: clamp(1rem, 3vw, 2rem);
}

details {
  border-block: 1px solid var(--line);
  color: var(--ink-soft);
}

summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3.5rem;
  padding: 0.75rem 0;
  cursor: pointer;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary span:first-child {
  display: grid;
}

summary small,
header p {
  margin: 0;
  color: var(--jade);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

summary strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
}

summary > span:last-child {
  color: var(--jade);
  transition: transform 160ms ease;
}

details[open] summary > span:last-child {
  transform: rotate(45deg);
}

.details-body {
  display: grid;
  gap: 0.75rem;
  padding: 0 0 1.25rem;
}

.temporal-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

article {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 82%, transparent);
  padding: clamp(0.85rem, 2vw, 1.2rem);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

header span {
  color: var(--ink-faint);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h3,
h4,
dd {
  overflow-wrap: anywhere;
}

h3 {
  margin: 0.35rem 0 0;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 500;
}

h3 span {
  color: var(--ink-soft);
  font-size: 0.82em;
}

.organ-shichen-summary {
  margin: 0.35rem 0 1rem;
  color: var(--ink-soft);
  font-size: 0.76rem;
}

dl {
  display: grid;
  gap: 0.55rem;
  margin: 0.85rem 0 0;
}

dt,
h4 {
  color: var(--ink-faint);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  margin: 0.12rem 0 0;
  font-size: 0.74rem;
  line-height: 1.45;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 0.9rem;
}

h4 {
  margin: 0;
}

ul {
  margin: 0.45rem 0 0;
  padding-left: 1rem;
  font-size: 0.74rem;
}

li + li {
  margin-top: 0.35rem;
}

.temporal-debug {
  margin-top: 1rem;
  border-top: 1px solid var(--line);
  padding-top: 0.9rem;
}

.temporal-debug dl {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 1rem;
}

.temporal-debug dd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.66rem;
}

@media (max-width: 640px) {
  .temporal-details,
  .provider-grid,
  .temporal-debug dl {
    grid-template-columns: 1fr;
  }
}
</style>
