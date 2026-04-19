import SpeedMap from './SpeedMap'
import { formatDistance, formatDuration } from '../utils/storage'
import { formatSpeed } from '../utils/speed'

export default function RouteTab({ recorder, settings }) {
  const {
    recording,
    currentPos,
    currentSpeed,
    trackLog,
    violations,
    totalDistance,
    elapsed,
  } = recorder

  return (
    <div className="route-tab">
      <SpeedMap
        trackLog={trackLog}
        violations={violations}
        companyLimit={settings.companySpeedLimit}
        currentPos={currentPos}
        follow={recording}
        height={380}
      />

      <div className="route-info">
        <div className="route-info-cell">
          <span className="route-info-label">現在速度</span>
          <span className="route-info-value">{formatSpeed(currentSpeed)} km/h</span>
        </div>
        <div className="route-info-cell">
          <span className="route-info-label">距離</span>
          <span className="route-info-value">{formatDistance(totalDistance)}</span>
        </div>
        <div className="route-info-cell">
          <span className="route-info-label">時間</span>
          <span className="route-info-value">{formatDuration(elapsed)}</span>
        </div>
        <div className="route-info-cell">
          <span className="route-info-label">違反</span>
          <span className="route-info-value">{violations.length} 件</span>
        </div>
      </div>

      {!recording && trackLog.length === 0 && (
        <p className="route-hint">「記録」タブから業務を開始するとルートが色分け表示されます。</p>
      )}
    </div>
  )
}
