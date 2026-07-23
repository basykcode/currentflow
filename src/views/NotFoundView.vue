<template>
  <div class="page-shell not-found">
    <p class="eyebrow">No signal</p>
    <h1>This path is not part of the instrument.</h1>
    <p>No route or reading has been inferred.</p>
    <RouterLink class="quiet-button" to="/">Return to The Current Flow</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: calc(100vh - var(--header-height));
  text-align: center;
  place-content: center;
}

h1 {
  max-width: 12ch;
  margin-inline: auto;
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 400;
  letter-spacing: -0.04em;
}

.not-found > p:not(.eyebrow) {
  color: var(--ink-soft);
}

.quiet-button {
  width: fit-content;
  margin: 1rem auto 0;
  text-decoration: none;
}
</style>
