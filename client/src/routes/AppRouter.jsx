import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PublicLayout, AuthLayout, AdminLayout, FreelancerLayout } from '../layouts'
import ProtectedRoute from './ProtectedRoute'

// Route-level code splitting: each page is its own chunk, loaded on first
// visit rather than bundled into the initial payload. The layouts render
// <Outlet/> inside a <Suspense> boundary, so navigation shows PageLoader
// instead of a blank screen while a chunk downloads.
const LandingPage = lazy(() => import('../landing/LandingPage'))
const LoginPage = lazy(() => import('../auth/LoginPage'))
const RegisterPage = lazy(() => import('../auth/RegisterPage'))
const AdminLoginPage = lazy(() => import('../auth/AdminLoginPage'))
const VerifyEmailPage = lazy(() => import('../auth/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('../auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../auth/ResetPasswordPage'))
const AdminDashboardPage = lazy(() => import('../admin/dashboard/AdminDashboardPage'))
const FreelancerDashboardPage = lazy(() => import('../freelancer/dashboard/FreelancerDashboardPage'))
const FreelancerProfilePage = lazy(() => import('../freelancer/profile/ProfilePage'))
const FreelancerDocumentsPage = lazy(() => import('../freelancer/documents/DocumentsPage'))
const FreelancerListPage = lazy(() => import('../admin/freelancers/FreelancerListPage'))
const FreelancerDetailPage = lazy(() => import('../admin/freelancers/FreelancerDetailPage'))
const AdminWebinarListPage = lazy(() => import('../admin/webinars/WebinarListPage'))
const AdminWebinarDetailPage = lazy(() => import('../admin/webinars/WebinarDetailPage'))
const AdminQuestionListPage = lazy(() => import('../admin/questions/QuestionListPage'))
const AdminTestListPage = lazy(() => import('../admin/tests/TestListPage'))
const AdminTestDetailPage = lazy(() => import('../admin/tests/TestDetailPage'))
const AdminCertificateListPage = lazy(() => import('../admin/certificates/CertificateListPage'))
const AdminCertificateDetailPage = lazy(() => import('../admin/certificates/CertificateDetailPage'))
const FreelancerWebinarListPage = lazy(() => import('../freelancer/webinars/WebinarListPage'))
const FreelancerWebinarDetailPage = lazy(() => import('../freelancer/webinars/WebinarDetailPage'))
const FreelancerTestListPage = lazy(() => import('../freelancer/tests/TestListPage'))
const FreelancerTestInstructionsPage = lazy(() => import('../freelancer/tests/TestInstructionsPage'))
const FreelancerTestAttemptPage = lazy(() => import('../freelancer/tests/TestAttemptPage'))
const FreelancerTestResultPage = lazy(() => import('../freelancer/tests/TestResultPage'))
const FreelancerCertificateListPage = lazy(() => import('../freelancer/certificates/CertificateListPage'))
const FreelancerCertificateDetailPage = lazy(() => import('../freelancer/certificates/CertificateDetailPage'))
const AdminTrainingListPage = lazy(() => import('../admin/training/TrainingListPage'))
const AdminTrainingDetailPage = lazy(() => import('../admin/training/TrainingDetailPage'))
const FreelancerTrainingListPage = lazy(() => import('../freelancer/training/TrainingListPage'))
const FreelancerTrainingDetailPage = lazy(() => import('../freelancer/training/TrainingDetailPage'))
const FreelancerLessonPage = lazy(() => import('../freelancer/training/LessonPage'))
const AdminLeadListPage = lazy(() => import('../admin/leads/LeadListPage'))
const AdminLeadDetailPage = lazy(() => import('../admin/leads/LeadDetailPage'))
const FreelancerLeadListPage = lazy(() => import('../freelancer/leads/LeadListPage'))
const FreelancerLeadDetailPage = lazy(() => import('../freelancer/leads/LeadDetailPage'))
const AdminCommissionListPage = lazy(() => import('../admin/commissions/CommissionListPage'))
const AdminCommissionDetailPage = lazy(() => import('../admin/commissions/CommissionDetailPage'))
const FreelancerEarningsPage = lazy(() => import('../freelancer/earnings/EarningsPage'))
const FreelancerCommissionDetailPage = lazy(() => import('../freelancer/earnings/CommissionDetailPage'))
const AdminIntegrationSettingsPage = lazy(() => import('../admin/integrations/IntegrationSettingsPage'))
const AdminReportsPage = lazy(() => import('../admin/reports/ReportsPage'))
const AdminSalesPage = lazy(() => import('../admin/sales/SalesPage'))
const AdminSettingsPage = lazy(() => import('../admin/settings/SettingsPage'))
const FreelancerNotificationsPage = lazy(() => import('../freelancer/notifications/NotificationsPage'))
const VerifyCertificatePage = lazy(() => import('../public/VerifyCertificatePage'))

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
          { path: 'leads', element: <AdminLeadListPage /> },
          { path: 'leads/:id', element: <AdminLeadDetailPage /> },
          { path: 'commissions', element: <AdminCommissionListPage /> },
          { path: 'commissions/:id', element: <AdminCommissionDetailPage /> },
          { path: 'integrations', element: <AdminIntegrationSettingsPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'sales', element: <AdminSalesPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
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
          { path: 'leads', element: <FreelancerLeadListPage /> },
          { path: 'leads/:id', element: <FreelancerLeadDetailPage /> },
          { path: 'commissions', element: <FreelancerEarningsPage /> },
          { path: 'commissions/:id', element: <FreelancerCommissionDetailPage /> },
          { path: 'notifications', element: <FreelancerNotificationsPage /> },
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
