<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { selectGuidanceIntention } from '@/domain/guidance/guidanceEngine'
import type { GuidanceBundle, GuidanceElement } from '@/domain/guidance/types'

const props = withDefaults(
  defineProps<{
    bundle: GuidanceBundle
    showOltr?: boolean
  }>(),
  { showOltr: true },
)

const activeBundle = ref<GuidanceBundle>(props.bundle)
const selectionAnnouncement = ref('')
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
    selectionAnnouncement.value = ''
  },
)

const chooseIntention = (intentionId: string) => {
  const updated = selectGuidanceIntention(activeBundle.value, intentionId)
  activeBundle.value = updated
  if (updated.status === 'available') {
    selectionAnnouncement.value = `${updated.selectedIntention.englishLabel} selected. Execution ranking updated: ${updated.executions.map((selection) => selection.definition.title).join(', ')}.`
  }
}

const elementLabel = (element: GuidanceElement) =>
  `${element.charAt(0).toUpperCase()}${element.slice(1)}`

const organLabel = (organ: string) =>
  organ
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
</script>

<template>
  <section class="guidance-output" aria-labelledby="guidance-output-heading">
    <template v-if="availableBundle">
      <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {{ selectionAnnouncement }}
      </p>
      <header v-if="showOltr" class="guidance-oltr">
        <p class="eyebrow">One Line to Remember</p>
        <h2 id="guidance-output-heading">{{ availableBundle.oltr.text }}</h2>
      </header>
      <h2 v-else id="guidance-output-heading" class="visually-hidden">Guidance output</h2>

      <div class="guidance-sections">
        <section class="intention panel" aria-labelledby="intention-heading">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Intention</p>
              <h3 id="intention-heading">Choose the quality of response</h3>
              <p class="section-introduction">
                Three viable orientations for this Current. Selection changes the work-domain
                ranking, while the temporal field and OLTR remain fixed.
              </p>
            </div>
            <p class="section-number" aria-hidden="true">01</p>
          </div>

          <ol class="intention-options" aria-label="Ranked intention choices">
            <li v-for="selection in availableBundle.intentions" :key="selection.definition.id">
              <button
                type="button"
                :aria-pressed="selection.definition.id === availableBundle.selectedIntention.id"
                @click="chooseIntention(selection.definition.id)"
              >
                <span class="choice-rank">Rank {{ selection.rank }}</span>
                <span class="intention-choice-identity">
                  <span class="intention-character" aria-hidden="true">
                    {{ selection.definition.character }}
                  </span>
                  <span>
                    <span class="intention-pinyin">{{ selection.definition.pinyin }}</span>
                    <span class="intention-name">{{ selection.definition.englishLabel }}</span>
                  </span>
                </span>
                <span class="intention-definition">
                  {{ selection.definition.shortDefinition }}
                </span>
                <span
                  v-if="selection.definition.id === availableBundle.selectedIntention.id"
                  class="selected-marker"
                >
                  Selected
                </span>
              </button>
            </li>
          </ol>
        </section>

        <section class="execution panel" aria-labelledby="execution-heading">
          <div class="section-heading execution-heading">
            <div>
              <p class="eyebrow">Execution</p>
              <h3 id="execution-heading">Ranked domains of work</h3>
              <p class="section-introduction">
                Categories of activity suited to the selected intention—not commands or required
                tasks.
              </p>
            </div>
            <p class="section-number" aria-hidden="true">02</p>
          </div>

          <div class="active-organ" aria-label="Active organ correspondence">
            <span class="active-organ-label">Active organ</span>
            <strong>
              <span v-if="availableBundle.synthesis.operativeWork.activeOrgan.value.nameChinese">
                {{ availableBundle.synthesis.operativeWork.activeOrgan.value.nameChinese }}
              </span>
              {{ availableBundle.synthesis.operativeWork.activeOrgan.value.nameEnglish }}
            </strong>
            <span aria-hidden="true">·</span>
            <span>
              {{ elementLabel(availableBundle.synthesis.operativeWork.activeOrgan.value.element) }}
            </span>
          </div>

          <ol class="execution-list" aria-label="Ranked execution domains">
            <li
              v-for="selection in availableBundle.executions"
              :key="selection.definition.id"
              class="execution-card"
              :class="{ 'execution-card--active-organ': selection.activeOrganMatch }"
            >
              <div class="execution-card-header">
                <span class="execution-rank">{{ selection.rank }}</span>
                <div class="element-identity">
                  <span class="element-character" aria-hidden="true">
                    {{ selection.definition.elementCharacter }}
                  </span>
                  <div>
                    <p class="element-name">
                      {{ elementLabel(selection.definition.category) }} ·
                      {{ selection.definition.elementPinyin }}
                    </p>
                    <p class="spirit-name">
                      {{ selection.definition.spirit.character }}
                      {{ selection.definition.spirit.pinyin }}
                      <span aria-hidden="true">·</span>
                      {{ organLabel(selection.definition.spirit.zangCorrespondence) }}
                      correspondence
                    </p>
                  </div>
                </div>
                <span v-if="selection.activeOrganMatch" class="organ-match">
                  Active-organ element
                </span>
              </div>

              <h4>{{ selection.definition.title }}</h4>
              <p class="execution-description">{{ selection.definition.description }}</p>

              <div class="domain-examples">
                <p>Work domains</p>
                <ul>
                  <li v-for="domain in selection.definition.taskDomains" :key="domain">
                    {{ domain }}
                  </li>
                </ul>
              </div>
            </li>
          </ol>

          <p class="execution-context-note">
            Five Phase and organ correspondences are traditional. The task-domain mapping and
            ranking are a Current operational formalization, not a medical claim.
          </p>
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
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.guidance-output {
  margin-top: clamp(3rem, 7vw, 6rem);
}

