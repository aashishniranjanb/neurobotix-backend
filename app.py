"""
app.py — NeuroBotix ARM Server (Performance Edition)
====================================================
"""
import eventlet
eventlet.monkey_patch()

import cv2
import numpy as np
import time
import base64
from threading import Lock
from flask import Flask, request
from flask_socketio import SocketIO
from flask_cors import CORS

from vision import VisionProcessor, get_robust_camera
from kinematics import ArmKinematics

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

connected_clients = 0
clients_lock = Lock()

def _background_worker():
    global connected_clients
    print("[INFO] Performance worker launched.")
    cap, vp, kin = None, None, None

    while True:
        with clients_lock: active = connected_clients > 0
        if active:
            if cap is None:
                cap = get_robust_camera()
                if cap:
                    vp = VisionProcessor()
                    ret, frame = cap.read()
                    h, w = (frame.shape[0], frame.shape[1]) if ret else (480, 640)
                    kin = ArmKinematics(frame_w=w, frame_h=h)
            
            if cap:
                ret, frame = cap.read()
                if not ret or frame is None:
                    socketio.sleep(0.005)
                    continue
                
                # IMPORTANT: vision.py draws the Yellow lines/Magenta dots here
                ann, data = vp.process_frame(frame)
                
                if data:
                    payload = kin.calculate(data)
                    socketio.emit("robot_telemetry", payload)
                
                # HIGH-SPEED JPEG ENCODING (Quality 55 for speed)
                ok, buf = cv2.imencode(".jpg", ann, [cv2.IMWRITE_JPEG_QUALITY, 55])
                if ok:
                    b64 = base64.b64encode(buf.tobytes()).decode('utf-8')
                    socketio.emit("video_frame", b64)
                
                socketio.sleep(0.005) # Yield for network
        else:
            if cap is not None:
                cap.release()
                if vp: vp.release()
                cap, vp, kin = None, None, None
            socketio.sleep(0.1)

@socketio.on('connect')
def handle_connect():
    global connected_clients
    with clients_lock: connected_clients += 1

@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    with clients_lock: connected_clients = max(0, connected_clients - 1)

@app.route("/")
def index():
    return """
    <body style="background:#000;color:#D4AF37;text-align:center;font-family:'Courier New', monospace;margin:0;padding:20px;">
        <h1 style="color:#D4AF37;margin-bottom:10px;text-shadow: 0 0 15px rgba(212, 175, 55, 0.5); font-weight: 900;">XION 2026: 6-DOF NEURO LINK</h1>
        
        <div style="display:inline-block; border:4px solid #D4AF37; background:#111; box-shadow: 0 0 40px rgba(212, 175, 55, 0.4); border-radius:12px; overflow:hidden;">
            <canvas id="video_canvas" width="640" height="480" style="display:block; background:#000;"></canvas>
        </div>

        <div id="telemetry_grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 800px; margin: 20px auto; font-weight: bold; font-size: 14px;">
            <div style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">BASE: <span id="base">0</span>°</div>
            <div style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">SHOULDER: <span id="shoulder">0</span>°</div>
            <div style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">ELBOW: <span id="elbow">0</span>°</div>
            <div style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">WRIST P: <span id="w_pitch">0</span>°</div>
            <div style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">WRIST R: <span id="w_roll">0</span>°</div>
            <div id="gripper_box" style="border: 1px solid #D4AF37; padding:8px; border-radius:6px;">GRIPPER: <span id="gripper">OPEN</span></div>
        </div>
        
        <div id="meta" style="color:#D4AF37; font-size:12px; opacity:0.6;">PREMIUM 30-45 FPS LINK | NO LAG | PERFORMANCE MODE ACTIVE</div>

        <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
        <script>
            const socket = io();
            const canvas = document.getElementById('video_canvas');
            const ctx = canvas.getContext('2d');
            const fields = {
                base: document.getElementById('base'),
                shoulder: document.getElementById('shoulder'),
                elbow: document.getElementById('elbow'),
                w_pitch: document.getElementById('w_pitch'),
                w_roll: document.getElementById('w_roll'),
                gripper: document.getElementById('gripper'),
                gripper_box: document.getElementById('gripper_box')
            };

            socket.on('robot_telemetry', d => {
                const t = d.telemetry;
                fields.base.innerText = t.base;
                fields.shoulder.innerText = t.shoulder;
                fields.elbow.innerText = t.elbow;
                fields.w_pitch.innerText = t.wrist_pitch;
                fields.w_roll.innerText = t.wrist_roll;
                fields.gripper.innerText = t.gripper;
                fields.gripper_box.style.background = (t.gripper === 'CLOSED') ? 'rgba(212, 175, 55, 0.4)' : 'none';
            });

            socket.on('video_frame', data => {
                const img = new Image();
                img.onload = () => { ctx.drawImage(img, 0, 0, 640, 480); };
                img.src = 'data:image/jpeg;base64,' + data;
            });
        </script>
    </body>
    """

if __name__ == "__main__":
    print("[SERVER] NeuroBotix Performance Build Loading (30-45 FPS targeted)...")
    socketio.start_background_task(_background_worker)
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)