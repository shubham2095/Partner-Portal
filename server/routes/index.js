import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import freelancerRoutes from './freelancer.routes.js'
import adminRoutes from './admin.routes.js'
import adminWebinarRoutes from './adminWebinar.routes.js'
import freelancerWebinarRoutes from './freelancerWebinar.routes.js'
import questionRoutes from './question.routes.js'
import testRoutes from './test.routes.js'
import freelancerTestRoutes from './freelancerTest.routes.js'
import attemptRoutes from './attempt.routes.js'
import adminCertificateRoutes from './adminCertificate.routes.js'
import freelancerCertificateRoutes from './freelancerCertificate.routes.js'
import verifyRoutes from './verify.routes.js'
import adminTrainingRoutes from './adminTraining.routes.js'
import freelancerTrainingRoutes from './freelancerTraining.routes.js'
import adminLeadRoutes from './adminLead.routes.js'
import freelancerLeadRoutes from './freelancerLead.routes.js'
import adminCommissionRoutes from './adminCommission.routes.js'
import freelancerCommissionRoutes from './freelancerCommission.routes.js'
import notificationRoutes from './notification.routes.js'
import adminIntegrationRoutes from './adminIntegration.routes.js'
import webhookRoutes from './webhook.routes.js'
import adminAnalyticsRoutes from './adminAnalytics.routes.js'
import freelancerAnalyticsRoutes from './freelancerAnalytics.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/freelancer', freelancerRoutes)
router.use('/admin', adminRoutes)
router.use('/admin/webinars', adminWebinarRoutes)
router.use('/admin/questions', questionRoutes)
router.use('/admin/tests', testRoutes)
router.use('/admin/certificates', adminCertificateRoutes)
router.use('/freelancer/webinars', freelancerWebinarRoutes)
router.use('/freelancer/tests', freelancerTestRoutes)
router.use('/freelancer/attempts', attemptRoutes)
router.use('/freelancer/certificates', freelancerCertificateRoutes)
router.use('/admin/training', adminTrainingRoutes)
router.use('/freelancer/training', freelancerTrainingRoutes)
router.use('/admin/leads', adminLeadRoutes)
router.use('/freelancer/leads', freelancerLeadRoutes)
router.use('/admin/commissions', adminCommissionRoutes)
router.use('/freelancer/commissions', freelancerCommissionRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin/integrations', adminIntegrationRoutes)
router.use('/webhooks', webhookRoutes)
router.use('/admin/analytics', adminAnalyticsRoutes)
router.use('/freelancer/analytics', freelancerAnalyticsRoutes)
router.use('/verify', verifyRoutes)

export default router
