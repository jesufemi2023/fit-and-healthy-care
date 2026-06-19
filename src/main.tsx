import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGA } from './lib/analytics';
import { initMetaPixel } from './lib/metaPixel';

// Initialize Analytics & Tracking Services
initGA();
initMetaPixel();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
