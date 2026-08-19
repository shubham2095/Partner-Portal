import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/forms/Input'
import Button from '../components/ui/Button'
import { loginFreelancer } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (formValues) => {
    try {
      const { user, token } = await loginFreelancer(formValues)
      setSession({ user, token })
      toast.success('Welcome back!')
      navigate('/freelancer/dashboard')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
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
      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="********"
        error={errors.password?.message}
        {...register('password', { required: 'Password is required' })}
      />
      <div className="text-right text-sm">
        <Link to="/auth/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Log In
      </Button>
      <p className="text-center text-sm text-text-secondary">
        Not a partner yet?{' '}
        <Link to="/auth/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
