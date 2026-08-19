import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/forms/Input'
import Button from '../components/ui/Button'
import { forgotPassword } from '../services/authService'

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email)
      toast.success('If an account exists for this email, a reset link has been sent.')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (isSubmitSuccessful) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-text-primary">Check your email for a password reset link.</p>
        <Link to="/auth/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required' })}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Send Reset Link
      </Button>
      <p className="text-center text-sm text-text-secondary">
        <Link to="/auth/login" className="text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  )
}
