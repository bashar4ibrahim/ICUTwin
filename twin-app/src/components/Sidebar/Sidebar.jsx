import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import { NAV_ITEMS } from '../../app/shared';

function Sidebar({ active, onNav, user, onLogout }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  return (
    <aside className="sidebar-shell">
      {/* Logo with ECG Animation */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-icon">⚕</div>
          <div className="logo-text">
            <h2>ICU Twin</h2>
            <span>DIGITAL TWIN v3.0</span>
          </div>
        </div>
        <div className="ecg-line">
          <svg viewBox="0 0 400 30" preserveAspectRatio="none">
            <polyline
              points="0,15 20,15 25,5 30,25 35,15 45,15 50,5 55,25 60,15 70,15 80,5 85,25 90,15 400,15"
              className="ecg-path"
            />
          </svg>
        </div>
      </div>

      {/* Status & Live Indicator */}
      <div className="sidebar-status">
        <span className="live-dot" />
        <span className="live-indicator">SYSTEM ACTIVE</span>
        <div className="sidebar-time">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="nav-section-title">{section}</div>
            {NAV_ITEMS.filter((n) => n.section === section).map((item) => (
              <div
                key={item.id}
                onClick={() => onNav(item.id)}
                className={`nav-item ${active === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {active === item.id && <span className="active-dot" />}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="user-avatar">
            {user?.full_name?.slice(0, 1).toUpperCase() || 'D'}
          </div>
          <div className="user-info" style={{ flex: 1 }}>
            <h4>{user?.full_name || 'Doctor'}</h4>
            <span>{user?.role?.toUpperCase() || 'CLINICIAN'}</span>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Logout">
            ⇥
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;