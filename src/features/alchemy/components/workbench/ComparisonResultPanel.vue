<script setup lang="ts">
import type { FormulaComparisonResult, FormulaDraft } from '../../domain/types'
import CitationList from '../common/CitationList.vue'
import DataStatusBadge from '../common/DataStatusBadge.vue'

defineProps<{
  result: FormulaComparisonResult
  formulas: readonly FormulaDraft[]
}>()
</script>

<template>
  <section class="analysis-result comparison-result" aria-labelledby="comparison-result-heading">
    <header class="result-header">
      <div>
        <p class="mini-label">Provider-returned comparison</p>
        <h3 id="comparison-result-heading">Open formula comparison</h3>
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
        <dt>Scope</dt>
        <dd>{{ result.formulaIds.length }} local formulas</dd>
      </div>
    </dl>

    <section class="record-section">
      <div class="section-heading">
        <h4>Formula overview</h4>
        <span>Local drafts</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Formula</th>
              <th scope="col">Ingredient rows</th>
              <th scope="col">Resolved identities</th>
              <th scope="col">Source origin</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="formula in formulas" :key="formula.id">
              <th scope="row">{{ formula.name }}</th>
              <td>{{ formula.ingredients.length }}</td>
              <td>{{ formula.ingredients.filter((item) => item.herbMaterialId).length }}</td>
              <td>{{ formula.sourceFormulaId || 'Blank local draft' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="record-section">
      <div class="section-heading">
        <h4>Pairwise ingredient overlap</h4>
        <span>Identity only</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Formula A</th>
              <th scope="col">Formula B</th>
              <th scope="col">Shared materials</th>
              <th scope="col">Jaccard similarity</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pair in result.pairwiseOverlap"
              :key="`${pair.formulaAId}:${pair.formulaBId}`"
            >
              <th scope="row">{{ pair.formulaALabel }}</th>
              <td>{{ pair.formulaBLabel }}</td>
              <td>{{ pair.sharedIngredientLabels.join(', ') || 'None' }}</td>
              <td>
                {{
                  pair.jaccardSimilarity === undefined
                    ? 'Not supplied'
                    : `${Math.round(pair.jaccardSimilarity * 100)}%`
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="missing-note">
        Mathematical ingredient overlap does not indicate clinical similarity.
      </p>
    </section>

    <div class="analysis-grid">
      <section class="record-section">
        <div class="section-heading">
          <h4>Shared ingredients</h4>
          <span>{{ result.sharedIngredients.length }}</span>
        </div>
        <ul v-if="result.sharedIngredients.length" class="plain-list">
          <li v-for="item in result.sharedIngredients" :key="item.herbMaterialId">
            <strong>{{ item.herbDisplayName }}</strong>
            <span>{{ item.formulaIds.length }} formulas</span>
          </li>
        </ul>
        <p v-else class="empty-inline">No material appears in every open formula.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Repeated ingredients</h4>
          <span>{{ result.repeatedIngredients.length }}</span>
        </div>
        <ul v-if="result.repeatedIngredients.length" class="plain-list">
          <li v-for="item in result.repeatedIngredients" :key="item.herbMaterialId">
            <strong>{{ item.herbDisplayName }}</strong>
            <span>{{ item.formulaIds.length }} formulas</span>
          </li>
        </ul>
        <p v-else class="empty-inline">No identities repeat across formulas.</p>
      </section>
    </div>

    <section class="record-section">
      <div class="section-heading">
        <h4>Ingredients unique to each formula</h4>
        <span>Provider comparison</span>
      </div>
      <div class="unique-grid">
        <article v-for="formula in formulas" :key="formula.id">
          <strong>{{ formula.name }}</strong>
          <ul v-if="result.uniqueIngredientsByFormula[formula.id]?.length">
            <li
              v-for="item in result.uniqueIngredientsByFormula[formula.id]"
              :key="item.herbMaterialId"
            >
              {{ item.herbDisplayName }}
            </li>
          </ul>
          <p v-else class="empty-inline">No unique identities.</p>
        </article>
      </div>
    </section>

    <div class="analysis-grid">
      <section class="record-section">
        <div class="section-heading">
          <h4>Preparation differences</h4>
          <span>{{ result.preparationDifferences.length }}</span>
        </div>
        <ul v-if="result.preparationDifferences.length" class="plain-list">
          <li v-for="item in result.preparationDifferences" :key="item.herbMaterialId">
            <strong>{{ item.herbDisplayName }}</strong>
            <span>{{ item.preparations.join(' · ') }}</span>
          </li>
        </ul>
        <p v-else class="empty-inline">No cross-formula preparation difference reported.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Combined categories</h4>
          <span>{{ result.combinedDistributions.length }}</span>
        </div>
        <ul class="plain-list">
          <li v-for="item in result.combinedDistributions" :key="item.label">
            <strong>{{ item.label }}</strong>
            <span>{{ item.count }}</span>
          </li>
        </ul>
      </section>
    </div>

    <div class="analysis-grid">
      <section class="record-section">
        <div class="section-heading">
          <h4>Shared actions</h4>
          <span>{{ result.sharedActions.length }}</span>
        </div>
        <ul v-if="result.sharedActions.length" class="plain-list">
          <li v-for="item in result.sharedActions" :key="item.label">{{ item.label }}</li>
        </ul>
        <p v-else class="empty-inline">No action claim is shared by every formula.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Distinct actions</h4>
          <span>{{ result.distinctActions.length }}</span>
        </div>
        <ul class="plain-list">
          <li v-for="item in result.distinctActions" :key="item.label">
            <strong>{{ item.label }}</strong>
            <span>{{ item.formulaIds.length }} formulas</span>
          </li>
        </ul>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Shared patterns</h4>
          <span>{{ result.sharedPatterns.length }}</span>
        </div>
        <ul v-if="result.sharedPatterns.length" class="plain-list">
          <li v-for="item in result.sharedPatterns" :key="item.label">{{ item.label }}</li>
        </ul>
        <p v-else class="empty-inline">No pattern claim is shared by every formula.</p>
      </section>
      <section class="record-section">
        <div class="section-heading">
          <h4>Distinct patterns</h4>
          <span>{{ result.distinctPatterns.length }}</span>
        </div>
        <ul class="plain-list">
          <li v-for="item in result.distinctPatterns" :key="item.label">
            <strong>{{ item.label }}</strong>
            <span>{{ item.formulaIds.length }} formulas</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="record-section">
      <div class="section-heading">
        <h4>Cross-formula interaction signals</h4>
        <span>{{ result.interactionSignals.length }} pairs</span>
      </div>
      <div class="interaction-list">
        <article v-for="interaction in result.interactionSignals" :key="interaction.id">
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
    </section>

    <section v-if="result.conflicts.length" class="record-section">
      <div class="section-heading">
        <h4>Conflicts</h4>
        <DataStatusBadge status="conflicted" />
      </div>
      <article v-for="conflict in result.conflicts" :key="conflict.id" class="conflict-card">
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
          <h4>Missing data</h4>
          <span>{{ result.missingData.length }}</span>
        </div>
        <ul v-if="result.missingData.length" class="plain-list">
          <li v-for="item in result.missingData" :key="item">{{ item }}</li>
        </ul>
        <p v-else class="empty-inline">No missing fields reported by this provider.</p>
      </section>
      <section class="warning-register">
        <strong>Comparison boundaries</strong>
        <ul>
          <li v-for="warning in result.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>
