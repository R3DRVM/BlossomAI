import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[render:error]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleCopyStack = () => {
    const { error, errorInfo } = this.state;
    const stackText = `Error: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(stackText);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = stackText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-destructive-foreground text-sm font-bold">!</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isDev ? 'Development Error' : 'Something went wrong'}
              </h2>
            </div>
            
            {isDev && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Stack trace
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error?.stack}
                  </pre>
                </details>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors"
              >
                Try Reload
              </button>
              {isDev && (
                <button
                  onClick={this.handleCopyStack}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded text-sm hover:bg-secondary/80 transition-colors"
                >
                  Copy Stack
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
