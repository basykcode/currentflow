<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import type { ThemePreference } from '@/domain/settings/types'
import { usePreferencesStore } from '@/stores/preferences'

const preferences = usePreferencesStore()
const { theme, timezone, locationLabel } = storeToRefs(preferences)
const cleared = ref(false)

const themes: readonly { value: ThemePreference; label: string; detail: string }[] = [
  { value: 'dark', label: 'Dark', detail: 'Deep water' },
  { value: 'light', label: 'Light', detail: 'Morning mist' },
  { value: 'system', label: 'System', detail: 'Follow this device' },
]

const clearLocalData = () => {
  const confirmed = window.confirm(
    'Clear Current’s local alpha preferences on this device? This cannot be undone.',
  )
  if (!confirmed) return
  preferences.reset()
  cleared.value = true
}
</script>

<template>
  <div class="page-shell settings-page">
    <header class="page-intro">
      <p class="eyebrow">Settings · This device</p>
      <h1 class="page-title">A small set of honest controls.</h1>
      <p class="page-lede">
        Preferences stay in this browser. No account, geolocation request, or remote synchronization
        is active.
      </p>
    </header>

    <div class="settings-stack">
      <section class="settings-section panel" aria-labelledby="appearance-heading">
        <div class="section-copy">
          <p class="eyebrow">Appearance</p>
          <h2 id="appearance-heading">Theme</h2>
          <p>Choose a surface or follow your operating-system preference.</p>
        </div>
        <fieldset class="theme-options">
          <legend class="visually-hidden">Theme preference</legend>
          <label
            v-for="item in themes"
            :key="item.value"
            :class="{ selected: theme === item.value }"
          >
            <input v-model="theme" type="radio" name="theme" :value="item.value" />
            <span class="swatch" :data-theme-preview="item.value" aria-hidden="true"></span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.detail }}</small>
          </label>
        </fieldset>
      </section>

      <section class="settings-section panel" aria-labelledby="context-heading">
        <div class="section-copy">
          <p class="eyebrow">Local context</p>
          <h2 id="context-heading">Timezone & location</h2>
          <p>
            Detected timezone: <strong>{{ preferences.detectedTimezone }}</strong
            >. Location is never inferred or requested.
          </p>
        </div>
        <div class="context-fields">
          <label>
            <span>Timezone preference</span>
            <input
              v-model.trim="timezone"
              class="control"
              type="text"
              autocomplete="off"
              :placeholder="preferences.detectedTimezone"
            />
            <small>
              Used for live GanZhi, hexagram, and organ-period calculations. Enter an IANA name such
              as America/New_York.
            </small>
          </label>
          <label>
            <span>Location label</span>
            <input
              v-model.trim="locationLabel"
              class="control"
              type="text"
              autocomplete="off"
              maxlength="80"
              placeholder="Optional label, stored locally"
            />
            <small>No coordinates or geolocation permission are requested.</small>
          </label>
        </div>
      </section>

      <section class="settings-section panel" aria-labelledby="data-heading">
        <div class="section-copy">
          <p class="eyebrow">Local data</p>
          <h2 id="data-heading">Reset this alpha</h2>
          <p>Remove the theme, timezone, and location label stored by Current on this device.</p>
        </div>
        <div class="reset-action">
          <button class="danger-button" type="button" @click="clearLocalData">
            Clear local alpha data
          </button>
          <p v-if="cleared" role="status">Local alpha preferences cleared.</p>
        </div>
      </section>

      <section class="about-row" aria-labelledby="about-heading">
        <div>
          <p class="eyebrow">Application</p>
          <h2 id="about-heading">Current ~ Flow</h2>
        </div>
        <dl>
          <div>
            <dt>Version</dt>
            <dd>0.1.0 alpha</dd>
          </div>
          <div>
            <dt>Data provider</dt>
            <dd>lunar-javascript · deterministic local calculation</dd>
          </div>
          <div>
            <dt>Canonical URL</dt>
            <dd>Pending · current-flow.net is a placeholder</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 1080px;
}

.settings-stack {
  display: grid;
  gap: 1rem;
}

.settings-section {
  display: grid;
  grid-template-columns: minmax(14rem, 0.75fr) minmax(0, 1.25fr);
  gap: clamp(2rem, 6vw, 6rem);
  padding: clamp(1.3rem, 3.5vw, 2.5rem);
}

.section-copy h2,
.about-row h2 {
  margin-bottom: 0.7rem;
  font-family: var(--font-serif);
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 500;
}

.section-copy > p:last-child {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
  border: 0;
  padding: 0;
}

.theme-options label {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  cursor: pointer;
}

.theme-options label.selected {
  border-color: var(--jade);
  box-shadow: inset 0 0 0 1px var(--jade);
}

.theme-options input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.swatch {
  display: block;
  width: 100%;
  height: 3.5rem;
  margin-bottom: 0.7rem;
  border: 1px solid var(--line);
  border-radius: 0.4rem;
  background: #e9f4f7;
}

.swatch[data-theme-preview='dark'] {
  background: #061522;
}

.swatch[data-theme-preview='system'] {
  background: linear-gradient(90deg, #e9f4f7 50%, #061522 50%);
}

.theme-options strong {
  font-size: 0.82rem;
}

.theme-options small {
  color: var(--ink-faint);
  font-size: 0.65rem;
}

.context-fields {
  display: grid;
  gap: 1rem;
}

.context-fields label > span {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--ink-soft);
  font-size: 0.74rem;
  font-weight: 600;
}

.context-fields input {
  width: 100%;
}

.context-fields small {
  display: block;
  margin-top: 0.4rem;
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.reset-action {
  align-self: center;
}

.danger-button {
  border: 1px solid color-mix(in srgb, var(--cinnabar) 50%, var(--line));
  border-radius: var(--radius-sm);
  background: var(--cinnabar-wash);
  padding: 0.75rem 1rem;
  color: var(--cinnabar);
}

.reset-action p {
  margin: 0.55rem 0 0;
  color: var(--jade);
  font-size: 0.72rem;
}

.about-row {
  display: grid;
  grid-template-columns: minmax(14rem, 0.75fr) minmax(0, 1.25fr);
  gap: clamp(2rem, 6vw, 6rem);
  margin-top: 2rem;
  border-top: 1px solid var(--line);
  padding: 2rem 0;
}

.about-row dl {
  margin: 0;
}

.about-row dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--line);
  padding-block: 0.7rem;
  font-size: 0.74rem;
}

.about-row dt {
  color: var(--ink-faint);
}

.about-row dd {
  margin: 0;
  text-align: right;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 760px) {
  .settings-section,
  .about-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .theme-options {
    grid-template-columns: 1fr;
  }

  .theme-options label {
    display: grid;
    grid-template-columns: 3.5rem 1fr;
    align-items: center;
    column-gap: 0.75rem;
  }

  .swatch {
    grid-row: 1 / 3;
    height: 2.5rem;
    margin: 0;
  }
}
</style>
