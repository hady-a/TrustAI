"""
Text Analysis Service - Analyzes text for inconsistencies and deception
Returns: text_score (inconsistency probability 0-100)
"""

import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class TextAnalysisService:
    """Service for analyzing text content for inconsistencies and deception"""
    
    def __init__(self):
        """Initialize text analysis service"""
        logger.info("TextAnalysisService initialized")
    
    def analyze_text(self, text: Optional[str]) -> Dict[str, Any]:
        """
        Analyze text for inconsistencies and deception indicators
        
        Returns:
        {
            'text_score': float (0-100) - inconsistency probability,
            'word_count': int,
            'sentence_count': int,
            'avg_sentence_length': float,
            'linguistic_indicators': list,
            'deception_signals': list,
            'analysis': str
        }
        """
        if not text or len(text.strip()) == 0:
            logger.warning("No text provided for analysis")
            return {
                'text_score': 0.0,
                'word_count': 0,
                'sentence_count': 0,
                'avg_sentence_length': 0,
                'linguistic_indicators': [],
                'deception_signals': [],
                'analysis': 'No text provided'
            }
        
        try:
            logger.info(f"Analyzing text (length: {len(text)} chars)")
            
            # Extract basic metrics
            word_count = len(text.split())
            sentences = self._split_sentences(text)
            sentence_count = len(sentences)
            avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
            
            # Detect linguistic indicators
            linguistic_indicators = self._detect_linguistic_indicators(text)
            
            # Detect deception signals
            deception_signals = self._detect_deception_signals(text, linguistic_indicators)
            
            # Calculate text score
            text_score = self._calculate_text_score(
                linguistic_indicators,
                deception_signals,
                word_count,
                avg_sentence_length
            )
            
            analysis = self._generate_analysis(linguistic_indicators, deception_signals)
            
            return {
                'text_score': text_score,
                'word_count': word_count,
                'sentence_count': sentence_count,
                'avg_sentence_length': avg_sentence_length,
                'linguistic_indicators': linguistic_indicators,
                'deception_signals': deception_signals,
                'analysis': analysis
            }
        
        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            return {
                'text_score': 0.0,
                'word_count': 0,
                'sentence_count': 0,
                'avg_sentence_length': 0,
                'linguistic_indicators': [],
                'deception_signals': [],
                'analysis': 'Error during analysis'
            }
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        import re
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _detect_linguistic_indicators(self, text: str) -> List[str]:
        """Detect linguistic indicators that might suggest deception"""
        indicators = []
        text_lower = text.lower()
        
        # Excessive qualifiers (might indicate uncertainty)
        qualifiers = ['maybe', 'might', 'could', 'possibly', 'probably', 'seems', 'appears']
        qualifier_count = sum(text_lower.count(q) for q in qualifiers)
        if qualifier_count > 5:
            indicators.append('excessive_qualifiers')
        
        # Self-referential language (might indicate defensive behavior)
        self_refs = text_lower.count(' i ') + text_lower.count(' i\'') + text_lower.count('i said')
        word_count = len(text.split())
        if self_refs > word_count * 0.15:
            indicators.append('high_self_reference')
        
        # Negations (might indicate denial)
        negations = [' not ', 'no ', "don't", "didn't", "wouldn't", "couldn't", "never"]
        negation_count = sum(text_lower.count(n) for n in negations)
        if negation_count > 10:
            indicators.append('excessive_negations')
        
        # Complexity reduction (might indicate cognitive load)
        short_words = sum(1 for word in text.split() if len(word) < 4)
        if short_words / len(text.split()) > 0.5:
            indicators.append('reduced_complexity')
        
        # Repetition (might indicate stress or deception)
        words = text.split()
        word_freq = {}
        for word in words:
            word_lower = word.lower().strip('.,!?')
            word_freq[word_lower] = word_freq.get(word_lower, 0) + 1
        
        repeated_count = sum(1 for freq in word_freq.values() if freq > 2)
        if repeated_count > 3:
            indicators.append('word_repetition')
        
        return list(set(indicators))  # Remove duplicates
    
    def _detect_deception_signals(self, text: str, indicators: List[str]) -> List[str]:
        """Detect specific deception signals"""
        signals = []
        text_lower = text.lower()
        
        # Hedging language (might indicate dishonesty)
        if 'excessive_qualifiers' in indicators:
            signals.append('hedging_language')
        
        # Defensive language
        if 'excessive_negations' in indicators:
            signals.append('defensive_language')
        
        # Cognitive overload signals
        if 'reduced_complexity' in indicators:
            signals.append('cognitive_load')
        
        # Pronoun avoidance
        pronouns_without_i = ['he ', 'she ', 'they ', 'it ', 'you ', 'we ']
        i_count = text_lower.count(' i ') + text_lower.count('i ')
        other_pronouns = sum(text_lower.count(p) for p in pronouns_without_i)
        
        if i_count == 0 and other_pronouns > 5:
            signals.append('pronoun_avoidance')
        
        # Response length (unusually short or long might indicate deception)
        words = len(text.split())
        if words < 20:
            signals.append('minimal_response')
        elif words > 500:
            signals.append('excessive_details')
        
        return list(set(signals))  # Remove duplicates
    
    def _calculate_text_score(self, indicators: List[str], signals: List[str], 
                             word_count: int, avg_sentence_length: float) -> float:
        """
        Calculate text inconsistency score
        
        Args:
            indicators: Detected linguistic indicators
            signals: Detected deception signals
            word_count: Total words in text
            avg_sentence_length: Average words per sentence
        
        Returns:
            Text score (0-100)
        """
        score = 0.0
        
        # Base score from indicators
        indicator_weights = {
            'excessive_qualifiers': 15,
            'high_self_reference': 10,
            'excessive_negations': 20,
            'reduced_complexity': 10,
            'word_repetition': 12
        }
        
        for indicator, weight in indicator_weights.items():
            if indicator in indicators:
                score += weight
        
        # Additional score from deception signals
        signal_weights = {
            'hedging_language': 5,
            'defensive_language': 10,
            'cognitive_load': 15,
            'pronoun_avoidance': 12,
            'minimal_response': 15,
            'excessive_details': 10
        }
        
        for signal, weight in signal_weights.items():
            if signal in signals:
                score += weight
        
        # Adjust based on text metrics
        if word_count < 10:
            score += 5  # Too brief might indicate evasion
        elif avg_sentence_length > 30:
            score += 5  # Very long sentences might indicate complexity
        
        return float(max(0.0, min(100.0, score)))
    
    def _generate_analysis(self, indicators: List[str], signals: List[str]) -> str:
        """Generate human-readable analysis summary"""
        if not indicators and not signals:
            return "Text analysis shows normal patterns with no significant inconsistencies detected."
        
        parts = []
        
        if indicators:
            indicator_descriptions = {
                'excessive_qualifiers': 'High use of qualifying language',
                'high_self_reference': 'Frequently references self',
                'excessive_negations': 'Multiple negations and denials',
                'reduced_complexity': 'Simplified language patterns',
                'word_repetition': 'Notable word repetition'
            }
            detected = [indicator_descriptions.get(i, i) for i in indicators]
            parts.append(f"Linguistic indicators: {', '.join(detected)}")
        
        if signals:
            signal_descriptions = {
                'hedging_language': 'hedging language patterns',
                'defensive_language': 'defensive phrasing',
                'cognitive_load': 'signs of cognitive overload',
                'pronoun_avoidance': 'pronoun avoidance',
                'minimal_response': 'minimal response length',
                'excessive_details': 'excessive details provided'
            }
            detected = [signal_descriptions.get(s, s) for s in signals]
            parts.append(f"Deception signals: {', '.join(detected)}")
        
        return ". ".join(parts) if parts else "No significant patterns detected."
