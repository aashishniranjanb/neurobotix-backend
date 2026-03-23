import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import RobotArm from '../components/RobotArm'
import BotLabel from '../components/BotLabel'
import SyncPulse from '../components/SyncPulse'
import CarUseCasePanel from '../components/CarUseCasePanel'
import TriSyncHUD from '../components/TriSyncHUD'
import GyroControl from '../components/GyroControl'

const BOT_CONFIGS = [
  { id: 'ALPHA', label: 'UNIT α', offset: [-5, 0, 0] },
  { id: 'BETA',  label: 'UNIT β', offset: [0, 0, 0] },
  { id: 'GAMMA', label: 'UNIT γ', offset: [5, 0, 0] },
]

/**
 * TriSyncDashboard — Main stage UI.
 * Three synchronized robot arms + HUD + car use case panel + gyro control.
 */
export default function TriSyncDashboard() {
  const { joints, gesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [revealed, setRevealed] = useState(false)
  const [gyroRotation, setGyroRotation] = useState({ rotX: 0, rotY: 0 })

  // Handle first detection reveal
  if (gesture === 'FIRST_DETECTION' && !revealed) {
    setRevealed(true)
  }

  return (
    <div style={{
      background: '#0a0a0a',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Top HUD Bar ────────────────────────────── */}
      <TriSyncHUD
        gesture={gesture}
        connected={connected}
        syncId={syncId}
        clientCount={clientCount}
      />

      {/* ── Reveal Animation Overlay ───────────────── */}
      {!revealed && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            color: '#ffd700', fontSize: '2rem', letterSpacing: '0.2em',
            animation: 'blink 2s infinite',
            textShadow: '0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(201,168,76,0.3)',
          }}>
            AWAITING GESTURE...
          </div>
        </div>
      )}
      {revealed && (
        <div className="trisync-reveal-overlay" onAnimationEnd={() => {}}>
          <div className="trisync-reveal-text">TRISYNC ACTIVATED</div>
        </div>
      )}

      {/* ── Main Stage: 3 Robots ───────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 4, 14], fov: 55 }}
          shadows
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#0a0a0a']} />

          {/* Lighting — BRIGHT cinematic warm key + cool fill + volumetric */}
          <ambientLight intensity={0.5} color="#ffe8c0" />
          <pointLight position={[3, 8, 5]} color="#f5c842" intensity={3.0} castShadow />
          <pointLight position={[-3, 4, -4]} color="#6ab0ff" intensity={1.2} />
          <pointLight position={[0, 2, 10]} color="#ffffff" intensity={0.8} />
          <spotLight
            position={[0, 12, 0]}
            angle={0.5}
            penumbra={0.8}
            intensity={2.5}
            color="#ffd700"
            castShadow
          />
          {/* Rim lights for each bot */}
          <pointLight position={[-6, 6, -2]} color="#c9a84c" intensity={1.0} />
          <pointLight position={[6, 6, -2]} color="#c9a84c" intensity={1.0} />

          {/* Holographic Grid Floor */}
          <Grid
            args={[30, 30]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#1a3a5c"
            sectionSize={5}
            sectionThickness={1.0}
            sectionColor="#c9a84c"
            fadeDistance={40}
            fadeStrength={1.2}
            infiniteGrid
            position={[0, 0, 0]}
          />

          {/* Three Robot Arms — all share same joint data */}
          {BOT_CONFIGS.map(bot => (
            <group key={bot.id} position={bot.offset}>
              <RobotArm joints={joints} gesture={gesture} theme="gold-matte" />
              <BotLabel label={bot.label} />
            </group>
          ))}

          {/* Sync Pulse Ring */}
          <SyncPulse active={connected} syncId={syncId} />

          {/* Camera Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={6}
            maxDistance={30}
            target={[0, 3.5, 0]}
          />
        </Canvas>
      </div>

      {/* ── Bottom Strip: Car Use Case + Gyro ─────── */}
      <div style={{
        height: 200,
        display: 'flex',
        borderTop: '1px solid rgba(201, 168, 76, 0.25)',
        background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(5,5,5,1) 100%)',
      }}>

        {/* Left: Gesture info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRight: '1px solid rgba(201, 168, 76, 0.15)',
          fontFamily: "'Space Mono', monospace",
          color: '#ffd700',
        }}>
          <div style={{
            fontSize: '0.7rem', color: '#c9a84c', marginBottom: 8,
            letterSpacing: '0.15em',
          }}>
            HOLOGRAPHIC INTERFACE
          </div>
          <div style={{
            fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.1em',
            textShadow: '0 0 12px rgba(255,215,0,0.4)',
          }}>
            ⬡ {gesture || 'IDLE'}
          </div>
          <div style={{
            fontSize: '0.65rem', color: '#c9a84c88', marginTop: 10,
            letterSpacing: '0.08em',
          }}>
            SYNC #{syncId} · {clientCount} CLIENT{clientCount !== 1 ? 'S' : ''}
          </div>
        </div>

        {/* Center: Gyro Control */}
        <div style={{
          width: 180,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRight: '1px solid rgba(201, 168, 76, 0.15)',
        }}>
          <GyroControl
            size={120}
            onChange={(rot) => setGyroRotation(rot)}
          />
        </div>

        {/* Right: Car Use Case Panel (3D Canvas) */}
        <div style={{ flex: 2 }}>
          <Canvas camera={{ position: [4, 2, 4], fov: 40 }}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[3, 3, 3]} intensity={2.0} color="#ffd700" />
            <pointLight position={[-2, 2, -2]} intensity={0.8} color="#4ac9c9" />
            <CarUseCasePanel gesture={gesture} gyroRotation={gyroRotation} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
