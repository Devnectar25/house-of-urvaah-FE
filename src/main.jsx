import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initErrorTracker } from './services/errorTracker'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Initialize global runtime & console error tracker
initErrorTracker();

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
  // </React.StrictMode>,
)
