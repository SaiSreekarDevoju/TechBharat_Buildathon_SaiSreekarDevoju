import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DEFAULT_USER_OPTIONS, UserOptions } from '@lumen/shared';
import { SettingsView } from '../components/SettingsView.js';
import { getActiveTab } from '../lib/tab.js';
import { getTabOptions } from '../lib/tabStorage.js';
import '../styles/index.css';

const OptionsPage = () => {
  const [tabId, setTabId] = useState<number | null>(null);
  const [options, setOptions] = useState<UserOptions>(DEFAULT_USER_OPTIONS);

  useEffect(() => {
    void (async () => {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      setTabId(tab.id);
      setOptions(await getTabOptions(tab.id));
    })();
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', background: '#111111', borderRadius: '16px', border: '1px solid #272A2D' }}>
      {tabId ? (
        <SettingsView
          tabId={tabId}
          options={options}
          onOptionsChange={setOptions}
          onClose={() => window.close()}
        />
      ) : (
        <div style={{ color: '#FAFAF5', fontSize: '13px' }}>Open a normal browser tab, then reopen Lumen Settings.</div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
