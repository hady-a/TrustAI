#!/usr/bin/env python3
"""
Test for the generate_report method in ReportGenerator
"""

from datetime import datetime


class SimpleReportGenerator:
    """Simplified version for testing generate_report"""
    
    def __init__(self):
        self.timestamp = datetime.now()
    
    def generate_report(self, analysis_results: dict):
        """
        Generate a structured summary report from analysis results
        """
        try:
            # Input validation
            if not isinstance(analysis_results, dict):
                return {
                    "summary": "Error: Invalid input format",
                    "risk_level": "medium",
                    "recommendation": "Unable to process analysis results"
                }
            
            if not analysis_results:
                return {
                    "summary": "No analysis results provided",
                    "risk_level": "medium",
                    "recommendation": "Provide valid analysis data"
                }
            
            # Extract key metrics
            face_data = analysis_results.get('face_analysis', {})
            voice_data = analysis_results.get('voice_analysis', {})
            lie_data = analysis_results.get('lie_analysis', {})
            
            # Calculate trust score (0-1 range from credibility score 0-100)
            credibility_score = lie_data.get('credibility_score', 50)
            trust_score = credibility_score / 100.0
            
            # Determine risk level based on trust score
            if trust_score < 0.4:
                risk_level = "high"
                risk_description = "High Risk - significant credibility concerns"
            elif trust_score <= 0.7:
                risk_level = "medium"
                risk_description = "Medium Risk - moderate credibility concerns"
            else:
                risk_level = "low"
                risk_description = "Low Risk - credible and trustworthy"
            
            # Extract analysis details
            dominant_emotion = face_data.get('dominant_emotion', 'unknown')
            stress_level = voice_data.get('stress_level', 50)
            confidence = voice_data.get('confidence', 50)
            lie_probability = lie_data.get('lie_probability', 0)
            deception_indicators = lie_data.get('deception_indicators', [])
            
            # Generate summary
            summary = self._generate_summary_text(
                risk_level,
                risk_description,
                dominant_emotion,
                stress_level,
                confidence,
                lie_probability,
                deception_indicators,
                trust_score
            )
            
            # Generate recommendation based on risk level and metrics
            recommendation = self._generate_recommendation_text(
                risk_level,
                trust_score,
                stress_level,
                lie_probability
            )
            
            return {
                "summary": summary,
                "risk_level": risk_level,
                "recommendation": recommendation
            }
        
        except Exception as e:
            # Error handling - always return valid JSON
            return {
                "summary": f"Error during report generation: {str(e)}",
                "risk_level": "medium",
                "recommendation": "Contact support for assistance"
            }
    
    def _generate_summary_text(self, risk_level, risk_description, emotion, 
                               stress, confidence, lie_prob, indicators, trust_score):
        """Generate readable summary text"""
        summary = f"{risk_description}. "
        summary += f"Detected emotion: {emotion}. "
        
        if stress > 70:
            summary += "High stress detected. "
        elif stress > 40:
            summary += "Moderate stress detected. "
        else:
            summary += "Low stress detected. "
        
        summary += f"Credibility assessment: {int(trust_score * 100)}%. "
        
        if lie_prob > 60:
            summary += "High deception probability indicator. "
        elif lie_prob > 30:
            summary += "Moderate deception probability indicator. "
        
        if indicators:
            summary += f"Notable finding: {indicators[0]} "
        
        return summary.strip()
    
    def _generate_recommendation_text(self, risk_level, trust_score, stress_level, lie_prob):
        """Generate actionable recommendation"""
        if risk_level == "high":
            if lie_prob > 70:
                return "INVESTIGATE: Significant deception indicators detected. Verify claims independently."
            else:
                return "PROCEED WITH CAUTION: Request additional information or corroboration before proceeding."
        
        elif risk_level == "medium":
            if stress_level > 70:
                return "VERIFY: Monitor for inconsistencies. Follow up on key claims for confirmation."
            else:
                return "PROCEED: Credible but continue standard verification procedures."
        
        else:  # low risk
            if trust_score > 0.85:
                return "APPROVE: High credibility score. Proceed with confidence."
            else:
                return "PROCEED: Assessment appears credible. Standard procedures recommended."


