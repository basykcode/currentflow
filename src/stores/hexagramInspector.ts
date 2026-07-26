import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getHexagram } from '@/domain/astrology/hexagrams'
import type { Hexagram } from '@/domain/astrology/types'

export const useHexagramInspectorStore = defineStore('hexagram-inspector', () => {
  const selectedNumber = ref<number | null>(null)
  const hexagram = computed(() =>
    selectedNumber.value === null ? null : getHexagram(selectedNumber.value),
  )
  const isOpen = computed(() => hexagram.value !== null)

  const open = (selection: number | Hexagram) => {
    const number = typeof selection === 'number' ? selection : selection.number
    if (number === null) return
    selectedNumber.value = getHexagram(number).number
  }

  const close = () => {
    selectedNumber.value = null
  }

  return {
    selectedNumber,
    hexagram,
    isOpen,
    open,
    close,
  }
})
