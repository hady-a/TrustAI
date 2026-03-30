/**
 * Transforms nested API response data into a clean, flat object
 * Safely extracts analysis from multiple possible response structures
 * Returns consistent data structure regardless of input nesting level
 */

export interface AnalysisData {
  deceptionScore: number;
  credibilityScore: number;
  confidence: number;
  transcript: string;
  emotion: string;
  stress: string | number;
  lieProbability: string | number;
  credibilityConfidence: string | number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  metrics: {
    lie_probability: string | number;
    credibility_confidence: string | number;
    voice_stress: string | number;
    voice_emotion: string;
    transcription: string;
  };
  insights: string[];
}

/**
 * Determines risk level based on lie probability score
 */
function getRiskLevel(lieProbability: number): 'low' | 'medium' | 'high' | 'critical' {
  if (lieProbability >= 75) return 'critical';
  if (lieProbability >= 50) return 'high';
  if (lieProbability >= 25) return 'medium';
  return 'low';
}

/**
 * Transforms raw API response into standardized analysis data
 * Handles multiple response structures and provides fallbacks
 */
export function transformAnalysisData(apiResponse: any): AnalysisData {
  // Safely extract analysis from multiple possible nested structures
  const analysis = 
    apiResponse?.data?.data?.analysis || 
    apiResponse?.data?.analysis || 
    apiResponse?.analysis || 
    {};

  // Extract nested security objects with fallbacks
  const credibilityData = analysis?.credibility || {};
  const voiceData = analysis?.voice || {};
  const stressData = voiceData?.stress || {};
  const emotionData = voiceData?.emotion || {};
  const transcriptionData = voiceData?.transcription || {};

  // Extract core values with safe defaults
  const lieProbability = credibilityData?.lie_probability ?? 0;
  const credibilityConfidence = credibilityData?.confidence ?? 0;
  const stressLevel = stressData?.stress_level ?? 'N/A';
  const emotion = emotionData?.emotion ?? 'Unknown';
  const transcript = transcriptionData?.transcript ?? '(No data)';
  const credibilityAnalysis = credibilityData?.analysis ?? 'Analysis complete';

  // Calculate derived scores
  const deceptionScore = lieProbability || 0;
  const credibilityScore = 100 - (lieProbability || 0);
  const confidenceScore = (credibilityConfidence || 0) / 100;
  const riskLevel = getRiskLevel(deceptionScore);

  // Generate summary
  const summary = `${credibilityAnalysis}. Deception indicator: ${
    deceptionScore >= 75 ? 'High' : deceptionScore >= 50 ? 'Moderate' : 'Low'
  }`;

  return {
    deceptionScore,
    credibilityScore,
    confidence: confidenceScore,
    transcript,
    emotion,
    stress: stressLevel,
    lieProbability: lieProbability ?? 'N/A',
    credibilityConfidence: credibilityConfidence ?? 'N/A',
    riskLevel,
    summary,
    metrics: {
      lie_probability: lieProbability ?? 'N/A',
      credibility_confidence: credibilityConfidence ?? 'N/A',
      voice_stress: stressLevel ?? 'N/A',
      voice_emotion: emotion ?? 'N/A',
      transcription: transcript || '(No data)',
    },
    insights: [
      credibilityAnalysis || 'Analysis complete',
      `Voice emotion: ${emotion || 'Unknown'}`,
      `Stress level: ${stressLevel || 0}/100`,
    ],
  };
}

/**
 * Validates that transformed data has required core fields
 */
export function isValidAnalysisData(data: AnalysisData): boolean {
  return (
    typeof data.deceptionScore === 'number' &&
    typeof data.credibilityScore === 'number' &&
    typeof data.confidence === 'number' &&
    typeof data.transcript === 'string' &&
    data.metrics !== null &&
    Array.isArray(data.insights)
  );
}
