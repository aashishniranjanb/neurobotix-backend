import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

const USE_CASES = {
  OPEN:    { label: 'ASSEMBLY · Panel Placement',   color: '#c9a84c' },
  GRAB:    { label: 'PRECISION · Component Install', color: '#4ac9c9' },
  FIST:    { label: 'SAFETY · Emergency Hold',       color: '#c94a4a' },
  POINT:   { label: 'INSPECTION · 360° Scan',        color: '#a84cc9' },
  NEUTRAL: { label: 'TRISYNC · Standby Mode',        color: '#666666' },
  IDLE:    { label: 'TRISYNC · Awaiting Signal',      color: '#444444' },
  FIRST_DETECTION: { label: 'TRISYNC · Activated', color: '#ffd700' },
  DEMO:    { label: 'DEMO · Playback Active',         color: '#44aa88' },
}

/**
 * CarUseCasePanel — Wireframe car model that changes color
 * and label based on detected gesture.
 */
export default function CarUseCasePanel({ gesture }) {
  const uc = USE_CASES[gesture] || USE_CASES.NEUTRAL
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const speed = gesture === 'POINT' ? 1.2 : 0.4
    groupRef.current.rotation.y += delta * speed
  })

  return (
    <group ref={groupRef} scale={0.7}>

      {/* Car body */}
      <mesh>
        <boxGeometry args={[3, 0.8, 1.5]} />
        <meshStandardMaterial
          color={uc.color} wireframe
          emissive={uc.color} emissiveIntensity={0.4}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 0.5, 1.4]} />
        <meshStandardMaterial color={uc.color} wireframe />
      </mesh>

      {/* 4 Wheels */}
      {[
        [-1.1, -0.5, 0.8],
        [-1.1, -0.5, -0.8],
        [1.1, -0.5, 0.8],
        [1.1, -0.5, -0.8],
      ].map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Label */}
      <Text
        position={[0, -1.3, 0]}
        fontSize={0.22}
        color={uc.color}
        anchorX="center"
        anchorY="middle"
      >
        {uc.label}
      </Text>
    </group>
  )
}
