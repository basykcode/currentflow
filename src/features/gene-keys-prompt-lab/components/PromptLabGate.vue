<script setup lang="ts">
import { ref } from 'vue'

import { logInToPromptLab } from '@/features/gene-keys-prompt-lab/api'

const emit = defineEmits<{
  unlocked: []
}>()

const password = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  if (!password.value || submitting.value) {
    return
  }

  submitting.value = true
  error.value = ''
  try {
    await logInToPromptLab(password.value)
    password.value = ''
    emit('unlocked')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Access could not be verified.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="gate panel" aria-labelledby="prompt-lab-access-title">
    <p class="eyebrow">Private workspace</p>
    <h1 id="prompt-lab-access-title">Gene Keys Prompt Lab</h1>
    <p>
      Enter the shared password to open the synthesis workbench. The source chapters remain behind
      this server-side access boundary.
    </p>

    <form @submit.prevent="submit">
      <label for="prompt-lab-password">Password</label>
      <div class="gate-row">
        <input
          id="prompt-lab-password"
          v-model="password"
          class="control"
          type="password"
          autocomplete="current-password"
          :disabled="submitting"
          required
          autofocus
        />
        <button class="gate-button" type="submit" :disabled="submitting || !password">
          {{ submitting ? 'Opening…' : 'Enter' }}
        </button>
      </div>
      <p v-if="error" class="gate-error" role="alert">{{ error }}</p>
    </form>
  </section>
</template>

<style scoped>
.gate {
  width: min(calc(100% - 2rem), 34rem);
  margin: clamp(4rem, 12vh, 8rem) auto;
  padding: clamp(1.5rem, 5vw, 3rem);
}

.gate h1 {
  margin-bottom: 0.85rem;
  font-family: var(--font-serif);
  font-size: clamp(2.25rem, 7vw, 4rem);
  font-weight: 500;
  letter-spacing: -0.035em;
}

.gate > p:not(.eyebrow) {
  margin-bottom: 2rem;
  color: var(--ink-soft);
}

.gate form,
.gate label {
  display: grid;
  gap: 0.55rem;
}

.gate label {
  color: var(--jade);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.gate-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.65rem;
}

.gate-button {
  border-radius: var(--radius-sm);
  background: var(--jade);
  padding-inline: 1.35rem;
  color: var(--paper);
  font-weight: 800;
}

.gate-button:disabled {
  opacity: 0.55;
}

.gate-error {
  margin: 0.3rem 0 0;
  color: var(--cinnabar);
  font-size: 0.82rem;
}

@media (max-width: 480px) {
  .gate-row {
    grid-template-columns: 1fr;
  }

  .gate-button {
    min-height: 2.8rem;
  }
}
</style>
