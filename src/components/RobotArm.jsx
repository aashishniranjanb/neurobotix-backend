import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRobotWebSocket } from '../hooks/useRobotWebSocket'

/* ── Premium material presets (brightened for stage visibility) ── */
const matteBlack = {
  color: '#2a2a2e', metalness: 0.6, roughness: 0.5,
  emissive: '#0a0a12', emissiveIntensity: 0.15,
}
const darkMetal = {
  color: '#3a3a40', metalness: 0.65, roughness: 0.45,
  emissive: '#12121a', emissiveIntensity: 0.12,
}
const gold = {
  color: '#d4af37', metalness: 1, roughness: 0.25,
  emissive: '#7a5a00', emissiveIntensity: 0.6,
}
const brightGold = {
  color: '#ffd700', metalness: 1, roughness: 0.2,
  emissive: '#cc9900', emissiveIntensity: 0.7,
}

/* ── Helper: degrees → radians ────────────────────── */
const deg2rad = (deg) => deg * (Math.PI / 180)

export default function RobotArm({ joints, gesture, theme = 'gold-matte' }) {
  /* ── Refs for each joint group ──────────────────── */
  const baseRef     = useRef()
  const shoulderRef = useRef()
  const elbowRef    = useRef()
  const wristRef    = useRef()
  const fingerLRef  = useRef()
  const fingerRRef  = useRef()

  /* ── Apply rotations every frame from props using lerp ─────── */
  useFrame((state) => {
    const lerpFactor = 0.12;
    const isIdle = !gesture || gesture === 'IDLE' || gesture === 'AWAITING GESTURE...';
    const elapsed = state.clock.elapsedTime;

    // Breath animation offsets
    const breathBase = isIdle ? Math.sin(elapsed * 0.5) * 5 : 0;
    const breathShoulder = isIdle ? Math.sin(elapsed * 0.6) * 3 : 0;
    const breathElbow = isIdle ? Math.cos(elapsed * 0.7) * 4 : 0;

    if (baseRef.current && joints) {
      baseRef.current.rotation.y = THREE.MathUtils.lerp(
        baseRef.current.rotation.y,
        deg2rad((joints.base || 0) + breathBase),
        lerpFactor
      )
    }
    if (shoulderRef.current && joints) {
      shoulderRef.current.rotation.x = THREE.MathUtils.lerp(
        shoulderRef.current.rotation.x,
        deg2rad((joints.shoulder || 0) + breathShoulder),
        lerpFactor
      )
    }
    if (elbowRef.current && joints) {
      elbowRef.current.rotation.x = THREE.MathUtils.lerp(
        elbowRef.current.rotation.x,
        deg2rad((joints.elbow || 0) + breathElbow),
        lerpFactor
      )
    }
    // Wrist and Gripper remain direct or dummy for now since backend doesn't output wrist angle explicitly yet in trisync, but we can lerp if available.
    if (wristRef.current && joints && joints.wrist !== undefined) {
      wristRef.current.rotation.x = THREE.MathUtils.lerp(
        wristRef.current.rotation.x,
        deg2rad(joints.wrist || 0),
        lerpFactor
      )
    }

    const gripperOpen = joints && joints.gripper && !isIdle ? 0.12 : 0;
    if (fingerLRef.current) {
        fingerLRef.current.position.x = THREE.MathUtils.lerp(
            fingerLRef.current.position.x, 
            -gripperOpen, 
            lerpFactor
        )
    }
    if (fingerRRef.current) {
        fingerRRef.current.position.x = THREE.MathUtils.lerp(
            fingerRRef.current.position.x,
            gripperOpen,
            lerpFactor
        )
    }
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
