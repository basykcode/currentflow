<script setup lang="ts">
import type { SpecialMessageContent } from '@/features/special-messages/security'

defineProps<{
  message: SpecialMessageContent
}>()
</script>

<template>
  <article class="special-message-body" aria-labelledby="message-body-title">
    <div class="message-paper">
      <p class="message-status">Draft placeholder · Personal message not added yet</p>
      <h2 id="message-body-title">For Vada</h2>
      <div class="message-copy">
        <p v-for="(paragraph, index) in message.paragraphs" :key="index">
          {{ paragraph }}
        </p>
      </div>
      <p class="message-signoff">More soon.</p>
    </div>
  </article>
</template>

<style scoped>
.special-message-body {
  width: min(calc(100% - 2rem), 58rem);
  margin-inline: auto;
  padding: clamp(4rem, 10vw, 9rem) 0 clamp(7rem, 16vw, 13rem);
  color: #fff;
}

.message-paper {
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 1.4rem;
  background: rgb(2 7 16 / 62%);
  padding: clamp(1.5rem, 5vw, 4.25rem);
  box-shadow: 0 28px 90px rgb(0 0 0 / 45%);
  backdrop-filter: blur(12px);
}

.message-status {
  width: fit-content;
  margin-bottom: 2rem;
  border: 1px solid rgb(255 255 255 / 26%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  padding: 0.42rem 0.7rem;
  color: rgb(255 255 255 / 74%);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h2 {
  margin-bottom: clamp(2rem, 6vw, 4rem);
  font-family: var(--font-serif);
  font-size: clamp(2.8rem, 10vw, 6.5rem);
  font-weight: 500;
  letter-spacing: -0.05em;
}

.message-copy {
  font-family: var(--font-serif);
  font-size: var(--message-font-size);
  line-height: 1.72;
  text-shadow: 0 2px 18px rgb(0 0 0 / 85%);
}

.message-copy p {
  margin-bottom: 1.7em;
}

.message-signoff {
  margin: 3.5rem 0 0;
  color: rgb(255 255 255 / 72%);
  font-family: var(--font-serif);
  font-size: calc(var(--message-font-size) * 0.82);
  font-style: italic;
}

@media (max-width: 540px) {
  .special-message-body {
    width: min(calc(100% - 1rem), 58rem);
    padding-top: 1rem;
  }

  .message-paper {
    border-radius: 0.85rem;
  }
}
</style>
