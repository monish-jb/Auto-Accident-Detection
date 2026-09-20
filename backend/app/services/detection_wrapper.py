import os
import sys
import time
import json
import asyncio
import cv2
import numpy as np
from datetime import datetime

# Import workspace root modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
import config
from detector import VehicleDetector
from tracker import VehicleTracker
from accident_detector import AccidentDetector

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.all_models import Video, AnalysisJob, Incident
from backend.app.services.websocket_manager import manager


def run_video_analysis_job(video_id: int):
    """
    Synchronous worker routine executed via BackgroundTasks.
    Wraps existing detector.py, tracker.py, accident_detector.py.
    """
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        job = db.query(AnalysisJob).filter(AnalysisJob.video_id == video_id).first()

        if not video or not job:
            return

        job.status = "processing"
        job.started_at = datetime.utcnow()
        job.progress = 5
        db.commit()

        input_path = video.file_path
        if not os.path.exists(input_path):
            job.status = "failed"
            job.error_message = f"Input file not found at {input_path}"
            db.commit()
            return

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            job.status = "failed"
            job.error_message = "Failed to open video file via OpenCV"
            db.commit()
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0 or np.isnan(fps):
            fps = 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration_sec = total_frames / fps if fps > 0 else 0.0

        video.duration_sec = round(duration_sec, 2)
        video.width = width
        video.height = height
        video.fps = round(fps, 2)

        # Output paths
        annotated_filename = f"annotated_{video.id}.mp4"
        annotated_full_path = os.path.join(settings.ANNOTATED_DIR, annotated_filename)
        rel_annotated_path = f"storage/annotated/{annotated_filename}"

        poster_filename = f"poster_{video.id}.jpg"
        poster_full_path = os.path.join(settings.POSTERS_DIR, poster_filename)
        rel_poster_path = f"storage/posters/{poster_filename}"

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out_writer = cv2.VideoWriter(annotated_full_path, fourcc, fps, (width, height))

        detector = VehicleDetector()
        tracker = VehicleTracker()
        accident_detector = AccidentDetector()

        frame_idx = 0
        max_score = 0
        has_accident = False
        incidents_recorded = 0

        # Save poster frame (frame 1 or midpoint)
        midpoint_frame = max(1, total_frames // 4)

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            timestamp_sec = round((frame_idx - 1) / fps, 3)

            # Save poster snapshot
            if frame_idx == midpoint_frame:
                cv2.imwrite(poster_full_path, frame)
                video.poster_path = rel_poster_path

            # Detect & Track
            detections = detector.detect(frame)
            tracks = tracker.update(detections, frame)
            is_accident, details = accident_detector.analyze(tracks)

            score = details.get("total_score", 0)
            involved = details.get("involved_ids", [])
            collisions = details.get("collisions", [])

            if score > max_score:
                max_score = score

            annotated = frame.copy()

            # Draw vehicle bounding boxes
            for track in tracks:
                x1, y1, x2, y2 = [int(v) for v in track["bbox"]]
                is_inv = track["id"] in involved
                color = (0, 0, 255) if is_inv else (0, 255, 0)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)
                
                spd = track.get("speed", 0.0)
                lbl = f"#{track['id']} {track['class_name']} {spd:.1f}px/f"
                (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                cv2.rectangle(annotated, (x1, max(0, y1 - th - 8)), (x1 + tw + 8, y1), color, -1)
                cv2.putText(annotated, lbl, (x1 + 4, max(12, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

            # Draw Top Command Overlay Bar
            cv2.rectangle(annotated, (0, 0), (width, 70), (12, 17, 26), -1)
            hud_text = f"FRAME: {frame_idx}/{total_frames} | TIME: {timestamp_sec:.2f}s | VEHICLES: {len(tracks)} | SCORE: {score}"
            cv2.putText(annotated, hud_text, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)

            if is_accident:
                has_accident = True
                severity = "CRITICAL" if score >= 5 else "HIGH" if score >= 3 else "MEDIUM"
                
                # Save incident keyframe thumbnail
                thumb_filename = f"thumb_v{video.id}_f{frame_idx}.jpg"
                thumb_full_path = os.path.join(settings.THUMBNAILS_DIR, thumb_filename)
                rel_thumb_path = f"storage/thumbnails/{thumb_filename}"
                cv2.imwrite(thumb_full_path, annotated)

                # Record Incident in DB
                inc = Incident(
                    video_id=video.id,
                    timestamp_sec=timestamp_sec,
                    frame_number=frame_idx,
                    confidence=0.92,
                    severity=severity,
                    accident_score=score,
                    keyframe_thumbnail_path=rel_thumb_path,
                    involved_tracks_json={"involved_ids": involved, "collisions": collisions}
                )
                db.add(inc)
                incidents_recorded += 1

                # Red Alert Banner
                cv2.rectangle(annotated, (0, 70), (width, 140), (0, 0, 230), -1)
                cv2.putText(
                    annotated, f"!!! INCIDENT DETECTED !!! (SEVERITY: {severity} SCORE: {score})", (20, 115),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 3
                )

            out_writer.write(annotated)

            # Update progress every 10 frames
            if frame_idx % 10 == 0 or frame_idx == total_frames:
                prog = int((frame_idx / total_frames) * 95)
                job.progress = max(5, prog)
                db.commit()

        cap.release()
        out_writer.release()

        # If poster wasn't created, fallback to first frame
        if not video.poster_path and os.path.exists(annotated_full_path):
            video.poster_path = rel_annotated_path

        video.has_accident = has_accident
        video.max_score = max_score

        job.annotated_video_path = rel_annotated_path
        job.progress = 100
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        db.commit()

        print(f"Job #{job.id} completed successfully for Video #{video.id} (Accident={has_accident}, MaxScore={max_score})")

    except Exception as e:
        print(f"Error processing video job #{video_id}:", e)
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()
