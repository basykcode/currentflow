<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CitationList from '../components/common/CitationList.vue'
import ClaimGroup from '../components/common/ClaimGroup.vue'
import CompletenessSummary from '../components/common/CompletenessSummary.vue'
import DataStatusBadge from '../components/common/DataStatusBadge.vue'
import EntityNeighborhoodList from '../components/common/EntityNeighborhoodList.vue'
import ResourceError from '../components/common/ResourceError.vue'
import ReviewStatusBadge from '../components/common/ReviewStatusBadge.vue'
import { useAlchemyEnvironment } from '../composables/alchemyEnvironment'
import { useAsyncResource } from '../composables/useAsyncResource'
import { parseReviewStatus, reviewStatusLabel } from '../domain/reviewStatus'
import type { Citation, EntityNeighborhood, HerbDetail, PaginatedResult } from '../domain/types'
import type { HerbSummary } from '../domain/types'
import { useAlchemyProvider } from '../providers'

const route = useRoute()
const router = useRouter()
const provider = useAlchemyProvider()
const environment = useAlchemyEnvironment()

const stringQueryValue = (value: unknown): string => (typeof value === 'string' ? value : '')

const query = ref(stringQueryValue(route.query['q']))
const thermalNature = ref(stringQueryValue(route.query['nature']))
const flavor = ref(stringQueryValue(route.query['flavor']))
const channel = ref(stringQueryValue(route.query['channel']))
const category = ref(stringQueryValue(route.query['category']))
const action = ref(stringQueryValue(route.query['action']))
const source = ref(stringQueryValue(route.query['source']))
const reviewStatus = ref(stringQueryValue(route.query['review']))
const searchInput = ref<HTMLInputElement | null>(null)
let searchTimer: number | undefined

const searchResource = useAsyncResource<PaginatedResult<HerbSummary>>()
const herbResource = useAsyncResource<HerbDetail>()
const neighborhoodResource = useAsyncResource<EntityNeighborhood>()

const activeHerbId = computed(() => stringQueryValue(route.params['herbId']))
const resultAnnouncement = computed(() => {
  if (searchResource.loading.value) return 'Searching the materia medica.'
  if (searchResource.error.value) return searchResource.error.value.detail
  if (!searchResource.data.value) return ''
  return `${searchResource.data.value.total} material ${
    searchResource.data.value.total === 1 ? 'record' : 'records'
  } found.`
})

const routeQuery = () => ({
  ...(query.value ? { q: query.value } : {}),
  ...(thermalNature.value ? { nature: thermalNature.value } : {}),
  ...(flavor.value ? { flavor: flavor.value } : {}),
  ...(channel.value ? { channel: channel.value } : {}),
  ...(category.value ? { category: category.value } : {}),
  ...(action.value ? { action: action.value } : {}),
  ...(source.value ? { source: source.value } : {}),
  ...(reviewStatus.value ? { review: reviewStatus.value } : {}),
})

