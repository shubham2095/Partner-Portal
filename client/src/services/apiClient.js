import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    switch (status) {
      case 401:
        useAuthStore.getState().logout()
        toast.error(message || 'Session expired. Please log in again.')
        break
      case 403:
        toast.error(message || 'You do not have permission to do that.')
        break
      case 404:
        toast.error(message || 'Requested resource was not found.')
        break
      case 422:
        toast.error(message || 'Please check the submitted data.')
        break
      case 429:
        toast.error(message || 'Too many requests. Please slow down.')
        break
      case 500:
        toast.error(message || 'Something went wrong on our end.')
        break
      default:
        if (!error.response) {
          toast.error('Unable to reach the server. Check your connection.')
        }
    }

    return Promise.reject(error)
  }
)

export default apiClient
