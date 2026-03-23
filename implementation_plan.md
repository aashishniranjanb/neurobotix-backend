# XION 2026 — IMPLEMENTATION PLAN
## *TriSync Bots × Digital Twin Showcase*
### Theme: Gold · Matte Black · Antigravity

---

> **Mission Statement:** One human hand. Three robotic minds. One synchronized moment.  
> A live, full-stack demonstration of real-time multi-robot gesture control — rendered as a premium holographic experience for the Xion 2026 stage.

---

## 0. CRITICAL DESIGN REVIEW (Pre-Build Audit)

Before writing a single line of new code, the existing architecture must be evaluated against what the showcase demands. This is not optional — presentation failures in live demos are almost always caused by skipped design reviews.

### 0.1 What the Existing System Does Well
- MediaPipe Hands delivers 21 landmarks at 30fps — adequate for gesture classification
- WebSocket server is already live on `ws://localhost:8765` — proven pipe
- Three.js frontend with premium materials already exists — visual foundation is solid

### 0.2 Critical Gaps (Must Resolve Before Build)
| Gap | Severity | Risk If Ignored |
|-----|----------|-----------------|
| Frontend uses `setInterval` dummy loop — WebSocket NOT connected | **CRITICAL** | Demo shows fake data, zero credibility |
| Architecture is 1:1 (one hand → one robot) | **CRITICAL** | TriSync (1→3) requires broadcast redesign |
| No holographic OpenCV overlay exists | **HIGH** | Chief Guest reveal has no visual impact |
| No gesture classification layer | **HIGH** | Raw angles ≠ intentional commands |
| No synchronization protocol between 3 robots | **HIGH** | Bots drift independently, look broken |
| `node_modules` committed to repo | **MEDIUM** | Deploy failures on stage machine |
| Duplicate `frontend/` folder in repo | **LOW** | Developer confusion during crunch |

### 0.3 Core Design Constraints
1. **Latency budget:** End-to-end gesture → all 3 robot visuals ≤ 80ms (below human perception threshold for sync)
2. **Reliability:** Zero crashes during Chief Guest unveil (requires offline-first design — no cloud dependency at demo moment)
3. **Visual fidelity:** Both screens must be presentable at 1080p minimum
4. **Graceful degradation:** If camera fails, fallback to pre-recorded gesture sequence

---

## 1. SYSTEM ARCHITECTURE — FULL STACK

```
╔══════════════════════════════════════════════════════════════════════╗
║                     XION 2026 — SYSTEM TOPOLOGY                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  [ WEBCAM ]                                                          ║
║      │                                                               ║
║      ▼                                                               ║
║  ┌──────────────────────────────────────────────────────────┐       ║
║  │              BACKEND  (backend/server.py)                 │       ║
║  │                                                           │       ║
║  │  OpenCV Frame Capture                                     │       ║
║  │      │                                                    │       ║
║  │      ▼                                                    │       ║
║  │  MediaPipe Hands (21 landmarks @ 30fps)                   │       ║
║  │      │                                                    │       ║
║  │      ▼                                                    │       ║
║  │  Gesture Classifier Layer                                 │       ║
║  │  (Landmark → State: OPEN / GRAB / POINT / SWIPE_L/R)     │       ║
║  │      │                                                    │       ║
║  │      ▼                                                    │       ║
║  │  Joint Angle Mapper (base/shoulder/elbow/gripper)         │       ║
║  │      │                                                    │       ║
║  │      ▼                                                    │       ║
║  │  Holographic Overlay Renderer  ◄── DISPLAY WINDOW 1      │       ║
║  │  (OpenCV: dark bg + gold hand skeleton + particles)       │       ║
║  │      │                                                    │       ║
║  │      ▼                                                    │       ║
║  │  WebSocket Broadcaster → ws://localhost:8765              │       ║
║  │  Message: { joints, gesture, timestamp, sync_id }         │       ║
║  └──────────────────────────────────────────────────────────┘       ║
║           │                                                          ║
║     ┌─────┴──────────────────────┐                                   ║
║     ▼                            ▼                                   ║
║  DISPLAY 2                    DISPLAY 3                              ║
║  ┌─────────────────┐          ┌──────────────────────────────────┐   ║
║  │  SYSTEM 1       │          │  SYSTEM 2 — MAIN STAGE           │   ║
║  │  Digital Twin   │          │  TriSync Bots Dashboard          │   ║
║  │  Single Robot   │          │  3× Robot Arms (synchronized)    │   ║
║  │  React/Three.js │          │  + Holographic Hand overlay      │   ║
║  │  Gold+MattBlk   │          │  + Car Use-Case Holograms        │   ║
║  └─────────────────┘          └──────────────────────────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 2. SYSTEM 1 — DIGITAL TWIN (Repair + Polish)

### 2.1 Objective
Bridge the existing dummy animation to the live WebSocket feed. This system acts as the **proof of concept** display — shown while the audience settles before the main TriSync reveal.

### 2.2 WebSocket Hook (Drop-in Replacement)

**File:** `src/hooks/useRobotWebSocket.js`

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';

const RECONNECT_DELAY = 1500;
const WS_URL = 'ws://localhost:8765';

export function useRobotWebSocket() {
  const [joints, setJoints] = useState({
    base: 90, shoulder: 45, elbow: 30, gripper: 0
  });
  const [gesture, setGesture] = useState('IDLE');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setJoints(data.joints);
        setGesture(data.gesture);
      } catch (_) {}
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, RECONNECT_DELAY); // auto-reconnect
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { joints, gesture, connected };
}
```

