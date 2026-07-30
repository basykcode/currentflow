<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import HexagramGlyph from '@/components/astrology/HexagramGlyph.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  createTransformationEngine,
  getRelatingResult,
  type LineNumber,
  type TransformationResult,
} from '@/domain/yijing/transformations'
import { useHexagramInspectorStore } from '@/stores/hexagramInspector'

import TransformationHexagramCard from './transformations/TransformationHexagramCard.vue'
import TransformationLab from './transformations/TransformationLab.vue'

type CommentaryKey =
  'daoism' | 'confucianism' | 'buddhism' | 'psychology' | 'human-design' | 'gene-keys'

const COMMENTARIES: readonly { key: CommentaryKey; label: string }[] = [
  { key: 'daoism', label: 'Daoism' },
  { key: 'confucianism', label: 'Confucianism' },
  { key: 'buddhism', label: 'Buddhism' },
  { key: 'psychology', label: 'Psychology' },
  { key: 'human-design', label: 'Human Design' },
  { key: 'gene-keys', label: 'Gene Keys' },
]

const LINE_NUMBERS: readonly LineNumber[] = [1, 2, 3, 4, 5, 6]

const inspector = useHexagramInspectorStore()
const transformationEngine = createTransformationEngine()
const dialog = ref<HTMLElement | null>(null)
const modalScroll = ref<HTMLElement | null>(null)
const splitPinned = ref(false)
const splitHovered = ref(false)
const selectedLine = ref<LineNumber>(1)
const activeCommentary = ref<CommentaryKey>('daoism')
let previousFocus: HTMLElement | null = null
let priorBodyOverflow = ''

const hexagram = computed(() => inspector.hexagram)
const screen = computed(() => inspector.screen)
const arrivalContext = computed(() =>
  screen.value?.kind === 'hexagram' ? screen.value.arrivalContext : undefined,
)
const baseTransformations = computed(() => {
  if (!hexagram.value) return []
  const intrinsic = transformationEngine
    .getIntrinsic(hexagram.value)
    .filter((result) => result.definitionId !== 'trigram-exchange')
  return [getRelatingResult(hexagram.value, [selectedLine.value]), ...intrinsic]
})
const labScreen = computed(() =>
  screen.value?.kind === 'transformation-lab' ? screen.value : null,
)
const splitVisible = computed(() => splitPinned.value || splitHovered.value)
const commentaryLabel = computed(
  () => COMMENTARIES.find((item) => item.key === activeCommentary.value)?.label ?? 'Commentary',
)

const selectTransformation = (result: TransformationResult) => {
  if (labScreen.value) {
    inspector.updateTransformationLab({
      scrollTop: modalScroll.value?.scrollTop ?? 0,
    })
  }
  inspector.openHexagramFromTransformation(result)
}

const openTransformationLab = () => {
  inspector.openTransformationLab([selectedLine.value], modalScroll.value?.scrollTop ?? 0)
}

const navigateBack = () => {
  inspector.navigateBackWithinModal()
}

const close = () => {
  inspector.close()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key !== 'Tab' || !dialog.value) return

  const focusable = [
    ...dialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], select:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ]
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => inspector.isOpen,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      priorBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialog.value?.querySelector<HTMLElement>('.inspector-close')?.focus()
      return
    }

    document.body.style.overflow = priorBodyOverflow
    previousFocus?.focus()
    previousFocus = null
  },
)

