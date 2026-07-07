import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`ErrorBoundary (${this.props.fallback || 'page'}):`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.render) {
        return this.props.render(this.state.error);
      }
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-[1px] bg-red-400 mb-6" />
          <h2 className="font-serif italic text-2xl mb-2">
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className="font-mono text-xs text-[#666] dark:text-[#888] mb-6">
            {this.props.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 border border-[#CCC] dark:border-[#333] hover:bg-black/5 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
