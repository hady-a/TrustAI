import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication and admin privileges
router.get('/metrics', requireAuth, requireAdmin, AdminController.getDashboardMetrics);
router.get('/analytics', requireAuth, requireAdmin, AdminController.getAnalyticsData);
router.get('/logs', requireAuth, requireAdmin, AdminController.getAuditLogs);
router.get('/health', requireAuth, requireAdmin, AdminController.getSystemHealth);

// Backup routes
router.get('/backups', requireAuth, requireAdmin, AdminController.getBackups);
router.post('/backups', requireAuth, requireAdmin, AdminController.createBackup);
router.post('/backups/:backupId/restore', requireAuth, requireAdmin, AdminController.restoreBackup);
router.delete('/backups/:backupId', requireAuth, requireAdmin, AdminController.deleteBackup);

router.get('/export/users', requireAuth, requireAdmin, AdminController.exportUsers);
router.get('/export/analyses', requireAuth, requireAdmin, AdminController.exportAnalyses);
router.get('/report', requireAuth, requireAdmin, AdminController.generateReport);

// New metrics endpoints
router.get('/system-metrics', requireAuth, requireAdmin, AdminController.getSystemMetrics);
router.get('/metrics/trends', requireAuth, requireAdmin, AdminController.getMetricsTrends);
router.get('/metrics/modes', requireAuth, requireAdmin, AdminController.getMetricsByMode);

export default router;
