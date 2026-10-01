import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@higharc/dcp-hds-staging/tokens/primitives.css'
import '@higharc/dcp-hds-staging/tokens.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
