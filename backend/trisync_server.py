"""
XION 2026 — TriSync Backend Server
One hand → Three robots. Broadcast architecture.
"""
import asyncio
import websockets
import cv2
import mediapipe as mp
import json
import time
import numpy as np
import argparse
from collections import deque
from holographic_renderer import render_holographic_overlay

# ── CLI Arguments ────────────────────────────────────
parser = argparse.ArgumentParser(description='XION 2026 — TriSync Backend')
parser.add_argument('--host', type=str, default='0.0.0.0', help='Binding address')
parser.add_argument('--port', type=int, default=8765, help='WebSocket port')
parser.add_argument('--confidence', type=float, default=0.65, help='MediaPipe confidence')
parser.add_argument('--demo', action='store_true', help='Start in DEMO mode')
args = parser.parse_args()

# ── MediaPipe Setup ──────────────────────────────────
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1, 
    min_detection_confidence=args.confidence,
    min_tracking_confidence=args.confidence
)

# ── State ────────────────────────────────────────────
CLIENTS = set()
SMOOTHING_WINDOW = 5
angle_history = {k: deque(maxlen=SMOOTHING_WINDOW)
                 for k in ['base', 'shoulder', 'elbow']}

DEMO_MODE = args.demo
demo_frame = 0

# ── Pre-recorded demo sequence (200 frames) ─────────
def generate_demo_sequence():
    seq = []
    for i in range(200):
        t = i / 30.0
        seq.append({
            'joints': {
                'base': round(90 + 30 * np.sin(t * 0.5), 2),
                'shoulder': round(45 + 20 * np.sin(t * 0.7), 2),
                'elbow': round(30 + 15 * np.cos(t * 0.9), 2),
                'gripper': 1 if int(t * 2) % 2 == 0 else 0
            },
            'gesture': ['OPEN', 'GRAB', 'POINT', 'FIST', 'NEUTRAL'][i % 5]
        })
    return seq

DEMO_SEQUENCE = generate_demo_sequence()


# ── Gesture Classifier ──────────────────────────────
def classify_gesture(landmarks):
    """Pure rule-based classifier — deterministic, zero latency."""
    index_tip = landmarks[8]
    middle_tip = landmarks[12]
    ring_tip = landmarks[16]
    pinky_tip = landmarks[20]
    index_mcp = landmarks[5]

    # Finger extension check (tip above MCP = extended)
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


# ── Smoothing ────────────────────────────────────────
def smooth(key, raw_val):
    angle_history[key].append(raw_val)
    return round(sum(angle_history[key]) / len(angle_history[key]), 2)


# ── Landmark → Joint Angles ─────────────────────────
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


# ── Broadcast to all clients ────────────────────────
async def broadcast(message):
    if CLIENTS:
        await asyncio.gather(
            *[c.send(message) for c in CLIENTS],
            return_exceptions=True
        )


# ── Client handler ───────────────────────────────────
async def handler(websocket):
    CLIENTS.add(websocket)
    print(f"[TRISYNC] Client connected. Total: {len(CLIENTS)}")
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)
        print(f"[TRISYNC] Client disconnected. Total: {len(CLIENTS)}")


# ── Camera loop ──────────────────────────────────────
async def camera_loop():
    global DEMO_MODE, demo_frame

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[TRISYNC] ❌ ERROR: Could not open camera. Falling back to DEMO mode.")
        DEMO_MODE = True

    sync_id = 0
    first_detection = False

    print(f"[TRISYNC] Camera loop started. Mode: {'DEMO' if DEMO_MODE else 'LIVE'}")
    print("[TRISYNC] Controls: D=Toggle Demo, SPACE=Manual Reveal, Q=Quit")

    while True:
        # Check for keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord('d'):
            DEMO_MODE = not DEMO_MODE
            demo_frame = 0
            mode_str = "DEMO" if DEMO_MODE else "LIVE"
            print(f"[TRISYNC] Switched to {mode_str} mode")
        elif key == ord('q'):
            break
        elif key == ord(' '):
            # Manual reveal trigger
            payload = json.dumps({
                'joints': {'base': 90, 'shoulder': 45, 'elbow': 30, 'gripper': 0},
                'gesture': 'FIRST_DETECTION',
                'timestamp': time.time(),
                'sync_id': sync_id,
                'client_count': len(CLIENTS)
            })
            await broadcast(payload)
            sync_id += 1
            print("[TRISYNC] Manual FIRST_DETECTION triggered")

        if DEMO_MODE:
            # Play pre-recorded sequence
            demo_data = DEMO_SEQUENCE[demo_frame % len(DEMO_SEQUENCE)]
            payload = json.dumps({
                'joints': demo_data['joints'],
                'gesture': demo_data['gesture'],
                'timestamp': time.time(),
                'sync_id': sync_id,
                'client_count': len(CLIENTS)
            })
            await broadcast(payload)
            sync_id += 1
            demo_frame += 1
            await asyncio.sleep(0.033)
            continue

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

            # First detection trigger for unveil sequence
            if not first_detection:
                first_detection = True
                gesture = "FIRST_DETECTION"
                print("[TRISYNC] ★ FIRST HAND DETECTED — Unveil triggered!")

            payload = json.dumps({
                'joints': joints,
                'gesture': gesture,
                'timestamp': time.time(),
                'sync_id': sync_id,
                'client_count': len(CLIENTS)
            })
            await broadcast(payload)
            # Render holographic overlay
            render_holographic_overlay(frame, lm, gesture, joints, len(CLIENTS), sync_id)
        else:
            # Render empty overlay if no hand detected
            render_holographic_overlay(frame, [], "AWAITING GESTURE...", 
                {'base': 0, 'shoulder': 0, 'elbow': 0, 'gripper': 0}, len(CLIENTS), sync_id)

        await asyncio.sleep(0.033)  # ~30fps

    cap.release()
    cv2.destroyAllWindows()


# ── Main ─────────────────────────────────────────────
async def main():
    try:
        server = await websockets.serve(handler, args.host, args.port)
        print("=" * 50)
        print("  XION 2026 — TRISYNC SERVER")
        print(f"  WebSocket: ws://{args.host}:{args.port}")
        print(f"  Confidence: {args.confidence}")
        print("  Controls: D=Demo  SPACE=Reveal  Q=Quit")
        print("=" * 50)
        await asyncio.gather(server.wait_closed(), camera_loop())
    except Exception as e:
        print(f"[TRISYNC] ❌ CRITICAL ERROR: {e}")
    finally:
        print("[TRISYNC] Server shutting down.")


if __name__ == '__main__':
    asyncio.run(main())
