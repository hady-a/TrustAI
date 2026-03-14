import { Request, Response } from 'express';
import { db, safeQuery } from '../db';
import { systemSettings } from '../db/schema/systemSettings';
import { eq } from 'drizzle-orm';
import { AppError } from '../lib/AppError';

export class SystemSettingsController {
  // Get all system settings
  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await safeQuery(
        () => db
          .select()
          .from(systemSettings)
          .limit(1),
        'get-system-settings'
      );

      if (settings.length === 0) {
        // Return default settings if none exist
        return res.status(200).json({
          success: true,
          message: 'System settings retrieved',
          data: {
            maintenanceMode: false,
            sessionTimeout: 15,
            maxUploadSize: 100,
            analysisTimeout: 300,
            notificationsEnabled: true,
            emailAlertsEnabled: true,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'System settings retrieved',
        data: {
          maintenanceMode: settings[0].maintenanceMode,
          sessionTimeout: settings[0].sessionTimeout,
          maxUploadSize: settings[0].maxUploadSize,
          analysisTimeout: settings[0].analysisTimeout,
          notificationsEnabled: settings[0].notificationsEnabled,
          emailAlertsEnabled: settings[0].emailAlertsEnabled,
        },
      });
    } catch (error) {
      throw new AppError('Failed to retrieve system settings', 500);
    }
  }

  // Update system settings
  static async updateSettings(req: Request, res: Response) {
    try {
      const {
        maintenanceMode,
        sessionTimeout,
        maxUploadSize,
        analysisTimeout,
        notificationsEnabled,
        emailAlertsEnabled,
      } = req.body;

      // Get existing settings or create new ones
      let existingSettings = await safeQuery(
        () => db
          .select()
          .from(systemSettings)
          .limit(1),
        'get-settings-for-update'
      );

      let updatedSettings;

      if (existingSettings.length === 0) {
        // Create new settings
        const [newSettings] = await safeQuery(
          () => db
            .insert(systemSettings)
            .values({
              maintenanceMode: maintenanceMode ?? false,
              sessionTimeout: sessionTimeout ?? 15,
              maxUploadSize: maxUploadSize ?? 100,
              analysisTimeout: analysisTimeout ?? 300,
              notificationsEnabled: notificationsEnabled ?? true,
              emailAlertsEnabled: emailAlertsEnabled ?? true,
            })
            .returning(),
          'create-system-settings'
        );
        updatedSettings = newSettings;
      } else {
        // Update existing settings
        const settingsId = existingSettings[0].id;
        const [updated] = await safeQuery(
          () => db
            .update(systemSettings)
            .set({
              maintenanceMode: maintenanceMode ?? existingSettings[0].maintenanceMode,
              sessionTimeout: sessionTimeout ?? existingSettings[0].sessionTimeout,
              maxUploadSize: maxUploadSize ?? existingSettings[0].maxUploadSize,
              analysisTimeout: analysisTimeout ?? existingSettings[0].analysisTimeout,
              notificationsEnabled: notificationsEnabled ?? existingSettings[0].notificationsEnabled,
              emailAlertsEnabled: emailAlertsEnabled ?? existingSettings[0].emailAlertsEnabled,
            })
            .where(eq(systemSettings.id, settingsId))
            .returning(),
          'update-system-settings'
        );
        updatedSettings = updated;
      }

      return res.status(200).json({
        success: true,
        message: 'System settings updated successfully',
        data: {
          maintenanceMode: updatedSettings.maintenanceMode,
          sessionTimeout: updatedSettings.sessionTimeout,
          maxUploadSize: updatedSettings.maxUploadSize,
          analysisTimeout: updatedSettings.analysisTimeout,
          notificationsEnabled: updatedSettings.notificationsEnabled,
          emailAlertsEnabled: updatedSettings.emailAlertsEnabled,
        },
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw new AppError('Failed to update system settings', 500);
    }
  }

  // Get maintenance mode status only
  static async getMaintenanceStatus(req: Request, res: Response) {
    try {
      const settings = await safeQuery(
        () => db
          .select()
          .from(systemSettings)
          .limit(1),
        'get-maintenance-status'
      );

      const maintenanceMode = settings.length > 0 ? settings[0].maintenanceMode : false;

      return res.status(200).json({
        success: true,
        data: {
          maintenanceMode,
        },
      });
    } catch (error) {
      throw new AppError('Failed to retrieve maintenance status', 500);
    }
  }
}