def test_generate_report():
    """Test the generate_report method"""
    generator = SimpleReportGenerator()
    
    print("=" * 70)
    print("Testing generate_report Method")
    print("=" * 70)
    
    # Test 1: Low Risk (trustworthy)
    print("\nTest 1: Low Risk (High Credibility)")
    analysis1 = {
        'face_analysis': {'dominant_emotion': 'neutral'},
        'voice_analysis': {'stress_level': 30, 'confidence': 85},
        'lie_analysis': {'credibility_score': 85, 'lie_probability': 15, 'deception_indicators': []}
    }
    result1 = generator.generate_report(analysis1)
    print(f"  Input: credibility_score=85 (trust_score=0.85, should be LOW)")
    print(f"  Risk Level: {result1['risk_level']}")
    assert result1['risk_level'] == 'low', "Expected 'low' risk"
    print(f"  Summary: {result1['summary']}")
    print(f"  Recommendation: {result1['recommendation']}")
    print("  ✅ Correct")
    
    # Test 2: Medium Risk (moderate credibility)
    print("\nTest 2: Medium Risk (Moderate Credibility)")
    analysis2 = {
        'face_analysis': {'dominant_emotion': 'nervous'},
        'voice_analysis': {'stress_level': 55, 'confidence': 65},
        'lie_analysis': {'credibility_score': 60, 'lie_probability': 40, 'deception_indicators': ['Stress detected']}
    }
    result2 = generator.generate_report(analysis2)
    print(f"  Input: credibility_score=60 (trust_score=0.60, should be MEDIUM)")
    print(f"  Risk Level: {result2['risk_level']}")
    assert result2['risk_level'] == 'medium', "Expected 'medium' risk"
    print(f"  Summary: {result2['summary']}")
    print(f"  Recommendation: {result2['recommendation']}")
    print("  ✅ Correct")
    
    # Test 3: High Risk (low credibility)
    print("\nTest 3: High Risk (Low Credibility)")
    analysis3 = {
        'face_analysis': {'dominant_emotion': 'anger'},
        'voice_analysis': {'stress_level': 80, 'confidence': 40},
        'lie_analysis': {'credibility_score': 35, 'lie_probability': 75, 
                        'deception_indicators': ['Emotion-stress mismatch', 'High lie probability']}
    }
    result3 = generator.generate_report(analysis3)
    print(f"  Input: credibility_score=35 (trust_score=0.35, should be HIGH)")
    print(f"  Risk Level: {result3['risk_level']}")
    assert result3['risk_level'] == 'high', "Expected 'high' risk"
    print(f"  Summary: {result3['summary']}")
    print(f"  Recommendation: {result3['recommendation']}")
    print("  ✅ Correct")
    
    # Test 4: Empty input
    print("\nTest 4: Empty Input")
    result4 = generator.generate_report({})
    print(f"  Input: {{}}")
    print(f"  Risk Level: {result4['risk_level']}")
    print(f"  Summary: {result4['summary']}")
    assert result4['summary'] == 'No analysis results provided', "Should handle empty input"
    print("  ✅ Correct")
    
    # Test 5: Invalid input
    print("\nTest 5: Invalid Input (Non-dict)")
    result5 = generator.generate_report("invalid")
    print(f"  Input: 'invalid' (string, not dict)")
    print(f"  Risk Level: {result5['risk_level']}")
    print(f"  Summary: {result5['summary']}")
    assert result5['summary'] == 'Error: Invalid input format', "Should handle non-dict input"
    print("  ✅ Correct")
    
    # Validate all results have required structure
    print("\nValidating result structure...")
    for i, result in enumerate([result1, result2, result3, result4, result5], 1):
        assert 'summary' in result, f"Result {i} missing 'summary'"
        assert 'risk_level' in result, f"Result {i} missing 'risk_level'"
        assert 'recommendation' in result, f"Result {i} missing 'recommendation'"
        assert isinstance(result['summary'], str), f"Result {i} summary not string"
        assert isinstance(result['risk_level'], str), f"Result {i} risk_level not string"
        assert isinstance(result['recommendation'], str), f"Result {i} recommendation not string"
        assert result['risk_level'] in ['low', 'medium', 'high'], f"Result {i} invalid risk_level"
    
    print("  ✅ All results have valid JSON structure")
    
    print("\n" + "=" * 70)
    print("All tests passed! ✅")
    print("=" * 70)


if __name__ == "__main__":
    test_generate_report()
