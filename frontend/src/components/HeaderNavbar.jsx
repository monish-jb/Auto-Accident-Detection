import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LayoutDashboard, Monitor, UploadCloud, Settings, LogOut } from 'lucide-react';

export const HeaderNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="cmd-navbar">
      <div className="cmd-logo">
        <div className="cmd-logo-badge">INCIDENT HUD</div>
        <div className="cmd-title">COMMAND CENTER <span style={{ color: 'var(--hud-cyan)', fontSize: '12px' }}>v2.0</span></div>
      </div>

      <nav className="cmd-nav-links">
        <Link to="/dashboard" className={`cmd-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={16} /> Dashboard
        </Link>
        <Link to="/upload" className={`cmd-nav-item ${location.pathname === '/upload' ? 'active' : ''}`}>
          <UploadCloud size={16} /> Feed Upload
        </Link>
        <Link to="/history" className={`cmd-nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
          <Monitor size={16} /> Surveillance Wall
        </Link>
        <Link to="/settings" className={`cmd-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={16} /> Settings
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--hud-cyan)' }}>
            <span className="led-indicator led-green" style={{ marginRight: '6px' }}></span>
            {user.full_name || user.username}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            RANK: DISPATCH OFFICER
          </div>
        </div>

        <button onClick={logout} className="cmd-btn cmd-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
          <LogOut size={14} /> LOGOUT
        </button>
      </div>
    </header>
  );
};
