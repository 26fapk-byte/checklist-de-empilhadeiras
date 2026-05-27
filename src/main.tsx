import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for PWA support (best-effort, silent failure ok)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('LogiCheck: Service worker registered.');
    }).catch((err) => {
      console.warn('LogiCheck: Service worker registration failed.', err);
    });
  });
}