watch(
  () => inspector.screen,
  async (nextScreen, previousScreen) => {
    if (!nextScreen) return
    if (!previousScreen) selectedLine.value = 1
    if (nextScreen.kind === 'hexagram') splitPinned.value = false
    await nextTick()
    if (modalScroll.value) modalScroll.value.scrollTop = nextScreen.scrollTop ?? 0

    if (nextScreen.kind === 'transformation-lab') {
      dialog.value?.querySelector<HTMLElement>('.lab-back')?.focus()
      return
    }

    if (previousScreen?.kind === 'transformation-lab' && nextScreen.arrivalContext === undefined) {
      dialog.value?.querySelector<HTMLElement>('.advanced-lab-button')?.focus()
      return
    }

    if (nextScreen.arrivalContext) {
      dialog.value?.querySelector<HTMLElement>('.modal-back')?.focus()
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = priorBodyOverflow
})
</script>

<template>
  <Teleport to="body">
    <Transition name="inspector">
      <div v-if="hexagram" class="inspector-backdrop" role="presentation" @mousedown.self="close">
        <section
          ref="dialog"
          class="inspector-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="
            labScreen ? 'transformation-lab-title' : `hexagram-${hexagram.number}-title`
          "
          @keydown="handleKeydown"
        >
          <header class="inspector-header">
            <div class="inspector-header-context">
              <button
                v-if="inspector.canNavigateBack && !labScreen"
                class="modal-back"
                type="button"
                @click="navigateBack"
              >
                <span aria-hidden="true">←</span>
                Back
              </button>
              <div>
                <p>{{ labScreen ? 'Advanced transformation lab' : 'Hexagram inspection' }}</p>
                <span>King Wen {{ hexagram.number }} · {{ hexagram.namePinyin }}</span>
              </div>
            </div>
            <button
              class="inspector-close"
              type="button"
              aria-label="Close hexagram inspection"
              @click="close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div ref="modalScroll" class="inspector-scroll">
            <TransformationLab
              v-if="labScreen"
              :source="hexagram"
              :active-section="labScreen.activeSection"
              :selected-moving-lines="labScreen.selectedMovingLines"
              :filters="labScreen.filters"
              :chain="inspector.chain"
              :visited="inspector.visitedHexagramNumbers"
              :engine="transformationEngine"
              @back="navigateBack"
              @select="selectTransformation"
              @select-section="inspector.updateTransformationLab({ activeSection: $event })"
              @update-moving-lines="
                inspector.updateTransformationLab({ selectedMovingLines: $event })
              "
              @update-filters="inspector.updateTransformationLab({ filters: $event })"
              @reset-chain="inspector.resetTransformationChain"
              @select-chain-hexagram="inspector.openChainHexagram"
            />

            <div v-else class="inspector-layout">
              <aside class="transformations-panel" aria-labelledby="transformations-title">
                <div class="panel-heading">
                  <p class="section-kicker">Computed structure</p>
                  <h2 id="transformations-title">Transformations</h2>
                  <p>Four compact relationships, calculated directly from the six source lines.</p>
                </div>

                <div class="transformation-list">
                  <TransformationHexagramCard
                    v-for="transformation in baseTransformations"
                    :key="transformation.id"
                    compact
                    :result="transformation"
                    :visited="
                      transformation.targetHexagramNumber !== undefined &&
                      inspector.visitedHexagramNumbers.has(transformation.targetHexagramNumber)
                    "
                    @select="selectTransformation"
                  />
                </div>

                <section class="line-change" aria-labelledby="changing-line-title">
                  <div class="line-change-heading">
                    <div>
                      <p class="section-kicker">Single-line change</p>
                      <h3 id="changing-line-title">Select a line</h3>
                    </div>
                    <span>Bottom → top</span>
                  </div>
                  <div class="line-selector" role="radiogroup" aria-label="Changing line">
                    <button
                      v-for="line in LINE_NUMBERS"
                      :key="line"
                      type="button"
                      role="radio"
                      :aria-checked="selectedLine === line"
                      :class="{ 'is-selected': selectedLine === line }"
                      @click="selectedLine = line"
                    >
                      {{ line }}
                    </button>
                  </div>
                  <p class="line-change-note">
                    The selected line updates the compact Relating / Changed result above. The Lab
                    supports any combination of lines.
                  </p>
                </section>

                <button class="advanced-lab-button" type="button" @click="openTransformationLab">
                  <span>
                    <strong>Advanced Transformation Lab</strong>
                    <small
                      >Explore structures, destinations, paths, and source-gated systems.</small
                    >
                  </span>
                  <span aria-hidden="true">→</span>
                </button>

                <section class="advanced-transformations" aria-labelledby="advanced-title">
                  <p class="section-kicker">Advanced</p>
                  <div class="advanced-title-row">
                    <h3 id="advanced-title">Absolute Shadow</h3>
                    <StatusBadge status="unavailable" label="Rule pending" />
                  </div>
                  <p>
                    Reserved for the advanced transformation set. No result is inferred until its
                    calculation rule is defined and reviewed.
                  </p>
                </section>
              </aside>

              <article class="hexagram-focus">
                <aside
                  v-if="arrivalContext"
                  class="arrival-context"
                  aria-label="Transformation arrival context"
                >
                  <div>
                    <span>Reached through transformation</span>
                    <p>
                      From Hexagram {{ arrivalContext.sourceHexagramNumber }} through
                      {{ arrivalContext.transformationLabel }}
                      <template v-if="arrivalContext.changedLines.length">
                        · lines {{ arrivalContext.changedLines.join(', ') }}
                      </template>
                    </p>
                  </div>
                  <button type="button" @click="inspector.returnToSourceHexagram">
                    Return to source
                  </button>
                </aside>

                <header class="hexagram-identity">
                  <span class="hexagram-number">{{ hexagram.number }}</span>
                  <div>
                    <p class="chinese-name" lang="zh-Hant">{{ hexagram.nameChinese }}</p>
                    <h1 :id="`hexagram-${hexagram.number}-title`">{{ hexagram.nameEnglish }}</h1>
                    <p>{{ hexagram.namePinyin }}</p>
                  </div>
                </header>

                <div
                  class="hexagram-stage"
                  :class="{ 'is-split': splitVisible }"
                  @mouseenter="splitHovered = true"
                  @mouseleave="splitHovered = false"
                >
                  <div class="trigram-label trigram-label-upper">
                    <span>Upper trigram</span>
                    <strong>{{ hexagram.upperTrigram.nameEnglish }}</strong>
                    <small lang="zh-Hant">
                      {{ hexagram.upperTrigram.nameChinese }} ·
                      {{ hexagram.upperTrigram.namePinyin }}
                    </small>
                  </div>

                  <HexagramGlyph
                    :lines="hexagram.linesBottomToTop"
                    size="inspection"
                    :split="splitVisible"
                    :label="`Hexagram ${hexagram.number}, ${hexagram.nameEnglish}`"
                  />

                  <div class="trigram-label trigram-label-lower">
                    <span>Lower trigram</span>
                    <strong>{{ hexagram.lowerTrigram.nameEnglish }}</strong>
                    <small lang="zh-Hant">
                      {{ hexagram.lowerTrigram.nameChinese }} ·
                      {{ hexagram.lowerTrigram.namePinyin }}
                    </small>
                  </div>
                </div>

                <button
                  class="split-toggle quiet-button"
                  type="button"
                  :aria-pressed="splitPinned"
                  @click="splitPinned = !splitPinned"
                >
                  <span aria-hidden="true">{{ splitPinned ? '↧' : '↕' }}</span>
                  {{ splitPinned ? 'Join trigrams' : 'Separate trigrams' }}
                </button>

                <section class="commentary-section" aria-labelledby="commentary-title">
                  <div class="commentary-heading">
                    <div>
                      <p class="section-kicker">Interpretive lenses</p>
                      <h2 id="commentary-title">Commentaries</h2>
                    </div>
                    <StatusBadge status="unavailable" label="Texts pending" />
                  </div>

                  <div class="commentary-tabs" role="tablist" aria-label="Commentary tradition">
                    <button
                      v-for="commentary in COMMENTARIES"
                      :id="`commentary-tab-${commentary.key}`"
                      :key="commentary.key"
                      type="button"
                      role="tab"
                      :aria-selected="activeCommentary === commentary.key"
                      :aria-controls="`commentary-panel-${commentary.key}`"
                      :class="{ 'is-active': activeCommentary === commentary.key }"
                      @click="activeCommentary = commentary.key"
                    >
                      {{ commentary.label }}
                    </button>
                  </div>

                  <div
                    :id="`commentary-panel-${activeCommentary}`"
                    class="commentary-placeholder"
                    role="tabpanel"
                    :aria-labelledby="`commentary-tab-${activeCommentary}`"
                  >
                    <div>
                      <p>{{ commentaryLabel }}</p>
                      <h3>OLTR and source synthesis will appear here.</h3>
                    </div>
                    <p>
                      This view is ready for the pre-chunked commentaries. It remains unavailable
                      until those texts are reviewed and summarized without inventing an
                      interpretation.
                    </p>
                  </div>
                </section>

                <div class="identity-provenance">
                  <StatusBadge :status="hexagram.status" label="Curated reference" />
                  <span>{{ hexagram.sourceLabel }}</span>
                </div>
              </article>

              <aside class="gene-keys-panel" aria-labelledby="gene-key-title">
                <div class="panel-heading">
                  <p class="section-kicker">Spectrum of consciousness</p>
                  <h2 id="gene-key-title">Gene Key {{ hexagram.number }}</h2>
                  <p>Three frequency-band keywords associated with this Key.</p>
                </div>

                <dl class="gene-key-spectrum">
                  <div class="spectrum-item spectrum-shadow">
                    <dt>Shadow</dt>
                    <dd>{{ hexagram.geneKey.shadow }}</dd>
                  </div>
                  <div class="spectrum-item spectrum-gift">
                    <dt>Gift</dt>
                    <dd>{{ hexagram.geneKey.gift }}</dd>
                  </div>
                  <div class="spectrum-item spectrum-siddhi">
                    <dt>Siddhi</dt>
                    <dd>{{ hexagram.geneKey.siddhi }}</dd>
                  </div>
                </dl>

                <div class="gene-key-source">
                  <StatusBadge :status="hexagram.geneKey.status" label="Official vocabulary" />
                  <a :href="hexagram.geneKey.sourceUrl" target="_blank" rel="noreferrer">
                    {{ hexagram.geneKey.sourceLabel }}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.inspector-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  background: var(--backdrop);
  padding: 1rem;
  backdrop-filter: blur(10px);
  place-items: center;
}

