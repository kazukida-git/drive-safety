import { useState, useEffect } from 'react'
import RecordTab from './components/RecordTab'
import HistoryTab from './components/HistoryTab'
import StatsTab from './components/StatsTab'
import { loadTrips, saveTrips } from './utils/storage'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('record')
  const [trips, setTrips] = useState([])

  useEffect(() => {
    setTrips(loadTrips())
  }, [])

  const addTrip = (trip) => {
    const updated = [trip, ...trips]
    setTrips(updated)
    saveTrips(updated)
  }

  const tabs = [
    { id: 'record', label: '記録', icon: '📍' },
    { id: 'history', label: '履歴', icon: '📋' },
    { id: 'stats', label: '統計', icon: '📊' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚗 Drive Safety</h1>
        <p className="subtitle">走行記録 & 日報</p>
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
        {activeTab === 'record' && <RecordTab onTripComplete={addTrip} />}
        {activeTab === 'history' && <HistoryTab trips={trips} />}
        {activeTab === 'stats' && <StatsTab trips={trips} />}
      </main>
    </div>
  )
}

export default App
