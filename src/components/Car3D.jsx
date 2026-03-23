import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Car3D — A detailed 3D car model built from primitives.
 * Responds to gesture with color changes, hood animation,
 * wheel spin, and body glow.
 *
 * Props:
 *   gesture: string — current gesture
 *   gyroRotation: { rotX, rotY } — from GyroControl
 *   color: string — base color override
 *   label: string — unit label
 */

const GESTURE_CONFIG = {
  OPEN:    { color: '#ffd700', emissive: '#cc9900', hoodOpen: true,  spinSpeed: 0.3, label: 'ASSEMBLY' },
  GRAB:    { color: '#00e5ff', emissive: '#008899', hoodOpen: false, spinSpeed: 0.5, label: 'PRECISION' },
  FIST:    { color: '#ff3333', emissive: '#991111', hoodOpen: false, spinSpeed: 0.0, label: 'HOLD' },
  POINT:   { color: '#c86eff', emissive: '#7733aa', hoodOpen: false, spinSpeed: 1.5, label: 'INSPECT' },
  NEUTRAL: { color: '#aaaaaa', emissive: '#444444', hoodOpen: false, spinSpeed: 0.2, label: 'STANDBY' },
  IDLE:    { color: '#777777', emissive: '#333333', hoodOpen: false, spinSpeed: 0.15, label: 'IDLE' },
  DEMO:    { color: '#44cc88', emissive: '#227744', hoodOpen: true,  spinSpeed: 0.4, label: 'DEMO' },
  FIRST_DETECTION: { color: '#ffd700', emissive: '#ffaa00', hoodOpen: true, spinSpeed: 0.8, label: 'ACTIVATED' },
}

export default function Car3D({ gesture, gyroRotation, unitLabel = 'CAR α' }) {
  const groupRef = useRef()
  const hoodRef = useRef()
  const wheelsRef = useRef([])
  const bodyGlowRef = useRef()

  const config = GESTURE_CONFIG[gesture] || GESTURE_CONFIG.NEUTRAL

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Gyro-driven rotation with smooth lerp
    const gyroY = gyroRotation ? (gyroRotation.rotY * Math.PI) / 180 : 0
    const gyroX = gyroRotation ? (gyroRotation.rotX * Math.PI) / 180 * 0.3 : 0

    // Auto orbit + gyro
    const autoY = t * config.spinSpeed * 0.5
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      autoY + gyroY,
      0.08
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      gyroX,
      0.08
    )

    // Hood animation
    if (hoodRef.current) {
      const targetRot = config.hoodOpen ? -0.6 : 0
      hoodRef.current.rotation.x = THREE.MathUtils.lerp(
        hoodRef.current.rotation.x, targetRot, 0.05
      )
    }

    // Wheel spin
    wheelsRef.current.forEach(w => {
      if (w) w.rotation.x += delta * config.spinSpeed * 8
    })

    // Body glow pulse
    if (bodyGlowRef.current) {
      const pulse = 0.3 + Math.sin(t * 2) * 0.15
      bodyGlowRef.current.material.emissiveIntensity = pulse
    }
  })

  return (
    <group ref={groupRef}>

      {/* ── GROUND SHADOW DISC ──────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <circleGeometry args={[2.8, 48]} />
        <meshStandardMaterial
          color="#000000" transparent opacity={0.4}
        />
      </mesh>

      {/* ── MAIN BODY ──────────────────────────── */}
      <mesh position={[0, 0, 0]} castShadow ref={bodyGlowRef}>
        <boxGeometry args={[3.6, 0.7, 1.6]} />
        <meshStandardMaterial
          color={config.color}
          metalness={0.85}
          roughness={0.2}
          emissive={config.emissive}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Body side panels — darker accent */}
      <mesh position={[0, 0.05, 0.82]} castShadow>
        <boxGeometry args={[3.4, 0.5, 0.04]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, -0.82]} castShadow>
        <boxGeometry args={[3.4, 0.5, 0.04]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[1.85, -0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 1.5]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[-1.85, -0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 1.5]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ── CABIN / ROOF ──────────────────────── */}
      <mesh position={[-0.15, 0.65, 0]} castShadow>
        <boxGeometry args={[1.8, 0.55, 1.4]} />
        <meshStandardMaterial
          color="#1a1a2a"
          metalness={0.7}
          roughness={0.3}
          emissive={config.emissive}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Windshield (front glass) */}
      <mesh position={[0.65, 0.55, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.6, 0.55, 1.35]} />
        <meshStandardMaterial
          color="#1a3a5c"
          metalness={0.5}
          roughness={0.1}
          transparent opacity={0.6}
          emissive="#1a3a5c"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Rear glass */}
      <mesh position={[-0.95, 0.55, 0]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.5, 0.5, 1.35]} />
        <meshStandardMaterial
          color="#1a3a5c"
          metalness={0.5}
          roughness={0.1}
          transparent opacity={0.5}
        />
      </mesh>

      {/* ── HOOD (animated) ────────────────────── */}
      <group ref={hoodRef} position={[1.2, 0.38, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.06, 1.45]} />
          <meshStandardMaterial
            color={config.color}
            metalness={0.9}
            roughness={0.15}
            emissive={config.emissive}
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Hood line accent */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.8, 0.02, 0.04]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ── HEADLIGHTS ─────────────────────────── */}
      <mesh position={[1.82, 0.1, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffeedd"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[1.82, 0.1, -0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffeedd"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* ── TAILLIGHTS ─────────────────────────── */}
      <mesh position={[-1.82, 0.1, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff0000"
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[-1.82, 0.1, -0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ff2222"
          emissive="#ff0000"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* ── 4 WHEELS ───────────────────────────── */}
      {[
        [1.1, -0.4, 0.9],
        [1.1, -0.4, -0.9],
        [-1.1, -0.4, 0.9],
        [-1.1, -0.4, -0.9],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          {/* Tire */}
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            ref={el => { wheelsRef.current[i] = el }}
            castShadow
          >
            <torusGeometry args={[0.28, 0.12, 12, 24]} />
            <meshStandardMaterial
              color="#1a1a1a" metalness={0.3} roughness={0.8}
            />
          </mesh>
          {/* Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.15, 8]} />
            <meshStandardMaterial
              color="#aaa" metalness={0.95} roughness={0.1}
              emissive="#444" emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* ── UNDERGLOW ──────────────────────────── */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[3.2, 0.02, 1.3]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={0.8}
          transparent opacity={0.5}
        />
      </mesh>

      {/* ── SPOILER (rear) ─────────────────────── */}
      <mesh position={[-1.6, 0.55, 0]}>
        <boxGeometry args={[0.3, 0.04, 1.5]} />
        <meshStandardMaterial
          color="#222" metalness={0.8} roughness={0.2}
          emissive={config.emissive} emissiveIntensity={0.3}
        />
      </mesh>
      {/* Spoiler pillars */}
      <mesh position={[-1.5, 0.45, 0.6]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.5, 0.45, -0.6]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

    </group>
  )
}
