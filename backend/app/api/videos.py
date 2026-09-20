import os
import uuid
import math
from typing import Optional
from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File,
    BackgroundTasks, Query, status, Header, Request
)
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.all_models import User, Video, AnalysisJob, Incident
from backend.app.schemas.all_schemas import VideoOut, VideoListOut
from backend.app.api.auth import get_current_user
from backend.app.services.detection_wrapper import run_video_analysis_job

router = APIRouter(prefix="/api/videos", tags=["Videos"])


def range_stream_file(file_path: str, range_header: Optional[str] = None):
    """
    Helper providing HTTP 206 Partial Content range requests for HTML5 video playback.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    file_size = os.path.getsize(file_path)

    if range_header:
        # Format: bytes=start-end
        try:
            unit, ranges = range_header.split("=")
            if unit.strip().lower() != "bytes":
                return FileResponse(file_path)
            
            start_str, end_str = ranges.split("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
            if end >= file_size:
                end = file_size - 1
            length = (end - start) + 1
        except Exception:
            return FileResponse(file_path)

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_left = length
                chunk_size = 64 * 1024
                while bytes_left > 0:
                    read_len = min(chunk_size, bytes_left)
                    data = f.read(read_len)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers)

    return FileResponse(file_path, media_type="video/mp4")


@router.post("/upload", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read and check file size
    contents = await file.read()
    file_size = len(contents)
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds max allowed limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB"
        )

    # Save to storage with unique filename
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    stored_path = os.path.join(settings.UPLOADS_DIR, unique_name)
    with open(stored_path, "wb") as f:
        f.write(contents)

    rel_file_path = f"storage/uploads/{unique_name}"

    # Create Video record
    video = Video(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=unique_name,
        file_path=stored_path,
        file_size=file_size,
        mime_type=file.content_type or "video/mp4"
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # Create AnalysisJob record
    job = AnalysisJob(
        video_id=video.id,
        status="queued",
        progress=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch background job
    background_tasks.add_task(run_video_analysis_job, video.id)

    return video


@router.get("", response_model=VideoListOut)
def list_videos(
    search: Optional[str] = None,
    has_accident: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Video).filter(Video.user_id == current_user.id)

    if search:
        query = query.filter(Video.original_filename.ilike(f"%{search}%"))

    if has_accident is not None:
        query = query.filter(Video.has_accident == has_accident)

    total = query.count()
    videos = query.order_by(desc(Video.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": videos
    }


@router.get("/{video_id}", response_model=VideoOut)
def get_video_detail(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found or access denied")
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found or access denied")

    # Clean up physical files
    for p in [video.file_path, video.poster_path]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass

    if video.analysis_job and video.analysis_job.annotated_video_path:
        ann_path = os.path.join(settings.BASE_DIR, video.analysis_job.annotated_video_path)
        if os.path.exists(ann_path):
            try:
                os.remove(ann_path)
            except Exception:
                pass

    for inc in video.incidents:
        if inc.keyframe_thumbnail_path:
            tpath = os.path.join(settings.BASE_DIR, inc.keyframe_thumbnail_path)
            if os.path.exists(tpath):
                try:
                    os.remove(tpath)
                except Exception:
                    pass

    db.delete(video)
    db.commit()
    return None


@router.get("/{video_id}/stream")
def stream_original_video(
    video_id: int,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return range_stream_file(video.file_path, range)


@router.get("/{video_id}/stream-annotated")
def stream_annotated_video(
    video_id: int,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video or not video.analysis_job or not video.analysis_job.annotated_video_path:
        raise HTTPException(status_code=404, detail="Annotated video not available yet")

    full_path = os.path.join(settings.BASE_DIR, video.analysis_job.annotated_video_path)
    return range_stream_file(full_path, range)
