<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CitationList from '../components/common/CitationList.vue'
import DataStatusBadge from '../components/common/DataStatusBadge.vue'
import ResourceError from '../components/common/ResourceError.vue'
import ReviewStatusBadge from '../components/common/ReviewStatusBadge.vue'
import { useAlchemyEnvironment } from '../composables/alchemyEnvironment'
import { useAsyncResource } from '../composables/useAsyncResource'
import type { PaginatedResult, RetrievalContextResult, TextPassageResult } from '../domain/types'
import { useAlchemyProvider } from '../providers'

const route = useRoute()
const router = useRouter()
const provider = useAlchemyProvider()
const environment = useAlchemyEnvironment()

const stringValue = (value: unknown): string => (typeof value === 'string' ? value : '')
const query = ref(stringValue(route.query['q']))
const language = ref(stringValue(route.query['language']))
const source = ref(stringValue(route.query['source']))
const documentId = ref(stringValue(route.query['document']))
const reviewStatus = ref(stringValue(route.query['review']))
const selectedPassageIds = ref<string[]>([])
const copyMessage = ref('')
let searchTimer: number | undefined

const searchResource = useAsyncResource<PaginatedResult<TextPassageResult>>()
const contextResource = useAsyncResource<RetrievalContextResult>()

const routeQuery = () => ({
  ...(query.value ? { q: query.value } : {}),
  ...(language.value ? { language: language.value } : {}),
  ...(source.value ? { source: source.value } : {}),
  ...(documentId.value ? { document: documentId.value } : {}),
  ...(reviewStatus.value ? { review: reviewStatus.value } : {}),
})

const search = async () => {
  const result = await searchResource.run((signal) =>
    provider.searchTexts(
      {
        query: query.value,
        pageSize: 40,
        ...(language.value ? { language: language.value } : {}),
        ...(source.value ? { source: source.value } : {}),
        ...(documentId.value ? { documentId: documentId.value } : {}),
        ...(reviewStatus.value ? { reviewStatus: 'synthetic_fixture' } : {}),
      },
      signal,
    ),
  )
  if (result) {
    const visibleIds = new Set(result.items.map((passage) => passage.id))
    selectedPassageIds.value = selectedPassageIds.value.filter((id) => visibleIds.has(id))
  }
}

const scheduleSearch = () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    void router.replace({ query: routeQuery() })
    void search()
  }, 300)
}

const prepareContext = async () => {
  if (!selectedPassageIds.value.length) return
  await contextResource.run((signal) =>
    provider.buildRetrievalContext(
      { passageIds: selectedPassageIds.value, characterBudget: 6000 },
      signal,
    ),
  )
}

const togglePassage = (passageId: string, checked: boolean) => {
  selectedPassageIds.value = checked
    ? [...new Set([...selectedPassageIds.value, passageId])]
    : selectedPassageIds.value.filter((id) => id !== passageId)
  contextResource.clear()
}

const checkboxValue = (event: Event): boolean =>
  event.target instanceof HTMLInputElement && event.target.checked

const copyContext = async () => {
  if (!contextResource.data.value) return
  try {
    await window.navigator.clipboard.writeText(JSON.stringify(contextResource.data.value, null, 2))
    copyMessage.value = 'Retrieval package JSON copied.'
  } catch {
    copyMessage.value = 'Clipboard permission was not granted.'
  }
}

const resetFilters = () => {
  language.value = ''
  source.value = ''
  documentId.value = ''
  reviewStatus.value = ''
}

watch([query, language, source, documentId, reviewStatus], scheduleSearch)
watch(
  () => route.query['q'],
  (nextQuery) => {
    const nextValue = stringValue(nextQuery)
    if (nextValue !== query.value) query.value = nextValue
  },
)

