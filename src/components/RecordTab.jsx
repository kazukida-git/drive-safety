import { useMemo } from 'react'
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
import { formatDuration, formatDistance } from '../utils/storage'
import { formatSpeed, getSpeedColor } from '../utils/speed'

export default function RecordTab({
  recorder,
  settings,
  onStart,
  onStop,
}) {
  const {
    recording,
    currentSpeed,
    elapsed,
    totalDistance,
    maxSpeed,
    speedLog,
    violations,
  } = recorder

  const limit = settings.companySpeedLimit
  const speedColor = getSpeedColor(currentSpeed, limit)

  const chartData = useMemo(() => {
    if (!speedLog || speedLog.length === 0) return []
    const last = speedLog.slice(-120)
    const base = last[0].timestamp
    return last.map((p) => ({
      t: Math.round((p.timestamp - base) / 1000),
      speed: Math.round(p.speed * 10) / 10,
    }))
  }, [speedLog])

  const avgSpeed = useMemo(() => {
    const sec = elapsed / 1000
    if (sec < 1) return 0
    return (totalDistance / 1000) / (sec / 3600)
  }, [elapsed, totalDistance])

  return (
    <div className="record-tab">
      <div className="speed-meter" style={{ borderColor: speedColor }}>
        <div className="speed-value" style={{ color: speedColor }}>
          {formatSpeed(currentSpeed)}
        </div>
        <div className="speed-unit">km/h</div>
        <div className="speed-limit-note">制限 {limit} km/h</div>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-cell-label">走行距離</div>
          <div className="stat-cell-value">{formatDistance(totalDistance)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">走行時間</div>
          <div className="stat-cell-value">{formatDuration(elapsed)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">最高速度</div>
          <div className="stat-cell-value">{formatSpeed(maxSpeed)} km/h</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">平均速度</div>
          <div className="stat-cell-value">{formatSpeed(avgSpeed)} km/h</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">違反</div>
          <div className="stat-cell-value">
            {violations.length}
            <span className="stat-cell-sub"> 件</span>
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">状態</div>
          <div className="stat-cell-value">
            {recording ? (
              <span className="rec-inline">
                <span className="rec-dot" /> 記録中
              </span>
            ) : (
              '停止中'
            )}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">タコグラフ（直近2分）</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={160}>
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
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {violations.length > 0 && (
        <div className="violation-section">
          <div className="chart-title">違反ログ</div>
          <ul className="violation-list">
            {violations.slice(-5).reverse().map((v, i) => (
              <li key={`${v.timestamp}-${i}`} className={`violation-item violation-${v.type}`}>
                <span className="violation-time">
                  {new Date(v.timestamp).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="violation-msg">{v.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="record-controls">
        {!recording ? (
          <button className="btn btn-start" onClick={onStart}>
            ▶ 業務開始
          </button>
        ) : (
          <button className="btn btn-stop" onClick={onStop}>
            ⏹ 業務終了
          </button>
        )}
      </div>
    </div>
  )
}
