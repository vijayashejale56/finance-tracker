import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
            <div className="text-5xl mb-4">😵</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The app encountered an unexpected error. Please refresh the page.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6 text-left">
              <code className="text-xs text-red-500 dark:text-red-400 break-all">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}