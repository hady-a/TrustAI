import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index';
import { backups } from '../schema/backups';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

// Ensure backups directory exists
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

async function ensureBackupsDir() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create backups directory:', error);
  }
}

ensureBackupsDir();

export class BackupService {
  /**
   * Create a full backup of the database
   */
  static async createBackup(type: 'full' | 'incremental' = 'full') {
    const backupId = uuidv4();
    const timestamp = new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const fileName = `backup-${type}-${Date.now()}.sql`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    try {
      // Create backup record with "in_progress" status
      const backupRecord = await db
        .insert(backups)
        .values({
          id: backupId,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Backup - ${timestamp}`,
          type,
          status: 'in_progress',
          filePath,
          retentionDays: type === 'full' ? 30 : 7,
        })
        .returning();

      // Execute pg_dump command
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://hadyakram:password@localhost:5432/trustai';
      const command = `pg_dump "${databaseUrl}" > "${filePath}"`;

      await execAsync(command);

      // Get file size
      const stats = await fs.stat(filePath);
      const sizeInGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);

      // Update backup record with success status
      const updatedBackup = await db
        .update(backups)
        .set({
          status: 'completed',
          size: `${sizeInGB} GB`,
          completedAt: new Date(),
        })
        .where(eq(backups.id, backupId))
        .returning();

      return {
        success: true,
        backup: updatedBackup[0],
        message: `Backup created successfully: ${fileName}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update backup record with error status
      await db
        .update(backups)
        .set({
          status: 'failed',
          errorMessage,
        })
        .where(eq(backups.id, backupId))
        .catching(() => {}); // Ignore update errors

      throw new Error(`Backup creation failed: ${errorMessage}`);
    }
  }

  /**
   * Restore database from a backup
   */
  static async restoreBackup(backupId: string) {
    try {
      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, backupId),
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      if (backup.status !== 'completed') {
        throw new Error('Cannot restore from an incomplete or failed backup');
      }

      const filePath = backup.filePath;

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('Backup file not found on disk');
      }

      // Execute psql to restore
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://hadyakram:password@localhost:5432/trustai';
      const command = `psql "${databaseUrl}" < "${filePath}"`;

      await execAsync(command);

      return {
        success: true,
        message: `Database restored from backup: ${backup.name}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Restore failed: ${errorMessage}`);
    }
  }

  /**
   * Delete a backup
   */
  static async deleteBackup(backupId: string) {
    try {
      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, backupId),
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Delete the physical file if it exists
      if (backup.filePath) {
        try {
          await fs.unlink(backup.filePath);
        } catch (err) {
          console.warn(`Failed to delete backup file ${backup.filePath}:`, err);
        }
      }

      // Delete the database record
      await db.delete(backups).where(eq(backups.id, backupId));

      return {
        success: true,
        message: `Backup deleted: ${backup.name}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Delete backup failed: ${errorMessage}`);
    }
  }

  /**
   * Download a backup file
   */
  static async downloadBackup(backupId: string) {
    try {
      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, backupId),
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!backup.filePath) {
        throw new Error('Backup file path not found');
      }

      // Check if file exists
      try {
        await fs.access(backup.filePath);
      } catch {
        throw new Error('Backup file not found on disk');
      }

      return {
        success: true,
        filePath: backup.filePath,
        fileName: `${backup.id}.sql`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Download backup failed: ${errorMessage}`);
    }
  }

  /**
   * Get all backups
   */
  static async getAllBackups() {
    try {
      const allBackups = await db.query.backups.findMany({
        orderBy: (backups, { desc }) => [desc(backups.createdAt)],
      });

      return {
        success: true,
        backups: allBackups,
        nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch backups: ${errorMessage}`);
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  static async cleanupOldBackups() {
    try {
      const now = new Date();
      
      const oldBackups = await db
        .select()
        .from(backups)
        .where((col) => {
          return new Date(col.createdAt) < new Date(now.getTime() - col.retentionDays * 24 * 60 * 60 * 1000);
        });

      for (const backup of oldBackups) {
        await this.deleteBackup(backup.id);
      }

      return {
        success: true,
        deletedCount: oldBackups.length,
        message: `Cleaned up ${oldBackups.length} old backups`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Backup cleanup failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
