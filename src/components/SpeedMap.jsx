import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getSpeedColor, thinTrack, formatTimeHMS } from '../utils/speed'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const warnIcon = L.divIcon({
  className: 'warn-marker',
  html: '<div class="warn-marker-inner">!</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function AutoFit({ points, follow }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length === 0) return
    if (follow) {
      const last = points[points.length - 1]
      map.setView([last.lat, last.lon], map.getZoom() < 14 ? 15 : map.getZoom())
      return
    }
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]))
      map.fitBounds(bounds, { padding: [24, 24] })
    } else {
      map.setView([points[0].lat, points[0].lon], 15)
    }
  }, [points, follow, map])
  return null
}

export default function SpeedMap({
  trackLog,
  violations = [],
  companyLimit,
  currentPos,
  follow = false,
  height = 320,
}) {
  const thinned = useMemo(() => thinTrack(trackLog, 300, 5), [trackLog])

  const segments = useMemo(() => {
    const segs = []
    for (let i = 1; i < thinned.length; i++) {
      const a = thinned[i - 1]
      const b = thinned[i]
      const avg = (a.speed + b.speed) / 2
      segs.push({
        key: `${a.timestamp}-${b.timestamp}-${i}`,
        positions: [[a.lat, a.lon], [b.lat, b.lon]],
        color: getSpeedColor(avg, companyLimit),
      })
    }
    return segs
  }, [thinned, companyLimit])

  const center = useMemo(() => {
    if (currentPos) return currentPos
    if (thinned.length > 0) return [thinned[0].lat, thinned[0].lon]
    return [35.6812, 139.7671]
  }, [currentPos, thinned])

  const speedViolations = violations.filter((v) => v.type === 'speed' && v.lat && v.lon)

  return (
    <div className="speed-map-wrap" style={{ height }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {segments.map((s) => (
          <Polyline key={s.key} positions={s.positions} color={s.color} weight={5} opacity={0.9} />
        ))}
        {currentPos && <Marker position={currentPos} />}
        {speedViolations.map((v, i) => (
          <Marker key={`v-${v.timestamp}-${i}`} position={[v.lat, v.lon]} icon={warnIcon}>
            <Popup>
              <strong>速度超過</strong>
              <br />
              {v.message}
              <br />
              {formatTimeHMS(v.timestamp)}
            </Popup>
          </Marker>
        ))}
        <AutoFit points={thinned.length ? thinned : currentPos ? [{ lat: currentPos[0], lon: currentPos[1] }] : []} follow={follow} />
      </MapContainer>
      <div className="speed-legend">
        <div className="legend-row"><span className="legend-dot" style={{ background: '#22c55e' }} />〜30 km/h</div>
        <div className="legend-row"><span className="legend-dot" style={{ background: '#3b82f6' }} />〜{Math.round(companyLimit * 0.83)} km/h</div>
        <div className="legend-row"><span className="legend-dot" style={{ background: '#f59e0b' }} />注意域</div>
        <div className="legend-row"><span className="legend-dot" style={{ background: '#ef4444' }} />超過</div>
      </div>
    </div>
  )
}