**Replace in `RobotArm.jsx`:**
```javascript
// REMOVE: setInterval dummy loop
// ADD:
const { joints, gesture, connected } = useRobotWebSocket();

// Map joints → Three.js rotation:
baseRef.current.rotation.y = THREE.MathUtils.degToRad(joints.base);
shoulderRef.current.rotation.x = THREE.MathUtils.degToRad(joints.shoulder);
elbowRef.current.rotation.x = THREE.MathUtils.degToRad(joints.elbow);
```

### 2.3 Visual Theme Enforcement (Gold + Matte Black)

```javascript
// Materials
const mattBlack = new THREE.MeshStandardMaterial({
  color: '#1a1a1a', roughness: 0.85, metalness: 0.2
});
const goldAccent = new THREE.MeshStandardMaterial({
  color: '#c9a84c', roughness: 0.3, metalness: 0.9,
  emissive: '#3d2a00', emissiveIntensity: 0.4
});

// Lighting (cinematic — warm key, cool fill)
<pointLight position={[3, 5, 3]} color="#f5c842" intensity={1.8} />
<pointLight position={[-3, 2, -2]} color="#4a90d9" intensity={0.6} />
<ambientLight intensity={0.15} />
```

### 2.4 Status HUD Overlay

```javascript
// Corner HUD — shown on System 1 screen
<div style={{
  position: 'fixed', bottom: 24, left: 24,
  color: connected ? '#c9a84c' : '#ff4444',
  fontFamily: 'monospace', fontSize: 13,
  background: 'rgba(0,0,0,0.7)',
  padding: '8px 16px', borderRadius: 6,
  border: `1px solid ${connected ? '#c9a84c' : '#ff4444'}`
}}>
  {connected ? `⬡ LIVE · GESTURE: ${gesture}` : '⬡ RECONNECTING...'}
</div>
```

---

## 3. SYSTEM 2 — TRISYNC BOTS (Main Stage Build)

### 3.1 Core Philosophy: One Signal, Three Receivers

TriSync's design invariant: **every robot receives the identical joint payload at the identical timestamp**. Divergence is not a feature — it is a failure.

```
Gesture Signal → Broadcaster → [Robot A] [Robot B] [Robot C]
                                    ↑           ↑          ↑
                              All receive same JSON, same sync_id
```

### 3.2 Backend: Broadcaster Upgrade

**File:** `backend/trisync_server.py`

