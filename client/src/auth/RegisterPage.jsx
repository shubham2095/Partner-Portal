import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/forms/Input'
import PasswordInput from '../components/forms/PasswordInput'
import Button from '../components/ui/Button'
import { registerFreelancer } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (formValues) => {
    try {
      const { user, token } = await registerFreelancer({
        email: formValues.email,
        password: formValues.password,
        fullName: formValues.fullName,
        mobile: formValues.mobile,
      })
      setSession({ user, token })
      toast.success('Account created! Please check your email to verify your address.')
      navigate('/freelancer/dashboard')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="fullName"
        label="Full Name"
        placeholder="Jane Doe"
        error={errors.fullName?.message}
        {...register('fullName', { required: 'Name is required' })}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required' })}
      />
      <Input
        id="mobile"
        label="Mobile"
        placeholder="+91 90000 00000"
        error={errors.mobile?.message}
        {...register('mobile', { required: 'Mobile is required' })}
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="********"
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
        placeholder="********"
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
      <p className="text-center text-sm text-text-secondary">
        Already a partner?{' '}
        <Link to="/auth/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
