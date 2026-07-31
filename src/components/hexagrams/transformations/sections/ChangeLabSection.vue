<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import { getHexagram, getHexagramByLines } from '@/domain/astrology/hexagrams'
import type { HexagramReference } from '@/domain/astrology/types'
import {
  calculateNuclear,
  createAvailableResult,
  getRelatingResult,
  getTransformationPathCount,
  getTransformationPaths,
  LINE_NUMBERS,
  type LineNumber,
  type TransformationEngine,
  type TransformationLabFilters,
  type TransformationPath,
  type TransformationResult,
} from '@/domain/yijing/transformations'

import TransformationHexagramCard from '../TransformationHexagramCard.vue'

const props = defineProps<{
  source: HexagramReference
  selectedMovingLines: readonly LineNumber[]
  filters: TransformationLabFilters
  visited: ReadonlySet<number>
  engine: TransformationEngine
}>()

const emit = defineEmits<{
  select: [result: TransformationResult]
  updateMovingLines: [lines: readonly LineNumber[]]
  updateFilters: [filters: TransformationLabFilters]
}>()

const visibleByGroup = ref<Record<LineNumber, number>>({
  1: 6,
  2: 6,
  3: 6,
  4: 6,
  5: 6,
  6: 6,
})
const pathsRequested = ref(false)
const pathOffset = ref(0)
const pathPageSize = 6

const allDestinations = computed(() => props.engine.getDestinations(props.source))
const immediateChanges = computed(() =>
  allDestinations.value.filter((destination) => destination.changedLineCount === 1),
)
const selectedResult = computed(() => getRelatingResult(props.source, props.selectedMovingLines))
const selectedTarget = computed(() =>
  selectedResult.value.targetHexagramNumber === undefined
    ? null
    : getHexagram(selectedResult.value.targetHexagramNumber),
)
const sourceNuclearNumber = computed(
  () => getHexagramByLines(calculateNuclear(props.source.linesBottomToTop)).number,
)
const selectedTargetNuclearNumber = computed(() =>
  selectedTarget.value
    ? getHexagramByLines(calculateNuclear(selectedTarget.value.linesBottomToTop)).number
    : null,
)
const selectedSymmetryLabels = computed(() => {
  if (!selectedTarget.value) return []
  return (
    props.engine
      .getSymmetry(props.source)
      .find((result) => result.targetHexagramNumber === selectedTarget.value?.number)
      ?.operationLabels ?? []
  )
})
const selectedKingWenRelation = computed(() => {
  if (!selectedTarget.value) return 'None'
  const pair = props.source.number % 2 === 0 ? props.source.number - 1 : props.source.number + 1
  if (selectedTarget.value.number === pair) return 'King Wen Pair'
  if (selectedTarget.value.number === props.source.number - 1) return 'Previous neighbor'
  if (selectedTarget.value.number === props.source.number + 1) return 'Next neighbor'
  return 'None'
})
const pathCount = computed(() =>
  selectedTarget.value ? getTransformationPathCount(props.source, selectedTarget.value) : 0,
)
const pathPage = computed(() =>
  pathsRequested.value && selectedTarget.value
    ? getTransformationPaths(props.source, selectedTarget.value, {
        offset: pathOffset.value,
        limit: pathPageSize,
      })
    : null,
)

