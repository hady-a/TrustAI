import { db } from './index';
import { analysisRecords, analysisMetrics, type AnalysisRecord, type AnalysisMetric } from '../schema/analysis';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Analysis Repository
 * Handles all database operations for analysis records and metrics
 */
export class AnalysisRepository {
  /**
   * Create a new analysis record
   */
  async createAnalysis(data: Partial<AnalysisRecord>): Promise<AnalysisRecord> {
    const now = new Date();

    const result = await db
      .insert(analysisRecords)
      .values({
        id: data.id || randomUUID(),
        userId: data.userId || 'anonymous',
        mode: data.mode || 'BUSINESS',
        inputMethod: data.inputMethod || 'upload',
        status: 'processing',
        createdAt: now,
        updatedAt: now,
        ...data,
      })
      .returning();

    return result[0];
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(id: string): Promise<AnalysisRecord | null> {
    const results = await db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.id, id))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Get all analyses for a user
   */
  async getUserAnalyses(userId: string, limit = 50): Promise<AnalysisRecord[]> {
    return db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.userId, userId))
      .orderBy(desc(analysisRecords.createdAt))
      .limit(Math.min(limit, 100));
  }

  /**
   * Get analyses by mode and status
   */
  async getAnalysesByModeAndStatus(
    mode: string,
    status: string,
    limit = 50
  ): Promise<AnalysisRecord[]> {
    return db
      .select()
      .from(analysisRecords)
      .where(
        and(
          eq(analysisRecords.mode, mode),
          eq(analysisRecords.status, status)
        )
      )
      .orderBy(desc(analysisRecords.createdAt))
      .limit(Math.min(limit, 100));
  }

  /**
   * Update analysis record
   */
  async updateAnalysis(id: string, data: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    const results = await db
      .update(analysisRecords)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(analysisRecords.id, id))
      .returning();

    return results[0] || null;
  }

  /**
   * Update analysis status
   */
  async updateAnalysisStatus(
    id: string,
    status: string
  ): Promise<AnalysisRecord | null> {
    return this.updateAnalysis(id, { status } as any);
  }

  /**
   * Complete analysis with results
   */
  async completeAnalysis(
    id: string,
    result: {
      confidence?: number;
      summary?: string;
      faceAnalysis?: any;
      voiceAnalysis?: any;
      credibilityAnalysis?: any;
      recommendations?: string[];
      processingTime?: number;
    }
  ): Promise<AnalysisRecord | null> {
    return this.updateAnalysis(id, {
      status: 'completed',
      confidence: result.confidence,
      summary: result.summary,
      faceAnalysis: result.faceAnalysis,
      voiceAnalysis: result.voiceAnalysis,
      credibilityAnalysis: result.credibilityAnalysis,
      recommendations: result.recommendations,
      processingTime: result.processingTime,
      completedAt: new Date(),
    } as any);
  }

  /**
   * Fail analysis with error
   */
  async failAnalysis(id: string, error: string): Promise<AnalysisRecord | null> {
    return this.updateAnalysis(id, {
      status: 'failed',
      errorMessage: error,
    } as any);
  }

  /**
   * Delete analysis record
   */
  async deleteAnalysis(id: string): Promise<boolean> {
    // Delete metrics first (foreign key constraint)
    await db.delete(analysisMetrics).where(eq(analysisMetrics.analysisId, id));

    // Delete analysis record
    const result = await db
      .delete(analysisRecords)
      .where(eq(analysisRecords.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Create analysis metric
   */
  async createMetric(data: Partial<AnalysisMetric>): Promise<AnalysisMetric> {
    const result = await db
      .insert(analysisMetrics)
      .values({
        analysisId: data.analysisId || '',
        credibilityScore: data.credibilityScore,
        deceptionProbability: data.deceptionProbability,
        faceConfidence: data.faceConfidence,
        voiceConfidence: data.voiceConfidence,
        emotionState: data.emotionState,
        stressLevel: data.stressLevel,
        keyPhrases: data.keyPhrases,
        emotions: data.emotions,
        createdAt: new Date(),
        ...data,
      })
      .returning();

    return result[0];
  }

  /**
   * Get metrics for analysis
   */
  async getMetricsByAnalysisId(analysisId: string): Promise<AnalysisMetric[]> {
    return db
      .select()
      .from(analysisMetrics)
      .where(eq(analysisMetrics.analysisId, analysisId));
  }

  /**
   * Update metric
   */
  async updateMetric(id: string, data: Partial<AnalysisMetric>): Promise<AnalysisMetric | null> {
    const results = await db
      .update(analysisMetrics)
      .set(data)
      .where(eq(analysisMetrics.id, id))
      .returning();

    return results[0] || null;
  }

  /**
   * Get statistics for a user
   */
  async getUserStatistics(userId: string): Promise<{
    totalAnalyses: number;
    completedAnalyses: number;
    averageConfidence: number;
    analysesByMode: Record<string, number>;
    analysesByInputMethod: Record<string, number>;
  }> {
    const analyses = await this.getUserAnalyses(userId, 1000);

    const totalAnalyses = analyses.length;
    const completedAnalyses = analyses.filter((a) => a.status === 'completed').length;
    const avgConfidence =
      analyses.reduce((sum, a) => sum + ((a.confidence || 0) as number), 0) / totalAnalyses || 0;

    const byMode: Record<string, number> = {};
    const byInputMethod: Record<string, number> = {};

    analyses.forEach((a) => {
      byMode[a.mode] = (byMode[a.mode] || 0) + 1;
      byInputMethod[a.inputMethod] = (byInputMethod[a.inputMethod] || 0) + 1;
    });

    return {
      totalAnalyses,
      completedAnalyses,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      analysesByMode: byMode,
      analysesByInputMethod: byInputMethod,
    };
  }

  /**
   * Get recent completed analyses
   */
  async getRecentCompleted(limit = 10): Promise<AnalysisRecord[]> {
    return db
      .select()
      .from(analysisRecords)
      .where(eq(analysisRecords.status, 'completed'))
      .orderBy(desc(analysisRecords.completedAt))
      .limit(Math.min(limit, 100));
  }
}

// Export singleton instance
export const analysisRepository = new AnalysisRepository();
