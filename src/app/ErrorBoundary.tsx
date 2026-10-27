import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ar, en } from '../shared/i18n/messages'

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return <ErrorPage />
  }
}

/** Also used by React Router, which handles route render errors before the root boundary. */
export function ErrorPage() {
  const t = document.documentElement.lang === 'ar' ? ar : en
  return (
    <main className="error-screen">
      <div className="panel">
        <p className="eyebrow">{t.appName}</p>
        <h1>{t.errorTitle}</h1>
        <p>{t.errorDescription}</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          {t.reload}
        </button>
      </div>
    </main>
  )
}
