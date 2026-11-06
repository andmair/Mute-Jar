import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { syncBuildAndPurgeCache } from './utils/buildCacheManager';

// Run build synchronization immediately on startup:
// If a new build is detected, all local storage, session storage, and caches are purged.
syncBuildAndPurgeCache();

createRoot(document.getElementById('root')!).render(<App />);
