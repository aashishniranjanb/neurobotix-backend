import { useRef, useEffect, useState, useCallback } from 'react'

/**
 * WebcamPanel — Shows live webcam feed with gesture overlay.
 * If camera unavailable, shows a stylized fallback visualization.
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
    OPEN:    { icon: '🖐', label: 'OPEN HAND', action: 'Hood Opens · Assembly', color: '#ffd700' },
    GRAB:    { icon: '🤏', label: 'PINCH/GRAB', action: 'Gripper · Precision', color: '#00e5ff' },
    FIST:    { icon: '✊', label: 'FIST', action: 'Emergency Hold · Freeze', color: '#ff3333' },
    POINT:   { icon: '☝️', label: 'POINT', action: 'Inspection · 360° Spin', color: '#c86eff' },
    NEUTRAL: { icon: '✋', label: 'NEUTRAL', action: 'Standby · Orbit', color: '#aaaaaa' },
    IDLE:    { icon: '⏳', label: 'IDLE', action: 'Awaiting Hand...', color: '#666666' },
    DEMO:    { icon: '🎬', label: 'DEMO', action: 'Playback Active', color: '#44cc88' },
    FIRST_DETECTION: { icon: '⚡', label: 'DETECTED', action: 'TriSync Activated!', color: '#ffd700' },
  }

  const gc = gestureConfig[gesture] || gestureConfig.IDLE

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#050508',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Camera Feed ───────────────────────────── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            filter: 'contrast(1.1) brightness(0.85)',
            display: camActive ? 'block' : 'none',
          }}
        />

        {/* Scanline overlay for holographic feel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
        }} />

        {/* Gold border overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 2,
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
              width: 20, height: 20,
              borderTop: isTop ? '2px solid #c9a84c77' : 'none',
              borderBottom: !isTop ? '2px solid #c9a84c77' : 'none',
              borderLeft: isLeft ? '2px solid #c9a84c77' : 'none',
              borderRight: !isLeft ? '2px solid #c9a84c77' : 'none',
              pointerEvents: 'none',
            }} />
          )
        })}

        {/* No camera fallback */}
        {!camActive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)',
          }}>
            <div style={{
              fontSize: '4rem', marginBottom: 16,
              filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))',
            }}>
              {gc.icon}
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.65rem',
              color: '#c9a84c66',
              letterSpacing: '0.15em',
            }}>
              {camError ? 'CAMERA UNAVAILABLE' : 'CONNECTING CAMERA...'}
            </div>
          </div>
        )}

        {/* ── Header label ────────────────────────── */}
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6rem',
          color: '#c9a84c99',
          letterSpacing: '0.15em',
        }}>
          OPENCV FEED
        </div>

        {/* ── Live indicator ──────────────────────── */}
        <div style={{
          position: 'absolute', top: 12, right: 14,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.55rem',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block',
            animation: 'blink 1.5s infinite',
            boxShadow: connected ? '0 0 6px #4ade80' : '0 0 6px #ff4444',
          }} />
          <span style={{ color: connected ? '#4ade80' : '#ff4444' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Gesture Display ───────────────────────── */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(5,5,8,0.95)',
        fontFamily: "'Space Mono', monospace",
      }}>
        {/* Main gesture */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: '1.8rem',
            filter: `drop-shadow(0 0 12px ${gc.color}66)`,
          }}>
            {gc.icon}
          </span>
          <div>
            <div style={{
              fontSize: '1.1rem', fontWeight: 700,
              color: gc.color,
              letterSpacing: '0.1em',
              textShadow: `0 0 15px ${gc.color}44`,
            }}>
              {gc.label}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: '#c9a84caa',
              marginTop: 2,
            }}>
              {gc.action}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 20,
          fontSize: '0.55rem', color: '#c9a84c66',
          letterSpacing: '0.1em',
        }}>
          <span>SYNC #{syncId}</span>
          <span>CLIENTS: {clientCount}</span>
          <span>{connected ? '● CONNECTED' : '○ RECONNECTING'}</span>
        </div>
      </div>
    </div>
  )
}
