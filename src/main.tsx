import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { SessionManager } from './SessionManager';
import { AppProvider } from './state/store';
import { registerServiceWorker } from './lib/pwa';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <SessionManager />
    </AppProvider>
  </React.StrictMode>,
);
