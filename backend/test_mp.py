import mediapipe as mp
print(f"MediaPipe Version: {mp.__version__}")
try:
    print(f"Solutions: {mp.solutions}")
    print(f"Hands: {mp.solutions.hands}")
    print("SUCCESS: MediaPipe import works.")
except AttributeError as e:
    print(f"FAILURE: {e}")
    print(f"Available attributes: {dir(mp)}")
