<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  createHexagramCommentaryRepository,
  HEXAGRAM_COMMENTARY_SCHOOLS,
  SCHOOL_IDS,
} from '@/features/hexagram-commentary/repository'
import type {
  HexagramCommentarySet,
  SchoolHexagramSummary,
  SchoolId,
} from '@/features/hexagram-commentary/types'

const props = defineProps<{
  hexagramNumber: number
}>()

const STORAGE_KEY = 'current.hexagram-commentary.school'
const commentaryRepository = createHexagramCommentaryRepository()
const commentarySet = ref<HexagramCommentarySet | null>(null)
const loading = ref(true)

const storedSchool = (() => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return SCHOOL_IDS.includes(value as SchoolId) ? (value as SchoolId) : null
  } catch {
    return null
  }
})()

const activeSchool = ref<SchoolId>(storedSchool ?? 'daoist')
const activeDescriptor = computed(
  () =>
    HEXAGRAM_COMMENTARY_SCHOOLS.find((school) => school.id === activeSchool.value) ??
    HEXAGRAM_COMMENTARY_SCHOOLS[0],
)
const activeSummary = computed<SchoolHexagramSummary | null>(() => {
  if (commentarySet.value?.status !== 'available') return null
  return (
    commentarySet.value.summaries.find(
      (summary) => summary.schoolId === activeSchool.value,
    ) ?? null
  )
})
const isInsufficient = computed(
  () => activeSummary.value?.evidenceMode === 'insufficient',
)
const isDevelopment = import.meta.env.DEV

const evidenceModeLabel = computed(() => {
  const labels: Record<SchoolHexagramSummary['evidenceMode'], string> = {
    'multi-source-direct': 'Multi-source direct evidence',
    'single-source-direct': 'Single-source direct evidence',
    'direct-plus-framework': 'Direct evidence with framework',
    'framework-applied': 'Framework synthesis',
    insufficient: 'Insufficient evidence',
  }
  return activeSummary.value ? labels[activeSummary.value.evidenceMode] : 'Unavailable'
})

const systemLabel = computed(() => {
  switch (activeDescriptor.value?.classification) {
    case 'classical':
      return 'Classical commentary synthesis'
    case 'modern-system':
      return 'Modern system'
    default:
      return 'Modern interpretive synthesis'
  }
})

const selectSchool = (schoolId: SchoolId) => {
  activeSchool.value = schoolId
  try {
    window.localStorage.setItem(STORAGE_KEY, schoolId)
  } catch {
    // Storage may be unavailable in hardened or private browser contexts.
  }
}

const handleTabKeydown = async (event: KeyboardEvent, schoolId: SchoolId) => {
  const currentIndex = SCHOOL_IDS.indexOf(schoolId)
  let nextIndex: number | null = null
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIndex = (currentIndex + 1) % SCHOOL_IDS.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIndex = (currentIndex - 1 + SCHOOL_IDS.length) % SCHOOL_IDS.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = SCHOOL_IDS.length - 1
      break
  }
  if (nextIndex === null) return
  event.preventDefault()
  const nextSchool = SCHOOL_IDS[nextIndex]
  if (!nextSchool) return
  selectSchool(nextSchool)
  await nextTick()
  document
    .getElementById(`commentary-tab-${props.hexagramNumber}-${nextSchool}`)
    ?.focus()
}

