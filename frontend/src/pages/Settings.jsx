import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, ShieldCheck, Database, KeyRound } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    setMsg('System settings updated successfully.');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
      <div className="hud-card">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <SettingsIcon size={24} color="var(--hud-cyan)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: '18px' }}>DISPATCH COMMAND PREFERENCES</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
              OFFICER CREDENTIALS & DETECTION ENGINE PARAMETERS
            </p>
          </div>
        </div>

        {msg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--hud-green)', padding: '10px 14px', borderRadius: '4px', color: 'var(--hud-green)', fontSize: '13px', marginBottom: '20px' }}>
            ✓ {msg}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>COMMAND OFFICER NAME</label>
            <input
              type="text"
              value={user?.full_name || ''}
              readOnly
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>COMMAND EMAIL</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>YOLO DETECTOR ENGINE MODEL</label>
            <input
              type="text"
              value="yolov8n.pt (Nano Model - High Performance Realtime Processing)"
              readOnly
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: 'var(--hud-cyan)', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <button type="submit" className="cmd-btn cmd-btn-primary">
            <ShieldCheck size={16} /> SAVE DISPATCH PREFERENCES
          </button>
        </form>

      </div>
    </div>
  );
};
