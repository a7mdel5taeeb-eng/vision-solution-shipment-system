import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource-variable/montserrat'
import '@fontsource-variable/cairo'
import './styles/index.css'
import { router } from './app/router'
import { LocaleProvider } from './shared/i18n/LocaleProvider'
import { ThemeProvider } from './shared/theme/ThemeProvider'
import { ErrorBoundary } from './app/ErrorBoundary'
import { DemoProvider } from './app/demo/DemoProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <ThemeProvider>
          <DemoProvider>
            <RouterProvider router={router} />
          </DemoProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </StrictMode>,
)
