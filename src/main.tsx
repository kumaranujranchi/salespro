import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/main.scss';

// Automatically clean up SPA fallback loader and route guard once React mounts
if (typeof window !== 'undefined') {
  const loader = document.querySelector('.spa-fallback-loader');
  if (loader) loader.remove();
  document.documentElement.classList.remove('is-spa-route');
}

// Automatically reload when a new service worker takes control (PWA auto-update)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