.inspector-dialog {
  overflow: hidden;
  width: min(100%, 92rem);
  max-height: calc(100dvh - 2rem);
  border: 1px solid var(--line-strong);
  border-radius: clamp(0.8rem, 2vw, 1.4rem);
  background:
    radial-gradient(
      circle at 50% 12%,
      color-mix(in srgb, var(--jade-wash) 55%, transparent),
      transparent 26rem
    ),
    var(--paper);
  box-shadow: 0 34px 110px rgb(0 4 10 / 72%);
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 4.2rem;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper-raised) 92%, transparent);
  padding: 0.65rem 0.8rem 0.65rem 1.25rem;
  backdrop-filter: blur(18px);
}

.inspector-header p,
.inspector-header span {
  margin: 0;
}

.inspector-header p {
  color: var(--jade);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.inspector-header-context {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.inspector-header-context > div > span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.modal-back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.45rem 0.65rem;
  color: var(--jade);
  font-size: 0.64rem;
}

.modal-back:hover,
.modal-back:focus-visible {
  border-color: var(--jade);
  background: var(--jade-wash);
}

.inspector-close {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: transparent;
  color: var(--ink-soft);
  font-size: 1.65rem;
  line-height: 1;
  place-items: center;
}

.inspector-close:hover {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

.inspector-scroll {
  overflow: auto;
  max-height: calc(100dvh - 6.2rem);
  overscroll-behavior: contain;
}

.inspector-layout {
  display: grid;
  grid-template-columns: minmax(15rem, 0.8fr) minmax(25rem, 1.7fr) minmax(14rem, 0.72fr);
  min-height: min(49rem, calc(100dvh - 6.2rem));
}

.transformations-panel,
.gene-keys-panel {
  padding: clamp(1rem, 2.2vw, 1.6rem);
}

.transformations-panel {
  border-right: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper-raised) 56%, transparent);
}

