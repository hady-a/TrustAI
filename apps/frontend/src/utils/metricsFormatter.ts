/**
 * Utilities for formatting and handling analysis metrics
 */

export interface MetricValue {
  value: string | number;
  formatted: string;
  percentage?: number;
  status?: 'low' | 'moderate' | 'high';
}

/**
 * Format stress metric (0-1 or 0-100 or string)
 */
export function formatStress(stress: any): MetricValue | null {
  if (!stress) return null;

  if (typeof stress === 'string') {
    const normalized = stress.toLowerCase();
    return {
      value: normalized,
      formatted: normalized,
      status:
        normalized === 'low'
          ? 'low'
          : normalized === 'moderate'
            ? 'moderate'
            : normalized === 'high'
              ? 'high'
              : 'moderate',
    };
  }

  const num = Number(stress);
  if (isNaN(num)) return null;

  // Normalize to 0-1 range if > 1
  const normalized = num > 1 ? num / 100 : num;
  const percentage = Math.round(normalized * 100);

  return {
    value: normalized,
    formatted: `${percentage}%`,
    percentage,
    status: percentage < 33 ? 'low' : percentage < 67 ? 'moderate' : 'high',
  };
}

/**
 * Format confidence metric (0-1 or 0-100 or string)
 */
export function formatConfidence(confidence: any): MetricValue | null {
  if (!confidence) return null;

  if (typeof confidence === 'string') {
    return {
      value: confidence,
      formatted: confidence,
    };
  }

  const num = Number(confidence);
  if (isNaN(num)) return null;

  // Normalize to 0-1 range if > 1
  const normalized = num > 1 ? num / 100 : num;
  const percentage = Math.round(normalized * 100);

  return {
    value: normalized,
    formatted: `${percentage}%`,
    percentage,
  };
}

/**
 * Format emotion metric
 */
export function formatEmotion(emotion: any): string | null {
  if (!emotion) return null;

  if (typeof emotion === 'string') {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
  }

  return String(emotion);
}

/**
 * Get status badge color for metric
 */
export function getStatusColor(
  status?: 'low' | 'moderate' | 'high'
): {
  bg: string;
  border?: string;
  text: string;
} {
  switch (status) {
    case 'low':
      return { bg: 'bg-green-500/20', text: 'text-green-300' };
    case 'moderate':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-300' };
    case 'high':
      return { bg: 'bg-red-500/20', text: 'text-red-300' };
    default:
      return { bg: 'bg-slate-700/20', text: 'text-slate-300' };
  }
}

/**
 * Get progress bar color for numeric metric
 */
export function getProgressColor(percentage?: number): string {
  if (!percentage) return 'from-slate-400 to-slate-500';

  if (percentage < 33) {
    return 'from-green-400 to-emerald-500';
  } else if (percentage < 67) {
    return 'from-yellow-400 to-orange-500';
  } else {
    return 'from-red-400 to-rose-500';
  }
}

/**
 * Format voice metrics for display
 */
export function formatVoiceMetrics(metrics: any): Record<string, string> {
  if (!metrics) return {};

  const formatted: Record<string, string> = {};

  if (metrics.pitch !== undefined) {
    formatted.Pitch = `${metrics.pitch} Hz`;
  }
  if (metrics.jitter !== undefined) {
    formatted.Jitter = `${(metrics.jitter * 100).toFixed(2)}%`;
  }
  if (metrics.shimmer !== undefined) {
    formatted.Shimmer = `${(metrics.shimmer * 100).toFixed(2)}%`;
  }
  if (metrics.energy !== undefined) {
    formatted.Energy = `${metrics.energy.toFixed(2)} dB`;
  }
  if (metrics.mfcc !== undefined) {
    formatted['MFCCs'] = 'Extracted';
  }

  return formatted;
}

/**
 * Format face metrics for display
 */
export function formatFaceMetrics(metrics: any): Record<string, string> {
  if (!metrics) return {};

  const formatted: Record<string, string> = {};

  if (metrics.blinks !== undefined) {
    formatted.Blinks = `${metrics.blinks}`;
  }
  if (metrics.blink_rate !== undefined) {
    formatted['Blink Rate'] = `${metrics.blink_rate.toFixed(1)}/min`;
  }
  if (metrics.micro_expressions !== undefined) {
    formatted['Micro Expressions'] = `${metrics.micro_expressions}`;
  }
  if (metrics.head_movement !== undefined) {
    formatted['Head Movement'] = `${metrics.head_movement}`;
  }
  if (metrics.eye_contact !== undefined) {
    formatted['Eye Contact'] = `${metrics.eye_contact}%`;
  }

  return formatted;
}

/**
 * Check if result has any metrics data
 */
export function hasMetrics(metrics: any): boolean {
  if (!metrics) return false;

  return !!(
    metrics.emotion ||
    metrics.stress ||
    metrics.confidence ||
    metrics.stress_level ||
    metrics.credibility_score ||
    metrics.risk_level ||
    metrics.voice_metrics ||
    metrics.face_metrics
  );
}

/**
 * Get metrics summary for display
 */
export function getMetricsSummary(metrics: any): string {
  const parts: string[] = [];

  if (metrics.emotion) {
    parts.push(`${metrics.emotion} emotion`);
  }

  if (metrics.stress) {
    const stress = formatStress(metrics.stress);
    if (stress) {
      parts.push(`${stress.formatted} stress`);
    }
  }

  if (metrics.confidence) {
    const conf = formatConfidence(metrics.confidence);
    if (conf) {
      parts.push(`${conf.formatted} confidence`);
    }
  }

  return parts.join(', ') || 'Analysis in progress';
}
