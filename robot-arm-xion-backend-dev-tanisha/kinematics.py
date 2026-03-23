"""
kinematics.py — High-Performance 6-DoF Logic
===========================================
"""
import time
import math
from processing.smoother import DataSmoother

class ArmKinematics:
    def __init__(self, frame_w=640, frame_h=480):
        self.frame_w = frame_w
        self.frame_h = frame_h
        
        # Performance Smoothing (Higher alpha = less lag, slightly more jitter)
        alpha = 0.35 
        self.smoothers = {
            "base": DataSmoother(alpha=alpha),
            "shoulder": DataSmoother(alpha=alpha),
            "elbow": DataSmoother(alpha=alpha),
            "wrist_pitch": DataSmoother(alpha=alpha),
            "wrist_roll": DataSmoother(alpha=alpha)
        }

    def calculate(self, hand_data: dict) -> dict:
        lms = hand_data["landmarks"]
        pinch = hand_data["pinch"]
        
        # Keys: 0=wrist, 5=index_mcp, 17=pinky_mcp, 9=mid_mcp, 8=index_tip
        wrt = lms[0]
        idx_tip = lms[8]
        idx_mcp = lms[5]
        mid_mcp = lms[9]
        pnk_mcp = lms[17]

        # 1. Base (Yaw) & Shoulder (Pitch) - Rock Solid Logic
        raw_base = (1.0 - wrt.x) * 180.0
        raw_shoulder = (1.0 - wrt.y) * 180.0

        # 2. Elbow (Reach Extension)
        # Distance between wrist and index tip
        dist = math.hypot(idx_tip.x - wrt.x, idx_tip.y - wrt.y)
        raw_elbow = (1.0 - dist) * 180.0 # Simple linear mapping for presentation speed

        # 3. Wrist Pitch (Hand tilt)
        w_dy = wrt.y - mid_mcp.y
        raw_wrist_pitch = math.degrees(math.atan2(w_dy, 0.15)) + 90.0

        # 4. Wrist Roll (Hand rotation)
        r_dx = idx_mcp.x - pnk_mcp.x
        r_dy = idx_mcp.y - pnk_mcp.y
        raw_wrist_roll = math.degrees(math.atan2(r_dy, r_dx)) + 90.0

        # Smoothing & Clamping
        angles = {
            "base": max(0, min(180, raw_base)),
            "shoulder": max(0, min(180, raw_shoulder)),
            "elbow": max(0, min(180, raw_elbow)),
            "wrist_pitch": max(0, min(180, raw_wrist_pitch)),
            "wrist_roll": max(0, min(180, raw_wrist_roll))
        }
        
        smoothed = {k: self.smoothers[k].smooth(v) for k, v in angles.items()}

        return {
            "telemetry": {
                "base": round(smoothed["base"], 1),
                "shoulder": round(smoothed["shoulder"], 1),
                "elbow": round(smoothed["elbow"], 1),
                "wrist_pitch": round(smoothed["wrist_pitch"], 1),
                "wrist_roll": round(smoothed["wrist_roll"], 1),
                "gripper": "CLOSED" if pinch else "OPEN"
            }
        }
