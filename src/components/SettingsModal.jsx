import { useState } from 'react'

export default function SettingsModal({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState(settings)

  const update = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>設定</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label className="form-row">
            <span>会社制限速度 (km/h)</span>
            <input
              type="number"
              min="10"
              max="200"
              value={draft.companySpeedLimit}
              onChange={(e) => update('companySpeedLimit', Number(e.target.value))}
            />
          </label>
          <label className="form-row">
            <span>高速制限速度 (km/h)</span>
            <input
              type="number"
              min="10"
              max="200"
              value={draft.highwaySpeedLimit}
              onChange={(e) => update('highwaySpeedLimit', Number(e.target.value))}
            />
          </label>
          <label className="form-row">
            <span>長時間停車しきい値 (分)</span>
            <input
              type="number"
              min="1"
              max="240"
              value={draft.longStopThresholdMin}
              onChange={(e) => update('longStopThresholdMin', Number(e.target.value))}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