const search = async () => {
  const selectedReviewStatus = parseReviewStatus(reviewStatus.value)
  await searchResource.run((signal) =>
    provider.searchHerbs(
      {
        query: query.value,
        pageSize: 40,
        ...(thermalNature.value ? { thermalNature: thermalNature.value } : {}),
        ...(flavor.value ? { flavor: flavor.value } : {}),
        ...(channel.value ? { channel: channel.value } : {}),
        ...(category.value ? { category: category.value } : {}),
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

const loadDetail = async (herbId: string) => {
  if (!herbId) {
    herbResource.clear()
    neighborhoodResource.clear()
    return
  }
  await Promise.all([
    herbResource.run((signal) => provider.getHerb(herbId, signal)),
    neighborhoodResource.run((signal) => provider.getEntityNeighborhood(herbId, signal)),
  ])
}

const selectHerb = async (herbId: string) => {
  await router.push({
    name: 'alchemy-herb-detail',
    params: { herbId },
    query: routeQuery(),
  })
}

const clearFilters = () => {
  thermalNature.value = ''
  flavor.value = ''
  channel.value = ''
  category.value = ''
  action.value = ''
  source.value = ''
  reviewStatus.value = ''
}

const allDetailCitations = computed<readonly Citation[]>(() => {
  const herb = herbResource.data.value
  if (!herb) return []
  const claims = [
    ...herb.biologicalSources,
    ...herb.medicinalParts,
    ...herb.preparations,
    ...herb.thermalNatures,
    ...herb.flavors,
    ...herb.channels,
    ...herb.actions,
    ...herb.patterns,
    ...herb.cautions,
    ...herb.compounds,
  ]
  return [
    ...new Map(claims.flatMap((item) => item.citations).map((item) => [item.id, item])).values(),
  ]
})

const onGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return
  }
  event.preventDefault()
  searchInput.value?.focus()
}

watch(
  [query, thermalNature, flavor, channel, category, action, source, reviewStatus],
  scheduleSearch,
)

watch(
  () => route.query,
  (nextQuery) => {
    const nextSearch = stringQueryValue(nextQuery['q'])
    if (nextSearch !== query.value) query.value = nextSearch
  },
)

watch(activeHerbId, (herbId) => void loadDetail(herbId), { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  void search()
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <section class="alchemy-route" aria-labelledby="materia-heading">
    <header class="route-heading">
      <div>
        <p class="mini-label">01 · Research terminal</p>
        <h2 id="materia-heading">Materia Medica</h2>
        <p>
          Search multilingual identities, inspect claim-level provenance, and keep unresolved source
          differences in view.
        </p>
      </div>
      <DataStatusBadge
        :status="environment.status.value?.dataStatus ?? 'unavailable'"
        :label="environment.status.value?.label ?? 'Provider pending'"
      />
    </header>

    <div class="materia-layout" :class="{ 'has-detail': activeHerbId }">
      <aside class="research-controls panel" aria-label="Materia medica search and filters">
        <label class="field-label" for="materia-search">Search the materia medica</label>
        <div class="search-control">
          <input
            id="materia-search"
            ref="searchInput"
            v-model="query"
            class="control"
            type="search"
            placeholder="Name, 中文, pinyin, Latin, or alias"
            autocomplete="off"
          />
          <button v-if="query" class="text-button" type="button" @click="query = ''">Clear</button>
          <kbd aria-label="Keyboard shortcut slash">/</kbd>
        </div>

        <details class="filter-disclosure">
          <summary>Search filters</summary>
          <div class="filter-stack">
            <label v-if="environment.capabilities.value?.filters.thermalNatures.length">
              Thermal nature
              <select v-model="thermalNature" class="control">
                <option value="">All classifications</option>
                <option
                  v-for="item in environment.capabilities.value.filters.thermalNatures"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </label>
            <label v-if="environment.capabilities.value?.filters.flavors.length">
              Flavor
              <select v-model="flavor" class="control">
                <option value="">All classifications</option>
                <option
                  v-for="item in environment.capabilities.value.filters.flavors"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </label>
            <label v-if="environment.capabilities.value?.filters.channels.length">
              Channel
              <select v-model="channel" class="control">
                <option value="">All channels</option>
                <option
                  v-for="item in environment.capabilities.value.filters.channels"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </label>
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
            <button class="quiet-button" type="button" @click="clearFilters">Reset filters</button>
          </div>
        </details>

        <p class="search-status" aria-live="polite">{{ resultAnnouncement }}</p>
      </aside>

      <section class="result-column panel" aria-labelledby="result-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Indexed materials</p>
            <h3 id="result-heading">Search results</h3>
          </div>
          <span v-if="searchResource.data.value"
            >{{ searchResource.data.value.total }} records</span
          >
        </div>

        <div
          v-if="searchResource.loading.value && !searchResource.data.value"
          class="loading-panel"
        >
          Reading the materia-medica index…
        </div>
        <ResourceError
          v-else-if="searchResource.error.value"
          :error="searchResource.error.value"
          @retry="search"
        />
        <div v-else-if="searchResource.data.value?.items.length" class="result-list">
          <button
            v-for="herb in searchResource.data.value.items"
            :key="herb.id"
            type="button"
            class="result-card"
            :class="{ active: activeHerbId === herb.id }"
            @click="selectHerb(herb.id)"
          >
            <span class="result-index" aria-hidden="true">
              {{ String(searchResource.data.value.items.indexOf(herb) + 1).padStart(2, '0') }}
            </span>
            <span class="result-identity">
              <strong>{{ herb.displayName }}</strong>
              <span
                v-if="herb.nameChineseTraditional || herb.nameChineseSimplified"
                lang="zh-Hant"
              >
                {{ herb.nameChineseTraditional || herb.nameChineseSimplified }}
              </span>
              <small>{{ herb.pinyin }}</small>
              <small>{{ herb.latinDrugName || herb.botanicalNames[0] }}</small>
            </span>
            <span class="result-badges">
              <DataStatusBadge :status="herb.status" />
              <ReviewStatusBadge :status="herb.reviewStatus" />
              <small>{{ herb.sourceCount }} sources</small>
              <small v-if="herb.ambiguous">Ambiguous identity</small>
            </span>
          </button>
          <p v-if="searchResource.data.value.partial" class="partial-note">
            Partial results · additional records may be available.
          </p>
        </div>
        <div v-else class="empty-state">
          <span aria-hidden="true">∅</span>
          <h3>No matching material records</h3>
          <p>Try a broader name or clear one of the active filters.</p>
        </div>
      </section>

      <article class="detail-column panel" aria-labelledby="herb-detail-heading">
        <div v-if="herbResource.loading.value && !herbResource.data.value" class="loading-panel">
          Loading the selected source record…
        </div>
        <ResourceError
          v-else-if="herbResource.error.value"
          :error="herbResource.error.value"
          @retry="loadDetail(activeHerbId)"
        />
        <template v-else-if="herbResource.data.value">
          <header class="detail-heading">
            <RouterLink
              class="mobile-back-link"
              :to="{ name: 'alchemy-materia-medica', query: routeQuery() }"
            >
              ← Results
            </RouterLink>
            <div class="detail-title-row">
              <div>
                <p class="mini-label">Material record · {{ herbResource.data.value.id }}</p>
                <h3 id="herb-detail-heading">{{ herbResource.data.value.displayName }}</h3>
              </div>
              <span
                v-if="
                  herbResource.data.value.nameChineseTraditional ||
                  herbResource.data.value.nameChineseSimplified
                "
                class="cjk-name"
                lang="zh-Hant"
              >
                {{
                  herbResource.data.value.nameChineseTraditional ||
                  herbResource.data.value.nameChineseSimplified
                }}
              </span>
            </div>
            <p class="identity-line">
              {{ herbResource.data.value.pinyin }}
              <span v-if="herbResource.data.value.latinDrugName">
                · {{ herbResource.data.value.latinDrugName }}
              </span>
            </p>
            <div class="badge-row">
              <DataStatusBadge :status="herbResource.data.value.status" />
              <ReviewStatusBadge :status="herbResource.data.value.reviewStatus" />
            </div>
            <dl class="identity-grid">
              <div>
                <dt>Aliases</dt>
                <dd>{{ herbResource.data.value.aliases.join(', ') || 'Unavailable' }}</dd>
              </div>
              <div>
                <dt>Biological names</dt>
                <dd>{{ herbResource.data.value.botanicalNames.join(', ') || 'Unavailable' }}</dd>
              </div>
              <div>
                <dt>Categories</dt>
                <dd>{{ herbResource.data.value.categoryLabels.join(', ') }}</dd>
              </div>
            </dl>
          </header>

          <div
            v-if="herbResource.data.value.completeness.unresolvedConflictCount"
            class="conflict-notice"
            role="note"
          >
            <strong>Conflicting sources remain visible.</strong>
            This record contains {{ herbResource.data.value.completeness.unresolvedConflictCount }}
            unresolved classification group.
          </div>

          <CompletenessSummary
            :completeness="herbResource.data.value.completeness"
            :status="herbResource.data.value.status"
          />
          <ClaimGroup
            title="Biological source"
            :claims="herbResource.data.value.biologicalSources"
          />
          <ClaimGroup title="Medicinal part" :claims="herbResource.data.value.medicinalParts" />
          <ClaimGroup title="Preparations" :claims="herbResource.data.value.preparations" />
          <ClaimGroup title="Traditional nature" :claims="herbResource.data.value.thermalNatures" />
          <ClaimGroup title="Flavors" :claims="herbResource.data.value.flavors" />
          <ClaimGroup title="Channels" :claims="herbResource.data.value.channels" />
          <ClaimGroup title="Documented actions" :claims="herbResource.data.value.actions" />
          <ClaimGroup title="Pattern associations" :claims="herbResource.data.value.patterns" />
          <ClaimGroup title="Cautions" :claims="herbResource.data.value.cautions" />
          <ClaimGroup title="Compounds" :claims="herbResource.data.value.compounds" />

          <section class="related-records">
            <div class="section-heading">
              <h3>Related formulas</h3>
              <span>{{ herbResource.data.value.relatedFormulaIds.length }} records</span>
            </div>
            <div class="link-list">
              <RouterLink
                v-for="formulaId in herbResource.data.value.relatedFormulaIds"
                :key="formulaId"
                :to="{ name: 'alchemy-formula-detail', params: { formulaId } }"
              >
                {{ formulaId.replace('demo:formula:', 'Demo Formula ') }}
              </RouterLink>
            </div>
          </section>

          <EntityNeighborhoodList
            v-if="neighborhoodResource.data.value"
            :neighborhood="neighborhoodResource.data.value"
          />

          <section class="source-register">
            <div class="section-heading">
              <h3>Source register</h3>
              <span>{{ allDetailCitations.length }} sources</span>
            </div>
            <CitationList :citations="allDetailCitations" />
          </section>
        </template>
        <div v-else class="empty-state detail-empty">
          <span aria-hidden="true">索</span>
          <h3 id="herb-detail-heading">Select a material record</h3>
          <p>
            Claim groups, citations, conflicts, completeness, and relationships will appear here.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
