import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid } from "@react-three/drei"

function RobotArm() {
  return (
    <group position={[0, 0, 0]}>

      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* Upper Arm */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.6, 3, 0.6]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.7}
          roughness={0.5}
        />
      </mesh>

      {/* Forearm */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[0.5, 2.5, 0.5]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={1}
          roughness={0.25}
        />
      </mesh>

      {/* Gripper */}
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[1, 0.3, 1]} />
        <meshStandardMaterial
          color="#ffd700"
          metalness={1}
          roughness={0.2}
          emissive="#aa8800"
          emissiveIntensity={0.4}
        />
      </mesh>

    </group>
  )
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0f0f0f" }}>

      <Canvas camera={{ position: [6, 6, 10] }}>

        <ambientLight intensity={0.5} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
        />

        <spotLight
          position={[-5, 8, 5]}
          angle={0.4}
          intensity={1.5}
        />
        <directionalLight position={[5, 10, 5]} intensity={2} />

        <Grid args={[20, 20]} />

        <RobotArm />

        <OrbitControls />

      </Canvas>

    </div>
  )
}