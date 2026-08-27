<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { rerankGuidanceExecutions, selectGuidanceIntention } from '@/domain/guidance/guidanceEngine'
import type { ExecutionCategory, GuidanceBundle } from '@/domain/guidance/types'

const props = withDefaults(
  defineProps<{
    bundle: GuidanceBundle
    showOltr?: boolean
    density?: 'full' | 'glance'
  }>(),
  { showOltr: true, density: 'full' },
)

const activeBundle = ref<GuidanceBundle>(props.bundle)
const availableBundle = computed(() =>
  activeBundle.value.status === 'available' ? activeBundle.value : null,
)
const unavailableReason = computed(() =>
  activeBundle.value.status === 'unavailable' ? activeBundle.value.reason : '',
)
const glanceExecutions = computed(() => {
  if (!availableBundle.value) return []
  return availableBundle.value.executions.slice(0, 3)
})
const glanceIntentions = computed(() => {
  if (!availableBundle.value) return []
  return availableBundle.value.intentions.slice(0, 3)
})
const executionCategoryLabels: Readonly<Record<ExecutionCategory, string>> = {
  somatic: 'Body',
  task: 'Task',
  environment: 'Environment',
  pause: 'Pause',
}

watch(
  () => props.bundle,
  (bundle) => {
    activeBundle.value = bundle
  },
)

const chooseIntention = (intentionId: string) => {
  activeBundle.value = selectGuidanceIntention(activeBundle.value, intentionId)
}

const rerankExecution = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const category = value ? (value as ExecutionCategory) : undefined
  activeBundle.value = rerankGuidanceExecutions(activeBundle.value, category)
}
</script>

