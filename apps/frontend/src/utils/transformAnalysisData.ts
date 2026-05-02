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
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  behavioralSignals: string[];
  summary: string;
  metrics: {
    credibility_score: string | number;
    confidence_level: string | number;
    risk_level: string;
    voice_stress: string | number;
    voice_emotion: string;
    transcription: string;
  };
  insights: string[];
}

/**
 * Determines risk level based on credibility score (inverted — lower credibility = higher risk)
 */
function getRiskLevel(credibilityScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (credibilityScore <= 25) return 'critical';
  if (credibilityScore <= 45) return 'high';
  if (credibilityScore <= 70) return 'medium';
  return 'low';
}

/**
 * Transforms raw API response into standardized analysis data
 * Handles multiple response structures and provides fallbacks
 */
export function transformAnalysisData(apiResponse: any): AnalysisData {
  // Debug logging - show exact input structure
  console.log('[transformAnalysisData] Input structure:', {
    keys: Object.keys(apiResponse || {}),
    hasTopLevelData: !!(apiResponse?.data),
    hasNestedData: !!(apiResponse?.data?.data),
    hasFace: !!(apiResponse?.face),
    hasVoice: !!(apiResponse?.voice),
    hasCredibility: !!(apiResponse?.credibility),
  });
  console.log('[transformAnalysisData] Full input:', JSON.stringify(apiResponse, null, 2));

  // Safely extract analysis from FLAT structure (new backend format)
  // Backend now returns: {face, voice, credibility, errors} at top level
  // NOT nested inside data.analysis
  const credibilityData = apiResponse?.credibility || {};
  const voiceData = apiResponse?.voice || {};
  const faceData = apiResponse?.face || {};
  const stressData = voiceData?.stress || {};
  const emotionData = voiceData?.emotion || {};
  const transcriptionData = voiceData?.transcription || {};

  // Extract core values from credibility module output
  // Fixed field names to match new backend (NO lie_probability, use deception_probability)
  const credibilityScore = credibilityData?.credibility_score ?? credibilityData?.deception_probability ?? 50;
  const deceptionProbability = credibilityData?.deception_probability ?? (100 - credibilityScore);
  const confidenceLevel = credibilityData?.confidence ?? 0;
  const riskLevelRaw = credibilityData?.risk_level ?? '';
  const behavioralSignals: string[] = credibilityData?.behavioral_signals ?? [];

  // Voice fields with safe access
  const stressLevel = stressData?.stress_level ?? stressData?.level ?? 'N/A';
  const emotion = emotionData?.emotion ?? 'Unknown';
  const transcript = transcriptionData?.transcript ?? transcriptionData?.text ?? '(No data)';
  const recommendation = credibilityData?.recommendation ?? 'Analysis complete';

  // Calculate derived scores (correct the deceptionScore calculation)
  // Use actual deception_probability from backend if available
  const deceptionScore = deceptionProbability !== undefined ? deceptionProbability : Math.max(0, 100 - credibilityScore);
  const confidenceScore = (confidenceLevel || 0) / 100;
  const riskLevel = riskLevelRaw
    ? (riskLevelRaw.toLowerCase() as 'low' | 'medium' | 'high' | 'critical')
    : getRiskLevel(credibilityScore);

  // Generate summary
  const summary = `${recommendation}. Risk level: ${
    riskLevel === 'critical' ? 'Critical' : riskLevel === 'high' ? 'High' : riskLevel === 'medium' ? 'Moderate' : 'Low'
  }`;

  const result: any = {
    deceptionScore,
    credibilityScore,
    confidence: confidenceScore,
    transcript,
    emotion,
    stress: stressLevel,
    riskLevel,
    behavioralSignals,
    summary,
    face: apiResponse?.face,
    voice: apiResponse?.voice,
    credibility: apiResponse?.credibility,
    metrics: {
      voice_stress: stressLevel ?? 'N/A',
      voice_emotion: emotion ?? 'N/A',
      transcription: transcript || '(No data)',
      risk_level: riskLevelRaw || 'N/A',
    },
    insights: [
      recommendation || 'Analysis complete',
      `Voice emotion: ${emotion || 'Unknown'}`,
      `Stress level: ${stressLevel || 0}/100`,
      ...behavioralSignals.slice(0, 3),
    ],
  };

  // Log transformed output for verification
  console.log('[transformAnalysisData] Transformed output:', result);
  console.log('[transformAnalysisData] Confidence score:', confidenceScore);
  console.log('[transformAnalysisData] Deception score:', deceptionScore);
  console.log('[transformAnalysisData] Credibility score:', credibilityScore);

  return result;
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
