#!/usr/bin/env python3
"""
Simple test for the detect_lies_in_text method
This tests the method without requiring cv2 or other ML dependencies
"""

import re

# Simplified LieDetector with just the new method for testing
class SimpleLieDetector:
    def detect_lies_in_text(self, text: str):
        """
        Detect potential lies in text using linguistic patterns
        """
        try:
            # Input validation
            if not isinstance(text, str):
                return {
                    "success": False,
                    "lie_probability": 0.0,
                    "confidence": 0.0,
                    "analysis": "Error: Input must be a string"
                }
            
            if not text.strip():
                return {
                    "success": True,
                    "lie_probability": 0.0,
                    "confidence": 50.0,
                    "analysis": "Empty text provided"
                }
            
            # Normalize text to lowercase for analysis
            normalized_text = text.lower()
            
            # Strong words that often indicate absolute/defensive statements
            strong_words = [
                'always', 'never', 'definitely', 'absolutely', 'certainly',
                'no doubt', 'guaranteed', 'promise', 'swear', 'for sure',
                'without question', 'absolutely not', 'never would',
                'always have', '100%', 'completely', 'totally',
                'proven', 'undeniably', 'unquestionably'
            ]
            
            # Count strong words found
            strong_word_count = 0
            found_words = []
            
            for word in strong_words:
                # Use word boundaries to avoid matching substrings
                pattern = r'\b' + re.escape(word) + r'\b'
                matches = len(re.findall(pattern, normalized_text))
                if matches > 0:
                    strong_word_count += matches
                    if word not in found_words:
                        found_words.append(word)
            
            # Calculate lie probability (0-100)
            # Base: 20% (neutral baseline), increases with strong words
            base_probability = 20.0
            strong_word_boost = min(strong_word_count * 12, 70)  # Max +70%
            lie_probability = min(base_probability + strong_word_boost, 100.0)
            
            # Calculate confidence (0-100)
            # Higher confidence if more strong words detected
            confidence = 50.0 + (strong_word_count * 4)
            confidence = min(confidence, 95.0)  # Cap at 95%
            
            # Build analysis string
            if strong_word_count == 0:
                analysis = "Neutral language detected. No strong absolute statements found."
            else:
                words_sample = ', '.join(found_words[:4])
                analysis = f"Detected {strong_word_count} strong word(s): {words_sample}. " \
                          f"Excessive use of absolute language may indicate defensiveness."
            
            return {
                "success": True,
                "lie_probability": round(lie_probability, 2),
                "confidence": round(confidence, 2),
                "analysis": analysis
            }
        
        except Exception as e:
            # Error handling - always return valid JSON
            return {
                "success": False,
                "lie_probability": 0.0,
                "confidence": 0.0,
                "analysis": f"Error during text analysis: {str(e)}"
            }


def test_detect_lies_in_text():
    detector = SimpleLieDetector()
    
    tests = [
        ("Neutral text", "I went to the store today"),
        ("With strong words", "I always tell the truth and I never lie, absolutely"),
        ("Many strong words", "I definitely never would, absolutely guaranteed, for sure, without question"),
        ("Empty text", ""),
        ("Invalid input", None),  # Will be caught by error handling
    ]
    
    print("=" * 70)
    print("Testing detect_lies_in_text Method")
    print("=" * 70)
    
    for test_name, text in tests:
        if text is None:
            result = detector.detect_lies_in_text(123)  # Test with invalid type
        else:
            result = detector.detect_lies_in_text(text)
        
        print(f"\nTest: {test_name}")
        print(f"  Input: {repr(text if text is not None else 123)}")
        print(f"  Success: {result['success']}")
        print(f"  Lie Probability: {result['lie_probability']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Analysis: {result['analysis']}")
        
        # Validate result structure
        assert 'success' in result, "Missing 'success' key"
        assert 'lie_probability' in result, "Missing 'lie_probability' key"
        assert 'confidence' in result, "Missing 'confidence' key"
        assert 'analysis' in result, "Missing 'analysis' key"
        assert isinstance(result['success'], bool), "'success' must be bool"
        assert isinstance(result['lie_probability'], (int, float)), "'lie_probability' must be numeric"
        assert isinstance(result['confidence'], (int, float)), "'confidence' must be numeric"
        assert isinstance(result['analysis'], str), "'analysis' must be string"
        print("  ✅ Valid JSON structure")
    
    print("\n" + "=" * 70)
    print("All tests passed! ✅")
    print("=" * 70)


if __name__ == "__main__":
    test_detect_lies_in_text()
