import React from 'react';

interface HeaderProps {
  currentView: 'main' | 'history' | 'settings';
  onNavigate: (view: 'main' | 'history' | 'settings') => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
}) => {
  return (
    <header className="lumen-header">
      <div className="lumen-brand" onClick={() => onNavigate('main')} style={{ cursor: 'pointer' }}>
        <div className="lumen-logo-badge">⚡</div>
        <span>Lumen</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className={`lumen-icon-btn ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => onNavigate(currentView === 'history' ? 'main' : 'history')}
          title="Local History"
          style={{ color: currentView === 'history' ? '#E8FF3B' : undefined }}
        >
          🕒
        </button>
        <button
          className={`lumen-icon-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate(currentView === 'settings' ? 'main' : 'settings')}
          title="Settings"
          style={{ color: currentView === 'settings' ? '#E8FF3B' : undefined }}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
};
