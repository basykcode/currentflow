<script setup lang="ts">
import type { AlchemyUiError } from '../../domain/types'

defineProps<{
  error: AlchemyUiError
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="resource-error" role="alert">
    <p class="mini-label">{{ error.code }}</p>
    <h3>{{ error.title }}</h3>
    <p>{{ error.detail }}</p>
    <ul v-if="error.fieldErrors?.length">
      <li
        v-for="fieldError in error.fieldErrors"
        :key="`${fieldError.field}:${fieldError.message}`"
      >
        {{ fieldError.field }}: {{ fieldError.message }}
      </li>
    </ul>
    <button v-if="error.retryable" class="quiet-button" type="button" @click="$emit('retry')">
      Retry
    </button>
  </div>
</template>
