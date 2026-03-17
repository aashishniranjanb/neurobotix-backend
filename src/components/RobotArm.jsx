import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Premium material presets ─────────────────────── */
const matteBlack = { color: '#111111', metalness: 0.8, roughness: 0.4 }
const darkMetal  = { color: '#1a1a1a', metalness: 0.75, roughness: 0.45 }
const gold       = { color: '#d4af37', metalness: 1, roughness: 0.25 }
const brightGold = {
  color: '#ffd700',
  metalness: 1,
  roughness: 0.2,
  emissive: '#aa8800',
  emissiveIntensity: 0.4,
}

/* ── Helper: degrees → radians ────────────────────── */
const deg2rad = (deg) => deg * (Math.PI / 180)

export default function RobotArm() {
  /* ── React state for joint angles (degrees) ─────── */
  const [angles, setAngles] = useState({
    baseAngle: 0,
    shoulderAngle: 0,
    elbowAngle: 0,
    wristAngle: 0,
    gripperOpen: 0,
  })

  /* ── Refs for each joint group ──────────────────── */
  const baseRef     = useRef()
  const shoulderRef = useRef()
  const elbowRef    = useRef()
  const wristRef    = useRef()
  const fingerLRef  = useRef()
  const fingerRRef  = useRef()

  /* ── State-driven animation loop (50 ms interval) ─ */
  useEffect(() => {
    let startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000  // seconds

      setAngles({
        baseAngle:     30 * Math.sin(elapsed * 0.4),       // ±30° slow sweep
        shoulderAngle: -20 + 15 * Math.sin(elapsed * 0.6), // oscillates –5° to –35°
        elbowAngle:    -25 + 20 * Math.cos(elapsed * 0.8), // oscillates –5° to –45°
        wristAngle:    15 * Math.sin(elapsed * 1.2),        // ±15° small oscillation
        gripperOpen:   0.12 + 0.1 * Math.sin(elapsed * 1.5), // open/close
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  /* ── Apply rotations every frame from state ─────── */
  useFrame(() => {
    if (baseRef.current)     baseRef.current.rotation.y     = deg2rad(angles.baseAngle)
    if (shoulderRef.current) shoulderRef.current.rotation.x  = deg2rad(angles.shoulderAngle)
    if (elbowRef.current)    elbowRef.current.rotation.x     = deg2rad(angles.elbowAngle)
    if (wristRef.current)    wristRef.current.rotation.x     = deg2rad(angles.wristAngle)

    if (fingerLRef.current)  fingerLRef.current.position.x = -angles.gripperOpen
    if (fingerRRef.current)  fingerRRef.current.position.x =  angles.gripperOpen
  })

  return (
    <group position={[0, 0.05, 0]} scale={1.15}>

      {/* ── Base Platform (static) ─────────────────── */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.6, 0.5, 48]} />
        <meshStandardMaterial {...matteBlack} />
      </mesh>

      {/* ── Base Turret (rotates Y) ────────────────── */}
      <group ref={baseRef} position={[0, 0.5, 0]}>

        {/* Collar */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.1, 0.6, 48]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>

        {/* Shoulder joint ring */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <torusGeometry args={[0.55, 0.18, 16, 48]} />
          <meshStandardMaterial {...gold} />
        </mesh>

        {/* ── Shoulder Group (rotates X) ───────────── */}
        <group ref={shoulderRef} position={[0, 1.0, 0]}>

          {/* Upper arm */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.55, 2.6, 0.55]} />
            <meshStandardMaterial {...darkMetal} />
          </mesh>

          {/* Gold accent strips */}
          <mesh position={[0.3, 1.3, 0]} castShadow>
            <boxGeometry args={[0.06, 2.2, 0.6]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[-0.3, 1.3, 0]} castShadow>
            <boxGeometry args={[0.06, 2.2, 0.6]} />
            <meshStandardMaterial {...gold} />
          </mesh>

          {/* Elbow joint sphere */}
          <mesh position={[0, 2.65, 0]} castShadow>
            <sphereGeometry args={[0.38, 32, 32]} />
            <meshStandardMaterial {...gold} />
          </mesh>

          {/* ── Elbow Group (rotates X) ────────────── */}
          <group ref={elbowRef} position={[0, 2.7, 0]}>

            {/* Forearm */}
            <mesh position={[0, 1.1, 0]} castShadow>
              <boxGeometry args={[0.45, 2.2, 0.45]} />
              <meshStandardMaterial {...matteBlack} />
            </mesh>

            {/* Gold detail strip */}
            <mesh position={[0, 1.1, 0.25]} castShadow>
              <boxGeometry args={[0.5, 1.8, 0.04]} />
              <meshStandardMaterial {...gold} />
            </mesh>

            {/* Wrist joint ring */}
            <mesh position={[0, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.28, 0.1, 12, 32]} />
              <meshStandardMaterial {...gold} />
            </mesh>

            {/* ── Wrist Group (rotates X) ──────────── */}
            <group ref={wristRef} position={[0, 2.45, 0]}>

              {/* Wrist plate */}
              <mesh position={[0, 0.1, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.35, 0.2, 32]} />
                <meshStandardMaterial {...darkMetal} />
              </mesh>

              {/* ── Gripper Assembly ────────────────── */}
              <group position={[0, 0.3, 0]}>

                {/* Gripper mount */}
                <mesh position={[0, 0.08, 0]} castShadow>
                  <boxGeometry args={[0.6, 0.15, 0.35]} />
                  <meshStandardMaterial {...matteBlack} />
                </mesh>

                {/* Left finger */}
                <group ref={fingerLRef} position={[-0.12, 0, 0]}>
                  <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.12, 0.6, 0.25]} />
                    <meshStandardMaterial {...brightGold} />
                  </mesh>
                  <mesh position={[0, 0.8, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.15, 0.18]} />
                    <meshStandardMaterial {...brightGold} />
                  </mesh>
                </group>

                {/* Right finger */}
                <group ref={fingerRRef} position={[0.12, 0, 0]}>
                  <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.12, 0.6, 0.25]} />
                    <meshStandardMaterial {...brightGold} />
                  </mesh>
                  <mesh position={[0, 0.8, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.15, 0.18]} />
                    <meshStandardMaterial {...brightGold} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
