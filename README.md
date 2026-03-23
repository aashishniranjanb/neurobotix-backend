# XION 2026 — Robot Arm TriSync Digital Twin

A high-performance, Three.js-based Digital Twin system for synchronized control of three industrial robot arms via real-time hand tracking.

---

## ⚡ STAGE CHEAT SHEET (Start Here)

### 1. Hardware Connection
- Connect **USB Webcam** to the main presenter laptop.
- Connect **HDMI-1** to the main stage screen (TriSync Dashboard).
- (Optional) Connect **HDMI-2** to the side monitor (Holographic Overlay/Presenter View).

### 2. Launch Sequence
1.  **Open Terminal** in the `backend/` folder.
2.  Run the server:
    ```bash
    python trisync_server.py
    ```
    *Wait for "XION 2026 — TRISYNC SERVER" banner to appear.*
3.  **Open Browser** (Chrome/Edge) to:
    [http://localhost:5173/#trisync](http://localhost:5173/#trisync)
4.  **Confirm Sync**: The HUD at the top should show `[1/3] BOTS SYNCED`.
5.  **Press F11** in the browser for Fullscreen.

### 3. Chief Guest Reveal Moment
- Ensure the robots are in **Idle Breath** mode (no hand in view).
- The screen will say **"AWAITING GESTURE..."**.
- When the Chief Guest raises their hand, the system will trigger:
  - Gold flash reveal.
  - "TRISYNC ACTIVATED" banner.
  - All 3 bots snapping to control.

---

## 🛠 SETUP & INSTALLATION

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Webcam** (720p or 1080p recommended)

### One-Click Setup (Windows)
Go to the `backend/` folder and run:
```bash
setup_stage.bat
```

### Manual Install
1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
2.  **Frontend**:
    ```bash
    npm install
    npm run build
    ```

---

## 🎮 CONTROLS (Backend Terminal)
- `D` : Toggle **Demo Mode** (Pre-recorded movement loop).
- `SPACE` : Trigger **Reveal Sequence** manually.
- `Q` : Quit application.

---

## 📡 CLOUD SYNC & BACKUP
This system supports **cross-device synchronization**. Any device (Phone, Tablet, Laptop) on the same WiFi network can view the dashboard by navigating to:
`http://[HOST_IP]:5173/#trisync`

The `useRobotWebSocket` hook will automatically resolve the correct IP for real-time data.

---

## 💎 DESIGN SYSTEM
- **Palette**: Gold (`#c9a84c`), Matte Black (`#0a0a0a`), Chrome Mid (`#888888`).
- **Typography**: Space Mono (Google Fonts).
- **Engine**: Three.js (@react-three/fiber).

---

*Build Version: 1.0.0-PROD*  
*Event: XION 2026*  
*Project: Robot Arm Digital Twin Xion*
