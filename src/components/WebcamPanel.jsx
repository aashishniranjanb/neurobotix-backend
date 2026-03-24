import { useRef, useEffect, useState } from 'react'

/**
 * WebcamPanel — Shows live webcam feed with holographic gesture overlay.
 * Falls back to a stylized visualization when camera is unavailable.
 */
export default function WebcamPanel({ gesture, syncId, clientCount, connected }) {
  const videoRef = useRef(null)
  const [camActive, setCamActive] = useState(false)
  const [camError, setCamError] = useState(false)

  useEffect(() => {
    let stream = null
    const startCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCamActive(true)
        }
      } catch (err) {
        console.warn('[WebcamPanel] Camera not available:', err.message)
        setCamError(true)
      }
    }
    startCam()
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  const gestureConfig = {
    OPEN:    { icon: '🖐', label: 'OPEN HAND',  action: 'Hood Opens · Assembly',     color: '#ffd700' },
    GRAB:    { icon: '🤏', label: 'PINCH/GRAB', action: 'Gripper · Precision',       color: '#00e5ff' },
    FIST:    { icon: '✊', label: 'FIST',       action: 'Emergency Hold · Freeze',    color: '#ff3333' },
    POINT:   { icon: '☝️', label: 'POINT',      action: 'Inspection · 360° Spin',    color: '#c86eff' },
    FORWARD: { icon: '🚗', label: 'FORWARD',    action: '3 Fingers · Cars Drive Fwd', color: '#4ade80' },
    REVERSE: { icon: '🔙', label: 'REVERSE',    action: '4 Fingers · Cars Back Up',   color: '#fb923c' },
    NEUTRAL: { icon: '✋', label: 'NEUTRAL',    action: 'Standby · Orbit',            color: '#999' },
    IDLE:    { icon: '⏳', label: 'IDLE',       action: 'Awaiting Hand...',            color: '#555' },
    DEMO:    { icon: '🎬', label: 'DEMO',       action: 'Playback Active',             color: '#44cc88' },
    FIRST_DETECTION: { icon: '⚡', label: 'DETECTED', action: 'TriSync Activated!',    color: '#ffd700' },
  }

  const gc = gestureConfig[gesture] || gestureConfig.IDLE

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#050508', position: 'relative', overflow: 'hidden',
    }}>

      {/* ── Camera Feed ───────────────────────────── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', transform: 'scaleX(-1)',
            filter: 'contrast(1.15) brightness(0.9) saturate(0.85)',
            display: camActive ? 'block' : 'none',
          }}
        />

        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Gold border */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '1px solid rgba(201,168,76,0.25)',
          pointerEvents: 'none',
        }} />

        {/* Corner brackets */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
          const isTop = corner.includes('top')
          const isLeft = corner.includes('left')
          return (
            <div key={corner} style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: 8,
              [isLeft ? 'left' : 'right']: 8,
              width: 22, height: 22,
              borderTop: isTop ? '2px solid #c9a84c66' : 'none',
              borderBottom: !isTop ? '2px solid #c9a84c66' : 'none',
              borderLeft: isLeft ? '2px solid #c9a84c66' : 'none',
              borderRight: !isLeft ? '2px solid #c9a84c66' : 'none',
              pointerEvents: 'none',
            }} />
          )
        })}

        {/* No camera — animated fallback */}
        {!camActive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 65%)',
          }}>
            {/* Animated ring pulse */}
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              border: '2px solid rgba(201,168,76,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'blink 2s infinite',
            }}>
              <span style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.3))',
              }}>
                {gc.icon}
              </span>
            </div>
            <div style={{
              marginTop: 16,
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6rem', color: '#c9a84c55',
              letterSpacing: '0.18em',
            }}>
              {camError ? 'CAMERA UNAVAILABLE' : 'CONNECTING CAMERA...'}
            </div>
            <div style={{
              marginTop: 6,
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.48rem', color: '#c9a84c33',
              letterSpacing: '0.12em',
            }}>
              OPENCV FEED · SYSTEM {connected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        )}

        {/* ── Header label ────────────────────────── */}
        <div style={{
          position: 'absolute', top: 10, left: 12,
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.55rem', color: '#c9a84c77',
          letterSpacing: '0.18em',
        }}>
          OPENCV FEED
        </div>

        {/* ── Live indicator ──────────────────────── */}
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.5rem',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block',
            animation: 'blink 1.5s infinite',
            boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #ff4444',
          }} />
          <span style={{ color: connected ? '#4ade80' : '#ff4444' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Gesture Display ───────────────────────── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(201,168,76,0.12)',
        background: 'linear-gradient(180deg, rgba(10,10,14,0.97) 0%, rgba(5,5,8,0.99) 100%)',
        fontFamily: "'Space Mono', monospace",
      }}>
        {/* Main gesture */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${gc.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${gc.color}08`,
            transition: 'border-color 0.4s, background 0.4s',
          }}>
            <span style={{
              fontSize: '1.4rem',
              filter: `drop-shadow(0 0 10px ${gc.color}55)`,
            }}>
              {gc.icon}
            </span>
          </div>
          <div>
            <div style={{
              fontSize: '1rem', fontWeight: 700,
              color: gc.color, letterSpacing: '0.1em',
              textShadow: `0 0 12px ${gc.color}33`,
              transition: 'color 0.4s',
            }}>
              {gc.label}
            </div>
            <div style={{
              fontSize: '0.58rem', color: '#c9a84c99',
              marginTop: 2, letterSpacing: '0.04em',
            }}>
              {gc.action}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 18,
          fontSize: '0.5rem', color: '#c9a84c44',
          letterSpacing: '0.1em', paddingTop: 4,
          borderTop: '1px solid rgba(201,168,76,0.08)',
        }}>
          <span>SYNC #{syncId}</span>
          <span>CLIENTS: {clientCount}</span>
          <span style={{ color: connected ? '#c9a84c77' : '#ff444466' }}>
            {connected ? '● CONNECTED' : '○ RECONNECTING'}
          </span>
        </div>
      </div>
    </div>
  )
}
