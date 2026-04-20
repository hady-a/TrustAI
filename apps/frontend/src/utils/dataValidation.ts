/**
 * Data Validation & Safe Access Utilities
 * Provides safe guards and validators for incomplete AI analysis data
 */

export interface AnalysisDataWithDefaults {
  deceptionScore: number;
  credibilityScore: number;
  confidence: number;
  emotion: string;
  stress: string | number;
  transcript: string;
  metrics: Record<string, any>;
  insights: string[];
}

export interface DataAvailability {
  hasDeceptionScore: boolean;
  hasCredibilityScore: boolean;
  hasConfidence: boolean;
  hasMetrics: boolean;
  hasInsights: boolean;
  hasFaceData: boolean;
  hasVoiceData: boolean;
  hasCredibilityData: boolean;
  isComplete: boolean;
}

/**
 * Check what data is available in the analysis result
 */
export function checkDataAvailability(data: any): DataAvailability {
  const hasDec = typeof data?.deceptionScore === 'number';
  const hasC = typeof data?.credibilityScore === 'number';
  const hasConf = typeof data?.confidence === 'number';
  const hasM = data?.metrics && Object.keys(data.metrics).length > 0;
  const hasI = Array.isArray(data?.insights) && data.insights.length > 0;
  const hasFace = data?.face && typeof data.face === 'object';
  const hasVoice = data?.voice && typeof data.voice === 'object';
  const hasCred = data?.credibility && typeof data.credibility === 'object';

  return {
    hasDeceptionScore: hasDec,
    hasCredibilityScore: hasC,
    hasConfidence: hasConf,
    hasMetrics: hasM,
    hasInsights: hasI,
    hasFaceData: hasFace,
    hasVoiceData: hasVoice,
    hasCredibilityData: hasCred,
    isComplete: hasDec && hasC && hasConf && hasM && hasI && hasFace && hasVoice && hasCred,
  };
}

/**
 * Safely extract score with fallback
 */
export function getSafeScore(value: any, fallback: number = 0, min: number = 0, max: number = 100): number {
  const num = typeof value === 'number' ? value : fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * Safely extract string with fallback
 */
export function getSafeString(value: any, fallback: string = 'N/A'): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/**
 * Get display text for missing data
 */
export function getMissingDataMessage(section: string): string {
  const messages: Record<string, string> = {
    face: '📸 No face data detected',
    voice: '🎤 No voice data available',
    credibility: '🔍 Credibility analysis incomplete',
    deception: '⚠️ Deception score unavailable',
    confidence: '❓ Confidence level unavailable',
    emotion: '😊 Emotion detection skipped',
    stress: '⚡ Stress analysis unavailable',
    transcript: '📝 No transcript available',
    metrics: '📊 Detailed metrics unavailable',
    insights: '💡 No insights generated',
  };
  return messages[section] || `⚠️ ${section} data unavailable`;
}

/**
 * Get color coding for scores
 */
export function getScoreColor(score: number, isBad: boolean = false): string {
  if (isBad) {
    // For deception/risk scores - higher is worse
    if (score >= 75) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    if (score >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  } else {
    // For credibility/positive scores - higher is better
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Get background color for score cards
 */
export function getScoreBgColor(score: number, isBad: boolean = false): string {
  if (isBad) {
    if (score >= 75) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    if (score >= 25) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  } else {
    if (score >= 75) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (score >= 25) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  }
}

/**
 * Get label for score
 */
export function getScoreLabel(score: number, isBad: boolean = false): string {
  if (isBad) {
    // Deception/Risk - higher is worse
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 25) return 'Moderate';
    return 'Low';
  } else {
    // Credibility - higher is better
    if (score >= 75) return 'Highly Credible';
    if (score >= 50) return 'Credible';
    if (score >= 25) return 'Low Credibility';
    return 'Very Low';
  }
}

/**
 * Validate analysis data structure
 */
export function isValidAnalysisData(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    (typeof data.deceptionScore === 'number' ||
      typeof data.credibilityScore === 'number' ||
      data.metrics ||
      data.face ||
      data.voice)
  );
}

/**
 * Get percentage string safely
 */
export function getSafePercentage(value: any, fallback: string = 'N/A'): string {
  if (typeof value === 'number') {
    return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
  }
  return fallback;
}

/**
 * Create fallback data for sections
 */
export function createFallbackData(): AnalysisDataWithDefaults {
  return {
    deceptionScore: 0,
    credibilityScore: 50,
    confidence: 0,
    emotion: 'Unknown',
    stress: 'N/A',
    transcript: '(No transcript available)',
    metrics: {},
    insights: [],
  };
}
