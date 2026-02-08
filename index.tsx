import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Filter out Firebase offline warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string') {
      const msg = args[0];
      if (
          msg.includes('Could not reach Cloud Firestore backend') ||
          msg.includes('operate in offline mode') ||
          msg.includes('Backend didn\'t respond within')
      ) {
        return;
      }
  }
  originalConsoleError(...args);
};

// PWA Service Worker Registration with Update Detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
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