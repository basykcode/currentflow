<script setup lang="ts">
const prompts = [
  'Trace a theme across selected texts',
  'Compare two readings without collapsing them',
  'What context is still missing?',
] as const
</script>

<template>
  <div class="page-shell intelligence-page">
    <header class="page-intro">
      <p class="eyebrow">Intelligence · Context layer</p>
      <h1 class="page-title">A quieter kind of conversation.</h1>
      <p class="page-lede">
        A future synthesis layer for curated Daoist texts, user-controlled documents, birth context,
        and verified signals from Astrology and Alchemy.
      </p>
    </header>

    <section class="chat-shell panel" aria-labelledby="chat-heading">
      <header class="chat-header">
        <div>
          <span class="presence" aria-hidden="true"></span>
          <div>
            <h2 id="chat-heading">Current Intelligence</h2>
            <p>Curated sources · personal context · visible provenance</p>
          </div>
        </div>
        <span class="status-label">Model not connected</span>
      </header>

      <div class="conversation-empty">
        <div class="current-mark" aria-hidden="true"><i></i><i></i><i></i></div>
        <p class="eyebrow">No simulated answer</p>
        <h3>The room is ready; the intelligence is not.</h3>
        <p>
          When connected, this surface will distinguish source text, personal material,
          deterministic context, and synthesis. Until then, silence is more accurate.
        </p>
      </div>

      <div class="prompt-area">
        <p>Example lines of inquiry</p>
        <div class="prompt-chips">
          <button v-for="prompt in prompts" :key="prompt" type="button" disabled>
            {{ prompt }}
          </button>
        </div>
      </div>

      <div class="composer">
        <label for="intelligence-message">Inquiry</label>
        <div>
          <textarea
            id="intelligence-message"
            rows="2"
            placeholder="The model is not connected. No message will be sent."
            disabled
          ></textarea>
          <button type="button" disabled>Send later</button>
        </div>
        <p>No network request, document access, or spiritual authority is active in this alpha.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.intelligence-page {
  max-width: 1050px;
}

.chat-shell {
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--line);
  padding: 1rem 1.25rem;
}

.chat-header > div {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.presence {
  display: block;
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: var(--paper-soft);
}

.chat-header h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 500;
}

.chat-header p {
  margin: 0.1rem 0 0;
  color: var(--ink-faint);
  font-size: 0.65rem;
}

.conversation-empty {
  display: grid;
  max-width: 38rem;
  min-height: 28rem;
  margin-inline: auto;
  padding: clamp(3rem, 8vw, 6rem) 1.5rem;
  text-align: center;
  place-items: center;
}

.current-mark {
  display: grid;
  gap: 0.55rem;
  width: 6rem;
  margin-bottom: 1.5rem;
}

.current-mark i {
  display: block;
  height: 2px;
  border-radius: 999px;
  background: var(--jade);
}

.current-mark i:nth-child(2) {
  width: 70%;
  margin-left: auto;
  background: var(--line-strong);
}

.current-mark i:nth-child(3) {
  width: 25%;
  background: var(--cinnabar);
}

.conversation-empty h3 {
  margin-bottom: 1rem;
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 400;
  letter-spacing: -0.03em;
}

.conversation-empty > p:last-child {
  margin: 0;
  color: var(--ink-soft);
}

.prompt-area {
  border-top: 1px solid var(--line);
  padding: 1rem 1.25rem;
}

.prompt-area > p {
  margin-bottom: 0.6rem;
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.prompt-chips button {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper-soft);
  padding: 0.45rem 0.7rem;
  color: var(--ink-faint);
  font-size: 0.7rem;
}

.composer {
  border-top: 1px solid var(--line);
  background: var(--paper-soft);
  padding: 1rem 1.25rem;
}

.composer label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--ink-soft);
  font-size: 0.7rem;
}

.composer > div {
  display: flex;
  gap: 0.5rem;
}

.composer textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper-raised);
  padding: 0.75rem;
}

.composer button {
  border-radius: var(--radius-sm);
  background: var(--jade-wash);
  padding: 0.7rem 1rem;
  color: var(--ink-faint);
}

.composer > p {
  margin: 0.5rem 0 0;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

@media (max-width: 560px) {
  .chat-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .conversation-empty {
    min-height: 24rem;
    padding-inline: 1rem;
  }

  .composer > div {
    flex-direction: column;
  }
}
</style>
