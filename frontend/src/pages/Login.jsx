import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, UserCheck, Zap } from 'lucide-react';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('command');
  const [password, setPassword] = useState('control123');
  const [email, setEmail] = useState('command@control.gov');
  const [fullName, setFullName] = useState('Incident Command Officer');
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, username, password, fullName);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await login('command', 'control123');
      navigate('/dashboard');
    } catch (err) {
      // If demo user doesn't exist yet, auto register
      try {
        await register('command@control.gov', 'command', 'control123', 'Incident Command Officer');
        navigate('/dashboard');
      } catch (rErr) {
        setError('Demo authentication failed');
      }
    }
  };

  return (
    <div className="crt-overlay" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
        <div className="hud-card" style={{ padding: '36px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--hud-red)', borderRadius: '8px', marginBottom: '12px' }}>
              <ShieldAlert size={36} color="var(--hud-red)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: '20px', letterSpacing: '2px', color: 'var(--text-main)' }}>
              INCIDENT COMMAND ACCESS
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--hud-cyan)', marginTop: '4px' }}>
              AUTHENTICATION REQUIRED FOR DISPATCH SYSTEM
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--hud-red)', padding: '10px 14px', borderRadius: '4px', color: '#fff', fontSize: '13px', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>OFFICER FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>COMMAND EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>USERNAME / CALLSIGN</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>SECURITY PASSCODE</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hud-panel-border)', borderRadius: '4px', color: '#fff', outline: 'none' }}
              />
            </div>

            <button type="submit" className="cmd-btn cmd-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}>
              <KeyRound size={16} /> {isRegister ? 'REGISTER COMMAND OFFICER' : 'ACCESS CONTROL ROOM'}
            </button>

            <button type="button" onClick={handleDemoLogin} className="cmd-btn cmd-btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--hud-amber)', color: 'var(--hud-amber)' }}>
              <Zap size={16} /> AUTOLOGIN DEMO OFFICER (COMMAND)
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{ background: 'none', border: 'none', color: 'var(--hud-cyan)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            >
              {isRegister ? 'Already have access? Log in here' : 'Need new command credentials? Register here'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