```python
import asyncio
import websockets
import cv2
import mediapipe as mp
import json
import time
import numpy as np
from collections import deque

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.75)

CLIENTS = set()
SMOOTHING_WINDOW = 5
angle_history = {k: deque(maxlen=SMOOTHING_WINDOW) 
                 for k in ['base', 'shoulder', 'elbow']}

def classify_gesture(landmarks):
    """Pure rule-based classifier — deterministic, zero latency."""
    wrist = landmarks[0]
    index_tip = landmarks[8]
    middle_tip = landmarks[12]
    ring_tip = landmarks[16]
    pinky_tip = landmarks[20]
    index_mcp = landmarks[5]

    # Finger extension check
    fingers_up = sum([
        index_tip.y < index_mcp.y,
        middle_tip.y < landmarks[9].y,
        ring_tip.y < landmarks[13].y,
        pinky_tip.y < landmarks[17].y,
    ])

    dist_im = np.hypot(index_tip.x - middle_tip.x, 
                       index_tip.y - middle_tip.y)

    if fingers_up == 0:
        return "FIST"
    elif fingers_up == 4:
        return "OPEN"
    elif fingers_up == 1:
        return "POINT"
    elif dist_im < 0.04:
        return "GRAB"
    return "NEUTRAL"

def smooth(key, raw_val):
    angle_history[key].append(raw_val)
    return round(sum(angle_history[key]) / len(angle_history[key]), 2)

def landmarks_to_joints(lm):
    wrist = lm[0]
    index_y = lm[8].y
    middle_y = lm[12].y
    dist = abs(lm[8].x - lm[12].x)

    base = smooth('base', int((1 - wrist.x) * 180))
    shoulder = smooth('shoulder', int((1 - index_y) * 90))
    elbow = smooth('elbow', int((1 - middle_y) * 90))
    gripper = 1 if dist < 0.04 else 0

    return {'base': base, 'shoulder': shoulder,
            'elbow': elbow, 'gripper': gripper}

async def broadcast(message):
    if CLIENTS:
        await asyncio.gather(*[c.send(message) for c in CLIENTS],
                             return_exceptions=True)

async def handler(websocket):
    CLIENTS.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)

async def camera_loop():
    cap = cv2.VideoCapture(0)
    sync_id = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.033)
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        if results.multi_hand_landmarks:
            lm = results.multi_hand_landmarks[0].landmark
            joints = landmarks_to_joints(lm)
            gesture = classify_gesture(lm)

            payload = json.dumps({
                'joints': joints,
                'gesture': gesture,
                'timestamp': time.time(),
                'sync_id': sync_id,
                'client_count': len(CLIENTS)
            })
            await broadcast(payload)
            
            # Render holographic overlay (see Section 4)
            render_holographic_overlay(frame, lm, gesture, joints, 
                                        len(CLIENTS), sync_id)
            sync_id += 1

        await asyncio.sleep(0.033)  # ~30fps

async def main():
    server = await websockets.serve(handler, 'localhost', 8765)
    await asyncio.gather(server.wait_closed(), camera_loop())

if __name__ == '__main__':
    asyncio.run(main())
```

### 3.3 Frontend: TriSync Dashboard

**File:** `src/pages/TriSyncDashboard.jsx`

```jsx
import { Canvas } from '@react-three/fiber';
import { useRobotWebSocket } from '../hooks/useRobotWebSocket';
import RobotArm from '../components/RobotArm';
import HolographicHand from '../components/HolographicHand';
import CarUseCasePanel from '../components/CarUseCasePanel';
import SyncPulse from '../components/SyncPulse';

const BOT_CONFIGS = [
  { id: 'ALPHA', label: 'UNIT α', offset: [-5, 0, 0], delay: 0 },
  { id: 'BETA',  label: 'UNIT β', offset: [0, 0, 0],  delay: 0 },
  { id: 'GAMMA', label: 'UNIT γ', offset: [5, 0, 0],  delay: 0 },
];

export default function TriSyncDashboard() {
  const { joints, gesture, connected, syncId, clientCount } = useRobotWebSocket();

  return (
    <div style={{ background: '#0a0a0a', width: '100vw', height: '100vh',
                  display: 'flex', flexDirection: 'column' }}>
      
      {/* Top HUD Bar */}
      <TriSyncHUD gesture={gesture} connected={connected} 
                  syncId={syncId} clientCount={clientCount} />

      {/* Main Stage: 3 Robots */}
      <div style={{ flex: 1, display: 'flex' }}>
        <Canvas camera={{ position: [0, 3, 12], fov: 55 }}>
          <GoldLighting />
          <HolographicGridFloor />
          
          {BOT_CONFIGS.map(bot => (
            <group key={bot.id} position={bot.offset}>
              <RobotArm joints={joints} theme="gold-matte" />
              <BotLabel label={bot.label} />
            </group>
          ))}

          <SyncPulse active={connected} syncId={syncId} />
        </Canvas>
      </div>

      {/* Bottom: Holographic Hand + Car Use Cases */}
      <div style={{ height: 220, display: 'flex', 
                    borderTop: '1px solid #c9a84c22' }}>
        <HolographicHand gesture={gesture} joints={joints} />
        <CarUseCasePanel gesture={gesture} />
      </div>
    </div>
  );
}
```