.guidance-oltr {
  max-width: 66rem;
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

.guidance-sections {
  display: grid;
  gap: 1rem;
}

.intention,
.execution,
.guidance-unavailable {
  padding: clamp(1.25rem, 3vw, 2rem);
}

.section-number {
  flex: none;
  margin: 0;
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

h3,
h4 {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: -0.02em;
}

h3 {
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

h4 {
  margin-top: 1.25rem;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
}

.section-introduction {
  max-width: 58ch;
  margin: 0.7rem 0 0;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.5;
}

.intention-options,
.execution-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.intention-options > li {
  min-width: 0;
}

.intention-options button {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 13rem;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface-soft);
  padding: 1rem;
  color: var(--ink);
  font: inherit;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.intention-options button:hover {
  border-color: color-mix(in srgb, var(--jade) 55%, var(--line));
}

.intention-options button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--jade) 58%, transparent);
  outline-offset: 3px;
}

.intention-options button[aria-pressed='true'] {
  border-color: var(--jade);
  background: color-mix(in srgb, var(--jade-wash) 58%, var(--surface-soft));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--jade) 45%, transparent);
}

.choice-rank,
.active-organ-label,
.domain-examples > p {
  color: var(--ink-faint);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.intention-choice-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.25rem;
}

.intention-character {
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1;
}

.intention-pinyin,
.intention-name {
  display: block;
}

.intention-pinyin {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.intention-name {
  margin-top: 0.1rem;
  font-family: var(--font-serif);
  font-size: 1.2rem;
}

.intention-definition {
  max-width: 34ch;
  margin-top: 1rem;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.5;
}

.selected-marker,
.organ-match {
  display: inline-flex;
  align-items: center;
  min-height: 1.65rem;
  border: 1px solid color-mix(in srgb, var(--jade) 55%, var(--line));
  border-radius: 999px;
  color: var(--jade-deep);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.selected-marker {
  margin-top: auto;
  padding: 0.25rem 0.55rem;
}

.execution-heading {
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
}

.active-organ {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem;
  margin-top: 1rem;
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.active-organ strong {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
}

.active-organ-label {
  margin-right: 0.25rem;
}

.execution-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface-soft) 72%, transparent);
  padding: 1rem;
}

.execution-card--active-organ {
  border-color: color-mix(in srgb, var(--jade) 58%, var(--line));
  background: color-mix(in srgb, var(--jade-wash) 42%, var(--surface-soft));
}

.execution-card-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
}

.execution-rank {
  display: grid;
  width: 1.7rem;
  height: 1.7rem;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-faint);
  font-family: var(--font-serif);
  font-size: 0.75rem;
}

.element-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.55rem;
}

.element-character {
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 2rem;
  line-height: 1;
}

.element-name,
.spirit-name {
  margin: 0;
}

.element-name {
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 700;
}

.spirit-name {
  margin-top: 0.1rem;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.organ-match {
  grid-column: 2;
  justify-self: start;
  padding: 0.25rem 0.5rem;
}

.execution-description {
  margin: 0.65rem 0 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.5;
}

.domain-examples {
  margin-top: 1.25rem;
  border-top: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
  padding-top: 0.85rem;
}

.domain-examples > p {
  margin: 0;
}

.domain-examples ul {
  display: grid;
  gap: 0.45rem;
  margin: 0.7rem 0 0;
  padding: 0;
  color: var(--ink-soft);
  font-size: 0.75rem;
  line-height: 1.35;
  list-style: none;
}

.domain-examples li {
  position: relative;
  padding-left: 0.75rem;
}

.domain-examples li::before {
  position: absolute;
  top: 0.55em;
  left: 0;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 50%;
  background: var(--jade);
  content: '';
}

.execution-context-note {
  max-width: 78ch;
  margin: 1rem 0 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1.5;
}

.guidance-source {
  margin: 0.8rem 0 0;
  color: var(--ink-faint);
  font-size: 0.75rem;
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

@media (max-width: 900px) {
  .intention-options,
  .execution-list {
    grid-template-columns: 1fr;
  }

  .intention-options button {
    min-height: 0;
  }

  .guidance-source {
    text-align: left;
  }
}

@media (max-width: 520px) {
  .section-heading {
    gap: 0.75rem;
  }

  .intention,
  .execution,
  .guidance-unavailable {
    padding: 1rem;
  }

  .active-organ {
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .intention-options button {
    transition: none;
  }
}
</style>
