const SETTINGS_KEY = 'drivesafety-settings'

export const DEFAULT_SETTINGS = {
  companySpeedLimit: 60,
  highwaySpeedLimit: 100,
  longStopThresholdMin: 30,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
