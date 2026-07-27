<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CitationList from '../components/common/CitationList.vue'
import ClaimGroup from '../components/common/ClaimGroup.vue'
import CompletenessSummary from '../components/common/CompletenessSummary.vue'
import DataStatusBadge from '../components/common/DataStatusBadge.vue'
import ResourceError from '../components/common/ResourceError.vue'
import ReviewStatusBadge from '../components/common/ReviewStatusBadge.vue'
import { useAlchemyEnvironment } from '../composables/alchemyEnvironment'
import { useAsyncResource } from '../composables/useAsyncResource'
import { parseReviewStatus, reviewStatusLabel } from '../domain/reviewStatus'
import type { FormulaDetail, FormulaSummary, HerbSummary, PaginatedResult } from '../domain/types'
import { useAlchemyProvider } from '../providers'
import { useAlchemyWorkbenchStore } from '../stores/workbench'

const route = useRoute()
const router = useRouter()
const provider = useAlchemyProvider()
const environment = useAlchemyEnvironment()
const workbench = useAlchemyWorkbenchStore()

const stringValue = (value: unknown): string => (typeof value === 'string' ? value : '')
const query = ref(stringValue(route.query['q']))
const category = ref(stringValue(route.query['category']))
const ingredientId = ref(stringValue(route.query['ingredient']))
const action = ref(stringValue(route.query['action']))
const source = ref(stringValue(route.query['source']))
const reviewStatus = ref(stringValue(route.query['review']))
const workbenchMessage = ref('')
let searchTimer: number | undefined

const searchResource = useAsyncResource<PaginatedResult<FormulaSummary>>()
const detailResource = useAsyncResource<FormulaDetail>()
const herbOptionsResource = useAsyncResource<PaginatedResult<HerbSummary>>()
const activeFormulaId = computed(() => stringValue(route.params['formulaId']))

const routeQuery = () => ({
  ...(query.value ? { q: query.value } : {}),
  ...(category.value ? { category: category.value } : {}),
  ...(ingredientId.value ? { ingredient: ingredientId.value } : {}),
  ...(action.value ? { action: action.value } : {}),
  ...(source.value ? { source: source.value } : {}),
  ...(reviewStatus.value ? { review: reviewStatus.value } : {}),
})

const search = async () => {
  const selectedReviewStatus = parseReviewStatus(reviewStatus.value)
  await searchResource.run((signal) =>
    provider.searchFormulas(
      {
        query: query.value,
        pageSize: 40,
        ...(category.value ? { category: category.value } : {}),
        ...(ingredientId.value ? { ingredientId: ingredientId.value } : {}),
        ...(action.value ? { action: action.value } : {}),
        ...(source.value ? { source: source.value } : {}),
        ...(selectedReviewStatus ? { reviewStatus: selectedReviewStatus } : {}),
      },
      signal,
    ),
  )
}

const scheduleSearch = () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    void router.replace({ query: routeQuery() })
    void search()
  }, 300)
}

const loadDetail = async (formulaId: string) => {
  if (!formulaId) {
    detailResource.clear()
    return
  }
  await detailResource.run((signal) => provider.getFormula(formulaId, signal))
}

const selectFormula = async (formulaId: string) => {
  await router.push({
    name: 'alchemy-formula-detail',
    params: { formulaId },
    query: routeQuery(),
  })
}

const loadIntoWorkbench = async () => {
  const formula = detailResource.data.value
  if (!formula) return
  const created = workbench.importFormula(formula)
  if (!created) {
    workbenchMessage.value =
      'The local workbench already contains four formulas. Remove a slot before importing.'
    return
  }
  workbenchMessage.value = `${formula.displayName} was copied into a local draft. The source record was not changed.`
  await router.push({ name: 'alchemy-workbench' })
}

const resetFilters = () => {
  category.value = ''
  ingredientId.value = ''
  action.value = ''
  source.value = ''
  reviewStatus.value = ''
}

watch([query, category, ingredientId, action, source, reviewStatus], scheduleSearch)
watch(activeFormulaId, (formulaId) => void loadDetail(formulaId), { immediate: true })
watch(
  () => route.query['q'],
  (nextQuery) => {
    const nextValue = stringValue(nextQuery)
    if (nextValue !== query.value) query.value = nextValue
  },
)

