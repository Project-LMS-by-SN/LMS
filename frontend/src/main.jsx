import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Automatically reload the page when a redeploy invalidates old dynamic import chunks
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes: keep data fresh across page switches
      gcTime: 1000 * 60 * 60, // 60 minutes in memory
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Do not reload when revisiting an already-loaded page
      refetchOnReconnect: false,
      placeholderData: (previousData) => previousData,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