watch(
  () => props.hexagramNumber,
  async (hexagramNumber) => {
    loading.value = true
    commentarySet.value = await commentaryRepository.getHexagramCommentaries(hexagramNumber)
    loading.value = false
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="commentary-section"
    :aria-labelledby="`commentary-title-${hexagramNumber}`"
  >
    <div class="commentary-heading">
      <div>
        <p class="section-kicker">Interpretive lenses</p>
        <h2 :id="`commentary-title-${hexagramNumber}`">Synthesis</h2>
      </div>
      <StatusBadge
        :status="commentarySet?.status === 'available' ? 'demo' : 'unavailable'"
        :label="commentarySet?.status === 'available' ? 'Draft · review required' : 'Unavailable'"
      />
    </div>

    <div class="commentary-tabs" role="tablist" aria-label="Interpretive lens">
      <button
        v-for="school in HEXAGRAM_COMMENTARY_SCHOOLS"
        :id="`commentary-tab-${hexagramNumber}-${school.id}`"
        :key="school.id"
        type="button"
        role="tab"
        :tabindex="activeSchool === school.id ? 0 : -1"
        :aria-selected="activeSchool === school.id"
        :aria-controls="`commentary-panel-${hexagramNumber}-${school.id}`"
        :class="{ 'is-active': activeSchool === school.id }"
        @click="selectSchool(school.id)"
        @keydown="handleTabKeydown($event, school.id)"
      >
        {{ school.displayLabel }}
      </button>
    </div>

    <div
      :id="`commentary-panel-${hexagramNumber}-${activeSchool}`"
      class="commentary-panel"
      role="tabpanel"
      :aria-labelledby="`commentary-tab-${hexagramNumber}-${activeSchool}`"
      aria-live="polite"
    >
      <div v-if="loading" class="commentary-state">
        <p>Loading the source-grounded synthesis…</p>
      </div>

      <div v-else-if="commentarySet?.status === 'unavailable'" class="commentary-state">
        <p>{{ commentarySet.reason }}</p>
      </div>

      <div v-else-if="activeSummary && isInsufficient" class="commentary-state">
        <p class="commentary-system-label">{{ systemLabel }}</p>
        <h3>No supported synthesis is available.</h3>
        <p>{{ activeSummary.review.issues[0] }}</p>
      </div>

      <article v-else-if="activeSummary" class="commentary-panel__main">
        <div class="commentary-meta">
          <span>{{ systemLabel }}</span>
          <span>{{ evidenceModeLabel }}</span>
          <span>
            Based on {{ activeSummary.coverage.contributingSourceCount }}
            {{ activeSummary.coverage.contributingSourceCount === 1 ? 'source' : 'sources' }}
          </span>
        </div>

        <p class="commentary-oltr-label">OLTR · One Line To Remember</p>
        <h3>{{ activeSummary.essence }}</h3>
        <p class="commentary-summary">{{ activeSummary.summary }}</p>

        <details class="commentary-sources">
          <summary>Sources and method</summary>
          <p>
            This is original synthesis prose, not a translation or canonical meaning. Source
            passages remain local and are not included in the application.
          </p>
          <ul>
            <li v-for="source in activeSummary.sourcesUsed" :key="source.sourceId">
              <strong>{{ source.title }}</strong>
              <span v-if="source.contributors.length > 0">
                {{ source.contributors.join(' · ') }}
              </span>
              <small>
                {{ source.contribution }} · {{ source.evidenceMode }} ·
                {{ source.locatorCount }} {{ source.locatorCount === 1 ? 'locator' : 'locators' }}
              </small>
            </li>
          </ul>
          <p v-if="activeSummary.sourceTensionNote" class="commentary-tension">
            <strong>Source tension</strong>
            {{ activeSummary.sourceTensionNote }}
          </p>
        </details>

        <details v-if="isDevelopment" class="commentary-debug">
          <summary>Development provenance</summary>
          <p>Content version {{ activeSummary.contentVersion }}</p>
          <ul>
            <li v-for="source in activeSummary.sourcesUsed" :key="source.sourceId">
              {{ source.sourceId }} · {{ source.chunkIds.join(', ') }}
            </li>
          </ul>
        </details>
      </article>
    </div>
  </section>
</template>

<style scoped>
.commentary-section {
  min-width: 0;
  margin-top: clamp(2rem, 4vw, 3.5rem);
  border-top: 1px solid var(--line);
  padding-top: 1.3rem;
}

.commentary-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.commentary-heading h2 {
  margin: 0.18rem 0 0.55rem;
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 2vw, 1.9rem);
  font-weight: 500;
}

.commentary-heading :deep(.status-label) {
  flex: 0 0 auto;
  padding: 0.24rem 0.5rem;
  font-size: 0.54rem;
}

.section-kicker {
  margin: 0;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.commentary-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.8rem;
}

.commentary-tabs button {
  min-width: 0;
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.5rem 0.35rem;
  color: var(--ink-soft);
  font-size: 0.7rem;
  overflow-wrap: anywhere;
}

.commentary-tabs button:hover,
.commentary-tabs button:focus-visible,
.commentary-tabs button.is-active {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

.commentary-panel {
  min-width: 0;
  margin-top: 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 48%, transparent);
  padding: clamp(1rem, 2.4vw, 1.5rem);
}

.commentary-state {
  color: var(--ink-faint);
  font-size: 0.75rem;
}

.commentary-state h3 {
  margin: 0.25rem 0 0.6rem;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
}

.commentary-state p:last-child {
  margin-bottom: 0;
}

.commentary-system-label {
  margin: 0;
  color: var(--jade);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.commentary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.commentary-meta span:not(:last-child)::after {
  margin-left: 0.75rem;
  color: var(--line-strong);
  content: '·';
}

.commentary-panel__main h3 {
  margin: 0.25rem 0 0;
  color: var(--jade-deep);
  font-family: var(--font-serif);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  font-weight: 500;
  line-height: 1.3;
}

.commentary-oltr-label {
  margin: 0.75rem 0 0;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.commentary-summary {
  margin: 0.75rem 0 0;
  color: var(--ink-soft);
  font-size: 0.76rem;
  line-height: 1.7;
}

.commentary-sources,
.commentary-debug {
  margin-top: 1rem;
  border-top: 1px solid var(--line);
  padding-top: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.commentary-sources summary,
.commentary-debug summary {
  width: fit-content;
  cursor: pointer;
  color: var(--jade);
  font-weight: 750;
}

.commentary-sources > p {
  line-height: 1.55;
}

.commentary-sources ul,
.commentary-debug ul {
  display: grid;
  gap: 0.55rem;
  margin: 0.7rem 0;
  padding: 0;
  list-style: none;
}

.commentary-sources li {
  display: grid;
  gap: 0.1rem;
}

.commentary-sources strong {
  color: var(--ink-soft);
  font-weight: 650;
}

.commentary-sources small {
  font-size: 0.58rem;
}

.commentary-tension {
  border-left: 2px solid var(--jade);
  padding-left: 0.7rem;
}

.commentary-tension strong {
  display: block;
  color: var(--ink-soft);
}

.commentary-debug {
  opacity: 0.72;
}

.commentary-debug li {
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .commentary-heading {
    align-items: flex-start;
  }

  .commentary-tabs {
    gap: 0.35rem;
  }

  .commentary-tabs button {
    min-height: 3rem;
    font-size: 0.64rem;
  }

  .commentary-panel {
    overflow: hidden;
    padding-inline: 0.85rem;
  }

  .commentary-meta span::after {
    display: none;
  }
}
</style>
