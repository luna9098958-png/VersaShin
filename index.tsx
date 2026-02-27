import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

/**
 * Initializes and mounts the React application.
 * If the root element is not found immediately (e.g., script running before DOM is parsed),
 * it waits for the DOMContentLoaded event or retries after a short delay.
 */
const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountApp);
    } else {
      // Fallback: retry after a micro-task if the DOM is supposed to be ready but isn't
      setTimeout(mountApp, 10);
    }
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

mountApp();
