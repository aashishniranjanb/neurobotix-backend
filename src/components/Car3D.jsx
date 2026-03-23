import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Car3D — 3 distinct car body types: sedan, suv, sports
 * Props:
 *   gesture      — current gesture string
 *   gyroRotation — { rotX, rotY } from GyroControl
 *   baseColor    — idle body color (hex)
 *   carType      — 'sedan' | 'suv' | 'sports'
 */

const GESTURE_CONFIG = {
  OPEN:    { color: '#ffd700', emissive: '#cc9900', hoodOpen: true,  spinSpeed: 0.4, label: 'ASSEMBLY' },
  GRAB:    { color: '#00e5ff', emissive: '#008899', hoodOpen: false, spinSpeed: 0.5, label: 'PRECISION' },
  FIST:    { color: '#ff3333', emissive: '#991111', hoodOpen: false, spinSpeed: 0.0, label: 'HOLD' },
  POINT:   { color: '#c86eff', emissive: '#7733aa', hoodOpen: false, spinSpeed: 1.2, label: 'INSPECT' },
  FORWARD: { color: '#4ade80', emissive: '#22aa55', hoodOpen: false, spinSpeed: 0,   label: 'FORWARD', drive: 1 },
  REVERSE: { color: '#fb923c', emissive: '#cc6622', hoodOpen: false, spinSpeed: 0,   label: 'REVERSE', drive: -1 },
  NEUTRAL: { color: null,      emissive: null,      hoodOpen: false, spinSpeed: 0,   label: 'STANDBY' },
  IDLE:    { color: null,      emissive: null,      hoodOpen: false, spinSpeed: 0,   label: 'IDLE' },
  DEMO:    { color: '#44cc88', emissive: '#227744', hoodOpen: true,  spinSpeed: 0.4, label: 'DEMO' },
  FIRST_DETECTION: { color: '#ffd700', emissive: '#ffaa00', hoodOpen: true, spinSpeed: 0.8, label: 'ACTIVATED' },
}

/* ── Body dimension presets ─────────────────────── */
const CAR_TYPES = {
  sedan: {
    bodyW: 3.6, bodyH: 0.65, bodyD: 1.6,
    cabinW: 1.8, cabinH: 0.5, cabinD: 1.4, cabinY: 0.6,
    wheelY: -0.38, wheelSpread: 0.9, wheelAxle: 1.1,
    tireR: 0.26, tireT: 0.11, rimR: 0.17, rimH: 0.14, rimSeg: 8,
    spoiler: false,
    roofRack: false,
  },
  suv: {
    bodyW: 3.8, bodyH: 0.85, bodyD: 1.8,
    cabinW: 2.2, cabinH: 0.7, cabinD: 1.6, cabinY: 0.8,
    wheelY: -0.45, wheelSpread: 1.0, wheelAxle: 1.2,
    tireR: 0.34, tireT: 0.18, rimR: 0.16, rimH: 0.2, rimSeg: 6,
    spoiler: false,
    roofRack: true,
  },
  sports: {
    bodyW: 3.9, bodyH: 0.5, bodyD: 1.55,
    cabinW: 1.4, cabinH: 0.4, cabinD: 1.3, cabinY: 0.48,
    wheelY: -0.32, wheelSpread: 0.88, wheelAxle: 1.2,
    tireR: 0.26, tireT: 0.07, rimR: 0.22, rimH: 0.08, rimSeg: 10,
    spoiler: true,
    roofRack: false,
  },
}

