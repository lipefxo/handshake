import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { Agentation } from 'agentation'

const isEmbeddedPresentationPreview =
  window.location.pathname.startsWith('/p/') &&
  window.location.hash.includes('preview') &&
  window.self !== window.top

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {!isEmbeddedPresentationPreview && <Agentation />}
  </StrictMode>,
)
