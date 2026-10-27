import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/cairo'
import './styles/index.css'
import { LocaleProvider } from './shared/i18n/LocaleProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'
import { ErrorBoundary } from './app/ErrorBoundary'
import { Application } from './app/Application'
import './styles/auth.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <ThemeProvider>
          <Application />
        </ThemeProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </StrictMode>,
)