const normalizedQuery = computed(() => props.filters.query.trim().toLocaleLowerCase())
const filteredDestinations = computed(() => {
  const filtered = allDestinations.value.filter((destination) => {
    if (
      props.filters.changedLineCount !== 'all' &&
      destination.changedLineCount !== props.filters.changedLineCount
    ) {
      return false
    }
    if (
      props.filters.specificLine !== 'all' &&
      !destination.result.changedLines.includes(props.filters.specificLine)
    ) {
      return false
    }
    if (props.filters.sharesLowerTrigram && !destination.sharesLowerTrigram) return false
    if (props.filters.sharesUpperTrigram && !destination.sharesUpperTrigram) return false
    if (props.filters.sharesNuclearHexagram && !destination.sharesNuclearHexagram) return false
    if (
      props.filters.yilinAvailability === 'available' &&
      destination.yilinStatus !== 'available'
    ) {
      return false
    }
    const wasVisited = props.visited.has(destination.target.number)
    if (props.filters.visited === 'visited' && !wasVisited) return false
    if (props.filters.visited === 'unvisited' && wasVisited) return false
    if (
      normalizedQuery.value &&
      !`${destination.target.number} ${destination.target.nameEnglish} ${destination.target.nameChinese} ${destination.target.namePinyin}`
        .toLocaleLowerCase()
        .includes(normalizedQuery.value)
    ) {
      return false
    }
    return true
  })

  return [...filtered].sort((left, right) => {
    switch (props.filters.sort) {
      case 'fewest-lines':
        return (
          left.changedLineCount - right.changedLineCount || left.target.number - right.target.number
        )
      case 'king-wen':
        return left.target.number - right.target.number
      case 'english-name':
        return left.target.nameEnglish.localeCompare(right.target.nameEnglish)
      case 'yilin-availability':
        return (
          Number(right.yilinStatus === 'available') - Number(left.yilinStatus === 'available') ||
          left.target.number - right.target.number
        )
    }
  })
})
const groupedDestinations = computed(() =>
  LINE_NUMBERS.map((count) => ({
    count,
    total: allDestinations.value.filter((destination) => destination.changedLineCount === count)
      .length,
    matches: filteredDestinations.value.filter(
      (destination) => destination.changedLineCount === count,
    ),
  })),
)

const toggleLine = (lineNumber: LineNumber) => {
  const selected = new Set(props.selectedMovingLines)
  if (selected.has(lineNumber)) selected.delete(lineNumber)
  else selected.add(lineNumber)
  emit(
    'updateMovingLines',
    [...selected].sort((left, right) => left - right),
  )
}
const setAllLines = () => emit('updateMovingLines', LINE_NUMBERS)
const clearLines = () => emit('updateMovingLines', [])
const invertLines = () =>
  emit(
    'updateMovingLines',
    LINE_NUMBERS.filter((lineNumber) => !props.selectedMovingLines.includes(lineNumber)),
  )
const updateFilter = <Key extends keyof TransformationLabFilters>(
  key: Key,
  value: TransformationLabFilters[Key],
) => emit('updateFilters', { ...props.filters, [key]: value })
const showMore = (group: LineNumber) => {
  visibleByGroup.value = {
    ...visibleByGroup.value,
    [group]: visibleByGroup.value[group] + 6,
  }
}
const toPathResult = (path: TransformationPath, stepIndex: number): TransformationResult => {
  const step = path.steps[stepIndex]
  if (!step) {
    throw new Error(`Missing transformation path step ${stepIndex}.`)
  }
  return createAvailableResult(
    props.source,
    'transformation-paths',
    getHexagram(step.targetHexagramNumber),
    path.changedLineOrder.slice(0, stepIndex + 1),
    {
      operationLabels: [`Path ${path.index + 1} · step ${stepIndex + 1}`, step.label],
      dataStatus: 'current-derived',
      explanation:
        'Intermediate in a minimal path; changed lines are cumulative from the Lab source.',
    },
  )
}

watch(
  () => props.selectedMovingLines,
  () => {
    pathsRequested.value = false
    pathOffset.value = 0
  },
)
</script>

