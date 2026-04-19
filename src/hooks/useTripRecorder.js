import { useCallback, useEffect, useRef, useState } from 'react'
import { calcDistance } from '../utils/storage'
import { buildTripId, computeSafetyScore } from '../utils/speed'
import { saveTrip } from '../db'

const STOP_SPEED_KMH = 3
const MIN_POINT_METERS = 3

export function useTripRecorder(settings) {
  const [recording, setRecording] = useState(false)
  const [currentPos, setCurrentPos] = useState(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [trackLog, setTrackLog] = useState([])
  const [speedLog, setSpeedLog] = useState([])
  const [violations, setViolations] = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(0)
  const [overLimitSeconds, setOverLimitSeconds] = useState(0)

  const watchId = useRef(null)
  const timerRef = useRef(null)
  const lastPointRef = useRef(null)
  const stoppedSinceRef = useRef(null)
  const lastOverLimitRef = useRef(false)
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const reset = useCallback(() => {
    setTrackLog([])
    setSpeedLog([])
    setViolations([])
    setTotalDistance(0)
    setMaxSpeed(0)
    setOverLimitSeconds(0)
    setElapsed(0)
    setStartTime(null)
    lastPointRef.current = null
    stoppedSinceRef.current = null
    lastOverLimitRef.current = false
  }, [])

  const handlePosition = useCallback((pos) => {
    const { latitude, longitude, accuracy, speed } = pos.coords
    const ts = pos.timestamp || Date.now()
    const kmh = Math.max(0, (speed ?? 0) * 3.6)
    const point = { lat: latitude, lon: longitude, speed: kmh, accuracy: accuracy ?? 0, timestamp: ts }

    setCurrentPos([latitude, longitude])
    setCurrentSpeed(kmh)
    setMaxSpeed((prev) => (kmh > prev ? kmh : prev))

    const last = lastPointRef.current
    if (!last) {
      lastPointRef.current = point
      setTrackLog([point])
      setSpeedLog([{ speed: kmh, timestamp: ts }])
      return
    }

    const d = calcDistance(last.lat, last.lon, latitude, longitude)
    if (d >= MIN_POINT_METERS) {
      setTotalDistance((prev) => prev + d)
      setTrackLog((prev) => [...prev, point])
      lastPointRef.current = point
    }
    setSpeedLog((prev) => {
      const next = [...prev, { speed: kmh, timestamp: ts }]
      return next.length > 3600 ? next.slice(-3600) : next
    })

    const limit = settingsRef.current.companySpeedLimit
    if (kmh > limit) {
      if (!lastOverLimitRef.current) {
        setViolations((prev) => [
          ...prev,
          {
            type: 'speed',
            message: `${kmh.toFixed(0)} km/h (制限 ${limit})`,
            time: new Date(ts).toISOString(),
            timestamp: ts,
            lat: latitude,
            lon: longitude,
          },
        ])
        lastOverLimitRef.current = true
      }
    } else {
      lastOverLimitRef.current = false
    }

    if (kmh < STOP_SPEED_KMH) {
      if (!stoppedSinceRef.current) stoppedSinceRef.current = ts
      const stopDur = ts - stoppedSinceRef.current
      const threshold = (settingsRef.current.longStopThresholdMin ?? 30) * 60 * 1000
      if (stopDur >= threshold) {
        setViolations((prev) => {
          const already = prev.some(
            (v) => v.type === 'longstop' && ts - v.timestamp < threshold
          )
          if (already) return prev
          return [
            ...prev,
            {
              type: 'longstop',
              message: `長時間停車 ${Math.round(stopDur / 60000)}分`,
              time: new Date(ts).toISOString(),
              timestamp: ts,
              lat: latitude,
              lon: longitude,
            },
          ]
        })
      }
    } else {
      stoppedSinceRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      alert('このデバイスではGPSが使えません')
      return
    }
    reset()
    setRecording(true)
    setStartTime(Date.now())

    watchId.current = navigator.geolocation.watchPosition(handlePosition, null, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    })
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1000)
      if (settingsRef.current && lastPointRef.current) {
        const limit = settingsRef.current.companySpeedLimit
        if ((lastPointRef.current.speed || 0) > limit) {
          setOverLimitSeconds((s) => s + 1)
        }
      }
    }, 1000)
  }, [handlePosition, reset])

  const stop = useCallback(async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
    setCurrentSpeed(0)

    const startMs = startTime ?? Date.now()
    const endMs = Date.now()
    const totalSec = Math.round((endMs - startMs) / 1000)
    const avgSpeed =
      totalSec > 0 ? (totalDistance / 1000) / (totalSec / 3600) : 0
    const safetyScore = computeSafetyScore({
      violations,
      totalTime: totalSec,
      overLimitSeconds,
    })

    const trip = {
      id: buildTripId(startMs),
      driverId: 'default',
      startTime: new Date(startMs).toISOString(),
      endTime: new Date(endMs).toISOString(),
      totalDistance,
      totalTime: totalSec,
      maxSpeed,
      avgSpeed,
      safetyScore,
      violations,
      speedLog,
      trackLog,
      settings: {
        companySpeedLimit: settingsRef.current.companySpeedLimit,
        highwaySpeedLimit: settingsRef.current.highwaySpeedLimit,
      },
      syncStatus: 'local',
      createdAt: new Date().toISOString(),
    }

    if (trackLog.length >= 2) {
      try {
        await saveTrip(trip)
      } catch (e) {
        console.error('saveTrip failed', e)
      }
    }
    reset()
    return trip
  }, [
    startTime,
    totalDistance,
    maxSpeed,
    violations,
    overLimitSeconds,
    speedLog,
    trackLog,
    reset,
  ])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setCurrentPos([p.coords.latitude, p.coords.longitude]),
      () => setCurrentPos([35.6812, 139.7671]),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
    recording,
    currentPos,
    currentSpeed,
    startTime,
    elapsed,
    trackLog,
    speedLog,
    violations,
    totalDistance,
    maxSpeed,
    overLimitSeconds,
    start,
    stop,
  }
}
