import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Video, AlertTriangle, ShieldCheck, Cpu, ArrowUpRight, Activity } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, videosRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/videos?page_size=4')
      ]);
      setStats(statsRes.data);
      setRecentVideos(videosRes.data.items || []);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--hud-cyan)' }}>
        INITIALIZING COMMAND DASHBOARD DATA...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto', padding: '0 24px' }}>
      
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-hud)', fontSize: '24px', letterSpacing: '2px' }}>
            TACTICAL INCIDENT OVERVIEW
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
            REAL-TIME MONITORED SURVEILLANCE & ACCIDENT ANALYTICS MATRIX
          </p>
        </div>
        <Link to="/upload" className="cmd-btn cmd-btn-primary">
          <ArrowUpRight size={16} /> UPLOAD SURVEILLANCE FEED
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        <div className="hud-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>TOTAL FEEDS ANALYZED</span>
            <Video size={20} color="var(--hud-cyan)" />
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '32px', color: 'var(--hud-cyan)' }}>
            {stats?.total_videos || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            SCANNED SURVEILLANCE CLIPS
          </div>
        </div>

        <div className="hud-card hud-card-red">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--hud-red)' }}>ACCIDENTS CONFIRMED</span>
            <AlertTriangle size={20} color="var(--hud-red)" />
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '32px', color: 'var(--hud-red)' }}>
            {stats?.total_accidents || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--hud-red)', marginTop: '4px' }}>
            {stats?.total_incidents || 0} SEVERITY IMPACTS RECORDED
          </div>
        </div>

        <div className="hud-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>DETECTION ACCURACY</span>
            <ShieldCheck size={20} color="var(--hud-green)" />
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '32px', color: 'var(--hud-green)' }}>
            {((stats?.avg_confidence || 0.88) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            YOLOv8 + DEEPSORT CONFIDENCE
          </div>
        </div>

        <div className="hud-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>QUEUE PROCESSING</span>
            <Cpu size={20} color="var(--hud-amber)" />
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '32px', color: 'var(--hud-amber)' }}>
            {stats?.active_jobs || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            ACTIVE BACKGROUND JOBS
          </div>
        </div>

      </div>

      {/* City Grid Heatmap Activity View */}
      <div className="hud-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Activity size={20} color="var(--hud-cyan)" />
          <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '16px', letterSpacing: '1px' }}>
            TACTICAL SECTOR ACTIVITY HEATMAP (PAST 7 DAYS)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {stats?.activity_grid?.map((item, idx) => (
            <div key={idx} style={{
              background: item.accidents > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.1)',
              border: item.accidents > 0 ? '1px solid var(--hud-red)' : '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '6px',
              padding: '16px 12px',
              textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{item.day}</div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '20px', color: item.accidents > 0 ? 'var(--hud-red)' : 'var(--hud-cyan)', margin: '8px 0' }}>
                {item.scanned}
              </div>
              <div style={{ fontSize: '10px', color: item.accidents > 0 ? 'var(--hud-red)' : 'var(--hud-green)' }}>
                {item.accidents} CRASHES
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Surveillance Wall Snapshot */}
      <div className="hud-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '16px', letterSpacing: '1px' }}>
            RECENT MONITORED SURVEILLANCE CLIPS
          </h3>
          <Link to="/history" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--hud-cyan)' }}>
            VIEW FULL SURVEILLANCE WALL &rarr;
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            NO SURVEILLANCE CLIPS UPLOADED YET. CLICK "UPLOAD SURVEILLANCE FEED" TO SCAN A VIDEO.
          </div>
        ) : (
          <div className="surveillance-grid" style={{ marginTop: 0 }}>
            {recentVideos.map((video) => (
              <div key={video.id} className={`surveillance-tile ${video.has_accident ? 'alert-tile' : ''}`}>
                <div className="surveillance-header-overlay">
                  <span className="rec-badge">
                    <span className={`led-indicator ${video.has_accident ? 'led-red' : 'led-green'}`}></span>
                    {video.has_accident ? 'ALERT DETECTED' : 'NORMAL'}
                  </span>
                  <span className="cam-name-badge">CAM-{video.id.toString().padStart(3, '0')}</span>
                </div>

                <Link to={`/videos/${video.id}`}>
                  <img
                    src={video.poster_path ? `/${video.poster_path}` : 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600'}
                    alt={video.original_filename}
                    className="surveillance-poster"
                  />
                </Link>

                <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.9)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {video.original_filename}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <span>{video.duration_sec ? `${video.duration_sec.toFixed(1)}s` : 'Processing'}</span>
                    <span style={{ color: video.has_accident ? 'var(--hud-red)' : 'var(--hud-green)', fontWeight: 'bold' }}>
                      MAX SCORE: {video.max_score}
                    </span>
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