### 3.4 Synchronization Guarantee

All three robots in the DOM receive the **same React state update** from a single `useRobotWebSocket` hook, passed as props. This is architecturally guaranteed to be synchronous within a single React render cycle — no independent subscriptions, no drift.

```
WebSocket message
      │
      ▼
useRobotWebSocket() ← single source of truth
      │
      ├─► <RobotArm joints={joints} /> (ALPHA)
      ├─► <RobotArm joints={joints} /> (BETA)  ← same object ref
      └─► <RobotArm joints={joints} /> (GAMMA)
```

---

## 4. HOLOGRAPHIC OVERLAY SYSTEM (OpenCV)

### 4.1 Design Specification

The holographic window is displayed on the **presenter's laptop screen** or a third monitor. It shows:
- Dark (near-black) background with subtle gold grid
- Real-time hand skeleton rendered in gold/cyan gradient lines
- Per-joint angle annotations in monospace gold text
- Gesture label with confidence indicator
- Particle field emanating from active fingertips
- Connected client count (proves TriSync is live)

### 4.2 Implementation

**File:** `backend/holographic_renderer.py`

```python
import cv2
import numpy as np
import math

GOLD = (50, 168, 201)        # BGR: gold
GOLD_DIM = (20, 80, 100)
CYAN = (200, 220, 50)
MATTE = (20, 20, 20)
WHITE = (220, 220, 220)
RED_ALERT = (50, 50, 220)

HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),      # thumb
    (0,5),(5,6),(6,7),(7,8),      # index
    (0,9),(9,10),(10,11),(11,12), # middle
    (0,13),(13,14),(14,15),(15,16),# ring
    (0,17),(17,18),(18,19),(19,20) # pinky
]

FINGERTIP_IDS = [4, 8, 12, 16, 20]
particles = []

def add_particles(cx, cy, color=GOLD):
    for _ in range(3):
        particles.append({
            'x': cx, 'y': cy,
            'vx': np.random.uniform(-2, 2),
            'vy': np.random.uniform(-4, -1),
            'life': 1.0,
            'color': color
        })

def update_particles(canvas):
    global particles
    alive = []
    for p in particles:
        p['x'] += p['vx']
        p['y'] += p['vy']
        p['life'] -= 0.04
        if p['life'] > 0:
            alpha = int(p['life'] * 255)
            color = tuple(int(c * p['life']) for c in p['color'])
            cv2.circle(canvas, (int(p['x']), int(p['y'])), 2, color, -1)
            alive.append(p)
    particles = alive[-200:]  # cap particle count

def render_holographic_overlay(frame, landmarks, gesture, joints, 
                                client_count, sync_id):
    H, W = frame.shape[:2]
    canvas = np.zeros((H, W, 3), dtype=np.uint8)
    canvas[:] = (12, 10, 8)  # near-black matte background

    # Gold grid
    for i in range(0, W, 60):
        cv2.line(canvas, (i, 0), (i, H), (30, 25, 15), 1)
    for i in range(0, H, 60):
        cv2.line(canvas, (0, i), (W, i), (30, 25, 15), 1)

    if landmarks:
        pts = [(int(lm.x * W), int(lm.y * H)) for lm in landmarks]

        # Draw connections
        for a, b in HAND_CONNECTIONS:
            t = b / 20.0
            color = tuple(int(CYAN[c] * t + GOLD[c] * (1-t)) for c in range(3))
            cv2.line(canvas, pts[a], pts[b], color, 2, cv2.LINE_AA)

        # Draw joints
        for i, pt in enumerate(pts):
            r = 5 if i in FINGERTIP_IDS else 3
            cv2.circle(canvas, pt, r + 2, GOLD_DIM, -1)
            cv2.circle(canvas, pt, r, GOLD, -1)
            if i in FINGERTIP_IDS:
                add_particles(pt[0], pt[1])

        # Wrist label
        wx, wy = pts[0]
        cv2.putText(canvas, 'WRIST', (wx+8, wy-8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, GOLD_DIM, 1)

    update_particles(canvas)

    # Gesture banner
    banner_color = GOLD if gesture != 'FIST' else CYAN
    cv2.rectangle(canvas, (20, 20), (320, 70), (0,0,0), -1)
    cv2.rectangle(canvas, (20, 20), (320, 70), banner_color, 1)
    cv2.putText(canvas, f'GESTURE: {gesture}', (30, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, banner_color, 2)

    # Joint readout
    y0 = 100
    for name, val in joints.items():
        label = f'{name.upper():12s}: {val:>5.1f}{"°" if name != "gripper" else ""}'
        cv2.putText(canvas, label, (30, y0),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)
        y0 += 28

    # Sync status
    sync_color = GOLD if client_count >= 3 else RED_ALERT
    status = f'TRISYNC  [{client_count}/3 BOTS]  SYNC#{sync_id}'
    cv2.putText(canvas, status, (30, H - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, sync_color, 1)

    # Corner XION logo
    cv2.putText(canvas, 'XION 2026', (W - 160, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, GOLD_DIM, 1)

    cv2.imshow('XION 2026 — HOLOGRAPHIC CONTROL', canvas)
    cv2.waitKey(1)
```

