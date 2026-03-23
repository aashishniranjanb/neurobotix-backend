import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const USE_CASES = {
  OPEN:    { label: 'ASSEMBLY · Panel Placement',   color: '#c9a84c' },
  GRAB:    { label: 'PRECISION · Component Install', color: '#4ac9c9' },
  FIST:    { label: 'SAFETY · Emergency Hold',       color: '#c94a4a' },
  POINT:   { label: 'INSPECTION · 360° Scan',        color: '#a84cc9' },
  NEUTRAL: { label: 'TRISYNC · Standby Mode',        color: '#888888' },
  IDLE:    { label: 'TRISYNC · Awaiting Signal',      color: '#666666' },
  FIRST_DETECTION: { label: 'TRISYNC · Activated', color: '#ffd700' },
  DEMO:    { label: 'DEMO · Playback Active',         color: '#44aa88' },
}

/**
 * CarUseCasePanel — Wireframe car model that changes color
 * and label based on detected gesture.
 * Supports external gyro rotation via gyroRotation prop.
 */
export default function CarUseCasePanel({ gesture, gyroRotation }) {
  const uc = USE_CASES[gesture] || USE_CASES.NEUTRAL
  const groupRef = useRef()
  const autoRotRef = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Auto rotation speed by gesture
    const speed = gesture === 'POINT' ? 1.2 : 0.4
    autoRotRef.current += delta * speed

    // Combine auto rotation + gyro override
    const gyroY = gyroRotation ? (gyroRotation.rotY * Math.PI) / 180 : 0
    const gyroX = gyroRotation ? (gyroRotation.rotX * Math.PI) / 180 : 0

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      autoRotRef.current + gyroY,
      0.1
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      gyroX * 0.3,  // dampen X tilt so it doesn't flip
      0.1
    )
  })

  return (
    <group ref={groupRef} scale={0.7}>

      {/* Car body */}
      <mesh>
        <boxGeometry args={[3, 0.8, 1.5]} />
        <meshStandardMaterial
          color={uc.color} wireframe
          emissive={uc.color} emissiveIntensity={0.6}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 0.5, 1.4]} />
        <meshStandardMaterial
          color={uc.color} wireframe
          emissive={uc.color} emissiveIntensity={0.3}
        />
      </mesh>

      {/* Axle line indicators */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[3.2, 0.02, 0.02]} />
        <meshStandardMaterial color={uc.color} emissive={uc.color} emissiveIntensity={0.8} />
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
          <meshStandardMaterial
            color="#555" metalness={0.8} roughness={0.3}
            emissive="#333" emissiveIntensity={0.2}
          />
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
