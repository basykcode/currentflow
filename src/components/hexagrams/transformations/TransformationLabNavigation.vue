<script setup lang="ts">
import type { TransformationLabSectionId } from '@/domain/yijing/transformations'

const props = defineProps<{
  activeSection: TransformationLabSectionId
}>()

const emit = defineEmits<{
  select: [section: TransformationLabSectionId]
}>()

const sections: readonly { id: TransformationLabSectionId; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'change-lab', label: 'Change Lab' },
  { id: 'interior', label: 'Interior' },
  { id: 'classical-systems', label: 'Classical Systems' },
  { id: 'time-maps', label: 'Time & Maps' },
  { id: 'structure', label: 'Structure' },
]

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  let nextIndex = index
  if (event.key === 'ArrowLeft') nextIndex = (index - 1 + sections.length) % sections.length
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % sections.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = sections.length - 1
  const next = sections[nextIndex]
  if (!next) return
  emit('select', next.id)
  document.getElementById(`transformation-lab-tab-${next.id}`)?.focus()
}
</script>

<template>
  <nav class="lab-navigation" role="tablist" aria-label="Transformation Lab section">
    <button
      v-for="(section, index) in sections"
      :id="`transformation-lab-tab-${section.id}`"
      :key="section.id"
      type="button"
      role="tab"
      :aria-selected="props.activeSection === section.id"
      :aria-controls="`transformation-lab-panel-${section.id}`"
      :tabindex="props.activeSection === section.id ? 0 : -1"
      :class="{ 'is-active': props.activeSection === section.id }"
      @click="emit('select', section.id)"
      @keydown="handleKeydown($event, index)"
    >
      {{ section.label }}
    </button>
  </nav>
</template>

<style scoped>
.lab-navigation {
  display: flex;
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  gap: 0.4rem;
  padding: 0.25rem;
  scrollbar-width: thin;
}

button {
  flex: 0 0 auto;
  min-height: 2.65rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  padding: 0.5rem 0.8rem;
  color: var(--ink-soft);
  font-size: 0.68rem;
}

button:hover,
button.is-active {
  border-color: var(--jade);
  background: var(--jade-wash);
  color: var(--ink);
}

button:focus-visible {
  outline: 2px solid var(--jade);
  outline-offset: 2px;
}
</style>
