import cv2
import math
import os
import time
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

# --- 6-DOF PERFORMANCE EDITION ---

# Hardcoded MediaPipe Hand Connections
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),    # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),    # Index
    (9, 10), (10, 11), (11, 12),       # Middle
    (13, 14), (14, 15), (15, 16),      # Ring
    (17, 18), (18, 19), (19, 20),      # Pinky
    (5, 9), (9, 13), (13, 17), (0, 17) # Palm
]

def get_robust_camera():
    print("[INFO] Opening Camera 0...")
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        for _ in range(5): cap.read() # Warmup
        return cap
    return None

class VisionProcessor:
    def __init__(self):
        print("[INFO] Initializing High-Performance Landmarker...")
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.landmarker = vision.HandLandmarker.create_from_options(options)

    def process_frame(self, frame: np.ndarray):
        """Returns (annotated_frame, 6dof_data)"""
        if frame is None: return None, None
        
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
        
        try:
            result = self.landmarker.detect(mp_image)
        except:
            return frame, None

        hand_data = None
        if result.hand_landmarks:
            lms = result.hand_landmarks[0]
            
            # --- MANDATORY DRAWING (Yellow connections, Magenta dots) ---
            for s, e in HAND_CONNECTIONS:
                p1 = (int(lms[s].x * w), int(lms[s].y * h))
                p2 = (int(lms[e].x * w), int(lms[e].y * h))
                cv2.line(frame, p1, p2, (0, 255, 255), 2) # Yellow

            for lm in lms:
                cv2.circle(frame, (int(lm.x * w), int(lm.y * h)), 3, (255, 0, 255), -1) # Magenta

            # Calculate pinch (thumb tip to index tip)
            pinch = math.hypot(lms[8].x - lms[4].x, lms[8].y - lms[4].y) < 0.06
            
            hand_data = {
                "landmarks": lms,
                "pinch": pinch
            }

        return frame, hand_data

    def release(self):
        if hasattr(self, 'landmarker'): self.landmarker.close()