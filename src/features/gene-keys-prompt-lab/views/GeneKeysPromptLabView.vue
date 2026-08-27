<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import { getGeneKeyReferences } from '@/domain/astrology/geneKeys'
import {
  createPromptLabUser,
  generatePromptLabCommentary,
  GeneKeysPromptLabApiError,
  getPromptLabSession,
  getPromptLabWorkspace,
  logOutOfPromptLab,
} from '@/features/gene-keys-prompt-lab/api'
import PromptLabGate from '@/features/gene-keys-prompt-lab/components/PromptLabGate.vue'
import PromptLabHistory from '@/features/gene-keys-prompt-lab/components/PromptLabHistory.vue'
import {
  DEFAULT_GENE_KEYS_PROMPT_LAB_MODEL_ID,
  GENE_KEYS_PROMPT_LAB_MODELS,
  GENE_KEYS_PROMPT_MAX_LENGTH,
  GENE_KEYS_SOURCE_OPTIONS,
  type GeneKeysPromptLabGeneration,
  type GeneKeysPromptLabModelId,
  type GeneKeysPromptLabUser,
  type GeneKeysSourceId,
} from '@/features/gene-keys-prompt-lab/domain'
import {
  exportPromptLabHistory,
  loadPreferredModelId,
  loadPreferredUserId,
  savePreferredModelId,
  savePreferredUserId,
  type GeneKeysPromptLabHistoryEntry,
} from '@/features/gene-keys-prompt-lab/history'

const DEFAULT_PROMPT = `Write an OLTR and synthesized commentary for the selected Gene Key. Distill the movement from Shadow through Gift toward Siddhi into precise, original prose. Keep the voice contemplative, grounded, and useful for the Current Flow Hexagram Library.`

const geneKeys = getGeneKeyReferences()
const sessionLoading = ref(true)
const authenticated = ref(false)
const users = ref<GeneKeysPromptLabUser[]>([])
const selectedUserId = ref('')
const userSelection = ref('')
const addingUser = ref(false)
const newUserName = ref('')
const savingUser = ref(false)
const selectedModelId = ref<GeneKeysPromptLabModelId>(DEFAULT_GENE_KEYS_PROMPT_LAB_MODEL_ID)
const selectedKeyNumber = ref(1)
const selectedSourceIds = ref<GeneKeysSourceId[]>(
  GENE_KEYS_SOURCE_OPTIONS.map((source) => source.id),
)
const prompt = ref(DEFAULT_PROMPT)
const generating = ref(false)
const error = ref('')
const generation = ref<GeneKeysPromptLabGeneration | null>(null)
const history = ref<GeneKeysPromptLabHistoryEntry[]>([])
const activeHistoryId = ref<string | null>(null)

const selectedKey = computed(() => geneKeys.find((key) => key.number === selectedKeyNumber.value))
const canGenerate = computed(
  () =>
    authenticated.value &&
    !generating.value &&
    Boolean(selectedUserId.value) &&
    prompt.value.trim().length > 0,
)
const sourceSummary = computed(() => {
  if (selectedSourceIds.value.length === 0) {
    return 'Prompt only · no source text'
  }

  return selectedSourceIds.value.length === 2 ? 'Both source chapters' : 'One source chapter'
})

onMounted(async () => {
  selectedModelId.value = loadPreferredModelId()
  try {
    authenticated.value = await getPromptLabSession()
    if (authenticated.value) await refreshWorkspace()
  } catch {
    authenticated.value = false
  } finally {
    sessionLoading.value = false
  }
})

async function handleUnlocked() {
  authenticated.value = true
  error.value = ''
  await refreshWorkspace()
}

watch(selectedModelId, (modelId) => savePreferredModelId(modelId))

async function refreshWorkspace() {
  try {
    const workspace = await getPromptLabWorkspace()
    users.value = workspace.users
    history.value = workspace.history
    const rememberedUserId = loadPreferredUserId()
    const candidateUserId = users.value.some((user) => user.id === selectedUserId.value)
      ? selectedUserId.value
      : rememberedUserId
    selectedUserId.value =
      users.value.find((user) => user.id === candidateUserId)?.id ??
      users.value.find((user) => user.id === 'ben-kind')?.id ??
      users.value[0]?.id ??
      ''
    userSelection.value = selectedUserId.value
    if (selectedUserId.value) savePreferredUserId(selectedUserId.value)
  } catch (reason) {
    if (reason instanceof GeneKeysPromptLabApiError && reason.status === 401) {
      authenticated.value = false
    }
    error.value = reason instanceof Error ? reason.message : 'Shared history could not be loaded.'
  }
}

