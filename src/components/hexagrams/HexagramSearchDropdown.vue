<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import GeneKeyFrequencyIcon from '@/components/astrology/GeneKeyFrequencyIcon.vue'
import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import { getHexagrams } from '@/domain/astrology/hexagrams'
import { filterHexagrams } from '@/domain/astrology/hexagramSearch'

const props = defineProps<{
  currentHexagramNumber: number
}>()

const emit = defineEmits<{
  select: [hexagramNumber: number]
}>()

const root = ref<HTMLElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(0)
const hexagrams = getHexagrams('king-wen')
const results = computed(() => filterHexagrams(hexagrams, query.value))
const activeResult = computed(() => results.value[activeIndex.value])

watch(query, () => {
  activeIndex.value = 0
  isOpen.value = true
})

watch(
  () => props.currentHexagramNumber,
  () => {
    query.value = ''
    isOpen.value = false
  },
)

const openResults = () => {
  isOpen.value = true
  activeIndex.value = Math.max(
    0,
    results.value.findIndex((hexagram) => hexagram.number === props.currentHexagramNumber),
  )
}

const selectResult = (hexagramNumber: number) => {
  emit('select', hexagramNumber)
  query.value = ''
  isOpen.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    isOpen.value = false
    return
  }

  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return
  event.preventDefault()
  event.stopPropagation()

  if (!isOpen.value) {
    openResults()
    return
  }

  if (event.key === 'ArrowDown' && results.value.length) {
    activeIndex.value = (activeIndex.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp' && results.value.length) {
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter' && activeResult.value) {
    selectResult(activeResult.value.number)
  }
}

const handleFocusOut = (event: FocusEvent) => {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !root.value?.contains(nextTarget)) {
    isOpen.value = false
  }
}
</script>

<template>
  <div ref="root" class="hexagram-search" @focusout="handleFocusOut">
    <label class="search-label" for="modal-hexagram-search">Jump to hexagram</label>
    <span class="search-input-wrap">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
      <input
        id="modal-hexagram-search"
        v-model="query"
        class="hexagram-search-input"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="modal-hexagram-search-results"
        :aria-expanded="isOpen"
        :aria-activedescendant="
          isOpen && activeResult ? `modal-hexagram-result-${activeResult.number}` : undefined
        "
        autocomplete="off"
        spellcheck="false"
        placeholder="Number, name, pinyin, or Gene Key"
        @focus="openResults"
        @keydown="handleKeydown"
      />
    </span>

    <div v-if="isOpen" class="search-popover">
      <p class="search-result-count" aria-live="polite">
        {{ results.length }} {{ results.length === 1 ? 'result' : 'results' }}
      </p>
      <ul
        v-if="results.length"
        id="modal-hexagram-search-results"
        class="search-results"
        role="listbox"
        aria-label="Hexagram search results"
      >
        <li
          v-for="(result, index) in results"
          :id="`modal-hexagram-result-${result.number}`"
          :key="result.number"
          class="search-result"
          :class="{ 'is-active': index === activeIndex }"
          role="option"
          :aria-selected="result.number === currentHexagramNumber"
          @mouseenter="activeIndex = index"
          @mousedown.prevent="selectResult(result.number)"
        >
          <span class="result-glyph">
            <HexagramGlyph
              :lines="result.linesBottomToTop"
              size="compact"
              :label="`Hexagram ${result.number}, ${result.nameEnglish}`"
            />
            <strong>{{ result.number }}</strong>
          </span>
          <span class="result-identity">
            <strong>{{ result.nameEnglish }}</strong>
            <small>
              <span lang="zh-Hant">{{ result.nameChinese }}</span>
              <span aria-hidden="true"> · </span>
              <span lang="zh-Latn-pinyin">{{ result.namePinyin }}</span>
            </small>
          </span>
          <span class="result-spectrum" :aria-label="`Gene Key ${result.number} spectrum`">
            <span class="result-spectrum__shadow">
              <GeneKeyFrequencyIcon band="shadow" />
              <span class="visually-hidden">Shadow:</span>
              <span>{{ result.geneKey.shadow }}</span>
            </span>
            <span class="result-spectrum__gift">
              <GeneKeyFrequencyIcon band="gift" />
              <span class="visually-hidden">Gift:</span>
              <span>{{ result.geneKey.gift }}</span>
            </span>
            <span class="result-spectrum__siddhi">
              <GeneKeyFrequencyIcon band="siddhi" />
              <span class="visually-hidden">Siddhi:</span>
              <span>{{ result.geneKey.siddhi }}</span>
            </span>
          </span>
        </li>
      </ul>
      <p v-else class="search-empty">No matching hexagram.</p>
    </div>
  </div>
