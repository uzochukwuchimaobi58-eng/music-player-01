import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeCrashlytics } from './services/crashlyticsService.ts';

// Initialize global crashlytics and error monitoring
initializeCrashlytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
