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
        <div style={{ padding: '20px', color: 'white', background: '#050A14', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#EF4444' }}>Something went wrong.</h1>
          <p>Please check the browser console for more details.</p>
          <pre style={{ color: '#F59E0B', background: '#111D33', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ color: '#94A3B8', background: '#111D33', padding: '10px', borderRadius: '5px', overflowX: 'auto', marginTop: '10px' }}>
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