<template>
  <section
    class="guidance-output"
    :class="`guidance-output--${density}`"
    aria-labelledby="guidance-output-heading"
  >
    <template v-if="availableBundle">
      <template v-if="density === 'full'">
        <header v-if="showOltr" class="guidance-oltr">
          <p class="eyebrow">One Line to Remember</p>
          <h2 id="guidance-output-heading">{{ availableBundle.oltr.text }}</h2>
        </header>
        <h2 v-else id="guidance-output-heading" class="visually-hidden">Guidance output</h2>

        <div class="guidance-grid">
          <section class="intention panel" aria-labelledby="intention-heading">
            <p class="section-number">01</p>
            <p class="eyebrow">Intention</p>
            <div class="intention-identity">
              <p class="intention-character" aria-hidden="true">
                {{ availableBundle.selectedIntention.character }}
              </p>
              <div>
                <p class="intention-pinyin">{{ availableBundle.selectedIntention.pinyin }}</p>
                <h3 id="intention-heading">
                  {{ availableBundle.selectedIntention.englishLabel }}
                </h3>
              </div>
            </div>
            <p class="intention-definition">
              {{ availableBundle.selectedIntention.shortDefinition }}
            </p>

            <div v-if="availableBundle.intentions.length > 1" class="intention-alternatives">
              <p class="control-label">Available intentions</p>
              <div class="intention-options">
                <button
                  v-for="selection in availableBundle.intentions"
                  :key="selection.definition.id"
                  type="button"
                  :aria-pressed="selection.definition.id === availableBundle.selectedIntention.id"
                  @click="chooseIntention(selection.definition.id)"
                >
                  <span aria-hidden="true">{{ selection.definition.character }}</span>
                  {{ selection.definition.englishLabel }}
                </button>
              </div>
            </div>
          </section>

          <section class="execution panel" aria-labelledby="execution-heading">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Execution</p>
                <h3 id="execution-heading">A bounded next movement</h3>
              </div>
              <p class="section-number">02</p>
            </div>
            <p class="execution-action">{{ availableBundle.selectedExecution.text }}</p>
            <p class="execution-endpoint">
              Complete when: {{ availableBundle.selectedExecution.observableEndpoint }}
            </p>

            <label class="execution-rerank">
              <span>Prefer another form</span>
              <select @change="rerankExecution">
                <option value="">Best fit</option>
                <option value="somatic">Somatic</option>
                <option value="task">Task</option>
                <option value="environment">Environment</option>
                <option value="pause">Pause</option>
              </select>
            </label>
          </section>
        </div>

        <p class="guidance-source">
          {{ availableBundle.primaryCurrent.label.value }} ·
          {{ availableBundle.primaryCurrent.status.value }} · valid until
          <time :datetime="availableBundle.validityWindow.validUntilUtc">
            {{ availableBundle.validityWindow.validUntilUtc }}
          </time>
        </p>
      </template>

      <template v-else>
        <h2 id="guidance-output-heading" class="visually-hidden">Current guidance</h2>
        <div class="guidance-grid guidance-grid--glance">
          <section
            class="intention intention--glance panel"
            data-glance-item="intention"
            aria-labelledby="intention-glance-heading"
          >
            <div class="glance-panel-heading">
              <p class="eyebrow">Intention</p>
              <h3 id="intention-glance-heading" class="visually-hidden">Reviewed orientations</h3>
            </div>
            <div class="intention-glance-options" aria-label="Available intentions">
              <button
                v-for="selection in glanceIntentions"
                :key="selection.definition.id"
                type="button"
                :aria-pressed="selection.definition.id === availableBundle.selectedIntention.id"
                :aria-label="`${selection.definition.pinyin}, ${selection.definition.englishLabel}`"
                data-intention-layout="identity-title-row"
                @click="chooseIntention(selection.definition.id)"
              >
                <span class="intention-glance-identity">
                  <span class="intention-glance-character" lang="zh-Hant">
                    {{ selection.definition.character }}
                  </span>
                  <span class="intention-glance-pinyin" lang="zh-Latn-pinyin">
                    {{ selection.definition.pinyin }}
                  </span>
                </span>
                <span class="intention-glance-english">
                  {{ selection.definition.englishLabel }}
                </span>
              </button>
            </div>
          </section>

          <section
            class="execution execution--glance panel"
            data-glance-item="execution"
            aria-labelledby="execution-glance-heading"
          >
            <div class="glance-panel-heading">
              <p class="eyebrow">Execution</p>
              <h3 id="execution-glance-heading" class="visually-hidden">
                Up to three bounded next movements
              </h3>
            </div>
            <ol v-if="glanceExecutions.length" class="execution-glance-options">
              <li v-for="selection in glanceExecutions" :key="selection.definition.id">
                <div
                  class="execution-glance-recommendation"
                  :data-rank="selection.rank"
                  role="group"
                  :aria-label="`${executionCategoryLabels[selection.definition.category]}. ${selection.definition.text} Complete when: ${selection.definition.observableEndpoint}. ${selection.reasons[0]}`"
                  :title="`Complete when: ${selection.definition.observableEndpoint}. ${selection.reasons[0]}`"
                >
                  <span class="execution-glance-category">
                    {{ executionCategoryLabels[selection.definition.category] }}
                  </span>
                  <span class="execution-glance-action">{{ selection.definition.text }}</span>
                </div>
              </li>
            </ol>
            <p v-else class="guidance-glance-empty" role="status">
              No execution recommendation is available for this Current.
            </p>
          </section>
        </div>
      </template>
    </template>

    <template v-else>
      <div v-if="density === 'full'" class="guidance-unavailable panel" role="status">
        <p class="eyebrow">Guidance output</p>
        <h2 id="guidance-output-heading">Semantic input unavailable</h2>
        <p>{{ unavailableReason }}</p>
      </div>
      <div v-else class="guidance-grid guidance-grid--glance" role="status">
        <section
          class="guidance-unavailable guidance-unavailable--glance panel"
          data-glance-item="intention"
        >
          <p class="eyebrow">Intention</p>
          <h2 id="guidance-output-heading">Intention unavailable</h2>
          <p>{{ unavailableReason }}</p>
        </section>
        <section
          class="guidance-unavailable guidance-unavailable--glance panel"
          data-glance-item="execution"
        >
          <p class="eyebrow">Execution</p>
          <h3>No execution recommendation</h3>
          <p>{{ unavailableReason }}</p>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.guidance-output--full {
  margin-top: clamp(3rem, 7vw, 6rem);
}

.guidance-output--glance {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.guidance-oltr {
  max-width: 58rem;
  margin-inline: auto;
  padding-inline: 1rem;
  text-align: center;
}

.guidance-oltr h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5.4vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.guidance-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 1rem;
}

.guidance-grid--glance {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--glance-gap, 0.55rem);
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.intention,
.execution,
.guidance-unavailable {
  padding: clamp(1.25rem, 3vw, 2rem);
}

