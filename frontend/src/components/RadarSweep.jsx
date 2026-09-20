import React from 'react';

export const RadarSweep = ({ progress = 0, statusText = "SCANNING VIDEO TRAJECTORIES..." }) => {
  return (
    <div style={{ textAlign: 'center', padding: '30px' }}>
      <div className="radar-container">
        <div className="radar-sweep"></div>
      </div>
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '24px', color: 'var(--hud-cyan)', marginBottom: '8px' }}>
        {progress}%
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--hud-amber)', letterSpacing: '1px' }}>
        {statusText}
      </div>
      <div style={{ width: '100%', maxWidth: '300px', height: '4px', background: 'rgba(255,255,255,0.1)', margin: '16px auto 0 auto', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--hud-cyan)', transition: 'width 0.3s' }}></div>
      </div>
    </div>
  );
};
