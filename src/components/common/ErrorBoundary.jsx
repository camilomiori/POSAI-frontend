import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log the error to your error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-lg p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Ups! Algo salió mal
              </h1>
              
              <p className="text-gray-600 mb-6">
                Se ha producido un error inesperado. No te preocupes, puedes intentar recargar la página.
              </p>

              <div className="space-y-3 mb-6">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="w-full gap-2"
                >
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                    Detalles técnicos (desarrollo)
                  </summary>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;