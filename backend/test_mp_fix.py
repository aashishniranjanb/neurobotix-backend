try:
    import mediapipe.python.solutions.hands as mp_hands
    print("SUCCESS: import mediapipe.python.solutions.hands works.")
except ImportError:
    print("FAILURE: import mediapipe.python.solutions.hands failed.")

try:
    from mediapipe.python.solutions import hands as mp_hands
    print("SUCCESS: from mediapipe.python.solutions import hands works.")
except ImportError:
    print("FAILURE: from mediapipe.python.solutions import hands failed.")
