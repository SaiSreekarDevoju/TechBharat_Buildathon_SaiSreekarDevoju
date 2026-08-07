import React, { useEffect, useState } from 'react';
import { UserOptions, LANGUAGE_NAMES, SupportedLanguage } from '@lumen/shared';
import { clearAllHistory, saveGlobalCredentials } from '../lib/storage.js';
import { saveTabOptions } from '../lib/tabStorage.js';

interface SettingsViewProps {
  tabId: number;
  options: UserOptions;
  onOptionsChange: (options: UserOptions) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ tabId, options: incomingOptions, onOptionsChange, onClose }) => {
  const [options, setOptions] = useState<UserOptions>(incomingOptions);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setOptions(incomingOptions);
  }, [incomingOptions, tabId]);

  const commitTabOptions = async (nextOptions: UserOptions) => {
    setOptions(nextOptions);
    onOptionsChange(nextOptions);
    await saveTabOptions(tabId, nextOptions);
  };

  const handleSave = async () => {
    await saveGlobalCredentials({ groqApiKey: options.groqApiKey, proxyUrl: options.proxyUrl });
    const saved = await saveTabOptions(tabId, options);
    onOptionsChange(saved);
    setSavedMessage('Settings saved for this tab.');
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestResult('Testing connection...');
    try {
      const res = await fetch(`${options.proxyUrl.replace(/\/$/, '')}/health`);
      if (res.ok) {
        const data = await res.json();
        setTestResult(`Connected! (${data.name || 'Server OK'})`);
      } else {
        setTestResult(`Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      setTestResult(`Connection failed: ${err.message}`);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all locally saved history?')) {
      await clearAllHistory();
      alert('Local history cleared.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ color: '#E8FF3B', fontSize: '14px' }}>⚙️ Lumen Settings</h3>
          <div style={{ fontSize: '10px', color: '#6F757E', marginTop: '2px' }}>Behavior settings apply only to this tab.</div>
        </div>
        <button onClick={onClose} style={{ color: '#929292', fontSize: '14px' }}>✕</button>
      </div>

      {savedMessage && (
        <div style={{ padding: '8px', background: 'rgba(143, 227, 136, 0.15)', border: '1px solid #8FE388', borderRadius: '6px', color: '#8FE388', fontSize: '11px' }}>
          ✓ {savedMessage}
        </div>
      )}

      <div>
        <label style={{ fontSize: '11px', color: '#929292', display: 'block', marginBottom: '4px' }}>Groq API Key</label>
        <input
          type="password"
          value={options.groqApiKey}
          onChange={(e) => {
            const next = { ...options, groqApiKey: e.target.value };
            setOptions(next);
            onOptionsChange(next);
          }}
          placeholder="gsk_..."
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '10px', color: '#6F757E', marginTop: '4px' }}>
          Credential is stored locally so you do not need to re-enter it on every tab.
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#929292', display: 'block', marginBottom: '4px' }}>Backend Proxy Server URL</label>
        <input
          type="text"
          value={options.proxyUrl}
          onChange={(e) => {
            const next = { ...options, proxyUrl: e.target.value };
            setOptions(next);
            onOptionsChange(next);
          }}
          placeholder="http://localhost:3001"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#929292', display: 'block', marginBottom: '4px' }}>Text Model</label>
          <select
            value={options.model}
            onChange={(e) => void commitTabOptions({ ...options, model: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
            <option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
            <option value="openai/gpt-oss-20b">GPT-OSS 20B</option>
            <option value="groq/compound-mini">Groq Compound Mini</option>
            <option value="groq/compound">Groq Compound</option>
          </select>
          <div style={{ fontSize: '9px', color: '#6F757E', marginTop: '4px', lineHeight: 1.35 }}>
            Compound systems are text-only here. Visual Region always uses the Vision Model.
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#929292', display: 'block', marginBottom: '4px' }}>Vision Model</label>
          <select
            value={options.visionModel}
            onChange={(e) => void commitTabOptions({ ...options, visionModel: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
            <option value="llama-3.2-11b-vision-preview">llama-3.2-11b-vision-preview</option>
            <option value="llama-3.2-90b-vision-preview">llama-3.2-90b-vision-preview</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: '#929292', display: 'block', marginBottom: '4px' }}>Output Language</label>
        <select
          value={options.language}
          onChange={(e) => {
            const language = e.target.value as SupportedLanguage;
            void commitTabOptions({ ...options, language });
          }}
          style={{ width: '100%' }}
        >
          {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <div style={{ fontSize: '10px', color: '#6F757E', marginTop: '4px' }}>
          Every newly opened tab starts in English, regardless of another tab's language.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#111111', padding: '12px', borderRadius: '8px', border: '1px solid #272A2D' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#FAFAF5', cursor: 'pointer' }}>
          <span>🛡️ Privacy Redaction Mode</span>
          <input
            type="checkbox"
            checked={true}
            disabled
            readOnly
          />
        </label>
        <div style={{ fontSize: '10px', color: '#929292' }}>Always ON. Sensitive identifiers are redacted before any text leaves the browser/server summarization pipeline.</div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#FAFAF5', cursor: 'pointer', marginTop: '6px' }}>
          <span>📜 Store Local History</span>
          <input
            type="checkbox"
            checked={options.localHistoryEnabled}
            onChange={(e) => void commitTabOptions({ ...options, localHistoryEnabled: e.target.checked })}
          />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={handleSave} style={{ padding: '10px', background: '#E8FF3B', color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px' }}>
          Save Settings
        </button>
        <button onClick={handleTestConnection} style={{ padding: '8px', background: '#181818', color: '#E8E8E0', border: '1px solid #272A2D', borderRadius: '6px', fontSize: '12px' }}>
          Test Connection
        </button>
        {testResult && <div style={{ fontSize: '11px', color: testResult.includes('Connected') ? '#8FE388' : '#FF5C5C', textAlign: 'center' }}>{testResult}</div>}
        <button onClick={handleClearHistory} style={{ padding: '8px', background: 'transparent', color: '#FF5C5C', border: '1px solid rgba(255, 92, 92, 0.3)', borderRadius: '6px', fontSize: '11px', marginTop: '6px' }}>
          Clear Local History
        </button>
      </div>
    </div>
  );
};
