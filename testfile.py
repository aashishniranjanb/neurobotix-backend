import cv2

for i in range(5):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print("Camera found at index:", i)
        ret, frame = cap.read()
        if ret:
            cv2.imshow("Camera", frame)
            cv2.waitKey(0)
        cap.release()
        break
    else:
        print("No camera at index", i)
        