.gene-keys-panel {
  border-left: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper-raised) 42%, transparent);
}

.panel-heading h2,
.commentary-heading h2 {
  margin: 0.18rem 0 0.55rem;
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 2vw, 1.9rem);
  font-weight: 500;
}

.panel-heading > p:last-child {
  margin-bottom: 0;
  color: var(--ink-faint);
  font-size: 0.69rem;
}

.section-kicker {
  margin: 0;
  color: var(--jade);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.transformation-list {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.line-change {
  margin-top: 1.4rem;
  border-top: 1px solid var(--line);
  padding-top: 1.2rem;
}

.line-change-heading,
.advanced-title-row,
.commentary-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
}

.line-change-heading h3,
.advanced-title-row h3 {
  margin: 0.15rem 0 0;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 500;
}

.line-change-heading > span {
  color: var(--ink-faint);
  font-size: 0.57rem;
}

.line-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.32rem;
  margin: 0.75rem 0;
}

.line-selector button {
  min-width: 0;
  aspect-ratio: 1;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.line-selector button:hover,
.line-selector button.is-selected {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

.line-change-note {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.6rem;
  line-height: 1.45;
}

.advanced-lab-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  width: 100%;
  min-height: 3.5rem;
  margin-top: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--jade) 54%, var(--line));
  border-radius: var(--radius-sm);
  background: var(--jade-wash);
  padding: 0.7rem 0.8rem;
  color: var(--ink);
  text-align: left;
}

