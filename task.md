# XION 2026 — TASK TRACKER
## *TriSync Bots × Digital Twin — Build Sprint*
### Theme: Gold · Matte Black · Antigravity

---

> **Build Philosophy:** Ship working systems in order of risk, not order of glamour.  
> The holographic UI is the last thing you build. A connected, stable backend is the first.

---

## SPRINT OVERVIEW

```
PHASE 0 — Repo Surgery           [~1hr]   Fix what's broken before adding what's new
PHASE 1 — Bridge System 1        [~2hr]   Connect existing frontend to live data
PHASE 2 — TriSync Backend        [~3hr]   Build 1→3 broadcast server
PHASE 3 — TriSync Dashboard      [~4hr]   Build main stage 3-robot UI
PHASE 4 — Holographic Overlay    [~2hr]   OpenCV visual layer
PHASE 5 — Car Use Case Panel     [~2hr]   Gesture-reactive automotive holograms
PHASE 6 — Unveil Sequence        [~1hr]   Chief Guest moment + reveal animation
PHASE 7 — Hardening              [~2hr]   Fallback, lerp, stress test
PHASE 8 — Stage Prep             [~1hr]   Deployment, cable check, rehearsal
```

**Total estimated build time: ~18 hours** *(2–3 focused developer-days)*

---

## PHASE 0 — REPO SURGERY
**Priority: CRITICAL — Do this before any code work**

### Tasks

- [x] **P0-1** — Remove `node_modules` from git tracking
  ```bash
  echo "node_modules/" >> .gitignore
  git rm -r --cached node_modules
  git rm -r --cached frontend/node_modules 2>/dev/null || true
  git commit -m "fix: remove node_modules from git"
  ```

- [x] **P0-2** — Remove duplicate `frontend/` folder (keep root `src/`)
  ```bash
  git rm -r frontend/
  git commit -m "refactor: consolidate to single frontend at root"
  ```

- [x] **P0-3** — Verify `backend/server.py` runs cleanly
  ```bash
  cd backend && python server.py
  # Expected: webcam opens, WebSocket starts at ws://localhost:8765
  ```

- [x] **P0-4** — Verify frontend builds
  ```bash
  npm install && npm run dev
  # Expected: localhost:5173 renders robot arm (with dummy animation)
  ```

- [x] **P0-5** — Create branch `feat/xion-2026` for all new work
  ```bash
  git checkout -b feat/xion-2026
  ```

**✅ Phase 0 Complete when:** Backend runs, frontend builds, repo is clean.

---

## PHASE 1 — BRIDGE SYSTEM 1 (Digital Twin Live Connection)
**Priority: CRITICAL — Validates the entire pipe before building TriSync**

### Tasks

- [x] **P1-1** — Create `src/hooks/useRobotWebSocket.js`
  - Implements WebSocket connection to `ws://localhost:8765`
  - Auto-reconnects on disconnect (1.5s delay)
  - Returns `{ joints, gesture, connected, syncId }`
  - **Test:** `console.log(joints)` updates in browser when hand moves
  
- [x] **P1-2** — Replace dummy `setInterval` in `RobotArm.jsx`
  - Remove: entire `setInterval` block
  - Add: `const { joints } = useRobotWebSocket();`
  - Map `joints.base` → `rotation.y`, `joints.shoulder/elbow` → `rotation.x`
  - **Test:** Move hand left/right → base joint rotates accordingly

- [x] **P1-3** — Add lerp smoothing in `useFrame()`
  - Factor: `0.12` (smooth but responsive)
  - Apply to all joint refs
  - **Test:** Remove hand from view → arm eases to neutral, not snaps

- [x] **P1-4** — Add connection status HUD overlay
  - Gold color when connected, red when reconnecting
  - Shows: `⬡ LIVE · GESTURE: OPEN` or `⬡ RECONNECTING...`
  - Position: bottom-left corner, monospace font

- [x] **P1-5** — End-to-end latency check
  - Clap hands once rapidly, observe arm response
  - Target: ≤ 150ms visual delay
  - If > 150ms: check WebSocket send rate, check React render cycle

**✅ Phase 1 Complete when:** Moving real hand visibly drives System 1 robot arm with gold/matte theme intact.

---

## PHASE 2 — TRISYNC BACKEND
**Priority: CRITICAL — Foundation of the main demo**

### Tasks

- [ ] **P2-1** — Create `backend/trisync_server.py`
  - Copy `server.py` as base
  - Replace single-client handler with `CLIENTS = set()` broadcast pattern
  - Implement `async broadcast(message)` — sends to all connected clients
  - **Test:** Open 3 browser tabs → all show same data

