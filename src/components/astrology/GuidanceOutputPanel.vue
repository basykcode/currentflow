<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { rerankGuidanceExecutions, selectGuidanceIntention } from '@/domain/guidance/guidanceEngine'
import type { ExecutionCategory, GuidanceBundle } from '@/domain/guidance/types'

const props = withDefaults(
  defineProps<{
    bundle: GuidanceBundle
    showOltr?: boolean
  }>(),
  { showOltr: true },
)

const activeBundle = ref<GuidanceBundle>(props.bundle)
const availableBundle = computed(() =>
  activeBundle.value.status === 'available' ? activeBundle.value : null,
)
const unavailableReason = computed(() =>
  activeBundle.value.status === 'unavailable' ? activeBundle.value.reason : '',
)

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
  <section class="guidance-output" aria-labelledby="guidance-output-heading">
    <template v-if="availableBundle">
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

    <div v-else class="guidance-unavailable panel" role="status">
      <p class="eyebrow">Guidance output</p>
      <h2 id="guidance-output-heading">Semantic input unavailable</h2>
      <p>{{ unavailableReason }}</p>
    </div>
  </section>
</template>

<style scoped>
.guidance-output {
  margin-top: clamp(3rem, 7vw, 6rem);
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

@media (max-width: 800px) {
  .guidance-grid {
    grid-template-columns: 1fr;
  }

  .guidance-source {
    text-align: left;
  }
}
</style>
