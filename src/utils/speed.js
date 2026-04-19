import { calcDistance } from './storage'

export function getSpeedColor(speed, companyLimit) {
  if (speed > companyLimit) return '#ef4444'
  if (speed > companyLimit * 0.83) return '#f59e0b'
  if (speed > 30) return '#3b82f6'
  return '#22c55e'
}

export function formatSpeed(kmh) {
  if (!isFinite(kmh) || kmh < 0) return '0'
  return kmh.toFixed(0)
}

export function formatTimeHM(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export function formatTimeHMS(tsOrIso) {
  const d = new Date(tsOrIso)
  return d.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function buildTripId(startMs) {
  const d = new Date(startMs)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `trip_${y}${m}${day}_${hh}${mm}${ss}`
}

export function thinTrack(track, maxPoints = 300, minMeters = 5) {
  if (!track || track.length === 0) return []
  const filtered = []
  for (const p of track) {
    if (filtered.length === 0) {
      filtered.push(p)
      continue
    }
    const last = filtered[filtered.length - 1]
    const d = calcDistance(last.lat, last.lon, p.lat, p.lon)
    if (d >= minMeters) filtered.push(p)
  }
  if (filtered.length <= maxPoints) return filtered
  const step = filtered.length / maxPoints
  const out = []
  for (let i = 0; i < maxPoints; i++) {
    out.push(filtered[Math.floor(i * step)])
  }
  const last = filtered[filtered.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

export function computeSafetyScore({
  violations = [],
  totalTime = 0,
  overLimitSeconds = 0,
}) {
  let score = 100
  const speedViolations = violations.filter((v) => v.type === 'speed').length
  const longStops = violations.filter((v) => v.type === 'longstop').length
  score -= speedViolations * 5
  score -= longStops * 3
  if (totalTime > 0) {
    const overRatio = overLimitSeconds / totalTime
    score -= Math.round(overRatio * 30)
  }
  return Math.max(0, Math.min(100, score))
}

export function scoreColor(score) {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}