- [ ] **P2-2** — Implement `classify_gesture(landmarks)` function
  - States: `OPEN`, `GRAB`, `FIST`, `POINT`, `NEUTRAL`
  - Rule-based (landmark geometry) — NO AI, deterministic, zero latency
  - **Test:** Print gesture to terminal, verify each hand pose classifies correctly

- [ ] **P2-3** — Implement 5-frame rolling average smoother
  - `deque(maxlen=5)` per joint
  - Applied after landmark extraction, before broadcast
  - **Test:** Compare raw vs smoothed values — jitter should visibly reduce

- [ ] **P2-4** — Add `sync_id` counter to every payload
  - Monotonically incrementing integer
  - Used by frontend to detect dropped frames
  - **Test:** Log `sync_id` in browser console — should be sequential

- [ ] **P2-5** — Add `client_count` to payload
  - Frontend shows "3/3 BOTS CONNECTED" when all clients connected
  - **Test:** Open 3 tabs → client_count = 3

- [ ] **P2-6** — Implement demo mode fallback ('D' key)
  - Pre-record a 200-frame gesture sequence
  - On `d` keypress: loop through sequence instead of live camera
  - **Test:** Cover camera, press D → robots continue moving

**✅ Phase 2 Complete when:** 3 browser tabs all show identical, real-time, smoothed joint data.

---

## PHASE 3 — TRISYNC DASHBOARD (Main Stage UI)
**Priority: HIGH — This is what the audience sees**

### Tasks