</template>

<style scoped>
.hexagram-search {
  position: relative;
  z-index: 3;
  width: min(32rem, 42vw);
}

.search-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.search-input-wrap {
  position: relative;
  display: block;
}

.search-input-wrap > svg {
  position: absolute;
  top: 50%;
  left: 0.7rem;
  width: 0.9rem;
  height: 0.9rem;
  pointer-events: none;
  fill: none;
  stroke: var(--ink-faint);
  stroke-linecap: round;
  stroke-width: 1.7;
  transform: translateY(-50%);
}

.hexagram-search-input {
  width: 100%;
  min-height: 2.6rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper) 72%, transparent);
  padding: 0.55rem 0.9rem 0.55rem 2.15rem;
  color: var(--ink);
  font: inherit;
  font-size: 0.72rem;
}

.hexagram-search-input:focus {
  border-color: var(--jade);
  outline: 2px solid color-mix(in srgb, var(--jade) 25%, transparent);
  outline-offset: 1px;
}

.search-popover {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  overflow: hidden;
  width: min(46rem, calc(100vw - 2rem));
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--paper-raised);
  box-shadow: var(--shadow);
}

.search-result-count {
  margin: 0;
  border-bottom: 1px solid var(--line);
  padding: 0.55rem 0.8rem;
  color: var(--ink-faint);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-results {
  overflow: auto;
  max-height: min(31rem, 62dvh);
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  overscroll-behavior: contain;
}

.search-result {
  display: grid;
  grid-template-columns: 3.7rem minmax(8rem, 0.8fr) minmax(18rem, 1.5fr);
  align-items: center;
  gap: 0.8rem;
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.65rem;
  cursor: pointer;
  color: var(--ink-soft);
}

.search-result.is-active {
  background: var(--jade-wash);
  color: var(--ink);
}

.result-glyph {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--jade-deep);
}

.result-glyph :deep(.hexagram-glyph) {
  width: 1.65rem;
}

.result-glyph strong {
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.72rem;
}

.result-identity {
  display: grid;
  min-width: 0;
}

.result-identity > strong {
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 0.82rem;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-identity small {
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.result-spectrum {
  display: flex;
  flex-wrap: wrap-reverse;
  align-items: center;
  justify-content: flex-start;
  gap: 0.22rem 0.7rem;
  min-width: 0;
  font-size: 0.62rem;
  line-height: 1.2;
}

.result-spectrum > span {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  white-space: nowrap;
}

.result-spectrum :deep(.gene-key-frequency-icon) {
  font-size: 0.75rem;
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

.result-spectrum__shadow {
  color: var(--ink-faint);
}

.result-spectrum__gift {
  color: var(--jade);
}

.result-spectrum__siddhi {
  color: var(--ink);
}

.search-empty {
  margin: 0;
  padding: 2.5rem 1rem;
  color: var(--ink-faint);
  font-size: 0.72rem;
  text-align: center;
}

@media (max-width: 760px) {
  .hexagram-search {
    order: 3;
    width: 100%;
  }

  .search-popover {
    right: auto;
    left: 0;
    width: 100%;
  }

  .search-result {
    grid-template-columns: 3.5rem minmax(0, 1fr);
  }

  .result-spectrum {
    grid-column: 1 / -1;
    padding-left: 0.15rem;
  }
}

@media (max-width: 430px) {
  .result-spectrum {
    gap: 0.3rem 0.7rem;
    padding-block: 0.2rem 0.3rem;
  }
}
</style>
