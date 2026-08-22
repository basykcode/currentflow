<script setup lang="ts">
import { ref } from 'vue'

import { unlockVhMessage, type SpecialMessageContent } from '@/features/special-messages/security'

const emit = defineEmits<{
  unlocked: [message: SpecialMessageContent]
}>()

const password = ref('')
const errorMessage = ref('')
const checking = ref(false)

async function submitPassword() {
  if (password.value.length === 0) {
    errorMessage.value = 'Enter the password to continue.'
    return
  }

  checking.value = true
  errorMessage.value = ''

  const message = await unlockVhMessage(password.value)
  password.value = ''
  checking.value = false

  if (!message) {
    errorMessage.value = 'That password did not match. Please try again.'
    return
  }

  emit('unlocked', message)
}
</script>

<template>
  <section class="message-gate" aria-labelledby="message-gate-title">
    <div class="gate-card">
      <p class="gate-kicker">For VH</p>
      <h2 id="message-gate-title">This one is just for you.</h2>
      <p>Enter the password shared with you to open the message.</p>

      <form @submit.prevent="submitPassword">
        <label for="special-message-password">Password</label>
        <input
          id="special-message-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="errorMessage.length > 0"
          :aria-describedby="errorMessage ? 'special-message-error' : undefined"
          autofocus
        />
        <p v-if="errorMessage" id="special-message-error" class="gate-error" role="alert">
          {{ errorMessage }}
        </p>
        <button type="submit" :disabled="checking">
          {{ checking ? 'Opening…' : 'Open message' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.message-gate {
  display: grid;
  min-height: calc(100svh - 8.25rem);
  padding: clamp(2rem, 7vw, 7rem) 1rem;
  place-items: center;
}

.gate-card {
  width: min(100%, 29rem);
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 1.25rem;
  background: rgb(2 7 16 / 76%);
  padding: clamp(1.5rem, 5vw, 2.5rem);
  color: #fff;
  box-shadow: 0 28px 80px rgb(0 0 0 / 48%);
  backdrop-filter: blur(18px);
}

.gate-kicker {
  margin: 0 0 0.65rem;
  color: rgb(255 255 255 / 68%);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

h2 {
  margin-bottom: 0.8rem;
  font-family: var(--font-serif);
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 500;
  letter-spacing: -0.04em;
}

.gate-card > p:not(.gate-kicker) {
  color: rgb(255 255 255 / 76%);
}

form {
  display: grid;
  gap: 0.65rem;
  margin-top: 1.6rem;
}

label {
  font-size: 0.76rem;
  font-weight: 700;
}

input {
  min-height: 3.25rem;
  border: 1px solid rgb(255 255 255 / 34%);
  border-radius: 0.65rem;
  background: rgb(255 255 255 / 9%);
  padding: 0.75rem 0.9rem;
  color: #fff;
}

input:focus {
  border-color: #fff;
}

button {
  min-height: 3.25rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: #fff;
  padding: 0.75rem 1rem;
  color: #07111d;
  font-weight: 800;
}

button:hover:not(:disabled) {
  background: #dceaff;
}

button:disabled {
  opacity: 0.62;
}

.gate-error {
  margin: 0;
  color: #cbdcff;
  font-size: 0.76rem;
}
</style>
