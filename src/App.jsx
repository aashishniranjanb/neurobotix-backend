import { useState, useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, ContactShadows, Environment, Float, Text } from '@react-three/drei'
import { useRobotWebSocket } from './hooks/useRobotWebSocket'
import Car3D from './components/Car3D'
import GyroControl from './components/GyroControl'
import WebcamPanel from './components/WebcamPanel'

/* ── Gesture → Use-Case label mapping ───────────── */
const GESTURE_MAP = {
  OPEN:    { action: 'HOOD OPEN · Assembly Mode',     icon: '🖐', color: '#ffd700' },
  GRAB:    { action: 'PRECISION · Component Install',  icon: '🤏', color: '#00e5ff' },
  FIST:    { action: 'EMERGENCY HOLD · All Freeze',    icon: '✊', color: '#ff3333' },
  POINT:   { action: 'INSPECTION · 360° Scan',         icon: '☝️', color: '#c86eff' },
  FORWARD: { action: 'FORWARD · Throttle Active',      icon: '🚗', color: '#4ade80' },
  REVERSE: { action: 'REVERSE · Backing Up',           icon: '🔙', color: '#fb923c' },
  NEUTRAL: { action: 'STANDBY · Orbit Mode',           icon: '✋', color: '#999' },
  IDLE:    { action: 'AWAITING COMMAND...',             icon: '⏳', color: '#666' },
  DEMO:    { action: 'DEMO · Playback Active',         icon: '🎬', color: '#44cc88' },
  FIRST_DETECTION: { action: 'TRISYNC ACTIVATED',      icon: '⚡', color: '#ffd700' },
}

/* Clickable gesture buttons config */
const GESTURE_BUTTONS = [
  { g: 'OPEN',    icon: '🖐', label: 'Hood',   desc: 'Opens hood · Gold glow' },
  { g: 'POINT',   icon: '☝️', label: 'Spin',   desc: '360° inspection rotation' },
  { g: 'FORWARD', icon: '🚗', label: 'Forward', desc: '3 fingers · Drive forward' },
  { g: 'REVERSE', icon: '🔙', label: 'Reverse', desc: '4 fingers · Drive backward' },
  { g: 'FIST',    icon: '✊', label: 'Freeze',  desc: '0 fingers · Emergency hold' },
  { g: 'GRAB',    icon: '🤏', label: 'Grip',    desc: 'Pinch · Precision install' },
]

/* Car definitions */
const CARS = [
  { x: -5.5, type: 'sports', color: '#ff3366', label: 'SPORT' },
  { x:  0,   type: 'sedan',  color: '#c9a84c', label: 'SEDAN' },
  { x:  5.5, type: 'suv',    color: '#4a90ff', label: 'SUV' },
]

