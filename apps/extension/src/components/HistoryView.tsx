import React, { useState, useEffect } from 'react';
import { HistoryItem } from '@lumen/shared';
import { getLocalHistory, deleteHistoryItem, clearAllHistory } from '../lib/storage.js';

interface HistoryViewProps {
  onSelectSummary: (item: HistoryItem) => void;
  onClose: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectSummary, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');

  const loadHistory = async () => {
    const items = await getLocalHistory();
    setHistory(items);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteHistoryItem(id);
    await loadHistory();
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all saved summaries?')) {
      await clearAllHistory();
      await loadHistory();
    }
  };

  const filtered = history.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase()) ||
      item.previewText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ color: '#E8FF3B', fontSize: '14px' }}>🕒 Local History</h3>
        <button onClick={onClose} style={{ color: '#929292', fontSize: '14px' }}>✕</button>
      </div>

      <input
        type="text"
        placeholder="Search history by title or URL..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%' }}
      />

      {filtered.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#929292', fontSize: '12px' }}>
          No local history items found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSummary(item)}
              style={{
                background: '#111111',
                border: '1px solid #272A2D',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8FF3B')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#272A2D')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '13px', color: '#FAFAF5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {item.title}
                </strong>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  style={{ color: '#929292', fontSize: '12px', padding: '2px 4px' }}
                  title="Delete item"
                >
                  🗑️
                </button>
              </div>

              <div style={{ fontSize: '10px', color: '#8DB7FF', margin: '2px 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.url}
              </div>

              <p style={{ fontSize: '11px', color: '#929292', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.previewText}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10px', color: '#6F757E' }}>
                <span>Mode: {item.captureMode.toUpperCase()}</span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <button
          onClick={handleClearAll}
          style={{ padding: '8px', background: 'transparent', color: '#FF5C5C', border: '1px solid rgba(255,92,92,0.3)', borderRadius: '6px', fontSize: '11px', alignSelf: 'center' }}
        >
          Clear All History
        </button>
      )}
    </div>
  );
};
