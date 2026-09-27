import { Component } from 'react'

// Shows a readable error instead of a blank white page
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Eroare aplicație:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">A apărut o eroare în această pagină</h2>
          <p className="mt-2 break-words font-mono text-xs text-red-700">{String(this.state.error?.message || this.state.error)}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Reîncarcă aplicația
          </button>
        </div>
      </div>
    )
  }
}
