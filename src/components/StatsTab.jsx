import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { formatDistance } from '../utils/storage'

export default function StatsTab({ trips }) {
  const weeklyData = useMemo(() => {
    if (trips.length === 0) return []

    const now = new Date()
    const weeks = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayLabel = d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
      weeks.push({ date: key, label: dayLabel, distance: 0, count: 0, duration: 0 })
    }

    trips.forEach((trip) => {
      const tripDate = new Date(trip.date).toISOString().slice(0, 10)
      const entry = weeks.find((w) => w.date === tripDate)
      if (entry) {
        entry.distance += trip.distance / 1000
        entry.duration += trip.duration / 60000
        entry.count += 1
      }
    })

    return weeks.map((w) => ({
      ...w,
      distance: Math.round(w.distance * 10) / 10,
      duration: Math.round(w.duration),
    }))
  }, [trips])

  const totalStats = useMemo(() => {
    const totalDist = trips.reduce((s, t) => s + t.distance, 0)
    const totalDur = trips.reduce((s, t) => s + t.duration, 0)
    return {
      totalTrips: trips.length,
      totalDistance: totalDist,
      totalDuration: totalDur,
      avgDistance: trips.length > 0 ? totalDist / trips.length : 0,
    }
  }, [trips])

  if (trips.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📊</span>
        <p>統計データがありません</p>
        <p className="empty-hint">走行を記録すると統計が表示されます</p>
      </div>
    )
  }

  return (
    <div className="stats-tab">
      <div className="stats-summary">
        <div className="summary-card">
          <span className="summary-icon">🚗</span>
          <span className="summary-value">{totalStats.totalTrips}</span>
          <span className="summary-label">総走行回数</span>
        </div>
        <div className="summary-card">
          <span className="summary-icon">🛣</span>
          <span className="summary-value">{formatDistance(totalStats.totalDistance)}</span>
          <span className="summary-label">総走行距離</span>
        </div>
        <div className="summary-card">
          <span className="summary-icon">📏</span>
          <span className="summary-value">{formatDistance(totalStats.avgDistance)}</span>
          <span className="summary-label">平均走行距離</span>
        </div>
      </div>

      <div className="chart-section">
        <h3>直近7日間の走行距離 (km)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val} km`, '走行距離']}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="distance" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>直近7日間の走行時間 (分)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(val) => [`${val} 分`, '走行時間']}
              labelStyle={{ color: '#374151' }}
            />
            <Line
              type="monotone"
              dataKey="duration"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
