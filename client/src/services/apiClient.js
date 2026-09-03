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

    // Give each error class a stable toast id so a burst of identical
    // failures (e.g. a dashboard firing 12 parallel requests that all 429)
    // collapses into a single toast instead of stacking a dozen.
    const notify = (fallback) => toast.error(message || fallback, { id: `http-${status ?? 'network'}` })

    switch (status) {
      case 401:
        useAuthStore.getState().logout()
        notify('Session expired. Please log in again.')
        break
      case 403:
        notify('You do not have permission to do that.')
        break
      case 404:
        notify('Requested resource was not found.')
        break
      case 422:
        notify('Please check the submitted data.')
        break
      case 429:
        notify('Too many requests. Please slow down.')
        break
      case 500:
        notify('Something went wrong on our end.')
        break
      default:
        if (!error.response) {
          toast.error('Unable to reach the server. Check your connection.', { id: 'http-network' })
        }
    }

    return Promise.reject(error)
  }
)

export default apiClient
