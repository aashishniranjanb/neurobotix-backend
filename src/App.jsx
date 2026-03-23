import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text, ContactShadows } from '@react-three/drei'
import { useRobotWebSocket } from './hooks/useRobotWebSocket'
import Car3D from './components/Car3D'
import GyroControl from './components/GyroControl'
import WebcamPanel from './components/WebcamPanel'

const GESTURE_USE_CASE = {
  OPEN:    { action: 'HOOD OPEN · Assembly Mode', color: '#ffd700' },
  GRAB:    { action: 'PRECISION · Component Install', color: '#00e5ff' },
  FIST:    { action: 'EMERGENCY HOLD · All Freeze', color: '#ff3333' },
  POINT:   { action: 'INSPECTION · 360° Scan', color: '#c86eff' },
  FORWARD: { action: 'FORWARD · Throttle Active', color: '#4ade80' },
  REVERSE: { action: 'REVERSE · Backing Up', color: '#fb923c' },
  NEUTRAL: { action: 'STANDBY · Orbit Mode', color: '#aaaaaa' },
  IDLE:    { action: 'AWAITING COMMAND...', color: '#888888' },
  DEMO:    { action: 'DEMO · Playback Active', color: '#44cc88' },
}

export default function App() {
  const { gesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [gyroRotation, setGyroRotation] = useState({ rotX: 0, rotY: 0 })

  const uc = GESTURE_USE_CASE[gesture] || GESTURE_USE_CASE.IDLE

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#050508', overflow: 'hidden',
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* ── TOP BAR ──────────────────────────────── */}
      <div style={{
        height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: 'rgba(5,5,8,0.95)',
        borderBottom: '1px solid rgba(201,168,76,0.2)', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ color: '#ffd700', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.2em' }}>
          XION 2026
        </div>
        <div style={{ color: '#c9a84c88', fontSize: '0.65rem', letterSpacing: '0.15em' }}>
          TRICAR DIGITAL TWIN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.65rem' }}>
          <span style={{ color: connected ? '#ffd700' : '#ff6b6b', fontWeight: 700 }}>
            [{clientCount}/3] SYNCED
          </span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block', boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #ff4444'
          }} />
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Webcam ──────────────── */}
        <div style={{ width: 380, flexShrink: 0, borderRight: '1px solid rgba(201,168,76,0.15)' }}>
          <WebcamPanel gesture={gesture} syncId={syncId} clientCount={clientCount} connected={connected} />
        </div>

        {/* ── RIGHT: 3D Car ─────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [0, 8, 22], fov: 45 }} shadows>
            <color attach="background" args={['#050508']} />
            
            <Suspense fallback={null}>
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
              <pointLight position={[-10, 5, 5]} intensity={1.0} color="#4a90ff" />
              <spotLight position={[0, 15, 0]} angle={0.4} penumbra={1} intensity={2} castShadow />

              {/* THREE CARS — each a distinct type */}
              <group position={[-5.5, 0, 0]}>
                <Car3D gesture={gesture} gyroRotation={gyroRotation} baseColor="#ff3366" carType="sports" />
              </group>
              <group position={[0, 0, 0]}>
                <Car3D gesture={gesture} gyroRotation={gyroRotation} baseColor="#c9a84c" carType="sedan" />
              </group>
              <group position={[5.5, 0, 0]}>
                <Car3D gesture={gesture} gyroRotation={gyroRotation} baseColor="#4a90ff" carType="suv" />
              </group>
              
              <ContactShadows resolution={1024} scale={40} blur={2} opacity={0.35} far={10} color="#000000" position={[0, -0.56, 0]} />
              
              <Grid infiniteGrid cellSize={1} sectionSize={5} fadeDistance={40} cellColor="#0a1a30" sectionColor="#c9a84c22" position={[0, -0.55, 0]} />

              <OrbitControls enablePan={false} minDistance={5} maxDistance={30} target={[0, 0.5, 0]} maxPolarAngle={Math.PI / 2.1} />
            </Suspense>
          </Canvas>

          {/* Floating Action Name */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            fontSize: '1rem', fontWeight: 700, color: uc.color, letterSpacing: '0.1em',
            padding: '10px 24px', border: `1px solid ${uc.color}33`, borderRadius: 4,
            background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', zIndex: 5
          }}>
            ⬡ {uc.action}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ───────────────────────────── */}
      <div style={{
        height: 80, display: 'flex', alignItems: 'center', padding: '0 24px',
        borderTop: '1px solid rgba(201,168,76,0.2)', background: 'rgba(5,5,8,0.98)', flexShrink: 0, gap: 30
      }}>
        <div style={{ flex: 1, display: 'flex', gap: 15, fontSize: '0.55rem', color: '#c9a84c66', flexWrap: 'wrap' }}>
          {['OPEN', 'FIST', 'POINT', 'GRAB', 'FORWARD', 'REVERSE'].map(g => (
            <div key={g} style={{
              padding: '6px 12px', borderRadius: 4, background: gesture === g ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: `1px solid ${gesture === g ? '#c9a84c55' : 'transparent'}`, color: gesture === g ? '#ffd700' : 'inherit'
            }}>
              {g}
            </div>
          ))}
        </div>

        <GyroControl size={60} onChange={setGyroRotation} />

        <div style={{ flex: 1, textAlign: 'right', fontSize: '0.6rem', color: '#c9a84c44' }}>
          X: {gyroRotation.rotX.toFixed(0)}° Y: {gyroRotation.rotY.toFixed(0)}° | SYNC #{syncId}
        </div>
      </div>
    </div>
  )
}