.advanced-lab-button > span:first-child {
  display: grid;
  gap: 0.15rem;
}

.advanced-lab-button strong {
  color: var(--jade-deep);
  font-family: var(--font-serif);
  font-size: 0.88rem;
  font-weight: 500;
}

.advanced-lab-button small {
  color: var(--ink-faint);
  font-size: 0.56rem;
  line-height: 1.35;
}

.advanced-lab-button:hover,
.advanced-lab-button:focus-visible {
  border-color: var(--jade);
  background: color-mix(in srgb, var(--jade-wash) 76%, var(--paper-raised));
}

.advanced-transformations {
  margin-top: 1.4rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius-sm);
  padding: 0.9rem;
}

.advanced-title-row {
  align-items: center;
  margin-top: 0.2rem;
}

.advanced-title-row :deep(.status-label) {
  padding: 0.18rem 0.4rem;
  font-size: 0.5rem;
}

.advanced-transformations > p:last-child {
  margin: 0.7rem 0 0;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.hexagram-focus {
  min-width: 0;
  padding: clamp(1.25rem, 3.2vw, 2.5rem);
}

.arrival-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid color-mix(in srgb, var(--jade) 36%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--jade-wash) 54%, transparent);
  padding: 0.65rem 0.75rem;
}

.arrival-context span {
  color: var(--jade);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.arrival-context p {
  margin: 0.15rem 0 0;
  color: var(--ink-soft);
  font-size: 0.63rem;
}

.arrival-context button {
  flex: 0 0 auto;
  min-height: 2.4rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.4rem 0.6rem;
  color: var(--ink-soft);
  font-size: 0.58rem;
}

.hexagram-identity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 7rem;
  text-align: left;
}

.hexagram-number {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 50%, var(--line));
  border-radius: 50%;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 1.15rem;
  place-items: center;
}

.chinese-name {
  margin: 0;
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 1.4rem;
}

.hexagram-identity h1 {
  max-width: 22ch;
  margin: 0.05rem 0;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3.8vw, 3.3rem);
  font-weight: 400;
  letter-spacing: -0.035em;
}