---

## 5. CAR USE-CASE HOLOGRAM PANEL

### 5.1 Concept

Embedded in the TriSync dashboard (bottom-right), this panel cycles through automotive use-case illustrations based on detected gesture. It demonstrates **why** multi-robot gesture control matters in the real world.

### 5.2 Gesture → Use Case Mapping

| Gesture | Visual | Use Case Text |
|---------|--------|---------------|
| OPEN | 3D car hood opens | `Assembly: Panel Placement` |
| GRAB | Robotic gripper closes on engine | `Precision: Component Install` |
| FIST | Robots hold position | `Safety: Emergency Hold` |
| POINT | Car rotates on turntable | `Inspection: 360° Scan` |
| NEUTRAL | Idle orbit animation | `TriSync: Standby Mode` |

### 5.3 Implementation (React Three.js)

```jsx
// CarUseCasePanel.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const USE_CASES = {
  OPEN:    { label: 'ASSEMBLY · Panel Placement',   color: '#c9a84c' },
  GRAB:    { label: 'PRECISION · Component Install', color: '#4ac9c9' },
  FIST:    { label: 'SAFETY · Emergency Hold',       color: '#c94a4a' },
  POINT:   { label: 'INSPECTION · 360° Scan',        color: '#a84cc9' },
  NEUTRAL: { label: 'TRISYNC · Standby Mode',        color: '#666666' },
};

export default function CarUseCasePanel({ gesture }) {
  const uc = USE_CASES[gesture] || USE_CASES.NEUTRAL;
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[8, 0, 0]} scale={0.6}>
      {/* Simplified car body wireframe */}
      <mesh>
        <boxGeometry args={[3, 0.8, 1.5]} />
        <meshStandardMaterial color={uc.color} wireframe emissive={uc.color}
                              emissiveIntensity={0.4} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 0.5, 1.4]} />
        <meshStandardMaterial color={uc.color} wireframe />
      </mesh>
      {/* Wheels */}
      {[[-1.1,-0.5,0.8],[-1.1,-0.5,-0.8],[1.1,-0.5,0.8],[1.1,-0.5,-0.8]].map((p,i) => (
        <mesh key={i} position={p} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Label */}
      <Text position={[0, -1.5, 0]} fontSize={0.25} color={uc.color}
            anchorX="center" font="/fonts/SpaceMono-Regular.ttf">
        {uc.label}
      </Text>
    </group>
  );
}
```

---

## 6. CHIEF GUEST UNVEIL SEQUENCE

### 6.1 Event Flow

```
T-00:00  Ambient idle: 3 robots in slow orbit, gold particles drifting
T-00:30  Presenter: "To begin this demonstration, we invite our Chief Guest..."
T+00:00  Chief Guest places hand in camera frame
T+00:02  OpenCV detects hand → holographic overlay appears on presenter screen
T+00:03  Frontend receives first WebSocket payload → all 3 bots snap to attention
T+00:04  CSS animation: "TRISYNC ACTIVATED" text fires across main screen
T+00:05  System is LIVE — Chief Guest controls all 3 robots
```

