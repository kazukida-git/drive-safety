const TRIPS_KEY = 'drive-safety-trips'

export function loadTrips() {
  try {
    const data = localStorage.getItem(TRIPS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveTrips(trips) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
}

export function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}時間${m}分`
  return `${m}分${s}秒`
}

export function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
