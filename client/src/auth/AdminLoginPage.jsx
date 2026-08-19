import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/forms/Input'
import Button from '../components/ui/Button'
import { loginAdmin } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (formValues) => {
    try {
      const { user, token } = await loginAdmin(formValues)
      setSession({ user, token })
      toast.success('Welcome back!')
      navigate('/admin/dashboard')
    } catch (error) {
      // apiClient interceptor already surfaces an error toast
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <p className="text-center text-sm text-text-secondary">Admin sign in</p>
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="admin@example.com"
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
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Log In
      </Button>
    </form>
  )
}
