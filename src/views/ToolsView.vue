<script setup lang="ts">
const tools = [
  {
    index: '01',
    name: 'Personal BaZi',
    detail: 'A user-controlled personal structure layer, kept distinct from global conditions.',
  },
  {
    index: '02',
    name: 'Temporal Calendar',
    detail: 'Verified calendrical layers with source-aware navigation across time.',
  },
  {
    index: '03',
    name: 'Qi Men',
    detail: 'A future timing interface only after a documented deterministic engine exists.',
  },
  {
    index: '04',
    name: 'Text Library',
    detail: 'Curated sources and personal documents with visible provenance and permissions.',
  },
  {
    index: '05',
    name: 'Formula Comparison',
    detail: 'Side-by-side research records without an active recommendation engine.',
  },
  {
    index: '06',
    name: 'Saved Readings',
    detail: 'Private snapshots and notes after identity and retention controls are designed.',
  },
] as const
</script>

<template>
  <div class="page-shell">
    <header class="page-intro">
      <p class="eyebrow">Other Tools · Planned surfaces</p>
      <h1 class="page-title">Instruments should earn their place.</h1>
      <p class="page-lede">
        These tools outline the longer arc of Current. They remain unavailable until their data,
        calculation, and privacy boundaries can be stated clearly.
      </p>
    </header>

    <section class="tools-grid" aria-label="Planned tools">
      <article v-for="tool in tools" :key="tool.name" class="tool-card panel">
        <div class="tool-number">{{ tool.index }}</div>
        <div>
          <span>Planned</span>
          <h2>{{ tool.name }}</h2>
          <p>{{ tool.detail }}</p>
        </div>
        <button type="button" disabled>Unavailable in alpha</button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  min-height: 20rem;
  padding: 1.4rem;
}

.tool-number {
  margin-bottom: 3.5rem;
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.78rem;
}

.tool-card span {
  color: var(--jade);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 {
  margin: 0.45rem 0 0.75rem;
  font-family: var(--font-serif);
  font-size: 1.6rem;
  font-weight: 500;
}

.tool-card p {
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.tool-card button {
  width: 100%;
  margin-top: auto;
  border-top: 1px solid var(--line);
  background: transparent;
  padding: 1rem 0 0;
  color: var(--ink-faint);
  font-size: 0.7rem;
  text-align: left;
}

@media (max-width: 900px) {
  .tools-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tool-card {
    min-height: 16rem;
  }
}
</style>
