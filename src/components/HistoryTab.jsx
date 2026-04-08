import { useState } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDuration, formatDistance } from '../utils/storage'

export default function HistoryTab({ trips }) {
  const [selectedTrip, setSelectedTrip] = useState(null)

  if (trips.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>走行記録がありません</p>
        <p className="empty-hint">「記録」タブから走行を記録してください</p>
      </div>
    )
  }

  const formatDate = (isoStr) => {
    const d = new Date(isoStr)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    })
  }

  const formatTime = (isoStr) => {
    const d = new Date(isoStr)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const getCenter = (route) => {
    if (!route || route.length === 0) return [35.6812, 139.7671]
    const lat = route.reduce((s, p) => s + p[0], 0) / route.length
    const lng = route.reduce((s, p) => s + p[1], 0) / route.length
    return [lat, lng]
  }

  return (
    <div className="history-tab">
      {selectedTrip && (
        <div className="trip-detail">
          <button className="btn btn-back" onClick={() => setSelectedTrip(null)}>
            ← 一覧に戻る
          </button>
          <div className="trip-detail-header">
            <h3>{formatDate(selectedTrip.date)} {formatTime(selectedTrip.date)}</h3>
            {selectedTrip.memo && <p className="trip-memo">{selectedTrip.memo}</p>}
          </div>
          <div className="trip-detail-stats">
            <div className="stat-card">
              <span className="stat-label">走行距離</span>
              <span className="stat-value">{formatDistance(selectedTrip.distance)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">走行時間</span>
              <span className="stat-value">{formatDuration(selectedTrip.duration)}</span>
            </div>
          </div>
          {selectedTrip.route && selectedTrip.route.length >= 2 && (
            <div className="map-container">
              <MapContainer
                center={getCenter(selectedTrip.route)}
                zoom={14}
                style={{ height: '300px', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline positions={selectedTrip.route} color="#3b82f6" weight={4} />
              </MapContainer>
            </div>
          )}
        </div>
      )}

      {!selectedTrip && (
        <div className="trip-list">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="trip-card"
              onClick={() => setSelectedTrip(trip)}
            >
              <div className="trip-card-header">
                <span className="trip-date">{formatDate(trip.date)}</span>
                <span className="trip-time">{formatTime(trip.date)}</span>
              </div>
              <div className="trip-card-body">
                <span className="trip-stat">🛣 {formatDistance(trip.distance)}</span>
                <span className="trip-stat">⏱ {formatDuration(trip.duration)}</span>
              </div>
              {trip.memo && <p className="trip-card-memo">{trip.memo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
