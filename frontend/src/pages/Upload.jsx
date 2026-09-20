import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RadarSweep } from '../components/RadarSweep';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle } from 'lucide-react';

export const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['mp4', 'avi', 'mov', 'mkv'].includes(ext)) {
      setError('Invalid file format. Allowed formats: .MP4, .AVI, .MOV, .MKV');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File exceeds max size limit of 100MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setProgress(15);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress ticks
      const timer = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? prev : prev + 10));
      }, 500);

      const res = await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(timer);
      setProgress(100);

      setTimeout(() => {
        navigate(`/videos/${res.data.id}`);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload video');
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
      <div className="hud-card">
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: '20px', letterSpacing: '2px' }}>
            TACTICAL FEED UPLOAD PORTAL
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--hud-cyan)', marginTop: '4px' }}>
            SUBMIT SURVEILLANCE FOOTAGE FOR AUTOMATED ACCIDENT DETECTION
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--hud-red)', padding: '12px', borderRadius: '4px', color: '#fff', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--hud-red)" /> {error}
          </div>
        )}

        {uploading ? (
          <RadarSweep progress={progress} statusText="EXECUTING YOLOv8 & DEEPSORT ANALYSIS..." />
        ) : (
          <form onSubmit={handleUploadSubmit}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('feedFileInput').click()}
              style={{
                border: '2px dashed var(--hud-panel-border)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.4)',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'all 0.2s'
              }}
            >
              <UploadCloud size={48} color="var(--hud-cyan)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '16px', marginBottom: '6px' }}>
                DRAG & DROP SURVEILLANCE VIDEO HERE
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                Supports .MP4, .AVI, .MOV, .MKV (Max limit: 100MB)
              </p>
              <input
                type="file"
                id="feedFileInput"
                accept="video/mp4,video/avi,video/mov,video/mkv"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
            </div>

            {selectedFile && (
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--hud-cyan)', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <FileVideo size={20} color="var(--hud-cyan)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold' }}>
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                {previewUrl && (
                  <video src={previewUrl} controls style={{ width: '100%', maxHeight: '240px', borderRadius: '4px', background: '#000' }} />
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile}
              className="cmd-btn cmd-btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: selectedFile ? 1 : 0.5 }}
            >
              <CheckCircle2 size={16} /> SUBMIT FEED FOR AI ANALYSIS
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