<template>
  <div class="section-stack">
    <header>
      <p>Complete line-change universe</p>
      <h2>Change Lab</h2>
      <span>
        Every one of the 63 nonidentical destinations, organized by exact Hamming distance.
      </span>
    </header>

    <section class="line-workbench" aria-labelledby="line-selector-title">
      <div class="selector-copy">
        <h3 id="line-selector-title">Select moving lines</h3>
        <p>Shown top-to-bottom; calculated as line 1 at the bottom through line 6 at the top.</p>
        <div class="selector-actions">
          <button type="button" @click="clearLines">Clear all</button>
          <button type="button" @click="setAllLines">Select all</button>
          <button type="button" @click="invertLines">Invert selection</button>
        </div>
      </div>

      <div class="interactive-glyph" aria-label="Six moving-line controls">
        <button
          v-for="lineNumber in [...LINE_NUMBERS].reverse()"
          :key="lineNumber"
          type="button"
          :aria-pressed="selectedMovingLines.includes(lineNumber)"
          :class="{ 'is-selected': selectedMovingLines.includes(lineNumber) }"
          :aria-label="`Line ${lineNumber}, ${source.linesBottomToTop[lineNumber - 1]}; line text not connected`"
          @click="toggleLine(lineNumber)"
        >
          <span>Line {{ lineNumber }}</span>
          <span class="line-geometry" :class="source.linesBottomToTop[lineNumber - 1]">
            <i></i><i></i>
          </span>
          <small>
            {{ selectedMovingLines.includes(lineNumber) ? 'Selected' : 'Not selected' }} · line text
            not connected
          </small>
        </button>
      </div>

      <div class="target-preview" aria-live="polite">
        <div class="preview-figures">
          <HexagramGlyph
            :lines="source.linesBottomToTop"
            size="compact"
            :label="source.nameEnglish"
          />
          <span aria-hidden="true">→</span>
          <HexagramGlyph
            v-if="selectedTarget"
            :lines="selectedTarget.linesBottomToTop"
            size="compact"
            :label="selectedTarget.nameEnglish"
          />
          <span v-else class="empty-target">—</span>
        </div>
        <p>
          {{ selectedMovingLines.length }} selected
          {{ selectedMovingLines.length === 1 ? 'line' : 'lines' }}
        </p>
        <TransformationHexagramCard
          :result="selectedResult"
          show-transition-status
          :visited="
            selectedResult.targetHexagramNumber !== undefined &&
            visited.has(selectedResult.targetHexagramNumber)
          "
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section aria-labelledby="immediate-changes-title">
      <div class="section-heading">
        <div>
          <h3 id="immediate-changes-title">Six immediate changes</h3>
          <p>One deterministic target for each individual line.</p>
        </div>
        <span>6 destinations</span>
      </div>
      <p class="source-notice">
        Source line-text titles are not connected; cards show structural line positions only.
      </p>
      <div class="result-grid">
        <TransformationHexagramCard
          v-for="destination in immediateChanges"
          :key="destination.result.id"
          :result="destination.result"
          show-transition-status
          :visited="visited.has(destination.target.number)"
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section v-if="selectedTarget" class="destination-details" aria-labelledby="destination-title">
      <div class="section-heading">
        <div>
          <h3 id="destination-title">Selected destination details</h3>
          <p>Deterministic relation evidence for the current line mask.</p>
        </div>
        <span>{{ pathCount }} minimal {{ pathCount === 1 ? 'path' : 'paths' }}</span>
      </div>
      <dl>
        <div>
          <dt>Changed lines</dt>
          <dd>{{ selectedMovingLines.join(', ') }}</dd>
        </div>
        <div>
          <dt>Hamming distance</dt>
          <dd>{{ selectedMovingLines.length }}</dd>
        </div>
        <div>
          <dt>Trigrams</dt>
          <dd>
            {{ source.lowerTrigram.nameEnglish }}/{{ source.upperTrigram.nameEnglish }} →
            {{ selectedTarget.lowerTrigram.nameEnglish }}/{{
              selectedTarget.upperTrigram.nameEnglish
            }}
          </dd>
        </div>
        <div>
          <dt>Target nuclear</dt>
          <dd>Hexagram {{ selectedTargetNuclearNumber }}</dd>
        </div>
        <div>
          <dt>Source nuclear</dt>
          <dd>Hexagram {{ sourceNuclearNumber }}</dd>
        </div>
        <div>
          <dt>King Wen relation</dt>
          <dd>{{ selectedKingWenRelation }}</dd>
        </div>
        <div>
          <dt>Symmetry relation</dt>
          <dd>{{ selectedSymmetryLabels.length ? selectedSymmetryLabels.join(', ') : 'None' }}</dd>
        </div>
        <div>
          <dt>Jiaoshi Yilin</dt>
          <dd>Transition repository not connected</dd>
        </div>
        <div>
          <dt>Eight Palaces</dt>
          <dd>Source table not connected</dd>
        </div>
      </dl>
      <button
        v-if="!pathsRequested"
        class="paths-button"
        type="button"
        @click="pathsRequested = true"
      >
        Calculate Transformation Paths
      </button>
      <div v-else-if="pathPage" class="paths">
        <div class="paths-heading">
          <div>
            <strong>Transformation Paths</strong>
            <span>Current structural exploration · {{ pathPage.total }} total</span>
          </div>
          <div>
            <button
              type="button"
              :disabled="pathOffset === 0"
              @click="pathOffset = Math.max(0, pathOffset - pathPageSize)"
            >
              Previous
            </button>
            <button
              type="button"
              :disabled="pathOffset + pathPageSize >= pathPage.total"
              @click="pathOffset += pathPageSize"
            >
              Next
            </button>
          </div>
        </div>
        <details
          v-for="path in pathPage.paths"
          :key="path.index"
          :open="path.index === pathPage.offset"
        >
          <summary>
            Path {{ path.index + 1 }} · lines {{ path.changedLineOrder.join(' → ') }}
          </summary>
          <div class="path-steps">
            <TransformationHexagramCard
              v-for="(step, stepIndex) in path.steps"
              :key="`${path.index}-${stepIndex}`"
              compact
              :result="toPathResult(path, stepIndex)"
              show-transition-status
              :visited="visited.has(step.targetHexagramNumber)"
              @select="emit('select', $event)"
            />
          </div>
        </details>
      </div>
    </section>

    <section aria-labelledby="destination-browser-title">
      <div class="section-heading">
        <div>
          <h3 id="destination-browser-title">All 63 destinations</h3>
          <p>{{ filteredDestinations.length }} match the current filters.</p>
        </div>
        <span>Counts: 6 · 15 · 20 · 15 · 6 · 1</span>
      </div>

      <div class="filters">
        <label>
          Search
          <input
            :value="filters.query"
            type="search"
            placeholder="Number or name"
            @input="updateFilter('query', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          Changed-line count
          <select
            :value="filters.changedLineCount"
            @change="
              updateFilter(
                'changedLineCount',
                ($event.target as HTMLSelectElement).value === 'all'
                  ? 'all'
                  : (Number(($event.target as HTMLSelectElement).value) as LineNumber),
              )
            "
          >
            <option value="all">All</option>
            <option v-for="line in LINE_NUMBERS" :key="line" :value="line">{{ line }}</option>
          </select>
        </label>
        <label>
          Contains line
          <select
            :value="filters.specificLine"
            @change="
              updateFilter(
                'specificLine',
                ($event.target as HTMLSelectElement).value === 'all'
                  ? 'all'
                  : (Number(($event.target as HTMLSelectElement).value) as LineNumber),
              )
            "
          >
            <option value="all">Any</option>
            <option v-for="line in LINE_NUMBERS" :key="line" :value="line">{{ line }}</option>
          </select>
        </label>
        <label>
          Visited
          <select
            :value="filters.visited"
            @change="
              updateFilter(
                'visited',
                ($event.target as HTMLSelectElement).value as TransformationLabFilters['visited'],
              )
            "
          >
            <option value="all">All</option>
            <option value="unvisited">Unvisited</option>
            <option value="visited">Visited</option>
          </select>
        </label>
        <label>
          Sort
          <select
            :value="filters.sort"
            @change="
              updateFilter(
                'sort',
                ($event.target as HTMLSelectElement).value as TransformationLabFilters['sort'],
              )
            "
          >
            <option value="fewest-lines">Fewest changed lines</option>
            <option value="king-wen">King Wen number</option>
            <option value="english-name">English name</option>
            <option value="yilin-availability">Yilin availability</option>
          </select>
        </label>
        <label class="check-filter">
          <input
            :checked="filters.sharesLowerTrigram"
            type="checkbox"
            @change="
              updateFilter('sharesLowerTrigram', ($event.target as HTMLInputElement).checked)
            "
          />
          Shares lower trigram
        </label>
        <label class="check-filter">
          <input
            :checked="filters.sharesUpperTrigram"
            type="checkbox"
            @change="
              updateFilter('sharesUpperTrigram', ($event.target as HTMLInputElement).checked)
            "
          />
          Shares upper trigram
        </label>
        <label class="check-filter">
          <input
            :checked="filters.sharesNuclearHexagram"
            type="checkbox"
            @change="
              updateFilter('sharesNuclearHexagram', ($event.target as HTMLInputElement).checked)
            "
          />
          Shares nuclear hexagram
        </label>
        <label class="check-filter">
          <input
            :checked="filters.yilinAvailability === 'available'"
            type="checkbox"
            @change="
              updateFilter(
                'yilinAvailability',
                ($event.target as HTMLInputElement).checked ? 'available' : 'all',
              )
            "
          />
          Has Jiaoshi Yilin transition
        </label>
      </div>

      <p v-if="filters.yilinAvailability === 'available'" class="source-notice" role="status">
        No reviewed Jiaoshi Yilin transition repository is connected, so this filter has no matches.
      </p>

      <div class="destination-groups">
        <details v-for="group in groupedDestinations" :key="group.count" :open="group.count === 1">
          <summary>
            {{ group.count }} changed {{ group.count === 1 ? 'line' : 'lines' }}
            <span>{{ group.matches.length }} shown · {{ group.total }} total</span>
          </summary>
          <div class="result-grid">
            <TransformationHexagramCard
              v-for="destination in group.matches.slice(0, visibleByGroup[group.count])"
              :key="destination.result.id"
              :result="destination.result"
              show-transition-status
              :visited="visited.has(destination.target.number)"
              @select="emit('select', $event)"
            />
          </div>
          <button
            v-if="group.matches.length > visibleByGroup[group.count]"
            class="show-more"
            type="button"
            @click="showMore(group.count)"
          >
            Show 6 more
          </button>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-stack {
  display: grid;
  max-width: 100%;
  min-width: 0;
  gap: 2rem;
}

