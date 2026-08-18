import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#050A14] text-black dark:text-white p-5 font-mono transition-colors duration-500 flex flex-col items-center justify-center text-center">
          <h1 className="text-red-500 text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="mb-4 text-[#666] dark:text-text-secondary">An unexpected error occurred. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="btn-primary px-6 py-3 text-xs">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
