import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PasswordInput from '../components/forms/PasswordInput'
import Button from '../components/ui/Button'
import { resetPassword } from '../services/authService'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ newPassword }) => {
    try {
      await resetPassword(token, newPassword)
      toast.success('Password reset successfully. Please log in.')
      navigate('/auth/login')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-danger">This reset link is missing a token.</p>
        <Link to="/auth/forgot-password" className="text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <PasswordInput
        id="newPassword"
        label="New Password"
        placeholder="********"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
        })}
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm New Password"
        placeholder="********"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === watch('newPassword') || 'Passwords do not match',
        })}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Reset Password
      </Button>
    </form>
  )
}
