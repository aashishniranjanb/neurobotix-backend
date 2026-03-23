import { useRef, useState, useCallback } from 'react'

/**
 * GyroControl — On-screen drag-to-rotate control box.
 * Provides X and Y rotation values (in degrees) via onChange callback.
 * Looks like a premium holographic gyroscope with gold accents.
 */
export default function GyroControl({ onChange, size = 130 }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const lastPos = useRef({ x: 0, y: 0 })

  const handleStart = useCallback((clientX, clientY) => {
    setDragging(true)
    lastPos.current = { x: clientX, y: clientY }
  }, [])

  const handleMove = useCallback((clientX, clientY) => {
    if (!dragging) return
    const dx = clientX - lastPos.current.x
    const dy = clientY - lastPos.current.y
    lastPos.current = { x: clientX, y: clientY }

    const sensitivity = 0.8
    const newRotY = (rotY + dx * sensitivity) % 360
    const newRotX = Math.max(-90, Math.min(90, rotX - dy * sensitivity))

    setRotX(newRotX)
    setRotY(newRotY)
    if (onChange) onChange({ rotX: newRotX, rotY: newRotY })
  }, [dragging, rotX, rotY, onChange])

  const handleEnd = useCallback(() => {
    setDragging(false)
  }, [])

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0]
    handleStart(t.clientX, t.clientY)
  }
  const onTouchMove = (e) => {
    const t = e.touches[0]
    handleMove(t.clientX, t.clientY)
  }

  // Indicator dot position on the pad
  const padR = size / 2 - 12
  const dotX = ((rotY % 360) / 360) * padR * 2 - padR
  const dotY = -(rotX / 90) * padR

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${dragging ? '#ffd700' : '#c9a84c88'}`,
        background: dragging
          ? 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, rgba(0,0,0,0.9) 80%)'
          : 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, rgba(0,0,0,0.95) 80%)',
        cursor: dragging ? 'grabbing' : 'grab',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: dragging
          ? '0 0 20px rgba(201,168,76,0.3), inset 0 0 15px rgba(201,168,76,0.1)'
          : '0 0 8px rgba(201,168,76,0.1)',
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
    >
      {/* Crosshair lines */}
      <div style={{
        position: 'absolute', top: '50%', left: 8, right: 8,
        height: 1, background: '#c9a84c33',
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: 8, bottom: 8,
        width: 1, background: '#c9a84c33',
      }} />

      {/* Dot indicator */}
      <div style={{
        position: 'absolute',
        left: `calc(50% + ${dotX}px)`,
        top: `calc(50% + ${dotY}px)`,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#ffd700',
        border: '2px solid #c9a84c',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 10px rgba(255,215,0,0.6)',
        transition: dragging ? 'none' : 'all 0.15s ease',
      }} />

      {/* Ring marks */}
      {[0, 90, 180, 270].map((deg) => {
        const r = padR + 4
        const x = Math.cos((deg * Math.PI) / 180) * r
        const y = Math.sin((deg * Math.PI) / 180) * r
        return (
          <div
            key={deg}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: 4, height: 4,
              borderRadius: '50%',
              background: '#c9a84c66',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}

      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: -22,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.55rem',
        color: '#c9a84c99',
        letterSpacing: '0.12em',
        whiteSpace: 'nowrap',
      }}>
        CHASSIS GYRO
      </div>

      {/* Readout */}
      <div style={{
        position: 'absolute',
        top: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.5rem',
        color: '#c9a84ccc',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}>
        X:{rotX.toFixed(0)}° Y:{rotY.toFixed(0)}°
      </div>
    </div>
  )
}
