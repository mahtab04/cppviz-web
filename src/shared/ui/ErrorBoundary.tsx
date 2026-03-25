import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-300 p-8 h-screen w-full">
          <div className="bg-red-900/20 border border-red-700/50 p-6 rounded-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="mb-4 text-sm text-gray-400">An unexpected error occurred in the application rendering.</p>
            <pre className="text-xs bg-gray-950 p-4 rounded overflow-auto border border-gray-800 text-red-200">
              {this.state.error?.message}
            </pre>
            <button 
              className="mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded transition-colors text-sm font-medium text-white"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
