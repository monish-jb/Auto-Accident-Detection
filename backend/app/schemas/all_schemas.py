from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Incident Schemas
class IncidentOut(BaseModel):
    id: int
    video_id: int
    timestamp_sec: float
    frame_number: int
    confidence: float
    severity: str
    accident_score: int
    keyframe_thumbnail_path: Optional[str] = None
    involved_tracks_json: Optional[list] = None
    created_at: datetime

    class Config:
        from_attributes = True


# AnalysisJob Schemas
class JobOut(BaseModel):
    id: int
    video_id: int
    status: str
    progress: int
    error_message: Optional[str] = None
    annotated_video_path: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Video Schemas
class VideoOut(BaseModel):
    id: int
    user_id: int
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    duration_sec: float
    width: int
    height: int
    fps: float
    poster_path: Optional[str] = None
    has_accident: bool
    max_score: int
    created_at: datetime
    analysis_job: Optional[JobOut] = None
    incidents: List[IncidentOut] = []

    class Config:
        from_attributes = True


class VideoListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[VideoOut]


class DashboardStats(BaseModel):
    total_videos: int
    total_accidents: int
    total_incidents: int
    avg_confidence: float
    active_jobs: int
    activity_grid: List[dict]
