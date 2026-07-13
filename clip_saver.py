"""
clip_saver.py
Keeps a rolling buffer of the last N seconds of frames so that when an
accident is flagged, we can save footage from BEFORE the event as well
as continue recording for a few seconds AFTER it.
"""

import os
import time
import cv2
from collections import deque
import config


class ClipSaver:
    def __init__(self, fps, frame_size):
        self.fps = fps if fps and fps > 0 else config.CLIP_FPS_FALLBACK
        self.frame_size = frame_size  # (width, height)

        pre_frames = int(config.PRE_EVENT_SECONDS * self.fps)
        self.buffer = deque(maxlen=pre_frames)

        self.recording = False
        self.post_frames_remaining = 0
        self.writer = None
        self.current_clip_path = None

        os.makedirs(config.CLIP_OUTPUT_DIR, exist_ok=True)

    def add_frame(self, frame):
        """Call this every frame regardless of accident state."""
        self.buffer.append(frame.copy())

        if self.recording:
            self.writer.write(frame)
            self.post_frames_remaining -= 1
            if self.post_frames_remaining <= 0:
                self._finalize_clip()

    def trigger(self):
        """Call this the moment an accident is detected. Starts a new clip
        (if not already recording) using the pre-event buffer as the head."""
        if self.recording:
            return self.current_clip_path  # already saving this incident

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"accident_{timestamp}.mp4"
        self.current_clip_path = os.path.join(config.CLIP_OUTPUT_DIR, filename)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        self.writer = cv2.VideoWriter(
            self.current_clip_path, fourcc, self.fps, self.frame_size
        )

        # Flush pre-event buffer first so the clip includes lead-up footage
        for buffered_frame in self.buffer:
            self.writer.write(buffered_frame)

        self.recording = True
        self.post_frames_remaining = int(config.POST_EVENT_SECONDS * self.fps)
        return self.current_clip_path

    def _finalize_clip(self):
        if self.writer is not None:
            self.writer.release()
        self.recording = False
        self.writer = None
        print(f"[ClipSaver] Saved incident clip: {self.current_clip_path}")

    def close(self):
        if self.recording:
            self._finalize_clip()
