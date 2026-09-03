import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/forms/Input'
import PasswordInput from '../components/forms/PasswordInput'
import Button from '../components/ui/Button'
import SocialLogin from '../components/auth/SocialLogin'
import { loginFreelancer, resendVerification } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (formValues) => {
    setUnverifiedEmail(null)
    try {
      const { user, token } = await loginFreelancer(formValues)
      setSession({ user, token })
      toast.success('Welcome back!')
      navigate('/freelancer/dashboard')
    } catch (error) {
      if (error?.response?.data?.errors?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(formValues.email)
      }
      // apiClient interceptor already surfaces the error toast
    }
  }

  const resend = async () => {
    try {
      await resendVerification(unverifiedEmail)
      toast.success('Verification email sent. Check your inbox.')
    } catch {
      /* interceptor toasts */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="mb-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
        <p className="mt-1.5 text-sm text-text-secondary">Log in to your partner dashboard.</p>
      </div>
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="aditya.verma@gmail.com"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required' })}
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password', { required: 'Password is required' })}
      />

      {unverifiedEmail && (
        <div className="rounded-lg border border-warning/30 bg-warning-bg px-3 py-2.5 text-sm text-warning">
          Your email isn’t verified yet.{' '}
          <button type="button" onClick={resend} className="font-semibold underline underline-offset-2">
            Resend verification link
          </button>
        </div>
      )}

      <div className="text-right text-sm">
        <Link to="/auth/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Log In
      </Button>

      <SocialLogin />

      <p className="text-center text-sm text-text-secondary">
        Not a partner yet?{' '}
        <Link to="/auth/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