export default function App() {
  const { gesture: wsGesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [gyroRotation, setGyroRotation] = useState({ rotX: 0, rotY: 0 })
  const [hasRevealed, setHasRevealed] = useState(false)
  const [manualGesture, setManualGesture] = useState(null)
  const manualTimerRef = useRef(null)

  // Manual gesture override: clicking a button overrides the WS gesture
  const activeGesture = manualGesture || wsGesture
  const uc = GESTURE_MAP[activeGesture] || GESTURE_MAP.IDLE

  if (activeGesture === 'FIRST_DETECTION' && !hasRevealed) {
    setHasRevealed(true)
  }

  const handleGestureClick = (g) => {
    // If clicking the same gesture that's already active, toggle it off
    if (manualGesture === g) {
      setManualGesture(null)
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current)
      return
    }
    setManualGesture(g)
    // Auto-clear after 8 seconds so WS can take over again
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current)
    manualTimerRef.current = setTimeout(() => setManualGesture(null), 8000)
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current)
    }
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#050508', overflow: 'hidden',
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* ══════ TOP BAR ══════════════════════════════ */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(180deg, rgba(10,10,14,0.98) 0%, rgba(5,5,8,0.95) 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.25)', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            color: '#ffd700', fontSize: '1.1rem', fontWeight: 700,
            letterSpacing: '0.22em', textShadow: '0 0 18px rgba(255,215,0,0.25)',
          }}>
            XION 2026
          </div>
          <div style={{ width: 1, height: 22, background: 'rgba(201,168,76,0.2)' }} />
          <div style={{ color: '#c9a84c55', fontSize: '0.55rem', letterSpacing: '0.18em' }}>
            TRICAR DIGITAL TWIN
          </div>
        </div>

        {/* Live gesture badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 16px', borderRadius: 6,
          border: `1px solid ${uc.color}44`,
          background: `${uc.color}0c`,
          transition: 'all 0.4s ease',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{uc.icon}</span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, color: uc.color,
            letterSpacing: '0.12em',
            transition: 'color 0.3s',
          }}>
            {activeGesture || 'IDLE'}
          </span>
          {manualGesture && (
            <span style={{
              fontSize: '0.45rem', color: '#ffd70088',
              letterSpacing: '0.08em', marginLeft: 4,
            }}>
              MANUAL
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.6rem' }}>
          <span style={{ color: connected ? '#ffd700' : '#ff6b6b', fontWeight: 700, letterSpacing: '0.08em' }}>
            [{clientCount}/3] SYNCED
          </span>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block',
            boxShadow: connected ? '0 0 10px #4ade80' : '0 0 10px #ff4444',
            animation: 'blink 1.5s infinite',
          }} />
        </div>
      </div>

      {/* ══════ MAIN CONTENT ═════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Webcam + Gesture ────────────── */}
        <div style={{
          width: 360, flexShrink: 0,
          borderRight: '1px solid rgba(201,168,76,0.15)',
          display: 'flex', flexDirection: 'column',
        }}>
          <WebcamPanel gesture={activeGesture} syncId={syncId} clientCount={clientCount} connected={connected} />
        </div>

        {/* ── RIGHT: 3D Car Stage ───────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas
            camera={{ position: [0, 7, 20], fov: 42 }}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <color attach="background" args={['#060609']} />
            <fog attach="fog" args={['#060609', 35, 65]} />

            <Suspense fallback={null}>
              {/* ── CINEMATIC LIGHTING ──────────── */}
              <ambientLight intensity={0.4} color="#ffe8c8" />
              <spotLight
                position={[0, 18, 8]} angle={0.35} penumbra={0.9}
                intensity={3.5} color="#ffd700" castShadow
                shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001}
              />
              <pointLight position={[-12, 6, -4]} intensity={1.2} color="#4a90ff" />
              <pointLight position={[12, 6, -4]} intensity={1.2} color="#4a90ff" />
              <pointLight position={[0, 4, -12]} intensity={1.5} color="#c9a84c" />
              <pointLight position={[0, -1, 5]} intensity={0.6} color="#ffd70044" />

              {/* ── THREE DISTINCT CARS ─────────── */}
              {CARS.map((car) => (
                <group key={car.type} position={[car.x, 0, 0]}>
                  <Car3D
                    gesture={activeGesture}
                    gyroRotation={gyroRotation}
                    baseColor={car.color}
                    carType={car.type}
                  />
                  <pointLight
                    position={[0, -0.3, 0]}
                    intensity={0.6} distance={4}
                    color={uc.color !== '#666' ? uc.color : car.color}
                  />
                </group>
              ))}

              {/* ── FLOOR ──────────────────────── */}
              <ContactShadows
                resolution={1024} scale={50} blur={2.5}
                opacity={0.4} far={12} color="#000"
                position={[0, -0.56, 0]}
              />
              <Grid
                infiniteGrid cellSize={1} sectionSize={5}
                fadeDistance={45} fadeStrength={1.2}
                cellColor="#0a1628" sectionColor="#c9a84c18"
                position={[0, -0.55, 0]}
              />

              <OrbitControls
                enablePan={false} enableZoom={true} enableRotate={true}
                minDistance={6} maxDistance={35}
                target={[0, 0.5, 0]} maxPolarAngle={Math.PI / 2.1}
                autoRotateSpeed={0.3}
              />
            </Suspense>
          </Canvas>

          {/* ── Car type labels ─────────────────── */}
          <div style={{
            position: 'absolute', top: 16, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 80,
            pointerEvents: 'none',
          }}>
            {CARS.map(c => (
              <div key={c.type} style={{
                fontSize: '0.55rem', fontWeight: 700,
                color: c.color, letterSpacing: '0.15em',
                textShadow: `0 0 12px ${c.color}44`,
                opacity: 0.7,
              }}>
                {c.label}
              </div>
            ))}
          </div>

          {/* ── Floating action banner ──────────── */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.85rem', fontWeight: 700, color: uc.color, letterSpacing: '0.12em',
            padding: '8px 28px', borderRadius: 6,
            border: `1px solid ${uc.color}33`,
            background: `linear-gradient(180deg, rgba(5,5,8,0.92) 0%, rgba(10,10,15,0.95) 100%)`,
            backdropFilter: 'blur(12px)', zIndex: 5,
            boxShadow: `0 0 24px ${uc.color}15`,
            whiteSpace: 'nowrap',
            transition: 'color 0.4s, border-color 0.4s, box-shadow 0.4s',
          }}>
            ⬡ {uc.action}
          </div>
        </div>
      </div>

      {/* ══════ BOTTOM BAR — CLICKABLE GESTURE CONTROLS ═══════ */}
      <div style={{
        height: 80, display: 'flex', alignItems: 'center', padding: '0 16px',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        background: 'linear-gradient(180deg, rgba(8,8,12,0.98) 0%, rgba(5,5,8,0.99) 100%)',
        flexShrink: 0, gap: 10,
      }}>
        {/* Clickable gesture buttons */}
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {GESTURE_BUTTONS.map(item => {
            const isActive = activeGesture === item.g
            const isManual = manualGesture === item.g
            const itemColor = GESTURE_MAP[item.g]?.color || '#c9a84c'
            return (
              <button
                key={item.g}
                onClick={() => handleGestureClick(item.g)}
                title={item.desc}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  background: isActive
                    ? `linear-gradient(135deg, ${itemColor}18 0%, ${itemColor}08 100%)`
                    : 'rgba(201,168,76,0.03)',
                  border: `1.5px solid ${isActive ? itemColor + '66' : '#c9a84c12'}`,
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: "'Space Mono', monospace",
                  boxShadow: isActive ? `0 0 16px ${itemColor}20, inset 0 0 12px ${itemColor}08` : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = itemColor + '33'
                    e.currentTarget.style.background = `${itemColor}08`
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#c9a84c12'
                    e.currentTarget.style.background = 'rgba(201,168,76,0.03)'
                  }
                }}
              >
                <span style={{
                  fontSize: '1.1rem',
                  filter: isActive ? `drop-shadow(0 0 8px ${itemColor}55)` : 'none',
                  transition: 'filter 0.3s',
                }}>{item.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700,
                    color: isActive ? itemColor : '#c9a84c55',
                    letterSpacing: '0.08em',
                    transition: 'color 0.3s',
                  }}>
                    {item.label.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '0.4rem', 
                    color: isActive ? `${itemColor}88` : '#c9a84c22',
                    letterSpacing: '0.04em',
                    transition: 'color 0.3s',
                  }}>
                    {item.desc.split('·')[0].trim()}
                  </span>
                </div>
                {/* Active pulse indicator */}
                {isManual && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 5, height: 5, borderRadius: '50%',
                    background: itemColor,
                    boxShadow: `0 0 6px ${itemColor}`,
                    animation: 'blink 1s infinite',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 44, background: 'rgba(201,168,76,0.12)' }} />

        {/* Gyro */}
        <GyroControl size={56} onChange={setGyroRotation} />

        {/* Right status */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: 3, fontSize: '0.5rem', color: '#c9a84c44', letterSpacing: '0.08em',
          minWidth: 100,
        }}>
          <span style={{ color: '#c9a84c88' }}>
            X:{gyroRotation.rotX.toFixed(0)}° Y:{gyroRotation.rotY.toFixed(0)}°
          </span>
          <span>SYNC #{syncId} {connected ? '●' : '○'} {connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* ── UNVEIL OVERLAY ──────────────── */}
      {activeGesture === 'FIRST_DETECTION' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(201,168,76,0.15)',
          backdropFilter: 'blur(10px)',
          animation: 'revealFlash 2s ease-out forwards',
          pointerEvents: 'none'
        }}>
          <div style={{
            color: '#ffd700', fontSize: '3.5rem', fontWeight: 700,
            letterSpacing: '0.4em', border: '2px solid #ffd700',
            padding: '24px 64px', background: 'rgba(0,0,0,0.8)',
            boxShadow: '0 0 50px rgba(255,215,0,0.3)',
            animation: 'triSyncReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards'
          }}>
            TRISYNC ACTIVE
          </div>
        </div>
      )}
    </div>
  )
}
