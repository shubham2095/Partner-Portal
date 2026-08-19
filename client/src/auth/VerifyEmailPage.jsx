import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../services/authService'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  if (status === 'verifying') {
    return <p className="text-center text-sm text-text-secondary">Verifying your email...</p>
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-text-primary">Your email has been verified.</p>
        <Link to="/auth/login" className="text-primary hover:underline">
          Continue to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-danger">This verification link is invalid or has expired.</p>
      <Link to="/auth/login" className="text-primary hover:underline">
        Back to log in
      </Link>
    </div>
  )
}