- [ ] **P3-1** — Create `src/pages/TriSyncDashboard.jsx`
  - Layout: full viewport, matte black background (#0a0a0a)
  - Top HUD bar: XION 2026 wordmark (gold), gesture display, sync counter
  - Main area: Three.js Canvas (Canvas from @react-three/fiber)
  - Bottom strip: holographic hand (left) + car use case (right)

- [ ] **P3-2** — Instantiate 3 `<RobotArm>` components at offsets
  - Position: `[-5, 0, 0]`, `[0, 0, 0]`, `[5, 0, 0]`
  - All three receive **same `joints` prop** from single `useRobotWebSocket()` call
  - Add unit labels: α / β / γ (gold, Space Mono font)

- [ ] **P3-3** — Build `<SyncPulse>` component
  - Animated ring that pulses outward from center robot on each new sync_id
  - Gold color, fades to transparent
  - Proves synchronization visually to audience

- [ ] **P3-4** — Build `<TriSyncHUD>` top bar
  - Left: `XION 2026` (gold text, 1.5rem)
  - Center: `GESTURE: [OPEN]` with color coding per gesture type
  - Right: `[3/3] BOTS SYNCED` with green/gold indicator
  - Height: 60px, background: `rgba(0,0,0,0.8)`, border-bottom: `1px solid #c9a84c33`

- [ ] **P3-5** — Gold + Matte Black material system (shared across all 3 arms)
  - Define materials in `src/utils/xionMaterials.js`
  - Export: `mattBlack`, `goldAccent`, `chromeMid`
  - Ensure all robot segments reference these (no inline material definitions)

- [ ] **P3-6** — Holographic grid floor
  - Use `<gridHelper>` with gold color (`#c9a84c`)
  - Set opacity 0.2 via custom shader or `transparent: true`
  - Size: 30×30 units, division: 30

- [ ] **P3-7** — Camera positioning for stage view
  - Camera: `position={[0, 4, 14]}`, `fov={55}`
  - Orbit controls: disabled during demo (prevent accidental drag)
  - Optional: slow cinematic camera orbit if no hand detected

**✅ Phase 3 Complete when:** Three gold robots move in sync under stage lighting with HUD visible.

---

## PHASE 4 — HOLOGRAPHIC OVERLAY (OpenCV)
**Priority: HIGH — Critical for Chief Guest reveal**

### Tasks

- [ ] **P4-1** — Create `backend/holographic_renderer.py`
  - Function: `render_holographic_overlay(frame, landmarks, gesture, joints, client_count, sync_id)`
  - Matte black canvas (not raw camera feed — pure synthetic)
  - Call from `trisync_server.py` camera loop

- [ ] **P4-2** — Gold hand skeleton renderer
  - Iterate `HAND_CONNECTIONS` list (21 pairs)
  - Color gradient: gold (wrist) → cyan (fingertips)
  - Line thickness: 2px, antialiased (`cv2.LINE_AA`)

- [ ] **P4-3** — Fingertip particle emitter
  - On each frame: 3 new particles per active fingertip
  - Particles: move upward, fade over 25 frames
  - Cap at 200 simultaneous particles (performance)

- [ ] **P4-4** — Gesture banner (top-left)
  - Black background box with gold border
  - Text: `GESTURE: OPEN` in large font (0.9 scale)
  - Color changes per gesture type

- [ ] **P4-5** — Joint readout panel (left side)
  - Show: BASE / SHOULDER / ELBOW / GRIPPER values
  - Monospace font, white text, updates every frame

- [ ] **P4-6** — TriSync status bar (bottom)
  - Shows: `TRISYNC [3/3 BOTS] SYNC#12847`
  - Gold when 3 clients, red when < 3

- [ ] **P4-7** — XION 2026 watermark (top-right)
  - Dim gold, non-intrusive
  - Font size 0.7

- [ ] **P4-8** — Display window setup
  - `cv2.namedWindow('XION 2026 — HOLOGRAPHIC CONTROL', cv2.WINDOW_NORMAL)`
  - Set to full-screen on presenter monitor: `cv2.setWindowProperty(..., cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)`

**✅ Phase 4 Complete when:** Holographic window shows gold hand skeleton on dark bg with particles, updating at 30fps.

---

## PHASE 5 — CAR USE CASE PANEL
**Priority: MEDIUM — Adds context and wow factor**

### Tasks

- [ ] **P5-1** — Create `src/components/CarUseCasePanel.jsx`
  - Canvas within the bottom-right strip of TriSync Dashboard
  - 3D wireframe car model using primitive geometry (no external model file)

- [ ] **P5-2** — Build car geometry from primitives
  - Body: `BoxGeometry(3, 0.8, 1.5)`
  - Roof: `BoxGeometry(1.8, 0.5, 1.4)` at y+0.7
  - 4× Wheels: `CylinderGeometry(0.35, 0.35, 0.25, 16)`
  - All in wireframe mode with gesture-reactive emissive color

- [ ] **P5-3** — Gesture → use case mapping
  ```
  OPEN    → "ASSEMBLY · Panel Placement"     [gold]
  GRAB    → "PRECISION · Component Install"  [cyan]
  FIST    → "SAFETY · Emergency Hold"        [red]
  POINT   → "INSPECTION · 360° Scan"         [purple]
  NEUTRAL → "TRISYNC · Standby Mode"         [gray]
  ```

- [ ] **P5-4** — Slow rotation animation
  - `useFrame`: `rotation.y += delta * 0.4`
  - Faster on POINT gesture (inspection spin): `delta * 1.2`

- [ ] **P5-5** — Use case label under car
  - `<Text>` component from `@react-three/drei`
  - Space Mono font, gesture color, centered below car
  - Fade transition between gestures (opacity lerp)

**✅ Phase 5 Complete when:** Changing hand gesture changes car color and label text in real-time.

---

## PHASE 6 — CHIEF GUEST UNVEIL SEQUENCE
**Priority: HIGH — This is the showpiece moment**

### Tasks

- [ ] **P6-1** — Idle state (before hand detected)
  - 3 robots in slow breath animation (subtle ±5° oscillation)
  - Gold particles gently drifting on screen
  - Text: `"AWAITING GESTURE..."` pulsing softly

- [ ] **P6-2** — Detection trigger
  - Backend sends `gesture: "FIRST_DETECTION"` on frame where hand is first seen after idle
  - Frontend listens for this special event

- [ ] **P6-3** — Reveal animation
  - On `FIRST_DETECTION`: 
    1. Gold flash across entire screen (0.3s)
    2. `"TRISYNC ACTIVATED"` text slides in from center (0.8s CSS animation)
    3. All 3 robots snap from breath idle to full attention position
    4. SyncPulse ring fires once large and gold

- [ ] **P6-4** — CSS reveal animation
  ```css
  @keyframes triSyncReveal {
    0%   { opacity: 0; letter-spacing: 2em; }
    100% { opacity: 1; letter-spacing: 0.3em; }
  }
  ```

- [ ] **P6-5** — Optional: countdown trigger mode
  - Press `SPACE` in backend terminal to manually trigger reveal
  - Useful if presenter wants to control exact moment
  - `if cv2.waitKey(1) & 0xFF == ord(' '): broadcast({'gesture': 'FIRST_DETECTION', ...})`

**✅ Phase 6 Complete when:** The reveal sequence plays flawlessly in rehearsal 3 times in a row.

---

## PHASE 7 — HARDENING
**Priority: CRITICAL — Cannot skip for a live presentation**

### Tasks

- [ ] **P7-1** — Stress test: run for 30 continuous minutes
  - Watch for: memory leak (Chrome DevTools Memory tab)
  - Watch for: particle array growing unbounded
  - Watch for: WebSocket silently disconnecting

- [ ] **P7-2** — Low-light test
  - Dim room lights to presentation level
  - Verify MediaPipe still detects hand at `min_detection_confidence=0.65`
  - If fails: lower to 0.55, add note about ring light

- [ ] **P7-3** — Glare/background test
  - Move hand in front of different backgrounds (shirt, white paper, dark jacket)
  - Verify gesture classifier doesn't false-trigger

- [ ] **P7-4** — Demo mode full rehearsal
  - Cover webcam → verify demo mode activates cleanly
  - Run full Chief Guest sequence in demo mode
  - Must be indistinguishable from live at distance

- [ ] **P7-5** — WebSocket reconnection test
  - Kill backend → confirm frontend shows "RECONNECTING" cleanly
  - Restart backend → confirm frontend reconnects without page refresh

- [ ] **P7-6** — Three.js frame rate check
  - Target: 60fps on stage machine
  - Use `<Stats />` from drei during testing, remove before stage
  - If < 45fps: reduce grid helper divisions, reduce particle count

- [ ] **P7-7** — Mobile/tablet backup
  - Load TriSync Dashboard on mobile browser as backup display
  - Verify WebSocket connects from local network (use machine IP, not localhost)

**✅ Phase 7 Complete when:** System survives 30 minutes without intervention, demo mode works, reconnection is graceful.

---

## PHASE 8 — STAGE PREP
**Priority: CRITICAL — The day before**

### Tasks

- [ ] **P8-1** — Install dependencies on stage machine
  ```bash
  pip install mediapipe opencv-python websockets numpy
  npm install
  npm run build
  ```

- [ ] **P8-2** — Cable run plan
  - Webcam USB → presenter laptop (backend)
  - Presenter laptop HDMI-1 → System 1 screen (Digital Twin)
  - Presenter laptop HDMI-2 → System 2 screen (TriSync)
  - OR: use two machines connected via local WiFi

- [ ] **P8-3** — Environment setup
  - Kill: Windows Update, Slack, Chrome with tabs, antivirus scans
  - Set: power plan to "High Performance"
  - Set: display sleep to "Never"
  - Set: screen resolution 1920×1080 on both displays

- [ ] **P8-4** — Lighting check
  - Ensure key light (stage light) does not point at webcam
  - Check: hand gesture classifies correctly in venue lighting

- [ ] **P8-5** — Full dress rehearsal
  - Run complete sequence from power-on to Chief Guest moment
  - Time it: should be < 90 seconds from terminal launch to demo-ready

- [ ] **P8-6** — Backup preparation
  - Record a 2-minute screen recording of the working demo
  - Store on USB drive — if all technology fails, play the video

- [ ] **P8-7** — Browser startup sequence
  ```
  1. Start backend: python backend/trisync_server.py
  2. Wait for "WebSocket server started at ws://localhost:8765"
  3. Open browser: localhost:5173/trisync
  4. Verify: 3 robots visible, HUD shows "0/3 BOTS"
  5. Wait: HUD shows "1/3 BOTS" (confirming self-connection)
  ```

**✅ Phase 8 Complete when:** Full rehearsal runs cleanly from cold start with 2 engineers present to verify.

---

## DEPENDENCY MAP

```
P0 (Repo)
  └── P1 (System 1 Bridge)
        └── P2 (TriSync Backend)
              ├── P3 (TriSync Dashboard)
              │     ├── P5 (Car Use Case)
              │     └── P6 (Unveil Sequence)
              └── P4 (Holographic Overlay)
                    └── P6 (Unveil Sequence)

P7 (Hardening) — depends on ALL phases above
P8 (Stage Prep) — depends on P7
```

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Camera loses detection mid-demo | Medium | HIGH | Demo mode fallback (P2-6) |
| Stage lighting interferes with MediaPipe | Medium | HIGH | Ring light, lower confidence threshold |
| WebSocket drops during Chief Guest moment | Low | CRITICAL | Auto-reconnect (P1-1) |
| Three.js frame rate drops on stage machine | Medium | Medium | Test on actual machine (P8-1) |
| Presenter forgets startup sequence | Low | HIGH | Laminated cheat sheet on table |
| Power outage / laptop dies | Very Low | CRITICAL | Screen recording on USB (P8-6) |

---

## DEFINITION OF DONE (Demo Ready)

```
✅ Hand moves → all 3 robots respond identically < 150ms
✅ Gesture classifier correctly identifies: OPEN, GRAB, FIST, POINT
✅ Holographic overlay shows gold hand skeleton with particles
✅ Car use case panel changes per gesture
✅ Chief Guest reveal animation plays on first hand detection
✅ Demo mode works when camera covered
✅ System runs 30min without crash
✅ Repo is clean (no node_modules, no duplicate frontend/)
✅ Stage machine tested, dependencies confirmed
✅ Backup video recorded
```

---

*Document Version: XION-2026-TASKS-v1.0*  
*Sprint Owner: Engineering Lead*  
*Demo Date: Xion 2026 Stage*  
*Theme: Gold · Matte Black · Antigravity*
