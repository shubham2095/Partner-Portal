import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PublicLayout, AuthLayout, AdminLayout, FreelancerLayout } from '../layouts'
import ProtectedRoute from './ProtectedRoute'
import LandingPage from '../landing/LandingPage'
import LoginPage from '../auth/LoginPage'
import RegisterPage from '../auth/RegisterPage'
import AdminLoginPage from '../auth/AdminLoginPage'
import VerifyEmailPage from '../auth/VerifyEmailPage'
import ForgotPasswordPage from '../auth/ForgotPasswordPage'
import ResetPasswordPage from '../auth/ResetPasswordPage'
import AdminDashboardPage from '../admin/dashboard/AdminDashboardPage'
import FreelancerDashboardPage from '../freelancer/dashboard/FreelancerDashboardPage'
import FreelancerProfilePage from '../freelancer/profile/ProfilePage'
import FreelancerDocumentsPage from '../freelancer/documents/DocumentsPage'
import FreelancerListPage from '../admin/freelancers/FreelancerListPage'
import FreelancerDetailPage from '../admin/freelancers/FreelancerDetailPage'
import AdminWebinarListPage from '../admin/webinars/WebinarListPage'
import AdminWebinarDetailPage from '../admin/webinars/WebinarDetailPage'
import AdminQuestionListPage from '../admin/questions/QuestionListPage'
import AdminTestListPage from '../admin/tests/TestListPage'
import AdminTestDetailPage from '../admin/tests/TestDetailPage'
import AdminCertificateListPage from '../admin/certificates/CertificateListPage'
import AdminCertificateDetailPage from '../admin/certificates/CertificateDetailPage'
import FreelancerWebinarListPage from '../freelancer/webinars/WebinarListPage'
import FreelancerWebinarDetailPage from '../freelancer/webinars/WebinarDetailPage'
import FreelancerTestListPage from '../freelancer/tests/TestListPage'
import FreelancerTestInstructionsPage from '../freelancer/tests/TestInstructionsPage'
import FreelancerTestAttemptPage from '../freelancer/tests/TestAttemptPage'
import FreelancerTestResultPage from '../freelancer/tests/TestResultPage'
import FreelancerCertificateListPage from '../freelancer/certificates/CertificateListPage'
import FreelancerCertificateDetailPage from '../freelancer/certificates/CertificateDetailPage'
import AdminTrainingListPage from '../admin/training/TrainingListPage'
import AdminTrainingDetailPage from '../admin/training/TrainingDetailPage'
import FreelancerTrainingListPage from '../freelancer/training/TrainingListPage'
import FreelancerTrainingDetailPage from '../freelancer/training/TrainingDetailPage'
import FreelancerLessonPage from '../freelancer/training/LessonPage'
import VerifyCertificatePage from '../public/VerifyCertificatePage'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/verify', element: <VerifyCertificatePage /> },
      { path: '/verify/:certificateNumber', element: <VerifyCertificatePage /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'admin-login', element: <AdminLoginPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'freelancers', element: <FreelancerListPage /> },
          { path: 'freelancers/:id', element: <FreelancerDetailPage /> },
          { path: 'webinars', element: <AdminWebinarListPage /> },
          { path: 'webinars/:id', element: <AdminWebinarDetailPage /> },
          { path: 'questions', element: <AdminQuestionListPage /> },
          { path: 'tests', element: <AdminTestListPage /> },
          { path: 'tests/:id', element: <AdminTestDetailPage /> },
          { path: 'certificates', element: <AdminCertificateListPage /> },
          { path: 'certificates/:id', element: <AdminCertificateDetailPage /> },
          { path: 'training', element: <AdminTrainingListPage /> },
          { path: 'training/:id', element: <AdminTrainingDetailPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['FREELANCER']} />,
    children: [
      {
        path: '/freelancer',
        element: <FreelancerLayout />,
        children: [
          { path: 'dashboard', element: <FreelancerDashboardPage /> },
          { path: 'profile', element: <FreelancerProfilePage /> },
          { path: 'documents', element: <FreelancerDocumentsPage /> },
          { path: 'webinars', element: <FreelancerWebinarListPage /> },
          { path: 'webinars/:id', element: <FreelancerWebinarDetailPage /> },
          { path: 'tests', element: <FreelancerTestListPage /> },
          { path: 'tests/:id', element: <FreelancerTestInstructionsPage /> },
          { path: 'certificates', element: <FreelancerCertificateListPage /> },
          { path: 'certificates/:id', element: <FreelancerCertificateDetailPage /> },
          { path: 'attempts/:id/result', element: <FreelancerTestResultPage /> },
          { path: 'training', element: <FreelancerTrainingListPage /> },
          { path: 'training/:id', element: <FreelancerTrainingDetailPage /> },
          { path: 'training/:trainingId/lessons/:lessonId', element: <FreelancerLessonPage /> },
        ],
      },
      {
        path: '/freelancer/attempts/:id',
        element: <FreelancerTestAttemptPage />,
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
