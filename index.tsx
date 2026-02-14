
import React from 'react';
import ReactDOM from 'react-dom/client';

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

// PWA Service Worker Registration with Update Detection
const meta = import.meta as any;
const isProduction = meta.env ? meta.env.PROD : false;

if (isProduction && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                window.dispatchEvent(new Event('pwa-update-available'));
              }
            };
          }
        };
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

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
