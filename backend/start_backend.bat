@echo off
echo Starting XION 2026 TriSync Backend...
python trisync_server.py --host 0.0.0.0 --port 8765 --confidence 0.65
pause
