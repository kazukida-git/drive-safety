import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import SpeedMap from './SpeedMap'
import { formatDistance, formatDuration } from '../utils/storage'
import { formatSpeed, scoreColor, formatTimeHM } from '../utils/speed'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
}

function TripDetail({ trip, onBack, onDelete }) {
  const chartData = useMemo(() => {
    if (!trip.speedLog || trip.speedLog.length === 0) return []
    const base = trip.speedLog[0].timestamp
    return trip.speedLog.map((p) => ({
      t: Math.round((p.timestamp - base) / 1000),
      speed: Math.round(p.speed * 10) / 10,
    }))
  }, [trip])

  const limit = trip.settings?.companySpeedLimit ?? 60

  return (
    <div className="trip-detail">
      <div className="trip-detail-header-row">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <button
          className="btn-delete"
          onClick={() => {
            if (confirm('このトリップを削除しますか？')) onDelete(trip.id)
          }}
        >
          🗑 削除
        </button>
      </div>

      <div className="trip-detail-title">
        <div className="trip-detail-date">{formatDate(trip.startTime)}</div>
        <div className="trip-detail-time">
          {formatTimeHM(trip.startTime)} 〜 {formatTimeHM(trip.endTime)}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-cell-label">距離</div>
          <div className="stat-cell-value">{formatDistance(trip.totalDistance)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">時間</div>
          <div className="stat-cell-value">{formatDuration(trip.totalTime * 1000)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">最高</div>
          <div className="stat-cell-value">{formatSpeed(trip.maxSpeed)} km/h</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">平均</div>
          <div className="stat-cell-value">{formatSpeed(trip.avgSpeed)} km/h</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">安全スコア</div>
          <div className="stat-cell-value" style={{ color: scoreColor(trip.safetyScore) }}>
            {trip.safetyScore}
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">違反</div>
          <div className="stat-cell-value">{trip.violations?.length ?? 0} 件</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">タコグラフ</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis domain={[0, Math.max(limit + 40, 80)]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151' }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#f9fafb' }}
                formatter={(v) => [`${v} km/h`, '速度']}
                labelFormatter={(v) => `${v}s`}
              />
              <ReferenceLine y={limit} stroke="#ef4444" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">走行ルート</div>
        <SpeedMap
          trackLog={trip.trackLog}
          violations={trip.violations}
          companyLimit={limit}
          height={300}
        />
      </div>

      {trip.violations && trip.violations.length > 0 && (
        <div className="violation-section">
          <div className="chart-title">違反一覧</div>
          <ul className="violation-list">
            {trip.violations.map((v, i) => (
              <li key={`${v.timestamp}-${i}`} className={`violation-item violation-${v.type}`}>
                <span className="violation-time">{formatTimeHM(v.time)}</span>
                <span className="violation-msg">{v.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function HistoryTab({ trips, onDelete }) {
  const [selectedId, setSelectedId] = useState(null)
  const selected = trips.find((t) => t.id === selectedId)

  if (selected) {
    return (
      <TripDetail
        trip={selected}
        onBack={() => setSelectedId(null)}
        onDelete={(id) => {
          onDelete(id)
          setSelectedId(null)
        }}
      />
    )
  }

  if (trips.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>走行記録がありません</p>
        <p className="empty-hint">「記録」タブから業務を開始してください</p>
      </div>
    )
  }

  return (
    <div className="trip-list">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="trip-card"
          onClick={() => setSelectedId(trip.id)}
        >
          <div className="trip-card-header">
            <span className="trip-date">{formatDate(trip.startTime)}</span>
            <span
              className="trip-score-badge"
              style={{ background: scoreColor(trip.safetyScore) }}
            >
              {trip.safetyScore}
            </span>
          </div>
          <div className="trip-card-sub">
            {formatTimeHM(trip.startTime)} 〜 {formatTimeHM(trip.endTime)}
          </div>
          <div className="trip-card-body">
            <span className="trip-stat">🛣 {formatDistance(trip.totalDistance)}</span>
            <span className="trip-stat">⏱ {formatDuration(trip.totalTime * 1000)}</span>
            <span className="trip-stat">⚠ {trip.violations?.length ?? 0}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
