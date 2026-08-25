<script setup lang="ts">
withDefaults(
  defineProps<{
    characters: string
    pinyin: string
    english: string
    density?: 'compact' | 'regular'
  }>(),
  { density: 'regular' },
)
</script>

<template>
  <span class="chinese-term-inline" :class="`chinese-term-inline--${density}`">
    <span lang="zh-Hant">{{ characters }}</span>
    <span>{{ pinyin }}</span>
    <span aria-hidden="true">·</span>
    <span>{{ english }}</span>
  </span>
</template>

<style scoped>
.chinese-term-inline {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: inherit;
  column-gap: 0.3em;
}

.chinese-term-inline--compact {
  column-gap: 0.22em;
}
</style>