function handleUserSelection() {
  if (userSelection.value === '__add__') {
    addingUser.value = true
    newUserName.value = ''
    return
  }
  selectedUserId.value = userSelection.value
  if (selectedUserId.value) savePreferredUserId(selectedUserId.value)
}

function cancelAddUser() {
  addingUser.value = false
  newUserName.value = ''
  userSelection.value = selectedUserId.value
}

async function addUser() {
  const name = newUserName.value.trim()
  if (!name || savingUser.value) return

  savingUser.value = true
  error.value = ''
  try {
    const user = await createPromptLabUser(name)
    if (!users.value.some((candidate) => candidate.id === user.id)) {
      users.value = [...users.value, user].sort((left, right) => left.name.localeCompare(right.name))
    }
    selectedUserId.value = user.id
    userSelection.value = user.id
    savePreferredUserId(user.id)
    addingUser.value = false
    newUserName.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'The user could not be added.'
  } finally {
    savingUser.value = false
  }
}

async function logOut() {
  error.value = ''
  try {
    await logOutOfPromptLab()
    authenticated.value = false
    generation.value = null
    activeHistoryId.value = null
  } catch {
    error.value =
      'The server could not lock this workspace. Your session remains active; try again shortly.'
  }
}

async function generate() {
  const trimmedPrompt = prompt.value.trim()
  if (!canGenerate.value || !trimmedPrompt) {
    return
  }

  generating.value = true
  error.value = ''
  activeHistoryId.value = null

  try {
    const result = await generatePromptLabCommentary({
      keyNumber: selectedKeyNumber.value,
      sourceIds: [...selectedSourceIds.value],
      prompt: trimmedPrompt,
      userId: selectedUserId.value,
      modelId: selectedModelId.value,
    })
    generation.value = result
    history.value = [result, ...history.value.filter((entry) => entry.id !== result.id)]
    activeHistoryId.value = result.id
  } catch (reason) {
    if (reason instanceof GeneKeysPromptLabApiError && reason.status === 401) {
      authenticated.value = false
    }
    error.value = reason instanceof Error ? reason.message : 'Generation failed unexpectedly.'
  } finally {
    generating.value = false
  }
}

