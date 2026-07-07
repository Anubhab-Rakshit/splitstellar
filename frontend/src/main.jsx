import React from 'react'
import ReactDOM from 'react-dom/client'
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
        <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#050A14] text-black dark:text-white p-5 font-mono transition-colors duration-500">
          <h1 className="text-red-500 text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="mb-4 text-[#666] dark:text-text-secondary">Please check the browser console for more details.</p>
          <pre className="text-amber-500 bg-[#E5E5E5] dark:bg-[#111D33] p-3 rounded overflow-x-auto mb-3">
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre className="text-[#666] dark:text-[#94A3B8] bg-[#E5E5E5] dark:bg-[#111D33] p-3 rounded overflow-x-auto">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
