import { useRef } from 'react'
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
  OPEN:    { color: '#ffd700', emissive: '#cc9900', hoodOpen: true,  spinSpeed: 0.25, label: 'ASSEMBLY' },
  GRAB:    { color: '#00e5ff', emissive: '#008899', hoodOpen: false, spinSpeed: 0.3,  label: 'PRECISION' },
  FIST:    { color: '#ff3333', emissive: '#991111', hoodOpen: false, spinSpeed: 0.0,  label: 'HOLD' },
  POINT:   { color: '#c86eff', emissive: '#7733aa', hoodOpen: false, spinSpeed: 0.4,  label: 'INSPECT' },
  FORWARD: { color: '#4ade80', emissive: '#22aa55', hoodOpen: false, spinSpeed: 0,    label: 'FORWARD', drive: 1 },
  REVERSE: { color: '#fb923c', emissive: '#cc6622', hoodOpen: false, spinSpeed: 0,    label: 'REVERSE', drive: -1 },
  NEUTRAL: { color: null,      emissive: null,      hoodOpen: false, spinSpeed: 0,    label: 'STANDBY' },
  IDLE:    { color: null,      emissive: null,      hoodOpen: false, spinSpeed: 0,    label: 'IDLE' },
  DEMO:    { color: '#44cc88', emissive: '#227744', hoodOpen: true,  spinSpeed: 0.25, label: 'DEMO' },
  FIRST_DETECTION: { color: '#ffd700', emissive: '#ffaa00', hoodOpen: true, spinSpeed: 0.5, label: 'ACTIVATED' },
}

