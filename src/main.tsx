import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { WorkspaceProvider } from './context/Workspace'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WorkspaceProvider><App /></WorkspaceProvider>
    </BrowserRouter>
  </StrictMode>,
)
