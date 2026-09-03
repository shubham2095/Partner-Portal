import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginWithGoogle } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const ROLE_HOME = {
  FREELANCER: '/freelancer/dashboard',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
}

// Waits for the Google Identity Services script (loaded async in index.html).
function whenGoogleReady(cb, tries = 0) {
  if (window.google?.accounts?.id) return cb()
  if (tries > 40) return // ~4s — give up quietly
  setTimeout(() => whenGoogleReady(cb, tries + 1), 100)
}

export default function SocialLogin({ label = 'Or continue with' }) {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const buttonRef = useRef(null)
  const renderedRef = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID || renderedRef.current) return

    whenGoogleReady(() => {
      if (renderedRef.current || !buttonRef.current) return
      renderedRef.current = true

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { user, token } = await loginWithGoogle(credential)
            setSession({ user, token })
            toast.success('Signed in with Google')
            navigate(ROLE_HOME[user.role] ?? '/', { replace: true })
          } catch {
            /* apiClient interceptor already shows the error toast */
          }
        },
      })

      const isDark = document.documentElement.classList.contains('dark')
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: Math.min(400, buttonRef.current.offsetWidth || 360),
      })
      setReady(true)
    })
  }, [navigate, setSession])

  if (!CLIENT_ID) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 flex min-h-[44px] justify-center">
        <div ref={buttonRef} className="w-full [color-scheme:light]" />
        {!ready && (
          <span className="self-center text-xs text-text-muted">Loading Google sign-in…</span>
        )}
      </div>
    </div>
  )
}
