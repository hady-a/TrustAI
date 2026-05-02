import { Request } from 'express';

/**
 * Type-safe file access helpers for multer file uploads
 */

/**
 * Get audio files from request with type safety
 */
export function getAudioFiles(req: Request): Express.Multer.File[] {
  if (!req.files || typeof req.files === 'string') {
    return [];
  }
  
  const files = req.files as Record<string, Express.Multer.File[]>;
  return files.audio || [];
}

/**
 * Get image files from request with type safety
 */
export function getImageFiles(req: Request): Express.Multer.File[] {
  if (!req.files || typeof req.files === 'string') {
    return [];
  }
  
  const files = req.files as Record<string, Express.Multer.File[]>;
  return files.image || [];
}

/**
 * Get first audio file from request
 */
export function getFirstAudioFile(req: Request): Express.Multer.File | null {
  const audioFiles = getAudioFiles(req);
  return audioFiles.length > 0 ? audioFiles[0] : null;
}

/**
 * Get first image file from request
 */
export function getFirstImageFile(req: Request): Express.Multer.File | null {
  const imageFiles = getImageFiles(req);
  return imageFiles.length > 0 ? imageFiles[0] : null;
}

/**
 * Check if audio file exists
 */
export function hasAudioFile(req: Request): boolean {
  const audioFiles = getAudioFiles(req);
  return audioFiles.length > 0;
}

/**
 * Check if image file exists
 */
export function hasImageFile(req: Request): boolean {
  const imageFiles = getImageFiles(req);
  return imageFiles.length > 0;
}
