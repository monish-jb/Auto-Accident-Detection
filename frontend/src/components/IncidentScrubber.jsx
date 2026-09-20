import React from 'react';

export const IncidentScrubber = ({ duration = 1, currentTime = 0, incidents = [], onSeek }) => {
  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const targetTime = ratio * duration;
    onSeek(targetTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline-scrubber-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
        <span>TIMELINE SCRUBBER ({incidents.length} INCIDENTS DETECTED)</span>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div className="scrubber-track" onClick={handleTrackClick}>
        {/* Progress bar */}
        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--hud-cyan)', borderRadius: '6px' }}></div>

        {/* Incident diamond markers */}
        {incidents.map((inc) => {
          const leftPercent = duration > 0 ? (inc.timestamp_sec / duration) * 100 : 0;
          return (
            <div
              key={inc.id}
              className="scrubber-incident-marker"
              style={{ left: `${leftPercent}%` }}
              title={`Jump to Crash at ${inc.timestamp_sec.toFixed(2)}s (Score: ${inc.accident_score})`}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(inc.timestamp_sec);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
