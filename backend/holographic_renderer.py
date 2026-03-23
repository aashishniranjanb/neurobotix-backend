import cv2
import numpy as np
import math

# ── Colors (BGR format for OpenCV) ───────────────────
GOLD = (50, 168, 201)        
GOLD_DIM = (20, 80, 100)
CYAN = (200, 220, 50)
MATTE = (20, 20, 20)
WHITE = (220, 220, 220)
RED_ALERT = (50, 50, 220)
PURPLE = (180, 76, 168)

HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),      # thumb
    (0,5),(5,6),(6,7),(7,8),      # index
    (0,9),(9,10),(10,11),(11,12), # middle
    (0,13),(13,14),(14,15),(15,16),# ring
    (0,17),(17,18),(18,19),(19,20) # pinky
]

FINGERTIP_IDS = [4, 8, 12, 16, 20]
particles = []

# ── Car state ────────────────────────────────────────
car_rotation = 0.0

GESTURE_CAR_COLORS = {
    'OPEN':    GOLD,
    'GRAB':    CYAN,
    'FIST':    RED_ALERT,
    'POINT':   PURPLE,
    'NEUTRAL': (100, 100, 100),
}

GESTURE_USE_CASES = {
    'OPEN':  'ASSEMBLY',
    'GRAB':  'PRECISION',
    'FIST':  'HOLD',
    'POINT': 'INSPECT',
    'NEUTRAL': 'STANDBY',
}

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
            color = tuple(int(c * p['life']) for c in p['color'])
            cv2.circle(canvas, (int(p['x']), int(p['y'])), 2, color, -1)
            alive.append(p)
    particles = alive[-200:]  # cap particle count


def draw_holographic_car(canvas, gesture, joints, cx, cy, rotation_offset=0):
    """
    Top-down wireframe car that reacts to gesture in the OpenCV window.
    cx, cy = center position on canvas.
    """
    global car_rotation

    car_color = GESTURE_CAR_COLORS.get(gesture, (100, 100, 100))
    uc_label = GESTURE_USE_CASES.get(gesture, 'STANDBY')

    # Gesture → car rotation speed
    if gesture == 'POINT':
        speed = 3.0
    elif gesture == 'OPEN':
        speed = 0.8
    elif gesture == 'FIST':
        speed = 0.0
    else:
        speed = 0.5

    angle = math.radians((car_rotation + rotation_offset) % 360)

    # Car body points (top-down rectangle)
    W2, H2 = 28, 50  # half-width, half-length
    corners = [(-W2, -H2), (W2, -H2), (W2, H2), (-W2, H2)]

    def rotate_pt(px, py):
        rx = px * math.cos(angle) - py * math.sin(angle)
        ry = px * math.sin(angle) + py * math.cos(angle)
        return int(cx + rx), int(cy + ry)

    pts = [rotate_pt(px, py) for px, py in corners]

    # Draw body outline
    for i in range(4):
        cv2.line(canvas, pts[i], pts[(i + 1) % 4], car_color, 2, cv2.LINE_AA)

    # Windshield line (front)
    wl = rotate_pt(-W2 + 8, -H2 + 10)
    wr = rotate_pt(W2 - 8, -H2 + 10)
    cv2.line(canvas, wl, wr, CYAN, 1, cv2.LINE_AA)

    # Rear line
    rl = rotate_pt(-W2 + 8, H2 - 10)
    rr = rotate_pt(W2 - 8, H2 - 10)
    cv2.line(canvas, rl, rr, GOLD_DIM, 1, cv2.LINE_AA)

    # Center line (axle)
    cl = rotate_pt(-W2, 0)
    cr = rotate_pt(W2, 0)
    cv2.line(canvas, cl, cr, car_color, 1, cv2.LINE_AA)

    # 4 wheels (small circles at corners)
    wheel_offsets = [(-W2 - 6, -H2 + 12), (W2 + 6, -H2 + 12),
                     (-W2 - 6, H2 - 12), (W2 + 6, H2 - 12)]
    for wx, wy in wheel_offsets:
        wc = rotate_pt(wx, wy)
        cv2.circle(canvas, wc, 5, GOLD_DIM, -1)
        cv2.circle(canvas, wc, 5, car_color, 1)

    # Gesture use-case label under car
    label_pt = rotate_pt(0, H2 + 25)
    cv2.putText(canvas, uc_label,
                (label_pt[0] - 30, label_pt[1]),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, car_color, 1, cv2.LINE_AA)

    return speed  # return speed so caller can accumulate rotation


def render_holographic_overlay(frame, landmarks, gesture, joints, client_count, sync_id):
    global car_rotation

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
            color = tuple(int(CYAN[c] * t + GOLD[c] * (1 - t)) for c in range(3))
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
        cv2.putText(canvas, 'WRIST', (wx + 8, wy - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, GOLD_DIM, 1)

    update_particles(canvas)

    # Gesture banner
    banner_color = GOLD if gesture != 'FIST' else CYAN
    cv2.rectangle(canvas, (20, 20), (320, 70), (0, 0, 0), -1)
    cv2.rectangle(canvas, (20, 20), (320, 70), banner_color, 1)
    cv2.putText(canvas, f'GESTURE: {gesture}', (30, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, banner_color, 2)

    # Joint readout
    y0 = 100
    for name, val in joints.items():
        label = f'{name.upper():12s}: {val:>5.1f}{" deg" if name != "gripper" else ""}'
        cv2.putText(canvas, label, (30, y0),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)
        y0 += 28

    # ── TriSync Cars (3 side-by-side) ────────────────
    car_section_label = 'TRISYNC CAR PANEL'
    cv2.putText(canvas, car_section_label, (W - 310, H // 2 - 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GOLD_DIM, 1, cv2.LINE_AA)

    car_positions = [W - 260, W - 160, W - 60]
    for i, cxpos in enumerate(car_positions):
        speed = draw_holographic_car(canvas, gesture, joints,
                                     cxpos, H // 2,
                                     rotation_offset=i * 30)

    # Advance global car rotation
    car_rotation += speed
    car_rotation %= 360

    # Sync status
    sync_color = GOLD if client_count >= 3 else RED_ALERT
    status = f'TRISYNC  [{client_count}/3 BOTS]  SYNC#{sync_id}'
    cv2.putText(canvas, status, (30, H - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, sync_color, 1)

    # Corner XION logo
    cv2.putText(canvas, 'XION 2026', (W - 160, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, GOLD_DIM, 1)

    cv2.namedWindow('XION 2026 - HOLOGRAPHIC CONTROL', cv2.WINDOW_NORMAL)
    cv2.imshow('XION 2026 - HOLOGRAPHIC CONTROL', canvas)
    cv2.waitKey(1)
