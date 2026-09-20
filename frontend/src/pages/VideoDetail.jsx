import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { IncidentScrubber } from '../components/IncidentScrubber';
import { AlertTriangle, Download, ArrowLeft, Eye, ShieldAlert } from 'lucide-react';

export const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideoDetail();
  }, [id]);

  const fetchVideoDetail = async () => {
    try {
      const res = await api.get(`/videos/${id}`);
      setVideo(res.data);
    } catch (err) {
      console.error('Failed to fetch video detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (targetTimeSec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = targetTimeSec;
      videoRef.current.play();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--hud-cyan)' }}>
        LOADING SURVEILLANCE FEED DETAILED ANALYSIS...
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--hud-red)' }}>
        SURVEILLANCE FEED RECORD NOT FOUND OR ACCESS DENIED.
      </div>
    );
  }

  const streamUrl = showAnnotated && video.analysis_job?.annotated_video_path
    ? `/api/videos/${video.id}/stream-annotated`
    : `/api/videos/${video.id}/stream`;

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto', padding: '0 24px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/history" className="cmd-btn cmd-btn-secondary" style={{ padding: '6px 14px', fontSize: '11px' }}>
          <ArrowLeft size={14} /> BACK TO SURVEILLANCE WALL
        </Link>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--hud-cyan)' }}>
          FEED ID: #{video.id} | UPLOADED: {new Date(video.created_at).toLocaleString()}
        </div>
      </div>

      {/* Glitch Alert Banner if Accident */}
      {video.has_accident && (
        <div className="glitch-alert-banner" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <AlertTriangle size={28} color="var(--hud-red)" />
          <div>
            <div style={{ fontWeight: 'bold' }}>CRASH INCIDENT DETECTED // SEVERITY: CRITICAL (MAX SCORE: {video.max_score})</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#ffd1d1' }}>
              IMPACT EVENT RECORDED IN THIS FOOTAGE. CLICK INCIDENT MARKERS ON THE SCRUBBER TO INSPECT CRASH FRAMES.
            </div>
          </div>
        </div>
      )}

      {/* Main Player Card */}
      <div className="hud-card" style={{ marginBottom: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: '18px' }}>
            {video.original_filename}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAnnotated(!showAnnotated)}
              className={`cmd-btn ${showAnnotated ? 'cmd-btn-primary' : 'cmd-btn-secondary'}`}
              style={{ fontSize: '11px' }}
            >
              <Eye size={14} /> {showAnnotated ? 'VIEWING AI ANNOTATED FEED' : 'VIEWING RAW ORIGINAL FEED'}
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--hud-panel-border)' }}>
          <video
            ref={videoRef}
            key={streamUrl}
            src={streamUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            style={{ width: '100%', maxHeight: '500px', display: 'block' }}
          />
        </div>

        {/* Interactive Scrubber */}
        <IncidentScrubber
          duration={video.duration_sec || 1}
          currentTime={currentTime}
          incidents={video.incidents || []}
          onSeek={handleSeek}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          {video.analysis_job?.annotated_video_path && (
            <a
              href={`/${video.analysis_job.annotated_video_path}`}
              download
              className="cmd-btn cmd-btn-secondary"
              style={{ fontSize: '11px' }}
            >
              <Download size={14} /> DOWNLOAD ANNOTATED MP4
            </a>
          )}
        </div>

      </div>

      {/* Incidents Thumbnail Keyframes Grid */}
      <div className="hud-card">
        <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '16px', marginBottom: '16px', letterSpacing: '1px' }}>
          INCIDENT KEYFRAME THUMBNAILS & IMPACT LOGS ({video.incidents?.length || 0})
        </h3>

        {(!video.incidents || video.incidents.length === 0) ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--hud-green)', fontFamily: 'var(--font-mono)' }}>
            ✓ ALL CLEAR: NO CRASH INCIDENTS RECORDED IN THIS FOOTAGE.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {video.incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => handleSeek(inc.timestamp_sec)}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--hud-red)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s'
                }}
              >
                <img
                  src={inc.keyframe_thumbnail_path ? `/${inc.keyframe_thumbnail_path}` : 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'}
                  alt={`Incident ${inc.id}`}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--hud-red)', fontWeight: 'bold' }}>⚡ TIMESTAMP: {inc.timestamp_sec.toFixed(2)}s</span>
                    <span style={{ color: 'var(--hud-amber)' }}>SCORE: {inc.accident_score}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    FRAME #{inc.frame_number} | SEVERITY: {inc.severity} | CONF: {(inc.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
