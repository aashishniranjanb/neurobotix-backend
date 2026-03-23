import React from 'react'
import ReactDOM from 'react-dom/client'
import TriCarPage from './src/pages/TriCarPage'

/**
 * XION 2026 — TriCar Digital Twin
 * Single page: OpenCV feed + 3D Car + Gyro Control
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TriCarPage />
  </React.StrictMode>
)
