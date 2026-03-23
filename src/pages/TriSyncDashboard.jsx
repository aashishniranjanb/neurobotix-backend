import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Environment } from '@react-three/drei'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import Car3D from '../components/Car3D'
import TriSyncHUD from '../components/TriSyncHUD'
import GyroControl from '../components/GyroControl'

const CAR_CONFIGS = [
  { id: 'ALPHA', label: 'CAR α', offset: [-5.5, 0, 0] },
  { id: 'BETA',  label: 'CAR β', offset: [0, 0, 0] },
  { id: 'GAMMA', label: 'CAR γ', offset: [5.5, 0, 0] },
]

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
 * TriSyncDashboard — System 2: Triple Car Digital Twin
 * Three gesture-controlled cars with gyro chassis control.
 */
export default function TriSyncDashboard() {
  const { joints, gesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [revealed, setRevealed] = useState(false)
  const [gyroRotation, setGyroRotation] = useState({ rotX: 0, rotY: 0 })

  if (gesture === 'FIRST_DETECTION' && !revealed) {
    setRevealed(true)
  }

  const uc = GESTURE_USE_CASE[gesture] || GESTURE_USE_CASE.NEUTRAL

  return (
    <div style={{
      background: '#050508',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Top HUD ────────────────────────────────── */}
      <TriSyncHUD
        gesture={gesture}
        connected={connected}
        syncId={syncId}
        clientCount={clientCount}
      />

      {/* ── Reveal Overlay ──────────────────────────── */}
      {!revealed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}>
          <div style={{
            color: '#ffd700', fontSize: '2.2rem', letterSpacing: '0.25em',
            fontFamily: "'Space Mono', monospace",
            animation: 'blink 2s infinite',
            textShadow: '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(201,168,76,0.2)',
          }}>
            AWAITING GESTURE...
          </div>
        </div>
      )}
      {revealed && (
        <div className="trisync-reveal-overlay">
          <div className="trisync-reveal-text">TRISYNC ACTIVATED</div>
        </div>
      )}

      {/* ── Main 3D Stage ──────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 5, 16], fov: 50 }}
          shadows
          gl={{ antialias: true, toneMapping: 3 }}
        >
          <color attach="background" args={['#050508']} />
          <fog attach="fog" args={['#050508', 20, 50]} />

          {/* ── LIGHTING — Cinematic stage setup ─── */}
          <ambientLight intensity={0.3} color="#ffe0b0" />

          {/* Main key light — warm gold from above-front */}
          <spotLight
            position={[0, 15, 8]}
            angle={0.4}
            penumbra={0.8}
            intensity={4.0}
            color="#ffd700"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Fill lights — cool blue from sides */}
          <pointLight position={[-8, 6, -3]} color="#4a90ff" intensity={1.5} />
          <pointLight position={[8, 6, -3]} color="#4a90ff" intensity={1.5} />

          {/* Rim lights — warm gold behind cars */}
          <pointLight position={[-6, 3, -8]} color="#c9a84c" intensity={2.0} />
          <pointLight position={[0, 3, -8]} color="#c9a84c" intensity={2.0} />
          <pointLight position={[6, 3, -8]} color="#c9a84c" intensity={2.0} />

          {/* Front accent light */}
          <pointLight position={[0, 2, 12]} color="#ffffff" intensity={1.0} />

          {/* Floor spotlight per car */}
          {CAR_CONFIGS.map(car => (
            <spotLight
              key={car.id + '-spot'}
              position={[car.offset[0], 8, car.offset[2]]}
              angle={0.3}
              penumbra={1}
              intensity={2.0}
              color="#ffd700"
              castShadow
              target-position={car.offset}
            />
          ))}

          {/* ── FLOOR GRID ──────────────────────── */}
          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.4}
            cellColor="#0a1a30"
            sectionSize={5}
            sectionThickness={0.8}
            sectionColor="#c9a84c44"
            fadeDistance={35}
            fadeStrength={1.5}
            infiniteGrid
            position={[0, -0.55, 0]}
          />

          {/* ── THREE CARS ──────────────────────── */}
          {CAR_CONFIGS.map(car => (
            <group key={car.id} position={car.offset}>
              <Car3D
                gesture={gesture}
                gyroRotation={gyroRotation}
                unitLabel={car.label}
              />
              {/* Unit label below car */}
              <Text
                position={[0, -1.4, 2]}
                fontSize={0.35}
                color="#c9a84c"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYE58RXi4EwQ.woff2"
              >
                {car.label}
              </Text>
            </group>
          ))}

          {/* ── Camera Controls ─────────────────── */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={6}
            maxDistance={35}
            target={[0, 0.5, 0]}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>

        {/* ── Gesture Action Label (floating over 3D) ── */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: uc.color,
          letterSpacing: '0.15em',
          textShadow: `0 0 20px ${uc.color}66, 0 0 40px ${uc.color}33`,
          padding: '10px 30px',
          border: `1px solid ${uc.color}44`,
          borderRadius: 6,
          background: 'rgba(5,5,8,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}>
          ⬡ {uc.action}
        </div>
      </div>

      {/* ── Bottom Control Strip ────────────────────── */}
      <div style={{
        height: 110,
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        background: 'linear-gradient(180deg, rgba(8,8,12,0.98) 0%, rgba(3,3,5,1) 100%)',
        padding: '0 40px',
        gap: 40,
      }}>

        {/* Status readout */}
        <div style={{
          flex: 1,
          fontFamily: "'Space Mono', monospace",
          display: 'flex',
          gap: 30,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.55rem', color: '#c9a84c88', letterSpacing: '0.15em', marginBottom: 4 }}>
              GESTURE
            </div>
            <div style={{
              fontSize: '1.3rem', color: uc.color, fontWeight: 700,
              textShadow: `0 0 10px ${uc.color}55`,
            }}>
              {gesture || 'IDLE'}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: '#c9a84c22' }} />
          <div>
            <div style={{ fontSize: '0.55rem', color: '#c9a84c88', letterSpacing: '0.15em', marginBottom: 4 }}>
              SYNC
            </div>
            <div style={{ fontSize: '1rem', color: '#c9a84ccc' }}>
              #{syncId}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: '#c9a84c22' }} />
          <div>
            <div style={{ fontSize: '0.55rem', color: '#c9a84c88', letterSpacing: '0.15em', marginBottom: 4 }}>
              CLIENTS
            </div>
            <div style={{
              fontSize: '1rem',
              color: clientCount >= 3 ? '#ffd700' : '#ff6b6b',
            }}>
              {clientCount}/3
            </div>
          </div>
        </div>

        {/* Gyro Control — center */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <GyroControl
            size={80}
            onChange={(rot) => setGyroRotation(rot)}
          />
        </div>

        {/* Car status badges */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 16,
          fontFamily: "'Space Mono', monospace",
        }}>
          {CAR_CONFIGS.map(car => (
            <div key={car.id} style={{
              padding: '8px 16px',
              border: `1px solid ${uc.color}44`,
              borderRadius: 4,
              background: `${uc.color}08`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.6rem', color: '#c9a84c88', letterSpacing: '0.1em' }}>
                {car.label}
              </div>
              <div style={{
                fontSize: '0.7rem', color: uc.color, fontWeight: 700,
                marginTop: 2,
              }}>
                ● SYNCED
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