.section-stack > *,
.line-workbench > *,
.result-grid > * {
  min-width: 0;
}

header > p {
  margin: 0;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 {
  margin: 0.2rem 0;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 500;
}

h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 500;
}

header > span,
.selector-copy p,
.section-heading p,
.section-heading > span {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.line-workbench {
  display: grid;
  max-width: 100%;
  min-width: 0;
  grid-template-columns: minmax(10rem, 0.7fr) minmax(15rem, 1fr) minmax(16rem, 1.25fr);
  gap: 1rem;
  align-items: start;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 58%, transparent);
  padding: 1rem;
}

.selector-copy p {
  margin: 0.35rem 0 0.8rem;
}

.selector-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.selector-actions button,
.paths-button,
.paths-heading button,
.show-more {
  min-height: 2.35rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.45rem 0.65rem;
  color: var(--ink-soft);
  font-size: 0.61rem;
}

.interactive-glyph {
  display: grid;
  gap: 0.35rem;
}

.interactive-glyph > button {
  display: grid;
  grid-template-columns: 3.2rem 1fr minmax(5.5rem, auto);
  gap: 0.45rem;
  align-items: center;
  min-height: 2.6rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.4rem;
  color: var(--ink-soft);
  text-align: left;
}

.interactive-glyph > button.is-selected {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

.interactive-glyph > button > span:first-child {
  font-size: 0.6rem;
}

.interactive-glyph small {
  color: var(--ink-faint);
  font-size: 0.5rem;
}

.line-geometry {
  display: flex;
  gap: 12%;
}

.line-geometry i {
  display: block;
  width: 100%;
  height: 0.36rem;
  border-radius: 999px;
  background: currentColor;
}

.line-geometry.yang i:last-child {
  display: none;
}

.line-geometry.yin i {
  width: 44%;
}

.target-preview {
  display: grid;
  gap: 0.6rem;
}

.preview-figures {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-height: 5rem;
  color: var(--jade-deep);
}

.preview-figures .hexagram-glyph {
  width: 4rem;
}

.empty-target {
  display: grid;
  width: 4rem;
  height: 4rem;
  border: 1px dashed var(--line);
  place-items: center;
}

.target-preview > p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.61rem;
  text-align: center;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
}

