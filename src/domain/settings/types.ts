export type ThemePreference = 'light' | 'dark' | 'system'

export type LocalPreferences = {
  theme: ThemePreference
  timezone: string
  locationLabel: string
}