/* ── Body dimension presets ─────────────────────── */
const CAR_TYPES = {
  sedan: {
    bodyW: 1.6, bodyH: 0.65, bodyL: 3.6,
    cabinW: 1.4, cabinH: 0.5, cabinL: 1.8, cabinY: 0.6,
    wheelY: -0.38, wheelX: 0.9, wheelZ: 1.1,
    tireR: 0.26, tireT: 0.11, rimR: 0.17, rimH: 0.14, rimSeg: 8,
    spoiler: false,
    roofRack: false,
  },
  suv: {
    bodyW: 1.8, bodyH: 0.85, bodyL: 3.8,
    cabinW: 1.6, cabinH: 0.7, cabinL: 2.2, cabinY: 0.8,
    wheelY: -0.45, wheelX: 1.0, wheelZ: 1.2,
    tireR: 0.34, tireT: 0.18, rimR: 0.16, rimH: 0.2, rimSeg: 6,
    spoiler: false,
    roofRack: true,
  },
  sports: {
    bodyW: 1.55, bodyH: 0.5, bodyL: 3.9,
    cabinW: 1.3, cabinH: 0.4, cabinL: 1.4, cabinY: 0.48,
    wheelY: -0.32, wheelX: 0.88, wheelZ: 1.2,
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
  const wheelGroupRefs = useRef([])
  const bodyGlowRef = useRef()
  const zRef = useRef(0)
  const wheelAngleRef = useRef(0)

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
      // Forward = +Z (towards camera), Reverse = -Z (away from camera)
      zRef.current = THREE.MathUtils.clamp(zRef.current + driveDir * 4 * delta, -10, 8)
    } else if (Math.abs(zRef.current) > 0.01) {
      // Slowly return to center when not driving
      zRef.current *= 0.97
    }
    wrapperRef.current.position.z = THREE.MathUtils.lerp(
      wrapperRef.current.position.z, zRef.current, 0.08
    )

    /* ── Rotation: only when spinSpeed > 0 ─────── */
    const gyroY = gyroRotation ? (gyroRotation.rotY * Math.PI) / 180 : 0
    const gyroX = gyroRotation ? (gyroRotation.rotX * Math.PI) / 180 * 0.3 : 0

    if (cfg.spinSpeed > 0) {
      const autoY = t * cfg.spinSpeed
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, autoY + gyroY, 0.04)
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, gyroY, 0.06)
    }
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -gyroX, 0.06)

    /* ── Hood ──────────────────────────────────── */
    if (hoodRef.current) {
      const target = cfg.hoodOpen ? -0.6 : 0
      hoodRef.current.rotation.x = THREE.MathUtils.lerp(hoodRef.current.rotation.x, target, 0.05)
    }

    /* ── Wheels: spin the GROUP around X (local axle) ── */
    const driveWheelSpeed = Math.abs(driveDir) * 12
    const spinWheelSpeed = cfg.spinSpeed * 4
    const totalWheelSpeed = driveWheelSpeed + spinWheelSpeed

    if (totalWheelSpeed > 0) {
      // Forward = wheels roll forward (negative X rotation)
      // Reverse = wheels roll backward (positive X rotation)
      const rollDirection = driveDir !== 0 ? -driveDir : -1
      wheelAngleRef.current += delta * totalWheelSpeed * rollDirection
    }

    // Apply wheel rotation to all wheel groups
    wheelGroupRefs.current.forEach(wg => {
      if (wg) {
        wg.rotation.x = wheelAngleRef.current
      }
    })

    /* ── Glow pulse ───────────────────────────── */
    if (bodyGlowRef.current) {
      bodyGlowRef.current.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.12
    }
  })

  const wheelPositions = [
    [ dim.wheelX, dim.wheelY,  dim.wheelZ],   // front-right
    [-dim.wheelX, dim.wheelY,  dim.wheelZ],   // front-left
    [ dim.wheelX, dim.wheelY, -dim.wheelZ],   // rear-right
    [-dim.wheelX, dim.wheelY, -dim.wheelZ],   // rear-left
  ]

  return (
    <group ref={wrapperRef}>
      <group ref={groupRef}>

        {/* ── MAIN BODY ──────────────────────── */}
        <mesh position={[0, 0, 0]} castShadow ref={bodyGlowRef}>
          <boxGeometry args={[dim.bodyW, dim.bodyH, dim.bodyL]} />
          <meshStandardMaterial
            color={activeColor} metalness={0.9} roughness={0.1}
            emissive={activeEmissive} emissiveIntensity={0.3}
          />
        </mesh>

        {/* Neon accent line on top edge */}
        <mesh position={[0, dim.bodyH / 2, 0]}>
          <boxGeometry args={[dim.bodyW + 0.02, 0.02, dim.bodyL + 0.02]} />
          <meshStandardMaterial color={activeColor} emissive={activeColor} emissiveIntensity={2} />
        </mesh>

        {/* Side panels */}
        <mesh position={[dim.bodyW / 2 + 0.01, 0.05, 0]} castShadow>
          <boxGeometry args={[0.03, dim.bodyH - 0.15, dim.bodyL - 0.2]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-(dim.bodyW / 2 + 0.01), 0.05, 0]} castShadow>
          <boxGeometry args={[0.03, dim.bodyH - 0.15, dim.bodyL - 0.2]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Front bumper */}
        <mesh position={[0, -0.08, dim.bodyL / 2 + 0.05]} castShadow>
          <boxGeometry args={[dim.bodyW - 0.1, dim.bodyH * 0.6, 0.12]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Rear bumper */}
        <mesh position={[0, -0.08, -(dim.bodyL / 2 + 0.05)]} castShadow>
          <boxGeometry args={[dim.bodyW - 0.1, dim.bodyH * 0.6, 0.12]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ── CABIN / ROOF ──────────────────── */}
        <mesh position={[0, dim.cabinY, -0.15]} castShadow>
          <boxGeometry args={[dim.cabinW, dim.cabinH, dim.cabinL]} />
          <meshStandardMaterial
            color="#1a1a2e" metalness={0.7} roughness={0.3}
            emissive={activeEmissive} emissiveIntensity={0.06}
          />
        </mesh>

        {/* Windshield */}
        <mesh position={[0, dim.cabinY - 0.05, 0.6]} rotation={[-0.32, 0, 0]} castShadow>
          <boxGeometry args={[dim.cabinW - 0.05, dim.cabinH - 0.05, 0.55]} />
          <meshStandardMaterial
            color="#1a3a5c" metalness={0.5} roughness={0.1}
            transparent opacity={0.55} emissive="#1a3a5c" emissiveIntensity={0.15}
          />
        </mesh>

        {/* Rear glass */}
        <mesh position={[0, dim.cabinY - 0.05, -0.9]} rotation={[0.22, 0, 0]} castShadow>
          <boxGeometry args={[dim.cabinW - 0.05, dim.cabinH - 0.05, 0.45]} />
          <meshStandardMaterial
            color="#1a3a5c" metalness={0.5} roughness={0.1} transparent opacity={0.45}
          />
        </mesh>

        {/* ── HOOD (animated) ────────────────── */}
        <group ref={hoodRef} position={[0, dim.bodyH / 2 + 0.03, dim.bodyL / 2 - 0.6]}>
          <mesh castShadow>
            <boxGeometry args={[dim.bodyW - 0.15, 0.05, 1.0]} />
            <meshStandardMaterial
              color={activeColor} metalness={0.9} roughness={0.15}
              emissive={activeEmissive} emissiveIntensity={0.4}
            />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.035, 0.015, 0.7]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* ── HEADLIGHTS ─────────────────────── */}
        {[0.45, -0.45].map((x, i) => (
          <mesh key={`hl${i}`} position={[x, 0.08, dim.bodyL / 2]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#fff" emissive="#ffeedd" emissiveIntensity={1.8} />
          </mesh>
        ))}

        {/* ── TAILLIGHTS ─────────────────────── */}
        {[0.45, -0.45].map((x, i) => (
          <mesh key={`tl${i}`} position={[x, 0.08, -dim.bodyL / 2]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2.0} />
          </mesh>
        ))}

        {/* ── WHEELS ─────────────────────────── */}
        {wheelPositions.map((pos, i) => (
          <group key={i} position={pos}>
            {/* This inner group rotates around X for rolling */}
            <group ref={el => { wheelGroupRefs.current[i] = el }}>
              {/* Torus (tire) — rotated 90deg around Z so it faces sideways */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[dim.tireR, dim.tireT, 12, 24]} />
                <meshStandardMaterial color="#111" metalness={0.15} roughness={0.95} />
              </mesh>
              {/* Rim cylinder — also rotated 90deg around Z */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[dim.rimR, dim.rimR, dim.rimH, dim.rimSeg]} />
                <meshStandardMaterial
                  color={carType === 'sports' ? '#eee' : carType === 'suv' ? '#888' : '#bbb'}
                  metalness={0.85} roughness={0.15}
                  emissive="#555" emissiveIntensity={0.15}
                />
              </mesh>
            </group>
          </group>
        ))}

        {/* ── UNDERGLOW ──────────────────────── */}
        <mesh position={[0, dim.wheelY - 0.08, 0]}>
          <boxGeometry args={[dim.bodyW - 0.3, 0.02, dim.bodyL - 0.4]} />
          <meshStandardMaterial
            color={activeColor} emissive={activeEmissive}
            emissiveIntensity={1.0} transparent opacity={0.5}
          />
        </mesh>

        {/* ── SPOILER (sports only) ──────────── */}
        {dim.spoiler && (
          <>
            <mesh position={[0, dim.bodyH / 2 + 0.2, -dim.bodyL / 2 + 0.2]}>
              <boxGeometry args={[dim.bodyW - 0.1, 0.04, 0.3]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} emissive={activeEmissive} emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0.55, dim.bodyH / 2 + 0.1, -dim.bodyL / 2 + 0.25]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.55, dim.bodyH / 2 + 0.1, -dim.bodyL / 2 + 0.25]}>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
          </>
        )}

        {/* ── ROOF RACK (SUV only) ──────────── */}
        {dim.roofRack && (
          <>
            <mesh position={[0, dim.cabinY + dim.cabinH / 2 + 0.06, -0.2]}>
              <boxGeometry args={[dim.cabinW + 0.1, 0.04, dim.cabinL - 0.3]} />
              <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
            </mesh>
            {[-0.4, 0.4].map((z, i) => (
              <mesh key={`rack${i}`} position={[0, dim.cabinY + dim.cabinH / 2 + 0.04, z]}>
                <boxGeometry args={[dim.cabinW + 0.1, 0.04, 0.04]} />
                <meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} />
              </mesh>
            ))}
          </>
        )}

      </group>
    </group>
  )
}