onMounted(() => {
  void search()
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <section class="alchemy-route" aria-labelledby="text-library-heading">
    <header class="route-heading">
      <div>
        <p class="mini-label">04 · Source passages</p>
        <h2 id="text-library-heading">Text Library</h2>
        <p>
          Search passage-level source records, inspect their links, and assemble a bounded research
          package without sending it to a model.
        </p>
      </div>
      <DataStatusBadge
        :status="environment.status.value?.dataStatus ?? 'unavailable'"
        :label="environment.status.value?.label ?? 'Provider pending'"
      />
    </header>

    <div class="text-library-layout">
      <aside class="research-controls panel" aria-label="Text search and filters">
        <label class="field-label" for="text-search">Search source passages</label>
        <div class="search-control">
          <input
            id="text-search"
            v-model="query"
            class="control"
            type="search"
            placeholder="Term, title, entity, or passage wording"
            autocomplete="off"
          />
          <button v-if="query" class="text-button" type="button" @click="query = ''">Clear</button>
        </div>
        <div class="filter-stack">
          <label v-if="environment.capabilities.value?.filters.languages.length">
            Language
            <select v-model="language" class="control">
              <option value="">All languages</option>
              <option
                v-for="item in environment.capabilities.value.filters.languages"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </label>
          <label v-if="environment.capabilities.value?.filters.sources.length">
            Source
            <select v-model="source" class="control">
              <option value="">All sources</option>
              <option
                v-for="item in environment.capabilities.value.filters.sources"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </label>
          <label v-if="environment.capabilities.value?.filters.documents.length">
            Document
            <select v-model="documentId" class="control">
              <option value="">All documents</option>
              <option
                v-for="item in environment.capabilities.value.filters.documents"
                :key="item"
                :value="item"
              >
                {{ item.replace('demo:document:', '').replace(/-/g, ' ') }}
              </option>
            </select>
          </label>
          <label v-if="environment.capabilities.value?.filters.reviewStatuses.length">
            Review status
            <select v-model="reviewStatus" class="control">
              <option value="">All review states</option>
              <option value="synthetic_fixture">Synthetic fixture</option>
            </select>
          </label>
          <button class="quiet-button" type="button" @click="resetFilters">Reset filters</button>
        </div>
        <p class="search-status" aria-live="polite">
          <template v-if="searchResource.loading.value">Searching source passages…</template>
          <template v-else-if="searchResource.data.value">
            {{ searchResource.data.value.total }} passages ·
            {{ selectedPassageIds.length }} selected
          </template>
        </p>
      </aside>

      <section class="passage-column panel" aria-labelledby="passage-result-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Passage search</p>
            <h3 id="passage-result-heading">Results</h3>
          </div>
          <span v-if="searchResource.data.value"
            >{{ searchResource.data.value.total }} passages</span
          >
        </div>
        <div
          v-if="searchResource.loading.value && !searchResource.data.value"
          class="loading-panel"
        >
          Reading the synthetic source library…
        </div>
        <ResourceError
          v-else-if="searchResource.error.value"
          :error="searchResource.error.value"
          @retry="search"
        />
        <div v-else-if="searchResource.data.value?.items.length" class="passage-list">
          <article
            v-for="passage in searchResource.data.value.items"
            :key="passage.id"
            class="passage-card"
          >
            <header>
              <label class="select-passage">
                <input
                  type="checkbox"
                  :checked="selectedPassageIds.includes(passage.id)"
                  @change="togglePassage(passage.id, checkboxValue($event))"
                />
                Select for research context
              </label>
              <div class="badge-row">
                <DataStatusBadge :status="passage.status" />
                <ReviewStatusBadge :status="passage.reviewStatus" />
              </div>
            </header>
            <p class="mini-label">{{ passage.documentTitle }} · {{ passage.locator }}</p>
            <h4>
              {{ passage.chapter }}<span v-if="passage.section"> · {{ passage.section }}</span>
            </h4>
            <p class="passage-text" :lang="passage.language">{{ passage.text }}</p>
            <dl class="passage-meta">
              <div>
                <dt>Language</dt>
                <dd>{{ passage.language }}</dd>
              </div>
              <div>
                <dt>Matched terms</dt>
                <dd>{{ passage.matchedTerms.join(', ') }}</dd>
              </div>
              <div>
                <dt>Linked entities</dt>
                <dd>{{ passage.linkedEntities.map((item) => item.label).join(', ') || 'None' }}</dd>
              </div>
            </dl>
            <details>
              <summary>Passage citation</summary>
              <CitationList :citations="[passage.citation]" />
            </details>
          </article>
        </div>
        <div v-else class="empty-state">
          <span aria-hidden="true">∅</span>
          <h3>No matching passages</h3>
          <p>Try a broader term or reset the active source filters.</p>
        </div>
      </section>

      <aside class="context-column panel" aria-labelledby="context-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Bounded retrieval package</p>
            <h3 id="context-heading">Research context</h3>
          </div>
          <DataStatusBadge
            :status="contextResource.data.value?.status ?? 'unavailable'"
            :label="contextResource.data.value ? 'Prepared' : 'Not prepared'"
          />
        </div>
        <p>
          Selected passages can be packaged with citations, graph facts, and unresolved ambiguities.
          No AI model receives this data.
        </p>
        <button
          class="primary-button"
          type="button"
          :disabled="
            !selectedPassageIds.length ||
            contextResource.loading.value ||
            !environment.capabilities.value?.canBuildRetrievalContext
          "
          @click="prepareContext"
        >
          {{ contextResource.loading.value ? 'Preparing…' : 'Prepare research context' }}
        </button>
        <ResourceError
          v-if="contextResource.error.value"
          :error="contextResource.error.value"
          @retry="prepareContext"
        />

        <div v-if="contextResource.data.value" class="context-package">
          <dl class="result-metadata">
            <div>
              <dt>Selected passages</dt>
              <dd>{{ contextResource.data.value.passages.length }}</dd>
            </div>
            <div>
              <dt>Character budget</dt>
              <dd>
                {{ contextResource.data.value.characterCount }} /
                {{ contextResource.data.value.characterBudget }}
              </dd>
            </div>
            <div>
              <dt>Citations</dt>
              <dd>{{ contextResource.data.value.citations.length }}</dd>
            </div>
          </dl>

          <section class="context-section">
            <h4>Selected passages</h4>
            <ol>
              <li v-for="passage in contextResource.data.value.passages" :key="passage.id">
                <strong>{{ passage.documentTitle }} · {{ passage.locator }}</strong>
                <p>{{ passage.text }}</p>
              </li>
            </ol>
          </section>
          <section class="context-section">
            <h4>Matched entities</h4>
            <ul class="token-list">
              <li v-for="entity in contextResource.data.value.matchedEntities" :key="entity.id">
                {{ entity.label }} · {{ entity.entityType }}
              </li>
            </ul>
          </section>
          <section class="context-section">
            <h4>Graph facts</h4>
            <ul class="plain-list">
              <li v-for="fact in contextResource.data.value.graphFacts" :key="fact.id">
                {{ fact.subject }} · {{ fact.predicate }} · {{ fact.object }}
              </li>
            </ul>
          </section>
          <section class="context-section">
            <h4>Unresolved ambiguities</h4>
            <ul v-if="contextResource.data.value.unresolvedAmbiguities.length" class="plain-list">
              <li v-for="item in contextResource.data.value.unresolvedAmbiguities" :key="item">
                {{ item }}
              </li>
            </ul>
            <p v-else class="empty-inline">No ambiguity was reported for this package.</p>
          </section>
          <section class="context-section">
            <h4>Source and review summary</h4>
            <ul class="plain-list">
              <li v-for="item in contextResource.data.value.sourceSummary" :key="item.sourceTitle">
                <strong>{{ item.sourceTitle }}</strong>
                <span>
                  {{ item.passageCount }} passages · {{ item.reviewStatuses.join(', ') }}
                </span>
              </li>
            </ul>
          </section>
          <CitationList :citations="contextResource.data.value.citations" />
          <button class="quiet-button" type="button" @click="copyContext">
            Copy package as JSON
          </button>
          <p class="action-message" role="status">{{ copyMessage }}</p>
        </div>
        <div v-else class="empty-state compact-empty">
          <span aria-hidden="true">文</span>
          <h3>Select passages</h3>
          <p>The package preview will remain empty until you explicitly prepare context.</p>
        </div>
      </aside>
    </div>
  </section>
</template>
