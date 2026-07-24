<script setup lang="ts">
import { ref } from 'vue'

import DataStatusBadge from '../components/common/DataStatusBadge.vue'
import { useAlchemyEnvironment } from '../composables/alchemyEnvironment'

const environment = useAlchemyEnvironment()
const selectedPrompt = ref('')

const examplePrompts = [
  'Compare the documented properties of two materials.',
  'Show how several sources classify this preparation.',
  'Locate conflicting claims about this formula.',
  'Summarize the cited passages associated with this category.',
] as const
</script>

<template>
  <section class="alchemy-route" aria-labelledby="inquiry-heading">
    <header class="route-heading">
      <div>
        <p class="mini-label">05 · Future private synthesis</p>
        <h2 id="inquiry-heading">Guided Inquiry</h2>
        <p>
          A prepared surface for future source-bounded questions. Retrieval can be previewed today;
          model synthesis remains deliberately disconnected.
        </p>
      </div>
      <DataStatusBadge status="unavailable" label="Model not connected" />
    </header>

    <div class="inquiry-layout">
      <section class="inquiry-prompts panel" aria-labelledby="prompt-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Research-oriented examples</p>
            <h3 id="prompt-heading">Begin with the evidence</h3>
          </div>
        </div>
        <div class="prompt-list">
          <button
            v-for="prompt in examplePrompts"
            :key="prompt"
            type="button"
            :aria-pressed="selectedPrompt === prompt"
            :class="{ active: selectedPrompt === prompt }"
            @click="selectedPrompt = prompt"
          >
            <span aria-hidden="true">↗</span>
            {{ prompt }}
          </button>
        </div>
        <p class="missing-note">
          Examples ask about documented records, classifications, conflicts, and citations. They do
          not request diagnosis, treatment, or recommendations.
        </p>
      </section>

      <section class="inquiry-context panel" aria-labelledby="source-selection-heading">
        <div class="column-heading">
          <div>
            <p class="mini-label">Source-selection preview</p>
            <h3 id="source-selection-heading">Retrieval scope</h3>
          </div>
          <span>Preview only</span>
        </div>
        <div class="source-preview-list" aria-label="Future source selection">
          <label>
            <input type="checkbox" checked disabled />
            Human-reviewed materia records
            <small>Unavailable until the verified source graph is connected.</small>
          </label>
          <label>
            <input type="checkbox" checked disabled />
            Passage-level source citations
            <small>Will preserve document and locator metadata.</small>
          </label>
          <label>
            <input type="checkbox" disabled />
            Private workbench drafts
            <small>User-controlled inclusion will be required.</small>
          </label>
        </div>
        <RouterLink class="quiet-button" :to="{ name: 'alchemy-texts' }">
          Prepare context in Text Library
        </RouterLink>
      </section>

      <section class="inquiry-composer panel" aria-labelledby="composer-heading">
        <div class="composer-status">
          <div>
            <p class="mini-label">Selected-context preview</p>
            <h3 id="composer-heading">Private model workspace</h3>
          </div>
          <DataStatusBadge status="unavailable" label="Model not connected" />
        </div>

        <div class="selected-context-preview">
          <span>Prompt draft</span>
          <p>{{ selectedPrompt || 'Choose a research prompt to preview the future composer.' }}</p>
          <dl>
            <div>
              <dt>Retrieved passages</dt>
              <dd>0 · no package selected</dd>
            </div>
            <div>
              <dt>Cited graph facts</dt>
              <dd>0 · no package selected</dd>
            </div>
            <div>
              <dt>Unresolved ambiguities</dt>
              <dd>Not evaluated</dd>
            </div>
          </dl>
        </div>

        <label for="inquiry-composer">Research question</label>
        <textarea
          id="inquiry-composer"
          class="control"
          rows="5"
          :value="selectedPrompt"
          placeholder="Private model not connected"
          disabled
        ></textarea>
        <button class="primary-button" type="button" disabled>Model not connected</button>
        <p class="model-boundary">
          A future private model may answer only from the retrieved sources and supplied graph
          facts. No external AI request or synthetic response is created in this alpha.
        </p>
        <p class="provider-inline">
          Knowledge provider:
          <strong>{{ environment.status.value?.label ?? 'Checking provider' }}</strong>
        </p>
      </section>
    </div>
  </section>
</template>
