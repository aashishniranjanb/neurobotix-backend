import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import Car3D from '../components/Car3D'
import GyroControl from '../components/GyroControl'
import WebcamPanel from '../components/WebcamPanel'

const GESTURE_USE_CASE = {
  OPEN:    { action: 'HOOD OPEN · Assembly Mode', color: '#ffd700' },
  GRAB:    { action: 'PRECISION · Component Install', color: '#00e5ff' },
  FIST:    { action: 'EMERGENCY HOLD · All Freeze', color: '#ff3333' },
  POINT:   { action: 'INSPECTION · 360° Scan', color: '#c86eff' },
  NEUTRAL: { action: 'STANDBY · Orbit Mode', color: '#aaaaaa' },
  IDLE:    { action: 'AWAITING COMMAND...', color: '#888888' },
  DEMO:    { action: 'DEMO · Playback Active', color: '#44cc88' },
  FIRST_DETECTION: { action: 'TRISYNC ACTIVATED', color: '#ffd700' },
}

/**
 * TriCarPage — Main stage: 
 *   Left: OpenCV webcam + gesture overlay
 *   Right: Triple car digital twin
 *   Bottom: Gyro + status
 */
export default function TriCarPage() {
  const { joints, gesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [gyroRotation, setGyroRotation] = useState({ rotX: 0, rotY: 0 })

  const uc = GESTURE_USE_CASE[gesture] || GESTURE_USE_CASE.IDLE

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#050508',
      overflow: 'hidden',
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* ── TOP BAR ──────────────────────────────── */}
      <div style={{
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(5,5,8,0.95)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{
          color: '#ffd700', fontSize: '1rem', fontWeight: 700,
          letterSpacing: '0.2em',
          textShadow: '0 0 12px rgba(255,215,0,0.3)',
        }}>
          XION 2026
        </div>
        <div style={{
          color: '#c9a84c88', fontSize: '0.65rem',
          letterSpacing: '0.15em',
        }}>
          TRICAR DIGITAL TWIN
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: '0.65rem',
        }}>
          <span style={{
            color: connected ? '#ffd700' : '#ff6b6b',
            fontWeight: 700,
          }}>
            [{clientCount}/3] SYNCED
          </span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block',
            boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #ff4444',
          }} />
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>

        {/* ── LEFT: Webcam + Gesture ──────────────── */}
        <div style={{
          width: 380,
          flexShrink: 0,
          borderRight: '1px solid rgba(201,168,76,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <WebcamPanel
            gesture={gesture}
            syncId={syncId}
            clientCount={clientCount}
            connected={connected}
          />
        </div>

        {/* ── RIGHT: 3D Car Stage ─────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas
            camera={{ position: [0, 4, 12], fov: 50 }}
            shadows
            gl={{ antialias: true, toneMapping: 3 }}
          >
            <color attach="background" args={['#050508']} />
            <fog attach="fog" args={['#050508', 25, 55]} />

            {/* ── LIGHTING ───────────────────────── */}
            <ambientLight intensity={0.35} color="#ffe0b0" />
            <spotLight
              position={[0, 14, 6]}
              angle={0.45}
              penumbra={0.8}
              intensity={4.5}
              color="#ffd700"
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-7, 5, -3]} color="#4a90ff" intensity={1.5} />
            <pointLight position={[7, 5, -3]} color="#4a90ff" intensity={1.5} />
            <pointLight position={[0, 2, 10]} color="#ffffff" intensity={0.8} />
            <pointLight position={[-5, 3, -6]} color="#c9a84c" intensity={1.5} />
            <pointLight position={[5, 3, -6]} color="#c9a84c" intensity={1.5} />

            {/* ── FLOOR ──────────────────────────── */}
            <Grid
              args={[40, 40]}
              cellSize={1}
              cellThickness={0.4}
              cellColor="#0a1a30"
              sectionSize={5}
              sectionThickness={0.8}
              sectionColor="#c9a84c33"
              fadeDistance={30}
              fadeStrength={1.5}
              infiniteGrid
              position={[0, -0.55, 0]}
            />

            {/* ── SINGLE CAR (Main Focus) ────────── */}
            <group position={[0, 0, 0]}>
              <Car3D
                gesture={gesture}
                gyroRotation={gyroRotation}
                unitLabel="TRICAR"
              />
              <Text
                position={[0, -1.3, 2.5]}
                fontSize={0.3}
                color="#c9a84c"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYE58RXi4EwQ.woff2"
              >
                TRICAR · DIGITAL TWIN
              </Text>
            </group>

            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={25}
              target={[0, 0.5, 0]}
              maxPolarAngle={Math.PI / 2.1}
            />
          </Canvas>

          {/* ── Floating Gesture Action Label ─────── */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: uc.color,
            letterSpacing: '0.12em',
            textShadow: `0 0 20px ${uc.color}55`,
            padding: '8px 24px',
            border: `1px solid ${uc.color}33`,
            borderRadius: 4,
            background: 'rgba(5,5,8,0.88)',
            backdropFilter: 'blur(6px)',
            zIndex: 5,
            whiteSpace: 'nowrap',
          }}>
            ⬡ {uc.action}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ───────────────────────────── */}
      <div style={{
        height: 70,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        background: 'rgba(5,5,8,0.97)',
        flexShrink: 0,
        gap: 24,
      }}>
        {/* Gesture mapping quick ref */}
        <div style={{
          flex: 1,
          display: 'flex', gap: 16,
          fontSize: '0.5rem',
          color: '#c9a84c66',
          letterSpacing: '0.08em',
        }}>
          {[
            { e: '🖐', g: 'OPEN', a: 'Hood' },
            { e: '✊', g: 'FIST', a: 'Hold' },
            { e: '☝️', g: 'POINT', a: 'Spin' },
            { e: '🤏', g: 'GRAB', a: 'Grip' },
          ].map(item => (
            <div key={item.g} style={{
              padding: '4px 10px',
              border: `1px solid ${gesture === item.g ? (uc.color + '55') : '#c9a84c11'}`,
              borderRadius: 3,
              background: gesture === item.g ? `${uc.color}0a` : 'transparent',
              transition: 'all 0.3s',
            }}>
              <span style={{ fontSize: '0.8rem' }}>{item.e}</span>
              <span style={{
                marginLeft: 6,
                color: gesture === item.g ? uc.color : '#c9a84c44',
                fontWeight: gesture === item.g ? 700 : 400,
              }}>
                {item.a}
              </span>
            </div>
          ))}
        </div>

        {/* Gyro */}
        <GyroControl size={50} onChange={setGyroRotation} />

        {/* Sync info */}
        <div style={{
          display: 'flex', gap: 16,
          fontSize: '0.55rem', color: '#c9a84c55',
          letterSpacing: '0.1em',
        }}>
          <span>SYNC #{syncId}</span>
          <span style={{ color: connected ? '#c9a84c88' : '#ff444488' }}>
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  )
}
