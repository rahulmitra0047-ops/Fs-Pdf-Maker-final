
import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

// Polyfill for Google GenAI SDK to prevent crash on launch
// This must run before App import to ensure @google/genai finds process.env
if (typeof window !== 'undefined') {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  if (typeof (globalThis as any).process === 'undefined') {
    (globalThis as any).process = { env: {} };
  }
}

import App from './App';
import './index.css';

// PWA Service Worker Registration with vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'));
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
