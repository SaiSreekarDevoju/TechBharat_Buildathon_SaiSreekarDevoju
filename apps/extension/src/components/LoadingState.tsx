import React from 'react';

interface LoadingStateProps {
  statusText: string;
  onCancel: () => void;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ statusText, onCancel }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid #181818',
          borderTopColor: '#E8FF3B',
          animation: 'spin 1s linear infinite',
        }}
      />

      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAF5', marginBottom: '6px' }}>
          Understanding on-screen content
        </div>
        <div style={{ fontSize: '12px', color: '#E8FF3B' }}>{statusText}</div>
      </div>

      <button
        onClick={onCancel}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#181818',
          border: '1px solid #272A2D',
          borderRadius: '6px',
          color: '#929292',
          fontSize: '12px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5C5C')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#929292')}
      >
        Cancel capture
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
