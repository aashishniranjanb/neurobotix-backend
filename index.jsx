import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import RobotScene from './src/components/RobotScene'
import TriSyncDashboard from './src/pages/TriSyncDashboard'

/**
 * Simple hash-router:
 *   /           → System 1 Digital Twin (single robot)
 *   #trisync    → TriSync Dashboard (3 robots)
 */
function App() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '#trisync') {
    return <TriSyncDashboard />
  }
  return <RobotScene />
}

createRoot(document.getElementById('root')).render(<App />)
