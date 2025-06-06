import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h1 className="text-2xl font-bold text-white mb-2">System Error</h1>
              <p className="text-red-200 mb-4">
                Vessel systems encountered an error and need to restart.
              </p>
              <div className="bg-red-900/50 rounded p-3 mb-4">
                <p className="text-red-100 text-sm font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
              >
                Restart Systems
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}