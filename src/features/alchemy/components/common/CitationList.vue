<script setup lang="ts">
import type { Citation } from '../../domain/types'
import ReviewStatusBadge from './ReviewStatusBadge.vue'

defineProps<{
  citations: readonly Citation[]
}>()

const safeExternalUrl = (value?: string): string | null => {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null
  } catch {
    return null
  }
}
</script>

<template>
  <ul v-if="citations.length" class="citation-list">
    <li v-for="citation in citations" :key="citation.id">
      <div class="citation-heading">
        <strong>{{ citation.sourceTitle }}</strong>
        <ReviewStatusBadge :status="citation.reviewStatus" />
      </div>
      <p v-if="citation.locator || citation.language" class="citation-meta">
        <span v-if="citation.locator">{{ citation.locator }}</span>
        <span v-if="citation.language">{{ citation.language }}</span>
      </p>
      <blockquote v-if="citation.quotation">{{ citation.quotation }}</blockquote>
      <a
        v-if="safeExternalUrl(citation.url)"
        :href="safeExternalUrl(citation.url) ?? undefined"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open supplied source
        <span class="sr-only">(opens in a new tab)</span>
      </a>
    </li>
  </ul>
  <p v-else class="empty-inline">No citation supplied.</p>
</template>
