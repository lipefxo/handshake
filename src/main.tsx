import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import 'dialkit/styles.css'
import App from './App.tsx'
import { DialRoot } from 'dialkit'
import { Agentation } from 'agentation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DialRoot />
    <Agentation />
  </StrictMode>,
)
