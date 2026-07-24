<script setup lang="ts">
import type { DistributionDatum, FormulaAnalysisResult } from '../../domain/types'
import CitationList from '../common/CitationList.vue'
import ClaimGroup from '../common/ClaimGroup.vue'
import DataStatusBadge from '../common/DataStatusBadge.vue'

defineProps<{
  result: FormulaAnalysisResult
}>()

const percentLabel = (value: number): string => `${Math.round(value * 100)}%`

const distributionTitle = (key: 'nature' | 'flavor' | 'channel' | 'category'): string =>
  ({
    nature: 'Thermal nature',
    flavor: 'Flavor',
    channel: 'Channel',
    category: 'Category',
  })[key]

const distributionEntries = (
  result: FormulaAnalysisResult,
): readonly {
  key: 'nature' | 'flavor' | 'channel' | 'category'
  values: readonly DistributionDatum[]
}[] => [
  { key: 'nature', values: result.natureDistribution },
  { key: 'flavor', values: result.flavorDistribution },
  { key: 'channel', values: result.channelDistribution },
  { key: 'category', values: result.categoryDistribution },
]
</script>

<template>
  <section class="analysis-result" aria-labelledby="analysis-result-heading">
    <header class="result-header">
      <div>
        <p class="mini-label">Provider-returned analysis</p>
        <h3 id="analysis-result-heading">Formula analysis</h3>
      </div>
      <DataStatusBadge :status="result.status" />
    </header>
    <dl class="result-metadata">
      <div>
        <dt>Algorithm</dt>
        <dd>{{ result.algorithmVersion }}</dd>
      </div>
      <div>
        <dt>Data version</dt>
        <dd>{{ result.dataVersion || 'Not supplied' }}</dd>
      </div>
      <div>
        <dt>Source coverage</dt>
        <dd>
          {{
            result.sourceCoveragePercent === undefined
              ? 'Not supplied'
              : `${result.sourceCoveragePercent}%`
          }}
        </dd>
      </div>
    </dl>
    <div
      v-if="result.sourceCoveragePercent !== undefined"
      class="coverage-track"
      role="meter"
      aria-label="Provider-reported source coverage"
      :aria-valuenow="result.sourceCoveragePercent"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span :style="{ width: `${result.sourceCoveragePercent}%` }"></span>
    </div>

    <section class="record-section">
      <div class="section-heading">
        <h4>Normalized composition</h4>
        <span>{{ result.normalizedIngredients.length }} lines</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col">Amount retained</th>
              <th scope="col">Preparation</th>
              <th scope="col">Normalization</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ingredient in result.normalizedIngredients" :key="ingredient.lineId">
              <th scope="row">{{ ingredient.herbDisplayName }}</th>
              <td>{{ ingredient.amountText || 'Unspecified' }} {{ ingredient.unit }}</td>
              <td>{{ ingredient.preparationLabel || 'Not supplied' }}</td>
              <td>
                {{ ingredient.normalizationStatus }}<small>{{ ingredient.note }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="analysis-grid">
      <section class="record-section">
        <div class="section-heading">
          <h4>Duplicate ingredients</h4>
          <span>{{ result.duplicateIngredients.length }}</span>
        </div>
        <ul v-if="result.duplicateIngredients.length" class="plain-list">
          <li v-for="item in result.duplicateIngredients" :key="item.herbMaterialId">
            <strong>{{ item.herbDisplayName }}</strong>
            <span>{{ item.lineIds.length }} retained lines</span>
          </li>
        </ul>
        <p v-else class="empty-inline">No duplicate identities reported.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Preparation variants</h4>
          <span>{{ result.preparationVariants.length }}</span>
        </div>
        <ul v-if="result.preparationVariants.length" class="plain-list">
          <li v-for="item in result.preparationVariants" :key="item.herbMaterialId">
            <strong>{{ item.herbDisplayName }}</strong>
            <span>{{ item.preparations.join(' · ') }}</span>
          </li>
        </ul>
        <p v-else class="empty-inline">No preparation variants reported.</p>
      </section>
    </div>

    <div class="distribution-grid">
      <section
        v-for="distribution in distributionEntries(result)"
        :key="distribution.key"
        class="distribution-card"
      >
        <div class="section-heading">
          <h4>{{ distributionTitle(distribution.key) }}</h4>
          <span>Provider data</span>
        </div>
        <ul v-if="distribution.values.length">
          <li v-for="item in distribution.values" :key="item.label">
            <div>
              <span>{{ item.label }}</span>
              <small>{{ item.count }} · {{ percentLabel(item.proportion) }}</small>
            </div>
            <div class="distribution-track" aria-hidden="true">
              <span :style="{ width: percentLabel(item.proportion) }"></span>
            </div>
          </li>
        </ul>
        <p v-else class="empty-inline">Data incomplete.</p>
      </section>
    </div>

    <ClaimGroup title="Documented actions" :claims="result.documentedActions" />
    <ClaimGroup title="Documented patterns" :claims="result.documentedPatterns" />

    <section class="record-section">
      <div class="section-heading">
        <h4>Sourced pair relationships</h4>
        <span>{{ result.interactions.length }} pairs</span>
      </div>
      <div v-if="result.interactions.length" class="interaction-list">
        <article v-for="interaction in result.interactions" :key="interaction.id">
          <div class="interaction-heading">
            <strong>{{ interaction.sourceLabel }} ↔ {{ interaction.targetLabel }}</strong>
            <DataStatusBadge
              :status="interaction.status"
              :label="interaction.kind.replace(/_/g, ' ')"
            />
          </div>
          <p>{{ interaction.summary }}</p>
          <CitationList :citations="interaction.citations" />
        </article>
      </div>
      <p v-else class="empty-inline">A single-material formula has no pair relationships.</p>
    </section>

    <section v-if="result.sourceConflicts.length" class="record-section">
      <div class="section-heading">
        <h4>Source conflicts</h4>
        <DataStatusBadge status="conflicted" />
      </div>
      <article v-for="conflict in result.sourceConflicts" :key="conflict.id" class="conflict-card">
        <strong>{{ conflict.field }}</strong>
        <p>{{ conflict.summary }}</p>
        <ul>
          <li v-for="alternative in conflict.alternatives" :key="alternative">{{ alternative }}</li>
        </ul>
        <CitationList :citations="conflict.citations" />
      </article>
    </section>

    <div class="analysis-grid">
      <section class="record-section">
        <div class="section-heading">
          <h4>Missing-data report</h4>
          <span>{{ result.missingData.length }}</span>
        </div>
        <ul v-if="result.missingData.length" class="plain-list">
          <li v-for="item in result.missingData" :key="item">{{ item }}</li>
        </ul>
        <p v-else class="empty-inline">No missing fields reported by this provider.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Review-state breakdown</h4>
          <span>{{ result.reviewStatusBreakdown.length }} states</span>
        </div>
        <ul class="plain-list">
          <li v-for="item in result.reviewStatusBreakdown" :key="item.status">
            <strong>{{ item.status.replace(/_/g, ' ') }}</strong>
            <span>{{ item.count }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="warning-register" aria-label="Analysis warnings">
      <strong>Interpretation boundary</strong>
      <ul>
        <li v-for="warning in result.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </section>
  </section>
</template>
