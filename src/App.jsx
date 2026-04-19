import { useEffect, useState } from 'react'
import RecordTab from './components/RecordTab'
import RouteTab from './components/RouteTab'
import HistoryTab from './components/HistoryTab'
import SettingsModal from './components/SettingsModal'
import { useTripRecorder } from './hooks/useTripRecorder'
import { loadSettings, saveSettings } from './utils/settings'
import { getAllTrips, deleteTrip as dbDeleteTrip } from './db'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('record')
  const [settings, setSettings] = useState(loadSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [trips, setTrips] = useState([])
  const recorder = useTripRecorder(settings)

  const refreshTrips = async () => {
    try {
      const data = await getAllTrips()
      setTrips(data)
    } catch (e) {
      console.error('failed to load trips', e)
    }
  }

  useEffect(() => {
    refreshTrips()
  }, [])

  const handleStop = async () => {
    await recorder.stop()
    await refreshTrips()
    setActiveTab('history')
  }

  const handleDelete = async (id) => {
    await dbDeleteTrip(id)
    await refreshTrips()
  }

  const handleSaveSettings = (next) => {
    setSettings(next)
    saveSettings(next)
  }

  const tabs = [
    { id: 'record', label: '記録', icon: '🚗' },
    { id: 'route', label: 'ルート', icon: '🗺' },
    { id: 'history', label: '履歴', icon: '📋' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1>🚗 Drive Safety</h1>
            <p className="subtitle">運行記録 & 安全管理</p>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(true)} aria-label="設定">
            ⚙
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === 'record' && (
          <RecordTab
            recorder={recorder}
            settings={settings}
            onStart={recorder.start}
            onStop={handleStop}
          />
        )}
        {activeTab === 'route' && (
          <RouteTab recorder={recorder} settings={settings} />
        )}
        {activeTab === 'history' && (
          <HistoryTab trips={trips} onDelete={handleDelete} />
        )}
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
