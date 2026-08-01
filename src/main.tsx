import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.scss';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('[NeonStream] #root not found — check index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
