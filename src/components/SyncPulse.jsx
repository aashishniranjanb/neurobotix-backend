import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SyncPulse — Animated gold ring that pulses outward
 * on each new sync_id, proving synchronization to the audience.
 */
export default function SyncPulse({ active, syncId }) {
  const ringRef = useRef()
  const prevSyncId = useRef(0)
  const pulseScale = useRef(0.1)
  const pulseOpacity = useRef(0)

  useFrame(() => {
    if (!ringRef.current) return

    // Trigger pulse on new sync_id
    if (syncId !== prevSyncId.current) {
      prevSyncId.current = syncId
      pulseScale.current = 0.3
      pulseOpacity.current = 0.8
    }

    // Expand and fade
    pulseScale.current += 0.06
    pulseOpacity.current = Math.max(0, pulseOpacity.current - 0.015)

    ringRef.current.scale.set(pulseScale.current, pulseScale.current, pulseScale.current)
    ringRef.current.material.opacity = pulseOpacity.current
  })

  return (
    <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.8, 3.0, 64]} />
      <meshBasicMaterial
        color="#c9a84c"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
