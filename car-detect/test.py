# cur:
# - get image recognition (done)
# - get video recognition (done)
# - id track same objects (needed?)
# - use real camera feed (needed?)

from ultralytics import YOLO
import cv2
import random

# Model 
model = YOLO('car-detection.pt') 

# Media paths
image_path = 'trucks.jpg' 
video_path = 'test_video.mp4'

def imgDetect(image_path):
        frame = cv2.imread(image_path)
        results = model(frame)[0] 
                # Make bounding boxes
        for box in results.boxes:
                cls = int(box.cls[0]) 
                label = model.names[cls]

                if label == 'car' or label=='truck':
                        x1, y1, x2, y2 = map(int, box.xyxy[0]) # bounding box coords
                        conf = float(box.conf[0]) # confidence val
                        color=(255,0,0)
                        # color = (random.randint(0,255),random.randint(0,255),random.randint(0,255))
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(frame, f'{label} {conf:.2f}', (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        # results
        cv2.imshow('Detected Cars', frame)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
def videoDetect(video_path):
        cap = cv2.VideoCapture(video_path)
        while (cap.isOpened()):
                ret, frame = cap.read()
                if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                # Run inference
                results = model(frame)[0] 

                # Make bounding boxes
                for box in results.boxes:
                        cls = int(box.cls[0]) 
                        label = model.names[cls]

                        if label == 'car':
                                x1, y1, x2, y2 = map(int, box.xyxy[0]) # bounding box coords
                                conf = float(box.conf[0]) # confidence val
                                color=(255,0,0)
                                # color = (random.randint(0,255),random.randint(0,255),random.randint(0,255))
                                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                                cv2.putText(frame, f'{label} {conf:.2f}', (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                        if label=='truck':
                                x1, y1, x2, y2 = map(int, box.xyxy[0]) # bounding box coords
                                conf = float(box.conf[0]) # confidence val
                                color=(0,0,255)
                                # color = (random.randint(0,255),random.randint(0,255),random.randint(0,255))
                                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                                cv2.putText(frame, f'{label} {conf:.2f}', (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                # results
                cv2.imshow('Detected Cars', frame)
        cv2.waitKey(0)
        cap.release()
        cv2.destroyAllWindows()

imgDetect(image_path)
# videoDetect(video_path)