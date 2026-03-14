import { Router } from 'express';
import { SystemSettingsController } from '../controllers/systemSettings.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Get system settings (public endpoint - needed for maintenance mode check)
router.get('/', SystemSettingsController.getSettings);

// Get maintenance mode status only (public endpoint)
router.get('/status/maintenance', SystemSettingsController.getMaintenanceStatus);

// Update system settings (admin only)
router.put('/update', requireAuth, requireAdmin, SystemSettingsController.updateSettings);

export default router;