export default function Car3D({
  gesture,
  gyroRotation,
  baseColor = '#c9a84c',
  carType = 'sedan',
}) {
  const wrapperRef = useRef()
  const groupRef = useRef()
  const hoodRef = useRef()
  const wheelsRef = useRef([])
  const bodyGlowRef = useRef()
  const zRef = useRef(0) // z-offset for driving

  const cfg = GESTURE_CONFIG[gesture] || GESTURE_CONFIG.IDLE
  const dim = CAR_TYPES[carType] || CAR_TYPES.sedan

  const activeColor = cfg.color || baseColor
  const fallbackEmissive = new THREE.Color(baseColor).multiplyScalar(0.55).getStyle()
  const activeEmissive = cfg.emissive || fallbackEmissive

  useFrame((state, delta) => {
    if (!groupRef.current || !wrapperRef.current) return
    const t = state.clock.elapsedTime

    /* ── Driving (forward / reverse) ───────────── */
    const driveDir = cfg.drive || 0
    if (driveDir !== 0) {
      zRef.current = THREE.MathUtils.clamp(zRef.current + driveDir * 5 * delta, -12, 6)
    }
    wrapperRef.current.position.z = THREE.MathUtils.lerp(
      wrapperRef.current.position.z, zRef.current, 0.08
    )

    /* ── Rotation: only when spinSpeed > 0 ─────── */
    const gyroY = gyroRotation ? (gyroRotation.rotY * Math.PI) / 180 : 0
    const gyroX = gyroRotation ? (gyroRotation.rotX * Math.PI) / 180 * 0.3 : 0

    if (cfg.spinSpeed > 0) {
      const autoY = t * cfg.spinSpeed * 0.5
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, autoY + gyroY, 0.06)
    } else {
      // Only apply gyro, no auto-spin
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, gyroY, 0.06)
    }
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, gyroX, 0.06)

    /* ── Hood ──────────────────────────────────── */
    if (hoodRef.current) {
      const target = cfg.hoodOpen ? -0.6 : 0
      hoodRef.current.rotation.x = THREE.MathUtils.lerp(hoodRef.current.rotation.x, target, 0.05)
    }

    /* ── Wheels: spin when driving OR when spinSpeed > 0 */
    const wheelRate = (cfg.spinSpeed * 6) + (Math.abs(driveDir) * 12)
    wheelsRef.current.forEach(w => {
      if (w) w.rotation.x += delta * wheelRate * (driveDir < 0 ? -1 : 1 || 1)
    })

    /* ── Glow pulse ───────────────────────────── */
    if (bodyGlowRef.current) {
      bodyGlowRef.current.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.12
    }
  })

  const wheelPositions = [
    [ dim.wheelAxle, dim.wheelY,  dim.wheelSpread],
    [ dim.wheelAxle, dim.wheelY, -dim.wheelSpread],
    [-dim.wheelAxle, dim.wheelY,  dim.wheelSpread],
    [-dim.wheelAxle, dim.wheelY, -dim.wheelSpread],
  ]

  return (
    <group ref={wrapperRef}>
      <group ref={groupRef}>

        {/* ── MAIN BODY ──────────────────────── */}
        <mesh position={[0, 0, 0]} castShadow ref={bodyGlowRef}>
          <boxGeometry args={[dim.bodyW, dim.bodyH, dim.bodyD]} />
          <meshStandardMaterial
            color={activeColor} metalness={0.85} roughness={0.2}
            emissive={activeEmissive} emissiveIntensity={0.25}
          />
        </mesh>

        {/* Side panels */}
        <mesh position={[0, 0.05, dim.bodyD / 2 + 0.01]} castShadow>
          <boxGeometry args={[dim.bodyW - 0.2, dim.bodyH - 0.15, 0.03]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.05, -(dim.bodyD / 2 + 0.01)]} castShadow>
          <boxGeometry args={[dim.bodyW - 0.2, dim.bodyH - 0.15, 0.03]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[dim.bodyW / 2 + 0.05, -0.08, 0]} castShadow>
          <boxGeometry args={[0.12, dim.bodyH * 0.6, dim.bodyD - 0.1]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[-(dim.bodyW / 2 + 0.05), -0.08, 0]} castShadow>
          <boxGeometry args={[0.12, dim.bodyH * 0.6, dim.bodyD - 0.1]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ── CABIN / ROOF ──────────────────── */}
        <mesh position={[-0.15, dim.cabinY, 0]} castShadow>
          <boxGeometry args={[dim.cabinW, dim.cabinH, dim.cabinD]} />
          <meshStandardMaterial
            color="#1a1a2e" metalness={0.7} roughness={0.3}
            emissive={activeEmissive} emissiveIntensity={0.06}
          />
        </mesh>

        {/* Windshield */}
        <mesh position={[0.6, dim.cabinY - 0.05, 0]} rotation={[0, 0, 0.32]} castShadow>
          <boxGeometry args={[0.55, dim.cabinH - 0.05, dim.cabinD - 0.05]} />
          <meshStandardMaterial
            color="#1a3a5c" metalness={0.5} roughness={0.1}
            transparent opacity={0.55} emissive="#1a3a5c" emissiveIntensity={0.15}
          />
        </mesh>

        {/* Rear glass */}
        <mesh position={[-0.9, dim.cabinY - 0.05, 0]} rotation={[0, 0, -0.22]} castShadow>
          <boxGeometry args={[0.45, dim.cabinH - 0.05, dim.cabinD - 0.05]} />
          <meshStandardMaterial
            color="#1a3a5c" metalness={0.5} roughness={0.1} transparent opacity={0.45}
          />
        </mesh>

        {/* ── HOOD (animated) ────────────────── */}
        <group ref={hoodRef} position={[dim.bodyW / 2 - 0.6, dim.bodyH / 2 + 0.03, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.0, 0.05, dim.bodyD - 0.15]} />
            <meshStandardMaterial
              color={activeColor} metalness={0.9} roughness={0.15}
              emissive={activeEmissive} emissiveIntensity={0.4}
            />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.7, 0.015, 0.035]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* ── HEADLIGHTS ─────────────────────── */}
        {[0.45, -0.45].map((z, i) => (
          <mesh key={`hl${i}`} position={[dim.bodyW / 2, 0.08, z]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#fff" emissive="#ffeedd" emissiveIntensity={1.8} />
          </mesh>
        ))}

        {/* ── TAILLIGHTS ─────────────────────── */}
        {[0.45, -0.45].map((z, i) => (
          <mesh key={`tl${i}`} position={[-dim.bodyW / 2, 0.08, z]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2.0} />
          </mesh>
        ))}

        {/* ── WHEELS ─────────────────────────── */}
        {wheelPositions.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh rotation={[Math.PI / 2, 0, 0]} ref={el => { wheelsRef.current[i] = el }} castShadow>
              <torusGeometry args={[dim.tireR, dim.tireT, 12, 24]} />
              <meshStandardMaterial color="#111" metalness={0.15} roughness={0.95} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[dim.rimR, dim.rimR, dim.rimH, dim.rimSeg]} />
              <meshStandardMaterial
                color={carType === 'sports' ? '#eee' : carType === 'suv' ? '#888' : '#bbb'}
                metalness={0.85} roughness={0.15}
                emissive="#555" emissiveIntensity={0.15}
              />
            </mesh>
          </group>
        ))}

        {/* ── UNDERGLOW ──────────────────────── */}
        <mesh position={[0, dim.wheelY - 0.08, 0]}>
          <boxGeometry args={[dim.bodyW - 0.4, 0.02, dim.bodyD - 0.3]} />
          <meshStandardMaterial
            color={activeColor} emissive={activeEmissive}
            emissiveIntensity={1.0} transparent opacity={0.5}
          />
        </mesh>

        {/* ── SPOILER (sports only) ──────────── */}
        {dim.spoiler && (
          <>
            <mesh position={[-dim.bodyW / 2 + 0.2, dim.bodyH / 2 + 0.2, 0]}>
              <boxGeometry args={[0.3, 0.04, dim.bodyD - 0.1]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} emissive={activeEmissive} emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-dim.bodyW / 2 + 0.25, dim.bodyH / 2 + 0.1, 0.55]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-dim.bodyW / 2 + 0.25, dim.bodyH / 2 + 0.1, -0.55]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
          </>
        )}

        {/* ── ROOF RACK (SUV only) ──────────── */}
        {dim.roofRack && (
          <>
            <mesh position={[0, dim.cabinY + dim.cabinH / 2 + 0.06, 0]}>
              <boxGeometry args={[dim.cabinW - 0.3, 0.04, dim.cabinD + 0.1]} />
              <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
            </mesh>
            {[-0.4, 0.4].map((x, i) => (
              <mesh key={`rack${i}`} position={[x, dim.cabinY + dim.cabinH / 2 + 0.04, 0]}>
                <boxGeometry args={[0.04, 0.08, dim.cabinD + 0.1]} />
                <meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} />
              </mesh>
            ))}
          </>
        )}

      </group>
    </group>
  )
}
