<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import BrandMark from '@/components/common/BrandMark.vue'

import AuthScaffold from './AuthScaffold.vue'
import OtherToolsMenu from './OtherToolsMenu.vue'

const route = useRoute()
const menuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink class="wordmark" to="/" aria-label="Current Flow home">
        <BrandMark />
        <span>Current <i>~</i> Flow</span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <div class="nav-group">
          <RouterLink to="/">Astrology</RouterLink>
          <RouterLink to="/alchemy">Alchemy</RouterLink>
          <RouterLink to="/intelligence">Intelligence</RouterLink>
        </div>
        <div class="nav-group nav-group-right">
          <OtherToolsMenu mode="desktop" />
          <RouterLink to="/settings">Settings</RouterLink>
          <AuthScaffold />
        </div>
      </nav>

      <button
        class="menu-trigger"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
        @click="menuOpen = !menuOpen"
      >
        <span></span><span></span>
      </button>
    </div>

    <nav v-if="menuOpen" id="mobile-menu" class="mobile-nav" aria-label="Mobile navigation">
      <RouterLink to="/">Astrology</RouterLink>
      <RouterLink to="/alchemy">Alchemy</RouterLink>
      <RouterLink to="/intelligence">Intelligence</RouterLink>
      <OtherToolsMenu mode="mobile" />
      <RouterLink to="/settings">Settings</RouterLink>
      <div class="mobile-auth"><AuthScaffold /></div>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
  background: color-mix(in srgb, var(--paper) 93%, transparent);
  padding-top: env(safe-area-inset-top);
  backdrop-filter: blur(16px);
}

.header-inner {
  display: flex;
  align-items: center;
  width: min(calc(100% - 2rem), 1380px);
  height: var(--app-header-content-height);
  margin-inline: auto;
}

.wordmark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.7rem;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 1.08rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.wordmark i {
  color: var(--cinnabar);
  font-family: var(--font-sans);
  font-style: normal;
  font-weight: 400;
}

.desktop-nav {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  margin-left: clamp(1.5rem, 4vw, 4.5rem);
}

.nav-group {
  display: flex;
  align-items: center;
  gap: clamp(0.4rem, 1vw, 1.25rem);
}

.nav-group a {
  position: relative;
  border-radius: 0.35rem;
  padding: 0.45rem 0.6rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
  text-decoration: none;
}

.nav-group a::after {
  position: absolute;
  right: 0.65rem;
  bottom: 0.08rem;
  left: 0.65rem;
  height: 1px;
  background: var(--cinnabar);
  content: '';
  opacity: 0;
  transform: scaleX(0);
  transition: 160ms ease;
}

.nav-group a:hover,
.nav-group a.router-link-active {
  color: var(--ink);
}

.nav-group a.router-link-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.menu-trigger,
.mobile-nav {
  display: none;
}

@media (max-width: 900px) {
  .header-inner {
    width: min(calc(100% - 1.25rem), 1380px);
  }

  .desktop-nav {
    display: none;
  }

  .menu-trigger {
    display: grid;
    gap: 0.35rem;
    width: 2.8rem;
    height: 2.8rem;
    margin-left: auto;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: transparent;
    place-content: center;
  }

  .menu-trigger span {
    display: block;
    width: 1rem;
    height: 1px;
    background: var(--ink);
  }

  .mobile-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
    border-top: 1px solid var(--line);
    background: var(--paper);
    padding: 0.75rem;
  }

  .mobile-nav > a {
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.75rem;
    color: var(--ink-soft);
    text-decoration: none;
  }

  .mobile-nav > a.router-link-active {
    border-color: var(--line);
    background: var(--jade-wash);
    color: var(--ink);
  }

  .mobile-auth {
    display: flex;
    align-items: center;
    padding-inline: 0.65rem;
  }
}
</style>