.section-heading p {
  margin: 0.2rem 0 0;
}

.result-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.destination-details {
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.destination-details dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin: 0;
}

.destination-details dl > div {
  border-top: 1px solid var(--line);
  padding-top: 0.45rem;
}

dt {
  color: var(--ink-faint);
  font-size: 0.54rem;
  text-transform: uppercase;
}

dd {
  margin: 0.15rem 0 0;
  font-size: 0.67rem;
}

.paths-button {
  margin-top: 0.8rem;
  border-color: var(--jade);
  color: var(--jade);
}

.paths {
  display: grid;
  max-width: 100%;
  min-width: 0;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.paths-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.paths-heading > div:first-child {
  display: grid;
}

.paths-heading strong {
  font-family: var(--font-serif);
  font-weight: 500;
}

.paths-heading span {
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.paths-heading button + button {
  margin-left: 0.35rem;
}

details {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.6rem;
}

summary {
  cursor: pointer;
  color: var(--ink-soft);
  font-size: 0.65rem;
}

.path-steps {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.55rem;
}

.filters {
  display: grid;
  max-width: 100%;
  min-width: 0;
  grid-template-columns: repeat(5, minmax(8rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.7rem;
}

.filters label {
  display: grid;
  gap: 0.2rem;
  color: var(--ink-faint);
  font-size: 0.54rem;
}

.filters input,
.filters select {
  min-width: 0;
  min-height: 2.45rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper-raised);
  padding: 0.42rem;
  color: var(--ink);
  font: inherit;
}

.filters .check-filter {
  display: flex;
  align-items: center;
  min-height: 2.45rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.4rem;
}

.check-filter input {
  min-height: auto;
}

.source-notice {
  border: 1px dashed var(--line);
  border-radius: var(--radius-sm);
  padding: 0.65rem;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.destination-groups {
  display: grid;
  max-width: 100%;
  min-width: 0;
  gap: 0.55rem;
}

.destination-groups summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-serif);
  font-size: 0.9rem;
}

.destination-groups summary span {
  color: var(--ink-faint);
  font-family: var(--font-sans);
  font-size: 0.55rem;
}

.destination-groups .result-grid {
  margin-top: 0.65rem;
}

.show-more {
  margin-top: 0.65rem;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--jade);
  outline-offset: 2px;
}

@media (max-width: 1050px) {
  .line-workbench {
    grid-template-columns: 1fr 1fr;
  }

  .selector-copy {
    grid-column: 1 / -1;
  }

  .filters {
    grid-template-columns: repeat(3, minmax(8rem, 1fr));
  }
}

@media (max-width: 700px) {
  .line-workbench,
  .result-grid,
  .destination-details dl {
    grid-template-columns: 1fr;
  }

  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-heading,
  .paths-heading {
    display: grid;
  }

  .interactive-glyph > button {
    grid-template-columns: 3rem 1fr;
  }

  .interactive-glyph small {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