onMounted(() => {
  void search()
  void herbOptionsResource.run((signal) =>
    provider.searchHerbs({ query: '', pageSize: 100 }, signal),
  )
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <section class="alchemy-route" aria-labelledby="formula-library-heading">
    <header class="route-heading">
      <div>
        <p class="mini-label">02 · Source formulas</p>
        <h2 id="formula-library-heading">Formula Library</h2>
        <p>
          Inspect source compositions and variants before copying an independent draft into the
          device-local workbench.
        </p>
      </div>
      <DataStatusBadge
        :status="environment.status.value?.dataStatus ?? 'unavailable'"
        :label="environment.status.value?.label ?? 'Provider pending'"
      />
    </header>

    <p v-if="workbenchMessage" class="action-message" role="status">{{ workbenchMessage }}</p>

    <div class="library-layout" :class="{ 'has-detail': activeFormulaId }">
      <aside class="research-controls panel" aria-label="Formula search and filters">
        <label class="field-label" for="formula-search">Search source formulas</label>
        <div class="search-control">
          <input
            id="formula-search"
            v-model="query"
            class="control"
            type="search"
            placeholder="Formula name, 中文, pinyin, or category"
            autocomplete="off"
          />
          <button v-if="query" class="text-button" type="button" @click="query = ''">Clear</button>
        </div>
        <div class="filter-stack">
          <label v-if="environment.capabilities.value?.filters.categories.length">
            Category
            <select v-model="category" class="control">
              <option value="">All categories</option>
              <option
                v-for="item in environment.capabilities.value.filters.categories"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </label>
          <label v-if="herbOptionsResource.data.value?.items.length">
            Contains material
            <select v-model="ingredientId" class="control">
              <option value="">Any indexed material</option>
              <option
                v-for="herb in herbOptionsResource.data.value.items"
                :key="herb.id"
                :value="herb.id"
              >
                {{ herb.displayName }}
              </option>
            </select>
          </label>
          <label v-if="environment.capabilities.value?.filters.actions.length">
            Documented action
            <select v-model="action" class="control">
              <option value="">All actions</option>
              <option
                v-for="item in environment.capabilities.value.filters.actions"
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
          <label v-if="environment.capabilities.value?.filters.reviewStatuses.length">
            Review status
            <select v-model="reviewStatus" class="control">
              <option value="">All review states</option>
              <option
                v-for="item in environment.capabilities.value.filters.reviewStatuses"
                :key="item"
                :value="item"
              >
                {{ reviewStatusLabel(item) }}
              </option>
            </select>
          </label>
          <button class="quiet-button" type="button" @click="resetFilters">Reset filters</button>
        </div>
        <p class="search-status" aria-live="polite">
          <template v-if="searchResource.loading.value">Searching source formulas…</template>
          <template v-else-if="searchResource.data.value">
            {{ searchResource.data.value.total }} formula records found.
          </template>
        </p>
      </aside>

      <section class="result-column panel" aria-labelledby="formula-result-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Indexed compositions</p>
            <h3 id="formula-result-heading">Formula records</h3>
          </div>
        </div>
        <div
          v-if="searchResource.loading.value && !searchResource.data.value"
          class="loading-panel"
        >
          Reading the formula index…
        </div>
        <ResourceError
          v-else-if="searchResource.error.value"
          :error="searchResource.error.value"
          @retry="search"
        />
        <div v-else-if="searchResource.data.value?.items.length" class="result-list">
          <button
            v-for="formula in searchResource.data.value.items"
            :key="formula.id"
            class="result-card"
            :class="{ active: activeFormulaId === formula.id }"
            type="button"
            @click="selectFormula(formula.id)"
          >
            <span class="result-index" aria-hidden="true">
              {{ String(searchResource.data.value.items.indexOf(formula) + 1).padStart(2, '0') }}
            </span>
            <span class="result-identity">
              <strong>{{ formula.displayName }}</strong>
              <span v-if="formula.nameChineseSimplified" lang="zh-Hans">
                {{ formula.nameChineseSimplified }}
              </span>
              <small>{{ formula.pinyin }}</small>
              <small>{{ formula.categories.join(' · ') }}</small>
            </span>
            <span class="result-badges">
              <DataStatusBadge :status="formula.status" />
              <ReviewStatusBadge :status="formula.reviewStatus" />
              <small
                >{{ formula.ingredientCount }} ingredients ·
                {{ formula.sourceCount }} sources</small
              >
            </span>
          </button>
        </div>
        <div v-else class="empty-state">
          <span aria-hidden="true">∅</span>
          <h3>No matching formula records</h3>
          <p>Try a broader title or reset the active filters.</p>
        </div>
      </section>

      <article class="detail-column panel" aria-labelledby="formula-detail-heading">
        <div
          v-if="detailResource.loading.value && !detailResource.data.value"
          class="loading-panel"
        >
          Loading the selected formula record…
        </div>
        <ResourceError
          v-else-if="detailResource.error.value"
          :error="detailResource.error.value"
          @retry="loadDetail(activeFormulaId)"
        />
        <template v-else-if="detailResource.data.value">
          <header class="detail-heading">
            <RouterLink
              class="mobile-back-link"
              :to="{ name: 'alchemy-formulas', query: routeQuery() }"
            >
              ← Formula records
            </RouterLink>
            <div class="detail-title-row">
              <div>
                <p class="mini-label">Source formula · {{ detailResource.data.value.id }}</p>
                <h3 id="formula-detail-heading">{{ detailResource.data.value.displayName }}</h3>
              </div>
              <span
                v-if="detailResource.data.value.nameChineseSimplified"
                class="cjk-name"
                lang="zh-Hans"
              >
                {{ detailResource.data.value.nameChineseSimplified }}
              </span>
            </div>
            <p class="identity-line">{{ detailResource.data.value.pinyin }}</p>
            <div class="badge-row">
              <DataStatusBadge :status="detailResource.data.value.status" />
              <ReviewStatusBadge :status="detailResource.data.value.reviewStatus" />
            </div>
            <button
              class="primary-button"
              type="button"
              :disabled="!workbench.hasRoom"
              @click="loadIntoWorkbench"
            >
              {{ workbench.hasRoom ? 'Load into Workbench' : 'Workbench full' }}
            </button>
            <p class="local-note">Creates a local copy; the source record remains unchanged.</p>
          </header>

          <CompletenessSummary
            :completeness="detailResource.data.value.completeness"
            :status="detailResource.data.value.status"
          />

          <section class="record-section">
            <div class="section-heading">
              <h3>Source variants</h3>
              <span>{{ detailResource.data.value.variants.length }} variants</span>
            </div>
            <div v-if="detailResource.data.value.variants.length" class="variant-list">
              <article v-for="variant in detailResource.data.value.variants" :key="variant.id">
                <strong>{{ variant.label }}</strong>
                <p>{{ variant.description }}</p>
                <DataStatusBadge :status="variant.status" />
              </article>
            </div>
            <p v-else class="empty-inline">No alternate source variants are indexed.</p>
          </section>

          <section class="record-section">
            <div class="section-heading">
              <h3>Ingredient lines</h3>
              <span>{{ detailResource.data.value.ingredients.length }} lines</span>
            </div>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Material</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Preparation</th>
                    <th scope="col">Source role</th>
                    <th scope="col">Provenance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="ingredient in detailResource.data.value.ingredients"
                    :key="ingredient.id"
                  >
                    <th scope="row">{{ ingredient.herbDisplayName }}</th>
                    <td>{{ ingredient.amountText || 'Unspecified' }} {{ ingredient.unit }}</td>
                    <td>{{ ingredient.preparationLabel || 'Not supplied' }}</td>
                    <td>{{ ingredient.role || 'Not supplied' }}</td>
                    <td>
                      <DataStatusBadge :status="ingredient.status" />
                      <small>{{ ingredient.citations.length }} citation</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <ClaimGroup
            title="Preparation notes"
            :claims="detailResource.data.value.preparationNotes"
          />
          <ClaimGroup
            title="Documented actions"
            :claims="detailResource.data.value.documentedActions"
          />
          <ClaimGroup
            title="Documented patterns"
            :claims="detailResource.data.value.documentedPatterns"
          />
          <ClaimGroup title="Cautions" :claims="detailResource.data.value.cautions" />

          <section v-if="detailResource.data.value.conflicts.length" class="record-section">
            <div class="section-heading">
              <h3>Source conflicts</h3>
              <DataStatusBadge status="conflicted" />
            </div>
            <article
              v-for="conflict in detailResource.data.value.conflicts"
              :key="conflict.id"
              class="conflict-card"
            >
              <strong>{{ conflict.field }}</strong>
              <p>{{ conflict.summary }}</p>
              <ul>
                <li v-for="alternative in conflict.alternatives" :key="alternative">
                  {{ alternative }}
                </li>
              </ul>
              <CitationList :citations="conflict.citations" />
            </article>
          </section>

          <section class="source-register">
            <div class="section-heading">
              <h3>Formula citations</h3>
              <span>{{ detailResource.data.value.citations.length }} sources</span>
            </div>
            <CitationList :citations="detailResource.data.value.citations" />
          </section>
        </template>
        <div v-else class="empty-state detail-empty">
          <span aria-hidden="true">方</span>
          <h3 id="formula-detail-heading">Select a source formula</h3>
          <p>Composition, source roles, variants, conflicts, and citations will appear here.</p>
        </div>
      </article>
    </div>
  </section>
</template>