.hexagram-identity div > p:last-child {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.hexagram-stage {
  display: grid;
  grid-template-columns: minmax(6rem, 1fr) minmax(9rem, 13rem) minmax(6rem, 1fr);
  gap: clamp(0.7rem, 2vw, 1.5rem);
  align-items: center;
  min-height: 18rem;
  margin-top: 0.5rem;
}

.hexagram-glyph {
  grid-column: 2;
  color: var(--jade-deep);
  filter: drop-shadow(0 0 24px color-mix(in srgb, var(--jade) 18%, transparent));
}

.trigram-label {
  display: grid;
  opacity: 0;
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.trigram-label span {
  color: var(--ink-faint);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.trigram-label strong {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
}

.trigram-label small {
  color: var(--jade);
  font-size: 0.66rem;
}

.trigram-label-upper {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  margin-top: 2rem;
  text-align: right;
  transform: translateX(0.5rem);
}

.trigram-label-lower {
  grid-column: 3;
  grid-row: 1;
  align-self: end;
  margin-bottom: 2rem;
  transform: translateX(-0.5rem);
}

.hexagram-stage.is-split .trigram-label {
  opacity: 1;
  transform: translateX(0);
}

.split-toggle {
  margin: -0.4rem auto 0;
}

.commentary-section {
  margin-top: clamp(2rem, 4vw, 3.5rem);
  border-top: 1px solid var(--line);
  padding-top: 1.3rem;
}

.commentary-heading {
  align-items: center;
}

.commentary-heading :deep(.status-label) {
  padding: 0.24rem 0.5rem;
  font-size: 0.54rem;
}

.commentary-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.8rem;
}

.commentary-tabs button {
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.5rem;
  color: var(--ink-soft);
  font-size: 0.7rem;
}

.commentary-tabs button:hover,
.commentary-tabs button.is-active {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

.commentary-placeholder {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1.5rem;
  margin-top: 0.8rem;
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  padding: clamp(1rem, 2.4vw, 1.5rem);
}

.commentary-placeholder div p {
  margin: 0 0 0.25rem;
  color: var(--jade);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.commentary-placeholder h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 500;
}

.commentary-placeholder > p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.identity-provenance {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
  color: var(--ink-faint);
  font-size: 0.58rem;
}

.identity-provenance :deep(.status-label) {
  flex: 0 0 auto;
  padding: 0.2rem 0.45rem;
  font-size: 0.52rem;
}

.gene-key-spectrum {
  display: grid;
  gap: 0.7rem;
  margin: 1.5rem 0 0;
}

.spectrum-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
  padding: 1rem;
}

.spectrum-item dt {
  color: var(--ink-faint);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.spectrum-item dd {
  overflow-wrap: anywhere;
  margin: 0.35rem 0 0;
  font-family: var(--font-serif);
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  line-height: 1.05;
}

.spectrum-shadow {
  border-color: color-mix(in srgb, var(--cinnabar) 42%, var(--line));
}

.spectrum-shadow dd {
  color: var(--cinnabar);
}

.spectrum-gift {
  border-color: color-mix(in srgb, var(--jade) 45%, var(--line));
}

.spectrum-gift dd {
  color: var(--jade);
}

.spectrum-siddhi {
  background: color-mix(in srgb, var(--jade-wash) 60%, var(--paper-raised));
}

.spectrum-siddhi dd {
  color: var(--jade-deep);
}

.gene-key-source {
  display: grid;
  gap: 0.65rem;
  margin-top: 1rem;
}

.gene-key-source :deep(.status-label) {
  padding: 0.22rem 0.45rem;
  font-size: 0.52rem;
}

.gene-key-source a {
  color: var(--ink-faint);
  font-size: 0.62rem;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 0.2rem;
}

.gene-key-source a:hover {
  color: var(--jade);
}

.inspector-enter-active,
.inspector-leave-active {
  transition: opacity 180ms ease;
}

.inspector-enter-active .inspector-dialog,
.inspector-leave-active .inspector-dialog {
  transition: transform 180ms ease;
}

.inspector-enter-from,
.inspector-leave-to {
  opacity: 0;
}

.inspector-enter-from .inspector-dialog,
.inspector-leave-to .inspector-dialog {
  transform: translateY(10px) scale(0.99);
}

@media (max-width: 1120px) {
  .inspector-layout {
    grid-template-columns: minmax(14rem, 0.75fr) minmax(25rem, 1.5fr);
  }

  .gene-keys-panel {
    grid-column: 1 / -1;
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .gene-key-spectrum {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .inspector-backdrop {
    padding: 0;
  }

  .inspector-dialog {
    width: 100%;
    max-height: 100dvh;
    border: 0;
    border-radius: 0;
  }

  .inspector-scroll {
    max-height: calc(100dvh - 4.2rem);
  }

  .inspector-layout {
    display: flex;
    flex-direction: column;
  }

  .hexagram-focus {
    order: -1;
  }

  .transformations-panel {
    border-top: 1px solid var(--line);
    border-right: 0;
  }

  .hexagram-stage {
    grid-template-columns: minmax(4rem, 1fr) minmax(8rem, 11rem) minmax(4rem, 1fr);
    min-height: 16rem;
  }
}

@media (max-width: 520px) {
  .inspector-header {
    min-height: 3.8rem;
    padding-left: 0.9rem;
  }

  .inspector-close {
    width: 2.4rem;
    height: 2.4rem;
  }

  .hexagram-focus {
    padding-inline: 0.9rem;
  }

  .hexagram-identity {
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 6rem;
  }

  .hexagram-number {
    width: 2.8rem;
    height: 2.8rem;
  }

  .hexagram-stage {
    grid-template-columns: 1fr minmax(7.5rem, 9.5rem) 1fr;
    gap: 0.4rem;
  }

  .trigram-label strong {
    font-size: 0.85rem;
  }

  .trigram-label small {
    font-size: 0.56rem;
  }

  .commentary-placeholder {
    grid-template-columns: 1fr;
  }

  .gene-key-spectrum {
    grid-template-columns: 1fr;
  }
}
</style>
