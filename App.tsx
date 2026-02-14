
import React, { useEffect } from 'react';
import { HashRouter, useNavigate } from 'react-router-dom';
import RootErrorBoundary from './shared/components/RootErrorBoundary';
import { ToastProvider } from './shared/context/ToastContext';
import AppRoutes from './app/routes/AppRoutes';
import OfflineIndicator from './shared/components/OfflineIndicator';
import { useSettings } from './shared/hooks/useSettings';
import { aiManager } from './core/ai/aiManager';

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

    // 2. Default Redirect to First Tab (Live MCQ)
    if (isInitialLoad) {
      isInitialLoad = false;
      navigate('/live-mcq/topics', { replace: true });
    }
  }, [navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <RootErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <HashRouter>
          <AppLogicHandler />
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </RootErrorBoundary>
  );
};

export default App;
