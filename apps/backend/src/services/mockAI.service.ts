import { logger } from '../lib/logger';

export interface MockAIResponse {
    overall_risk_score: number;
    confidence_level: number;
    modality_breakdown: {
        video: number;
        audio: number;
        text: number;
    };
    detected_indicators: string[];
    explanation_summary: string;
    model_details: {
        mode?: string;
        models_used?: string[];
        [key: string]: any;
    };
}

/**
 * Mock AI Service - generates realistic analysis results for testing
 * Used when the real AI service is unavailable
 */
export class MockAIService {
    static generateMockAnalysis(mode: string): MockAIResponse {
        const modeUpper = mode.toUpperCase();
        
        // Generate realistic scores based on mode
        const baseScore = Math.random() * 100;
        const riskScore = modeUpper === 'CRIMINAL_INVESTIGATION' 
            ? Math.min(baseScore + 20, 95)
            : modeUpper === 'BUSINESS_MEETING'
            ? Math.max(baseScore - 10, 20)
            : baseScore;

        const indicators: Record<string, string[]> = {
            HR_INTERVIEW: [
                'Good eye contact', 
                'Confident speech patterns',
                'Professional demeanor',
                'Clear communication',
                'Consistent responses'
            ],
            CRIMINAL_INVESTIGATION: [
                'Inconsistent statements',
                'Elevated stress levels',
                'Evasive body language',
                'Rapid eye movements',
                'Speech hesitations',
                'Defensive posture'
            ],
            BUSINESS_MEETING: [
                'Professional tone',
                'Structured responses',
                'Positive engagement',
                'Clear articulation',
                'Composed demeanor',
                'Active listening'
            ]
        };

        const indicatorKey = modeUpper === 'HR_INTERVIEW' ? 'HR_INTERVIEW' 
            : modeUpper === 'CRIMINAL_INVESTIGATION' ? 'CRIMINAL_INVESTIGATION'
            : 'BUSINESS_MEETING';

        const confidence = Math.round(80 + Math.random() * 15);

        return {
            overall_risk_score: Math.round(riskScore),
            confidence_level: confidence,
            modality_breakdown: {
                video: Math.round(50 + Math.random() * 40),
                audio: Math.round(50 + Math.random() * 40),
                text: Math.round(50 + Math.random() * 40),
            },
            detected_indicators: indicators[indicatorKey] || indicators.HR_INTERVIEW,
            explanation_summary: `Analysis completed in ${indicatorKey} mode. Risk assessment: ${Math.round(riskScore)}% with ${confidence}% confidence. Data shows consistent patterns aligned with selected analysis mode.`,
            model_details: {
                mode: indicatorKey,
                models_used: ['whisper', 'wav2vec2', 'deepface'],
                source: 'MOCK_SERVICE',
                note: 'Using mock analysis data - AI service unavailable. Real models will be used once service is running.'
            }
        };
    }

    static async analyze(userId: string, modes: string[]): Promise<MockAIResponse> {
        const mode = modes[0] || 'HR_INTERVIEW';
        logger.warn(
            { userId, modes: mode },
            '⚠️ AI service unavailable - using mock analysis for testing'
        );

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = this.generateMockAnalysis(mode);
        
        logger.info(
            { userId, mode, riskScore: response.overall_risk_score },
            '✅ Mock analysis generated successfully'
        );

        return response;
    }
}