function loadEntry(entry: GeneKeysPromptLabHistoryEntry) {
  selectedKeyNumber.value = entry.keyNumber
  selectedSourceIds.value = [...entry.sourceIds]
  prompt.value = entry.prompt
  selectedUserId.value = entry.user.id
  userSelection.value = entry.user.id
  selectedModelId.value = entry.modelId
  savePreferredUserId(entry.user.id)
  generation.value = entry
  activeHistoryId.value = entry.id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function exportHistory() {
  const blob = new Blob([exportPromptLabHistory(history.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `current-flow-gene-keys-prompt-lab-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="sessionLoading" class="session-loading" role="status">
    <span aria-hidden="true"></span>
    Checking private workspace…
  </div>

  <PromptLabGate v-else-if="!authenticated" @unlocked="handleUnlocked" />

  <div v-else class="page-shell prompt-lab-page">
    <header class="lab-header">
      <div class="page-intro">
        <p class="eyebrow">Other Tools · Language synthesis studio</p>
        <h1 class="page-title">Gene Keys Prompt Lab</h1>
        <p class="page-lede">
          Shape a prompt, choose a key and its evidence, then compare draft OLTRs and synthesized
          commentary one experiment at a time.
        </p>
      </div>
      <button class="quiet-button" type="button" @click="logOut">Lock workspace</button>
    </header>

    <div class="boundary-note" role="note">
      <StatusBadge status="curated" label="Private evidence" />
      <span>
        Source chapters are read only by the server for an explicit generation. They are never sent
        to this browser or saved in experiment history.
      </span>
    </div>

    <section class="identity-bar panel" aria-label="Experiment identity and model">
      <div class="identity-control">
        <label for="prompt-lab-user">You are</label>
        <select
          id="prompt-lab-user"
          v-model="userSelection"
          class="control"
          @change="handleUserSelection"
        >
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
          <option value="__add__">+ Add user…</option>
        </select>
      </div>
      <form v-if="addingUser" class="add-user" @submit.prevent="addUser">
        <label for="prompt-lab-new-user">Add a shared user</label>
        <div>
          <input
            id="prompt-lab-new-user"
            v-model="newUserName"
            class="control"
            maxlength="80"
            autocomplete="name"
            :disabled="savingUser"
            autofocus
            required
          />
          <button type="submit" :disabled="savingUser || !newUserName.trim()">
            {{ savingUser ? 'Saving…' : 'Add' }}
          </button>
          <button type="button" class="quiet-button" @click="cancelAddUser">Cancel</button>
        </div>
      </form>
      <div class="identity-control model-control">
        <label for="prompt-lab-model">Model</label>
        <select id="prompt-lab-model" v-model="selectedModelId" class="control">
          <option v-for="model in GENE_KEYS_PROMPT_LAB_MODELS" :key="model.id" :value="model.id">
            {{ model.label }} · {{ model.provider }}
          </option>
        </select>
      </div>
    </section>

    <main class="lab-grid">
      <form class="composer panel" @submit.prevent="generate">
        <div class="field-group">
          <label for="gene-key-selection">Gene Key</label>
          <select id="gene-key-selection" v-model.number="selectedKeyNumber" class="control">
            <option v-for="key in geneKeys" :key="key.number" :value="key.number">
              {{ key.number }} · {{ key.title }}
            </option>
          </select>
          <div v-if="selectedKey" class="spectrum" aria-label="Selected Gene Key spectrum">
            <span><small>Shadow</small>{{ selectedKey.shadow }}</span>
            <span><small>Gift</small>{{ selectedKey.gift }}</span>
            <span><small>Siddhi</small>{{ selectedKey.siddhi }}</span>
          </div>
        </div>

        <fieldset class="field-group source-fieldset">
          <legend>Source chapters</legend>
          <p>Select either, both, or neither. {{ sourceSummary }}</p>
          <label v-for="source in GENE_KEYS_SOURCE_OPTIONS" :key="source.id" class="source-choice">
            <input v-model="selectedSourceIds" type="checkbox" :value="source.id" />
            <span>
              <strong>{{ source.label }}</strong>
              <small>{{ source.description }}</small>
            </span>
          </label>
        </fieldset>

        <div class="field-group prompt-field">
          <div class="field-heading">
            <label for="prompt-lab-prompt">Prompt</label>
            <span
              >{{ prompt.length.toLocaleString() }} /
              {{ GENE_KEYS_PROMPT_MAX_LENGTH.toLocaleString() }}</span
            >
          </div>
          <textarea
            id="prompt-lab-prompt"
            v-model="prompt"
            class="control"
            rows="14"
            :maxlength="GENE_KEYS_PROMPT_MAX_LENGTH"
            :disabled="generating"
            required
          ></textarea>
        </div>

        <button class="generate-button" type="submit" :disabled="!canGenerate">
          <span v-if="generating" class="button-spinner" aria-hidden="true"></span>
          {{ generating ? 'Synthesizing…' : 'Generate commentary' }}
        </button>
        <p v-if="error" class="generation-error" role="alert">{{ error }}</p>
      </form>

      <section class="result panel" aria-labelledby="prompt-lab-result-title" aria-live="polite">
        <div v-if="generation" class="result-content">
          <div class="result-heading">
            <div>
              <p class="eyebrow">Generated experiment</p>
              <h2 id="prompt-lab-result-title">
                Gene Key {{ generation.keyNumber }} · {{ generation.keyTitle }}
              </h2>
            </div>
            <StatusBadge status="demo" label="Draft only" />
          </div>

          <article class="oltr-block">
            <h3>OLTR</h3>
            <p>{{ generation.output.oltr }}</p>
          </article>

          <article class="commentary-block">
            <h3>Synthesized Commentary</h3>
            <p>{{ generation.output.commentary }}</p>
          </article>

          <dl class="result-meta">
            <div>
              <dt>Generated by</dt>
              <dd>{{ generation.user.name }}</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{{ generation.evidenceMode }}</dd>
            </div>
            <div>
              <dt>Engine</dt>
              <dd>{{ generation.modelLabel }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ new Date(generation.generatedAt).toLocaleString() }}</dd>
            </div>
          </dl>
          <ul v-if="generation.warnings.length" class="warnings">
            <li v-for="warning in generation.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>

        <div v-else class="result-empty">
          <span aria-hidden="true">水</span>
          <h2 id="prompt-lab-result-title">The next voice begins here</h2>
          <p>Your generated OLTR and commentary will appear in this space.</p>
        </div>
      </section>
    </main>

    <PromptLabHistory
      :entries="history"
      :active-id="activeHistoryId"
      @load="loadEntry"
      @refresh="refreshWorkspace"
      @export="exportHistory"
    />
  </div>
</template>

<style scoped>
.session-loading {
  display: flex;
  min-height: 60vh;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  color: var(--ink-soft);
}

.session-loading span,
.button-spinner {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

.prompt-lab-page {
  --content: 1380px;
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
}

.lab-header,
.result-heading,
.field-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lab-header .page-intro {
  margin-bottom: 1.5rem;
}

.lab-header .quiet-button {
  flex: 0 0 auto;
}

.boundary-note {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 0.75rem 0;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.boundary-note :deep(.status-label) {
  flex: 0 0 auto;
}

.identity-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 0.85rem 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
}

.identity-control,
.add-user {
  display: grid;
  gap: 0.4rem;
}

.identity-control label,
.add-user label {
  color: var(--jade);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.add-user {
  grid-column: 1 / -1;
  grid-row: 2;
}

.add-user > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.5rem;
}

.add-user button[type='submit'] {
  border-radius: var(--radius-sm);
  background: var(--jade);
  padding-inline: 1rem;
  color: var(--paper);
  font-weight: 800;
}

.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 1rem;
  align-items: start;
}

.composer,
.result {
  padding: clamp(1.15rem, 3vw, 2rem);
}

.composer {
  display: grid;
  gap: 1.5rem;
}

.field-group {
  display: grid;
  gap: 0.55rem;
}

.field-group > label,
.source-fieldset legend,
.field-heading label {
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.spectrum {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}

.spectrum span {
  display: grid;
  border-left: 1px solid var(--line);
  padding-left: 0.65rem;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.spectrum small {
  color: var(--ink-faint);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.source-fieldset {
  margin: 0;
  border: 0;
  padding: 0;
}

.source-fieldset > p {
  margin: -0.15rem 0 0.15rem;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.source-choice {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  cursor: pointer;
}

.source-choice:has(input:checked) {
  border-color: var(--jade);
  background: var(--jade-wash);
}

.source-choice input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  accent-color: var(--jade);
}

.source-choice span,
.source-choice small {
  display: block;
}

.source-choice strong {
  color: var(--ink);
  font-size: 0.9rem;
}

.source-choice small {
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.field-heading {
  align-items: baseline;
}

.field-heading span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.prompt-field textarea {
  min-height: 18rem;
  resize: vertical;
  line-height: 1.55;
}

.generate-button {
  display: inline-flex;
  min-height: 3.2rem;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--jade);
  padding: 0.75rem 1.3rem;
  color: var(--paper);
  font-weight: 850;
}

.generate-button:disabled {
  opacity: 0.55;
}

.generation-error {
  margin: -0.7rem 0 0;
  color: var(--cinnabar);
  font-size: 0.82rem;
}

.result {
  position: sticky;
  top: calc(var(--header-height) + 1rem);
  min-height: 40rem;
}

.result-content {
  display: grid;
  gap: 1.7rem;
}

.result-heading h2,
.result-empty h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 3vw, 2.65rem);
  font-weight: 500;
}

.oltr-block,
.commentary-block {
  border-top: 1px solid var(--line);
  padding-top: 1.25rem;
}

.oltr-block h3,
.commentary-block h3 {
  color: var(--jade);
  font-size: 0.68rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.oltr-block p {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.45rem, 3vw, 2.2rem);
  line-height: 1.35;
}

.commentary-block p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 1.02rem;
  line-height: 1.75;
  white-space: pre-wrap;
}

.result-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}

.result-meta div {
  display: grid;
  gap: 0.2rem;
}

.result-meta dt {
  color: var(--ink-faint);
  font-size: 0.6rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.result-meta dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.warnings {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.75rem 0.75rem 0.75rem 1.75rem;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.result-empty {
  display: flex;
  min-height: 34rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.result-empty > span {
  margin-bottom: 1rem;
  color: var(--jade);
  font-family: var(--font-serif);
  font-size: 4rem;
  opacity: 0.48;
}

.result-empty p {
  color: var(--ink-faint);
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 940px) {
  .lab-grid {
    grid-template-columns: 1fr;
  }

  .result {
    position: static;
    min-height: 28rem;
  }
}

@media (max-width: 620px) {
  .lab-header,
  .boundary-note,
  .result-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .spectrum,
  .result-meta {
    grid-template-columns: 1fr;
  }

  .identity-bar,
  .add-user > div {
    grid-template-columns: 1fr;
  }

  .add-user {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .session-loading span,
  .button-spinner {
    animation: none;
  }
}
</style>
