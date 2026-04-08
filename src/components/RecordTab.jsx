import { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calcDistance, formatDuration, formatDistance } from '../utils/storage'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 15)
  }, [center, map])
  return null
}

export default function RecordTab({ onTripComplete }) {
  const [recording, setRecording] = useState(false)
  const [route, setRoute] = useState([])
  const [distance, setDistance] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [currentPos, setCurrentPos] = useState(null)
  const [memo, setMemo] = useState('')
  const watchId = useRef(null)
  const timerRef = useRef(null)

  const handlePosition = useCallback((pos) => {
    const { latitude, longitude } = pos.coords
    const point = [latitude, longitude]
    setCurrentPos(point)
    setRoute((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1]
        const d = calcDistance(last[0], last[1], latitude, longitude)
        if (d > 5) {
          setDistance((prevD) => prevD + d)
          return [...prev, point]
        }
        return prev
      }
      return [point]
    })
  }, [])

  const startRecording = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported on this device')
      return
    }
    setRecording(true)
    setRoute([])
    setDistance(0)
    setStartTime(Date.now())
    setElapsed(0)

    watchId.current = navigator.geolocation.watchPosition(handlePosition, null, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    })

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1000)
    }, 1000)
  }

  const stopRecording = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)

    if (route.length >= 2) {
      const trip = {
        id: Date.now(),
        date: new Date(startTime).toISOString(),
        route,
        distance,
        duration: Date.now() - startTime,
        memo,
      }
      onTripComplete(trip)
      setMemo('')
    }
  }

  useEffect(() => {
    // Get initial position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => setCurrentPos([35.6812, 139.7671]) // Tokyo fallback
      )
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const mapCenter = currentPos || [35.6812, 139.7671]

  return (
    <div className="record-tab">
      <div className="record-status">
        <div className="status-row">
          <div className="status-item">
            <span className="status-label">走行距離</span>
            <span className="status-value">{formatDistance(distance)}</span>
          </div>
          <div className="status-item">
            <span className="status-label">走行時間</span>
            <span className="status-value">{formatDuration(elapsed)}</span>
          </div>
        </div>

        {recording && (
          <div className="recording-indicator">
            <span className="rec-dot"></span> 記録中...
          </div>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '300px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={currentPos} />
          {currentPos && <Marker position={currentPos} />}
          {route.length >= 2 && (
            <Polyline positions={route} color="#3b82f6" weight={4} />
          )}
        </MapContainer>
      </div>

      <div className="record-controls">
        <input
          type="text"
          className="memo-input"
          placeholder="メモ（行き先・目的など）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        {!recording ? (
          <button className="btn btn-start" onClick={startRecording}>
            ▶ 記録開始
          </button>
        ) : (
          <button className="btn btn-stop" onClick={stopRecording}>
            ⏹ 記録停止
          </button>
        )}
      </div>
    </div>
  )
}
