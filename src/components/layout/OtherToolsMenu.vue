<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  mode: 'desktop' | 'mobile'
}>()

const route = useRoute()
const root = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const menuView = ref<'root' | 'special-messages'>('root')
const menuId = computed(() => `other-tools-menu-${props.mode}`)
const isSpecialMessageRoute = computed(() => route.path.startsWith('/special-messages/'))
const isOtherToolsRoute = computed(
  () => isSpecialMessageRoute.value || route.path === '/tools/hexagrams',
)

function closeMenu() {
  menuOpen.value = false
  menuView.value = 'root'
}

function toggleMenu() {
  if (menuOpen.value) {
    closeMenu()
    return
  }

  menuOpen.value = true
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (root.value && !event.composedPath().includes(root.value)) {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<template>
  <div
    ref="root"
    class="other-tools-menu"
    :class="`other-tools-menu-${mode}`"
    @keydown.esc.stop.prevent="closeMenu"
  >
    <button
      class="tools-menu-trigger"
      :class="{ 'is-active': isOtherToolsRoute }"
      type="button"
      aria-haspopup="true"
      :aria-controls="menuId"
      :aria-expanded="menuOpen"
      @click.stop="toggleMenu"
    >
      <span>Other Tools</span>
      <span class="trigger-caret" aria-hidden="true">⌄</span>
    </button>

    <div
      v-if="menuOpen"
      :id="menuId"
      class="tools-popover"
      :class="`tools-popover-${mode}`"
      aria-label="Other tools"
    >
      <template v-if="menuView === 'root'">
        <p class="menu-kicker">Other Tools</p>
        <RouterLink class="menu-item hexagram-link" to="/tools/hexagrams">
          <span>
            <strong>Hexagram Library</strong>
            <small>Browse and inspect all 64 figures</small>
          </span>
          <span aria-hidden="true">›</span>
        </RouterLink>
        <button class="menu-item" type="button" @click="menuView = 'special-messages'">
          <span>Special Messages</span>
          <span aria-hidden="true">›</span>
        </button>
      </template>

      <template v-else>
        <button class="menu-back" type="button" @click="menuView = 'root'">
          <span aria-hidden="true">←</span>
          <span>Other Tools</span>
        </button>
        <p class="menu-kicker">Special Messages</p>
        <RouterLink class="menu-item message-link" to="/special-messages/vh">
          <span>
            <strong>VH</strong>
            <small>A private message for Vada</small>
          </span>
          <span aria-hidden="true">›</span>
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.other-tools-menu {
  position: relative;
}

.tools-menu-trigger {
  display: inline-flex;
  position: relative;
  align-items: center;
  gap: 0.38rem;
  border-radius: 0.35rem;
  background: transparent;
  padding: 0.45rem 0.6rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.tools-menu-trigger::after {
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

.tools-menu-trigger:hover,
.tools-menu-trigger[aria-expanded='true'],
.tools-menu-trigger.is-active {
  color: var(--ink);
}

.tools-menu-trigger.is-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.trigger-caret {
  font-size: 0.95rem;
  line-height: 1;
  transform: translateY(-0.08rem);
}

.tools-popover {
  display: grid;
  gap: 0.35rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--paper-raised) 97%, transparent);
  padding: 0.55rem;
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.tools-popover-desktop {
  position: absolute;
  top: calc(100% + 0.65rem);
  right: 0;
  z-index: 70;
  width: 18rem;
}

.menu-kicker {
  margin: 0;
  padding: 0.35rem 0.55rem 0.15rem;
  color: var(--ink-faint);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menu-item,
.menu-back {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.75rem;
  color: var(--ink);
  text-align: left;
  text-decoration: none;
}

.menu-item:hover,
.menu-item:focus-visible {
  border-color: var(--line);
  background: var(--jade-wash);
}

.menu-back {
  justify-content: flex-start;
  width: fit-content;
  padding-block: 0.45rem;
  color: var(--ink-soft);
  font-size: 0.72rem;
}

.message-link strong,
.message-link small,
.hexagram-link strong,
.hexagram-link small {
  display: block;
}

.message-link strong,
.hexagram-link strong {
  margin-bottom: 0.15rem;
  font-family: var(--font-serif);
  font-size: 1rem;
}

.message-link small,
.hexagram-link small {
  color: var(--ink-soft);
  font-size: 0.68rem;
}

.other-tools-menu-mobile {
  grid-column: 1 / -1;
}

.other-tools-menu-mobile .tools-menu-trigger {
  width: 100%;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: 1rem;
}

.other-tools-menu-mobile .tools-menu-trigger[aria-expanded='true'],
.other-tools-menu-mobile .tools-menu-trigger.is-active {
  border-color: var(--line);
  background: var(--jade-wash);
}

.other-tools-menu-mobile .tools-menu-trigger::after {
  display: none;
}

.tools-popover-mobile {
  margin-top: 0.35rem;
}
</style>
