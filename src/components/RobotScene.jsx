import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import RobotArm from './RobotArm'

export default function RobotScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas
        camera={{ position: [8, 6, 10], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        {/* Background color */}
        <color attach="background" args={['#0a0a0a']} />

        {/* ── Lighting ──────────────────────────── */}
        <ambientLight intensity={0.4} />

        <directionalLight
          position={[8, 12, 6]}
          intensity={2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <spotLight
          position={[-6, 10, 4]}
          angle={0.35}
          penumbra={0.6}
          intensity={1.8}
          castShadow
        />

        {/* Fill light from behind */}
        <pointLight position={[-4, 5, -8]} intensity={0.6} color="#4488ff" />

        {/* Rim light for gold reflections */}
        <spotLight
          position={[4, 3, -6]}
          angle={0.5}
          penumbra={0.8}
          intensity={1.0}
          color="#ffcc66"
        />

        {/* ── Futuristic Grid Floor ─────────────── */}
        <Grid
          args={[40, 40]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="#1a3a5c"
          sectionSize={5}
          sectionThickness={1.2}
          sectionColor="#2266aa"
          fadeDistance={50}
          fadeStrength={1.2}
          infiniteGrid
          position={[0, 0, 0]}
        />

        {/* ── Robot Arm ─────────────────────────── */}
        <RobotArm />

        {/* ── Camera Controls ───────────────────── */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={4}
          maxDistance={30}
          target={[0, 3.5, 0]}
        />
      </Canvas>
    </div>
  )
}
