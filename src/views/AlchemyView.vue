<script setup lang="ts">
const formulaSlots = ['Chief', 'Deputy', 'Assistant', 'Envoy'] as const
</script>

<template>
  <div class="page-shell">
    <header class="page-intro">
      <p class="eyebrow">Alchemy · Research surface</p>
      <h1 class="page-title">Substances, formulas, and the relationships between them.</h1>
      <p class="page-lede">
        A future research and formulation interface connected to a curated knowledge graph of
        Chinese herbs, formulas, relationships, contraindications, source texts, and modern
        research.
      </p>
    </header>

    <div class="boundary" role="note">
      <span class="status-label">No clinical engine</span>
      <p>
        This is an educational and research interface—not diagnosis or medical treatment. No herbal
        recommendation engine is active in this alpha.
      </p>
    </div>

    <div class="alchemy-grid">
      <section class="terminal panel" aria-labelledby="terminal-heading">
        <div class="section-bar">
          <div>
            <p class="eyebrow">01 · Inquiry</p>
            <h2 id="terminal-heading">Materia Medica Terminal</h2>
          </div>
          <span>Data source not connected</span>
        </div>
        <label for="herb-search">Search a curated materia medica</label>
        <div class="search-shell">
          <input
            id="herb-search"
            class="control"
            type="search"
            placeholder="Search unavailable"
            disabled
          />
          <button type="button" disabled>Search</button>
        </div>
        <div class="result-preview" aria-label="Result layout preview">
          <div class="specimen-mark"></div>
          <div>
            <span>Result structure preview</span>
            <h3>Names, source trail, properties, and relationships</h3>
            <p>
              Verified graph records will appear here without blending source fact and synthesis.
            </p>
          </div>
        </div>
      </section>

      <section class="workbench panel" aria-labelledby="workbench-heading">
        <div class="section-bar">
          <div>
            <p class="eyebrow">02 · Composition</p>
            <h2 id="workbench-heading">Formula Workbench</h2>
          </div>
          <span>Engine not connected</span>
        </div>
        <div class="slots" aria-label="Empty formula slots">
          <div v-for="(slot, index) in formulaSlots" :key="slot" class="formula-slot">
            <span>0{{ index + 1 }}</span>
            <p>{{ slot }}</p>
            <small>Empty slot</small>
          </div>
        </div>
        <div class="compatibility">
          <span>Compatibility analysis</span>
          <div class="analysis-lines"><i></i><i></i><i></i></div>
          <p>Unavailable until a verified relationship engine and source graph are connected.</p>
        </div>
      </section>

      <section class="inquiry panel" aria-labelledby="inquiry-heading">
        <div class="section-bar">
          <div>
            <p class="eyebrow">03 · Guided inquiry</p>
            <h2 id="inquiry-heading">Ask across the evidence.</h2>
          </div>
          <span>Model not connected</span>
        </div>
        <div class="inquiry-blank">
          <p>
            A future model may help trace sources and compare relationships; it will not replace
            them.
          </p>
          <textarea
            class="control"
            rows="3"
            placeholder="Guided inquiry unavailable"
            disabled
          ></textarea>
          <button type="button" disabled>Begin inquiry · Coming later</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.boundary {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-block: 1px solid var(--line);
  padding-block: 0.9rem;
}

.boundary p {
  max-width: 72ch;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.alchemy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.terminal,
.workbench,
.inquiry {
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 2rem);
}

.inquiry {
  grid-column: 1 / -1;
}

.section-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.section-bar > span {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.3rem 0.55rem;
  color: var(--cinnabar);
  font-size: 0.63rem;
  white-space: nowrap;
}

h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 500;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.search-shell {
  display: flex;
  gap: 0.5rem;
}

.search-shell input {
  flex: 1;
  min-width: 0;
}

.search-shell button,
.inquiry button {
  border-radius: var(--radius-sm);
  background: var(--paper-soft);
  padding: 0.7rem 1rem;
  color: var(--ink-faint);
}

.result-preview {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  border-top: 1px solid var(--line);
  padding-top: 1.5rem;
}

.specimen-mark {
  flex: 0 0 3.5rem;
  width: 3.5rem;
  height: 4.5rem;
  border: 1px solid var(--line-strong);
  border-radius: 50% 45% 52% 48%;
  background: var(--jade-wash);
}

.result-preview span,
.compatibility > span {
  color: var(--jade);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result-preview h3 {
  margin: 0.4rem 0;
  font-family: var(--font-serif);
  font-size: 1rem;
}

.result-preview p,
.compatibility p,
.inquiry-blank p {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
}

.slots {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.formula-slot {
  min-height: 8rem;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 0.7rem;
}

.formula-slot > span {
  color: var(--cinnabar);
  font-family: var(--font-serif);
  font-size: 0.68rem;
}

.formula-slot p {
  margin: 1.3rem 0 0;
  font-size: 0.78rem;
}

.formula-slot small {
  color: var(--ink-faint);
  font-size: 0.6rem;
}

.compatibility {
  margin-top: 1.5rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}

.analysis-lines {
  display: flex;
  gap: 0.4rem;
  margin: 0.8rem 0;
}

.analysis-lines i {
  display: block;
  width: 25%;
  height: 3px;
  border-radius: 9px;
  background: var(--line);
}

.analysis-lines i:nth-child(2) {
  width: 45%;
  background: var(--jade-wash);
}

.inquiry-blank {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 1.2fr) auto;
  gap: 1rem;
  align-items: end;
}

.inquiry-blank textarea {
  width: 100%;
  resize: none;
}

@media (max-width: 820px) {
  .alchemy-grid {
    grid-template-columns: 1fr;
  }

  .inquiry {
    grid-column: auto;
  }

  .inquiry-blank {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .boundary,
  .section-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .slots {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
