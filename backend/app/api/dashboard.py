import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.all_models import User, Video, AnalysisJob, Incident
from backend.app.schemas.all_schemas import DashboardStats
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_videos = db.query(Video).filter(Video.user_id == current_user.id).count()
    total_accidents = db.query(Video).filter(Video.user_id == current_user.id, Video.has_accident == True).count()
    
    total_incidents = db.query(Incident).join(Video).filter(Video.user_id == current_user.id).count()
    
    avg_conf = db.query(func.avg(Incident.confidence)).join(Video).filter(Video.user_id == current_user.id).scalar() or 0.88
    
    active_jobs = db.query(AnalysisJob).join(Video).filter(
        Video.user_id == current_user.id,
        AnalysisJob.status.in_(["queued", "processing"])
    ).count()

    # Generate 7-day tactical activity matrix grid data
    now = datetime.datetime.utcnow()
    activity_grid = []
    for i in range(6, -1, -1):
        day_date = (now - datetime.timedelta(days=i)).date()
        scanned_cnt = db.query(Video).filter(
            Video.user_id == current_user.id,
            func.date(Video.created_at) == day_date
        ).count()
        accident_cnt = db.query(Video).filter(
            Video.user_id == current_user.id,
            Video.has_accident == True,
            func.date(Video.created_at) == day_date
        ).count()

        activity_grid.append({
            "day": day_date.strftime("%a %d"),
            "scanned": scanned_cnt,
            "accidents": accident_cnt,
            "intensity": min(5, scanned_cnt + (accident_cnt * 2))
        })

    return {
        "total_videos": total_videos,
        "total_accidents": total_accidents,
        "total_incidents": total_incidents,
        "avg_confidence": round(float(avg_conf), 2),
        "active_jobs": active_jobs,
        "activity_grid": activity_grid
    }
