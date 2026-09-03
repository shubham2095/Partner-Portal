import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            border: '1px solid #e8e7f0',
            padding: '12px 14px',
            fontSize: '13.5px',
            fontWeight: 500,
            color: '#1c1b29',
            boxShadow: '0 12px 24px -8px rgba(28,27,41,0.18), 0 4px 8px -2px rgba(28,27,41,0.06)',
          },
          success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#e11d48', secondary: '#ffffff' } },
        }}
      />
    </>
  )
}
