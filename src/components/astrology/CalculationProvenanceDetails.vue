<script setup lang="ts">
import { nextTick, ref } from 'vue'

import type { CurrentFlowSnapshot, TemporalHexagram } from '@/domain/astrology/types'

const props = defineProps<{
  snapshot: CurrentFlowSnapshot
}>()

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
            <p>Organ hour</p>
            <span>{{ snapshot.organ.status }}</span>
          </header>
          <h3>
            {{ snapshot.organ.nameEnglish }}
            <span v-if="snapshot.organ.nameChinese" lang="zh-Hant">
              {{ snapshot.organ.nameChinese }}
            </span>
          </h3>
          <dl>
            <div>
              <dt>Active range</dt>
              <dd>{{ snapshot.organ.timeRangeLabel }}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{{ snapshot.organ.sourceLabel }}</dd>
            </div>
            <template v-if="snapshot.organ.chuZhengKe">
              <div>
                <dt>Chu · Zheng · Ke</dt>
                <dd>
                  {{ snapshot.organ.chuZhengKe.nameChinese }} ·
                  {{ snapshot.organ.chuZhengKe.namePinyin }} ·
                  {{ snapshot.organ.chuZhengKe.meaningEnglish }} ·
                  {{ snapshot.organ.chuZhengKe.timeRangeLabel }}
                </dd>
              </div>
              <div>
                <dt>Quarter source</dt>
                <dd>
                  {{ snapshot.organ.chuZhengKe.status }} ·
                  {{ snapshot.organ.chuZhengKe.sourceLabel }}
                </dd>
              </div>
              <div>
                <dt>Cultivation cue</dt>
                <dd>
                  {{ snapshot.organ.chuZhengKe.cultivationPhase }} ·
                  {{ snapshot.organ.chuZhengKe.cultivationGuidance }}
                </dd>
              </div>
              <div>
                <dt>Cultivation source</dt>
                <dd>
                  {{ snapshot.organ.chuZhengKe.cultivationStatus }} ·
                  {{ snapshot.organ.chuZhengKe.cultivationSourceLabel }}
                </dd>
              </div>
            </template>
          </dl>
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

@media (max-width: 640px) {
  .temporal-details,
  .provider-grid {
    grid-template-columns: 1fr;
  }
}
</style>