### 6.2 Reveal Animation (CSS Keyframes)

```css
@keyframes revealTriSync {
  0%   { opacity: 0; transform: scaleX(0); }
  60%  { opacity: 1; transform: scaleX(1.05); }
  100% { transform: scaleX(1); }
}

.trisync-reveal {
  animation: revealTriSync 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  color: #c9a84c;
  font-family: 'Space Mono', monospace;
  font-size: 3rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  border: 1px solid #c9a84c;
  padding: 16px 48px;
}
```

### 6.3 Fallback Protocol (If Camera Fails)

```python
# In backend: press 'D' key to enter demo mode
if cv2.waitKey(1) & 0xFF == ord('d'):
    DEMO_MODE = True

if DEMO_MODE:
    # Replay pre-recorded gesture sequence
    demo_joints = DEMO_SEQUENCE[demo_frame % len(DEMO_SEQUENCE)]
    await broadcast(json.dumps({**demo_joints, 'gesture': 'DEMO', 
                                'sync_id': sync_id}))
    demo_frame += 1
```

---

## 7. TECHNICAL STACK SPECIFICATION

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Camera Vision | OpenCV | 4.x | Frame capture, holographic overlay |
| Hand Tracking | MediaPipe | 0.10.x | 21-landmark detection |
| WebSocket | websockets (Python) | 12.x | Real-time broadcast |
| Backend Runtime | Python | 3.11+ | Async event loop |
| Frontend Framework | React | 18.x | Component rendering |
| 3D Engine | Three.js + R3F | r164 / 8.x | Robot arm visualization |
| Build Tool | Vite | 5.x | Dev server + production build |
| Fonts | Space Mono | — | Monospace HUD aesthetic |
| Smoothing | Python deque | stdlib | Rolling average filter |

---

## 8. PERFORMANCE CONSTRAINTS & SOLUTIONS

| Problem | Cause | Solution |
|---------|-------|----------|
| Jitter in robot motion | Raw landmark noise | 5-frame rolling average |
| High CPU during demo | OpenCV + WebSocket + React all on one machine | Dedicate GPU machine to frontend, CPU to backend |
| WebSocket packet loss | Network hiccup | Client-side interpolation (lerp to target) |
| MediaPipe drop frames | Low light conditions | Add ring light, set `min_detection_confidence=0.65` |
| React re-render lag | State updates per frame | Memo + useRef for Three.js — bypass React for frame-level updates |

### Critical Lerp Implementation (Anti-Jitter)

```javascript
// In RobotArm.jsx useFrame():
const lerpFactor = 0.12; // tune for feel vs responsiveness
baseRef.current.rotation.y = THREE.MathUtils.lerp(
  baseRef.current.rotation.y,
  THREE.MathUtils.degToRad(joints.base),
  lerpFactor
);
```

---

## 9. DEPLOYMENT CHECKLIST (Stage Day)

```
[ ] Python 3.11 installed on presenter machine
[ ] pip install mediapipe opencv-python websockets numpy
[ ] npm install in project root
[ ] npm run build → verify dist/ folder
[ ] Test webcam: python backend/trisync_server.py → holographic window appears
[ ] Test WebSocket: open browser → verify 3 robots move
[ ] Test fallback: press 'D' → demo sequence plays
[ ] Dim stage lights near camera zone (reduce IR interference)
[ ] Set display resolution: 1920×1080 on both screens
[ ] Kill all background apps (Zoom, Slack, updates)
[ ] Charge laptop — disable sleep mode
[ ] Have second laptop ready with pre-recorded video backup
```

---

## 10. REPOSITORY CLEANUP (Required Before Demo)

```bash
# Remove committed node_modules
echo "node_modules/" >> .gitignore
echo "frontend/node_modules/" >> .gitignore
git rm -r --cached node_modules
git rm -r --cached frontend/node_modules
git commit -m "fix: remove node_modules from tracking"

# Consolidate duplicate frontend
# Keep: src/ (root)
# Remove: frontend/ (duplicate)
git rm -r frontend/
git commit -m "refactor: remove duplicate frontend folder"
```

---

*Document Version: XION-2026-IMPL-v1.0*  
*Classification: Engineering Internal*  
*Theme: Gold · Matte Black · Antigravity*
