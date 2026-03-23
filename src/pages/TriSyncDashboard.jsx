import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'
import RobotArm from '../components/RobotArm'
import BotLabel from '../components/BotLabel'
import SyncPulse from '../components/SyncPulse'
import CarUseCasePanel from '../components/CarUseCasePanel'
import TriSyncHUD from '../components/TriSyncHUD'

const BOT_CONFIGS = [
  { id: 'ALPHA', label: 'UNIT α', offset: [-5, 0, 0] },
  { id: 'BETA',  label: 'UNIT β', offset: [0, 0, 0] },
  { id: 'GAMMA', label: 'UNIT γ', offset: [5, 0, 0] },
]

/**
 * TriSyncDashboard — Main stage UI.
 * Three synchronized robot arms + HUD + car use case panel.
 */
export default function TriSyncDashboard() {
  const { joints, gesture, connected, syncId, clientCount } = useRobotWebSocket()
  const [revealed, setRevealed] = useState(false)

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

          {/* Lighting — cinematic warm key + cool fill */}
          <ambientLight intensity={0.15} />
          <pointLight position={[3, 8, 5]} color="#f5c842" intensity={2.0} castShadow />
          <pointLight position={[-3, 4, -4]} color="#4a90d9" intensity={0.6} />
          <spotLight
            position={[0, 12, 0]}
            angle={0.5}
            penumbra={0.8}
            intensity={1.5}
            color="#c9a84c"
            castShadow
          />

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
              <RobotArm joints={joints} theme="gold-matte" />
              <BotLabel label={bot.label} />
            </group>
          ))}

          {/* Sync Pulse Ring */}
          <SyncPulse active={connected} syncId={syncId} />

          {/* Camera Controls — disabled rotate during demo for stability */}
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

      {/* ── Bottom Strip: Car Use Case ─────────────── */}
      <div style={{
        height: 180,
        display: 'flex',
        borderTop: '1px solid rgba(201, 168, 76, 0.15)',
        background: 'rgba(0, 0, 0, 0.9)',
      }}>

        {/* Left: Gesture info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRight: '1px solid rgba(201, 168, 76, 0.1)',
          fontFamily: "'Space Mono', monospace",
          color: '#c9a84c',
        }}>
          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: 8 }}>
            HOLOGRAPHIC INTERFACE
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            ⬡ {gesture || 'IDLE'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 8 }}>
            SYNC #{syncId} · {clientCount} CLIENT{clientCount !== 1 ? 'S' : ''}
          </div>
        </div>

        {/* Right: Car Use Case Panel (3D Canvas) */}
        <div style={{ flex: 2 }}>
          <Canvas camera={{ position: [4, 2, 4], fov: 40 }}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.3} />
            <pointLight position={[3, 3, 3]} intensity={1.2} color="#c9a84c" />
            <CarUseCasePanel gesture={gesture} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
