import { pgTable, text, varchar, timestamp, numeric, jsonb, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

export const analysisRecords = pgTable('analysis_records', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  mode: varchar('mode', { length: 50 }).notNull(), // BUSINESS, CRIMINAL, INTERVIEW
  inputMethod: varchar('input_method', { length: 20 }).notNull(), // live, upload
  fileUrl: text('file_url'),
  videoUrl: text('video_url'),
  audioUrl: text('audio_url'),
  
  // Analysis Results
  status: varchar('status', { length: 20 }).notNull().default('processing'), // processing, completed, failed
  confidence: numeric('confidence', { precision: 5, scale: 3 }),
  summary: text('summary'),
  
  // Detailed Results (stored as JSON)
  faceAnalysis: jsonb('face_analysis'),
  voiceAnalysis: jsonb('voice_analysis'),
  credibilityAnalysis: jsonb('credibility_analysis'),
  recommendations: jsonb('recommendations'), // array of strings
  
  // Metadata
  duration: integer('duration'), // seconds (for live recordings)
  processingTime: integer('processing_time'), // milliseconds
  errorMessage: text('error_message'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const analysisMetrics = pgTable('analysis_metrics', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => randomUUID()),
  analysisId: varchar('analysis_id', { length: 128 }).notNull().references(() => analysisRecords.id),
  
  // Metrics
  faceConfidence: numeric('face_confidence', { precision: 5, scale: 3 }),
  voiceConfidence: numeric('voice_confidence', { precision: 5, scale: 3 }),
  emotionState: varchar('emotion_state', { length: 50 }),
  stressLevel: numeric('stress_level', { precision: 5, scale: 3 }),
  deceptionProbability: numeric('deception_probability', { precision: 5, scale: 3 }),
  credibilityScore: numeric('credibility_score', { precision: 5, scale: 3 }),
  
  // Additional data
  keyPhrases: jsonb('key_phrases'),
  emotions: jsonb('emotions'), // array with timestamps
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type AnalysisRecordInsert = typeof analysisRecords.$inferInsert;
export type AnalysisMetric = typeof analysisMetrics.$inferSelect;
export type AnalysisMetricInsert = typeof analysisMetrics.$inferInsert;
