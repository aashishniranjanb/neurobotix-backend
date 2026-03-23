import { GESTURE_COLORS } from '../utils/xionMaterials'

/**
 * TriSyncHUD — Top bar showing XION 2026 branding,
 * gesture status, and bot sync count.
 */
export default function TriSyncHUD({ gesture, connected, syncId, clientCount }) {
  const gestureColor = GESTURE_COLORS[gesture] || GESTURE_COLORS.NEUTRAL

  return (
    <div style={{
      height: 60,
      background: 'rgba(0, 0, 0, 0.85)',
      borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      fontFamily: "'Space Mono', monospace",
      zIndex: 20,
      flexShrink: 0,
    }}>

      {/* Left: XION branding */}
      <div style={{
        color: '#c9a84c',
        fontSize: '1.2rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        XION 2026
      </div>

      {/* Center: Gesture display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ color: '#888', fontSize: '0.75rem' }}>GESTURE</span>
        <span style={{
          color: gestureColor,
          fontSize: '1rem',
          fontWeight: 700,
          padding: '4px 16px',
          border: `1px solid ${gestureColor}44`,
          borderRadius: 4,
          background: `${gestureColor}11`,
          letterSpacing: '0.1em',
        }}>
          {gesture || 'IDLE'}
        </span>
      </div>

      {/* Right: Sync status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: '0.8rem',
      }}>
        <span style={{
          color: clientCount >= 3 ? '#c9a84c' : '#ff6b6b',
          fontWeight: 700,
        }}>
          [{clientCount}/3] BOTS SYNCED
        </span>
        <span style={{
          color: connected ? '#4ade80' : '#ff4444',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: connected ? '#4ade80' : '#ff4444',
            display: 'inline-block',
            animation: connected ? 'none' : 'blink 1s infinite',
          }} />
          {connected ? 'CONNECTED' : 'OFFLINE'}
        </span>
        <span style={{ color: '#555' }}>
          SYNC#{syncId}
        </span>
      </div>
    </div>
  )
}
