import { Component } from 'react';
import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full bg-blue-900/50 border border-blue-600/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-blue-400 mb-4 mx-auto" />
            <p className="text-blue-200 text-lg">Map loading error</p>
            <p className="text-blue-300 text-sm mt-2">Using position indicators instead</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}