.section-number {
  margin: 0 0 2rem;
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 0.8rem;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading .section-number {
  margin: 0;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 500;
  letter-spacing: -0.02em;
}

.intention-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.intention-character {
  margin: 0;
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: clamp(3rem, 7vw, 5.5rem);
  line-height: 1;
}

.intention-pinyin {
  margin: 0 0 0.2rem;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

.intention-definition,
.execution-action {
  max-width: 38ch;
  margin: 1.5rem 0 0;
  color: var(--ink-soft);
  font-size: 1.05rem;
  line-height: 1.55;
}

.execution-action {
  max-width: 42ch;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(1.3rem, 2.6vw, 1.8rem);
}

.execution-endpoint,
.guidance-source {
  color: var(--ink-faint);
  font-size: 0.75rem;
}

.execution-endpoint {
  margin: 0.75rem 0 0;
}

.intention-alternatives,
.execution-rerank {
  margin-top: 2rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}

.control-label,
.execution-rerank > span {
  display: block;
  margin: 0 0 0.65rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.intention-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.intention-options button,
select {
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-soft);
  padding: 0.55rem 0.8rem;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.75rem;
}

.intention-options button[aria-pressed='true'] {
  border-color: var(--jade);
  color: var(--ink);
}

select {
  width: min(100%, 18rem);
  border-radius: 0.75rem;
}

.guidance-source {
  margin: 0.8rem 0 0;
  text-align: right;
}

.guidance-unavailable {
  max-width: 48rem;
  margin-inline: auto;
}

.guidance-unavailable h2 {
  margin: 0.45rem 0 0;
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

.guidance-unavailable p:last-child {
  margin-bottom: 0;
  color: var(--ink-soft);
}

.intention--glance,
.execution--glance,
.guidance-unavailable--glance {
  min-width: 0;
  border-radius: var(--glance-card-radius, var(--radius-md));
  padding: var(--glance-card-padding, 0.65rem);
  box-shadow: 0 8px 24px rgb(0 8 24 / 18%);
}

.glance-panel-heading {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.6rem;
  text-align: center;
}

.glance-panel-heading .eyebrow {
  margin: 0;
  color: var(--jade);
  font-size: var(--glance-scope-size, 0.59rem);
  text-align: center;
}

.glance-panel-heading h3 {
  color: var(--ink-faint);
  font-family: var(--font-sans);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-align: right;
}

.intention-glance-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.2rem;
  margin-top: 0.28rem;
}

.intention-glance-options button {
  display: grid;
  grid-template-columns: minmax(2rem, auto) minmax(0, 1fr);
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  background: var(--surface-soft);
  padding: 0.18rem 0.4rem;
  color: var(--ink-soft);
  font: inherit;
  text-align: left;
}

.intention-glance-options button[aria-pressed='true'],
.execution-glance-recommendation[data-rank='primary'] {
  border-color: var(--jade);
  background: color-mix(in srgb, var(--surface-soft) 80%, var(--jade-wash));
  color: var(--ink);
}

.intention-glance-identity {
  display: grid;
  justify-items: center;
  min-width: 2rem;
}

.intention-glance-character {
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 1rem;
  line-height: 0.95;
}

.intention-glance-pinyin,
.intention-glance-english {
  max-width: 100%;
  font-size: 0.57rem;
  line-height: 1.1;
  text-align: left;
}

.intention-glance-english {
  color: var(--ink);
  font-size: clamp(0.52rem, 1.55vw, 0.64rem);
  font-weight: 700;
  line-height: 1.05;
  white-space: nowrap;
}

.guidance-glance-empty {
  margin: 0.4rem 0 0;
  color: var(--ink-soft);
  font-size: 0.65rem;
  line-height: 1.25;
}

.execution-glance-options {
  display: grid;
  gap: 0.22rem;
  margin: 0.28rem 0 0;
  padding: 0;
  list-style: none;
}

.execution-glance-recommendation {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.1rem;
  width: 100%;
  min-height: 2.25rem;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  background: var(--surface-soft);
  padding: 0.28rem 0.4rem;
  color: var(--ink-soft);
  text-align: left;
}

.execution--glance {
  height: 100%;
}

.execution-glance-category {
  color: var(--jade);
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.execution-glance-action {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: clamp(0.56rem, 1.55vw, 0.66rem);
  line-height: 1.06;
}

.execution-glance-endpoint,
.execution-glance-reason {
  grid-column: 1;
  color: var(--ink-faint);
  font-size: 0.52rem;
  line-height: 1.15;
}

.guidance-unavailable--glance h2,
.guidance-unavailable--glance h3 {
  margin: 0.3rem 0 0;
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.8vw, 1.25rem);
}

.guidance-unavailable--glance p:last-child {
  margin: 0.45rem 0 0;
  font-size: 0.68rem;
  line-height: 1.3;
}

@media (max-width: 800px) {
  .guidance-output--full .guidance-grid {
    grid-template-columns: 1fr;
  }

  .guidance-source {
    text-align: left;
  }
}
</style>
