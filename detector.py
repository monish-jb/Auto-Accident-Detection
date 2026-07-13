"""
detector.py
Thin wrapper around Ultralytics YOLOv8 that returns only the vehicle
detections we care about, in the format DeepSORT expects:
    [ [x1, y1, x2, y2], confidence, class_name ]
"""

from ultralytics import YOLO
import config


class VehicleDetector:
    def __init__(self, model_path=config.YOLO_MODEL_PATH):
        self.model = YOLO(model_path)
        self.class_names = self.model.names  # id -> name dict from the model

    def detect(self, frame):
        """
        Run YOLO on a single frame and return a list of detections
        filtered to vehicle classes only.
        """
        results = self.model(
            frame,
            conf=config.CONF_THRESHOLD,
            iou=config.IOU_NMS_THRESHOLD,
            verbose=False,
        )[0]

        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            cls_name = self.class_names[cls_id]
            if cls_name not in config.VEHICLE_CLASSES:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])

            # DeepSORT (deep-sort-realtime) expects [x, y, w, h]
            w, h = x2 - x1, y2 - y1
            detections.append(([x1, y1, w, h], conf, cls_name))

        return detections
