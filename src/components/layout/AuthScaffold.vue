<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const open = ref(false)

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}

document.addEventListener('keydown', closeOnEscape)
onBeforeUnmount(() => document.removeEventListener('keydown', closeOnEscape))
</script>

<template>
  <div class="auth-scaffold">
    <button
      class="auth-trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      aria-controls="auth-panel"
      @click="open = !open"
    >
      <span class="avatar" aria-hidden="true"></span>
      <span>Sign in</span>
    </button>

    <div v-if="open" id="auth-panel" class="auth-panel panel" role="dialog" aria-label="Sign in">
      <div class="auth-heading">
        <p class="eyebrow">Identity</p>
        <button
          class="close-button"
          type="button"
          aria-label="Close sign-in panel"
          @click="open = false"
        >
          ×
        </button>
      </div>
      <h2>Keep your context with you.</h2>
      <p>
        Identity and synchronization will arrive after the personal-data boundaries are defined.
      </p>
      <button type="button" disabled>Continue with Google <span>Coming later</span></button>
      <button type="button" disabled>Continue with email <span>Coming later</span></button>
    </div>
  </div>
</template>

<style scoped>
.auth-scaffold {
  position: relative;
}

.auth-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  padding: 0.4rem 0.72rem 0.4rem 0.42rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.auth-trigger:hover {
  border-color: var(--jade);
  color: var(--ink);
}

.avatar {
  width: 1.7rem;
  height: 1.7rem;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--jade-wash);
}

.avatar::after {
  display: block;
  width: 0.55rem;
  height: 0.55rem;
  margin: 0.34rem auto 0;
  border: 1px solid var(--jade);
  border-radius: 50%;
  content: '';
}

.auth-panel {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  z-index: 20;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.4rem;
}

.auth-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.auth-panel h2 {
  margin-bottom: 0.65rem;
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 500;
}

.auth-panel p:not(.eyebrow) {
  color: var(--ink-soft);
  font-size: 0.88rem;
}

.auth-panel > button:not(.close-button) {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.6rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper-soft);
  padding: 0.75rem;
  color: var(--ink-faint);
  text-align: left;
}

.auth-panel span {
  font-size: 0.72rem;
}

.close-button {
  background: transparent;
  color: var(--ink-soft);
  font-size: 1.5rem;
  line-height: 1;
}

@media (max-width: 840px) {
  .auth-panel {
    position: fixed;
    top: 4.5rem;
    right: 0.75rem;
  }
}
</style>
