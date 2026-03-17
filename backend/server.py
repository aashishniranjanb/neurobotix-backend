import asyncio
import websockets
import cv2
import mediapipe as mp
import json

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()

cap = cv2.VideoCapture(0)

async def send_data(websocket):
    while True:
        success, frame = cap.read()
        if not success:
            continue

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(frame_rgb)

        data = {
            "base": 0,
            "shoulder": 0,
            "elbow": 0,
            "wrist": 0,
            "gripper": 0
        }

        if result.multi_hand_landmarks:
            for hand in result.multi_hand_landmarks:
                lm = hand.landmark

                wrist = lm[0]
                index = lm[8]
                middle = lm[12]

                data["base"] = int(wrist.x * 180)
                data["shoulder"] = int(index.y * 180)
                data["elbow"] = int(middle.y * 180)
                data["wrist"] = int(index.x * 180)

                distance = abs(index.x - middle.x)
                data["gripper"] = 1 if distance > 0.05 else 0

        await websocket.send(json.dumps(data))
        await asyncio.sleep(0.05)

async def main():
    async with websockets.serve(send_data, "localhost", 8765):
        print("Server running at ws://localhost:8765")
        await asyncio.Future()

asyncio.run(main())