import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MailCheck } from 'lucide-react'
import Input from '../components/forms/Input'
import PasswordInput from '../components/forms/PasswordInput'
import Button from '../components/ui/Button'
import SocialLogin from '../components/auth/SocialLogin'
import { registerFreelancer, resendVerification } from '../services/authService'

function CheckInbox({ email }) {
  const [resending, setResending] = useState(false)

  const resend = async () => {
    setResending(true)
    try {
      await resendVerification(email)
      toast.success('Verification email sent again.')
    } catch {
      /* interceptor toasts */
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary ring-1 ring-inset ring-primary-100">
        <MailCheck className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h1 className="text-xl font-bold tracking-tight text-text-primary">Confirm your email</h1>
      <p className="text-sm text-text-secondary">
        We sent a verification link to <span className="font-semibold text-text-primary">{email}</span>.
        Click it to activate your account, then log in.
      </p>
      <Button variant="secondary" size="sm" isLoading={resending} onClick={resend} className="mt-1">
        Resend email
      </Button>
      <Link to="/auth/login" className="mt-1 text-sm text-primary hover:underline">
        Back to log in
      </Link>
    </div>
  )
}

export default function RegisterPage() {
  const [submittedEmail, setSubmittedEmail] = useState(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (formValues) => {
    try {
      const { email } = await registerFreelancer({
        email: formValues.email,
        password: formValues.password,
        fullName: formValues.fullName,
        mobile: formValues.mobile,
      })
      setSubmittedEmail(email || formValues.email)
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (submittedEmail) return <CheckInbox email={submittedEmail} />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="mb-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create your partner account</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Takes a minute. You’ll verify your email and complete your profile next.
        </p>
      </div>
      <Input
        id="fullName"
        label="Full Name"
        placeholder="Aditya Verma"
        error={errors.fullName?.message}
        {...register('fullName', { required: 'Name is required' })}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="aditya.verma@gmail.com"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required' })}
      />
      <Input
        id="mobile"
        label="Mobile"
        placeholder="+91 98765 43210"
        error={errors.mobile?.message}
        {...register('mobile', { required: 'Mobile is required' })}
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
        })}
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === watch('password') || 'Passwords do not match',
        })}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Create Account
      </Button>

      <SocialLogin label="Or sign up with" />

      <p className="text-center text-sm text-text-secondary">
        Already a partner?{' '}
        <Link to="/auth/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
