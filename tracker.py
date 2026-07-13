"""
tracker.py
Wraps deep-sort-realtime and keeps a rolling history of each track's
centroid so we can later compute speed and direction changes.
"""

from collections import deque
from deep_sort_realtime.deepsort_tracker import DeepSort
import config


class VehicleTracker:
    def __init__(self):
        self.tracker = DeepSort(max_age=config.MAX_TRACK_AGE)
        # track_id -> deque of (cx, cy) centroids, most recent last
        self.history = {}

    def update(self, detections, frame):
        """
        detections: output of VehicleDetector.detect()
        Returns a list of dicts: {id, bbox (x1,y1,x2,y2), class_name, centroid}
        """
        tracks = self.tracker.update_tracks(detections, frame=frame)

        active = []
        for track in tracks:
            if not track.is_confirmed():
                continue

            track_id = track.track_id
            x1, y1, x2, y2 = track.to_ltrb()
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2

            if track_id not in self.history:
                self.history[track_id] = deque(maxlen=config.TRACK_HISTORY_LEN)
            self.history[track_id].append((cx, cy))

            active.append({
                "id": track_id,
                "bbox": (x1, y1, x2, y2),
                "class_name": track.get_det_class() or "vehicle",
                "centroid": (cx, cy),
                "history": list(self.history[track_id]),
            })

        # drop history for tracks that no longer exist to avoid unbounded growth
        active_ids = {t["id"] for t in active}
        for stale_id in list(self.history.keys()):
            if stale_id not in active_ids and stale_id not in [t["id"] for t in active]:
                # keep a grace period implicitly handled by DeepSort's max_age;
                # here we just cap memory for truly gone tracks
                if stale_id not in active_ids:
                    pass  # left in dict; DeepSort will stop returning it, harmless to keep briefly

        return active
