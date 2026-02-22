import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { Agentation } from 'agentation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Agentation />
  </StrictMode>,
)
