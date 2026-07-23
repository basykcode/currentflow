import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { LocalPreferences, ThemePreference } from '@/domain/settings/types'

const STORAGE_KEY = 'current:preferences'

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Browser local time'

const defaults: LocalPreferences = {
  theme: 'system',
  timezone: detectedTimezone,
  locationLabel: '',
}

const readPreferences = (): LocalPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...defaults }
    const parsed = JSON.parse(stored) as Partial<LocalPreferences>
    return {
      theme: parsed.theme ?? defaults.theme,
      timezone: parsed.timezone ?? defaults.timezone,
      locationLabel: parsed.locationLabel ?? defaults.locationLabel,
    }
  } catch {
    return { ...defaults }
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const initial = readPreferences()
  const theme = ref<ThemePreference>(initial.theme)
  const timezone = ref(initial.timezone)
  const locationLabel = ref(initial.locationLabel)
  const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (theme.value === 'system') return systemDark.value ? 'dark' : 'light'
    return theme.value
  })

  const persist = () => {
    const value: LocalPreferences = {
      theme: theme.value,
      timezone: timezone.value,
      locationLabel: locationLabel.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }

  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', resolvedTheme.value)
  }

  const reset = () => {
    theme.value = defaults.theme
    timezone.value = defaults.timezone
    locationLabel.value = defaults.locationLabel
    localStorage.removeItem(STORAGE_KEY)
  }

  mediaQuery.addEventListener('change', (event) => {
    systemDark.value = event.matches
  })

  watch([theme, timezone, locationLabel], persist, { deep: true })
  watch(resolvedTheme, applyTheme, { immediate: true })

  return {
    detectedTimezone,
    theme,
    timezone,
    locationLabel,
    resolvedTheme,
    reset,
  }
})
