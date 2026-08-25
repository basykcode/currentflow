<script setup lang="ts">
withDefaults(
  defineProps<{
    decorative?: boolean
    label?: string
  }>(),
  { decorative: true, label: 'Present transformation' },
)
</script>

<template>
  <span
    class="current-taiji-mark"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
    :role="decorative ? undefined : 'img'"
    >☯</span
  >
</template>

<style scoped>
.current-taiji-mark {
  display: grid;
  width: 1em;
  height: 1em;
  color: currentcolor;
  font-family: 'Noto Sans Symbols 2', 'Apple Symbols', 'Segoe UI Symbol', sans-serif;
  font-size: 1em;
  line-height: 1;
  place-items: center;
}
</style>
