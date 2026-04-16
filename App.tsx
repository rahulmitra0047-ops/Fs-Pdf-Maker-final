


import React, { useEffect } from 'react';
import { HashRouter, useNavigate } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';
import RootErrorBoundary from './shared/components/RootErrorBoundary';
import { ToastProvider } from './shared/context/ToastContext';
import AppRoutes from './app/routes/AppRoutes';
import OfflineIndicator from './shared/components/OfflineIndicator';
import { useSettings } from './shared/hooks/useSettings';
import { aiManager } from './core/ai/aiManager';
import { migrateLearnData } from './core/migration/learnMigration';
import { ThemeProvider } from './features/flashcard/context/ThemeContext';

// Module-level flag to track if we've handled the initial redirect.
let isInitialLoad = true;

const AppLogicHandler = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Sync AI Keys
  useEffect(() => {
    if (settings.geminiApiKeys) {
        aiManager.setKeys(settings.geminiApiKeys);
    }
  }, [settings.geminiApiKeys]);
  
  useEffect(() => {
    // 0. Trigger Migration
    migrateLearnData();

    // Hide Capacitor Native Splash Screen precisely now (since React/DOM is ready)
    // This perfectly reveals our identical HTML/CSS splash screen underneath without any flash
    SplashScreen.hide().catch(console.error);

    // Remove the CSS-only native splash screen once the app is loaded
    const splashScreen = document.getElementById('native-splash');
    if (splashScreen) {
      setTimeout(() => {
        splashScreen.classList.add('splash-exit');
        setTimeout(() => splashScreen.remove(), 400); // Remove from DOM after fade out
      }, 1000); // Wait 1s so the user can enjoy the splash animation before the app reveals
    }

    // 1. Handle Share Target (URL Params -> App State)
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text');
    const sharedTitle = params.get('title');
    const sharedUrl = params.get('url');

    if (sharedText || sharedUrl) {
        const content = [sharedTitle, sharedText, sharedUrl].filter(Boolean).join('\n\n');
        
        // Clean URL params without removing sub-path
        const cleanUrl = window.location.pathname; 
        window.history.replaceState({}, '', cleanUrl);
        
        // Navigate to Create page with payload
        navigate('/create', { state: { importedText: content } });
        return;
    }

    // 2. Default Redirect to First Tab (Home)
    if (isInitialLoad) {
      isInitialLoad = false;
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <RootErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <OfflineIndicator />
          <HashRouter>
            <AppLogicHandler />
            <AppRoutes />
          </HashRouter>
        </ThemeProvider>
      </ToastProvider>
    </RootErrorBoundary>
  );
};

export default App;