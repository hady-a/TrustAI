"""
Services package for AI analysis
Exports face, voice, text analysis and fusion services
Lazy loads services to support environments with missing dependencies
"""

# Don't import services here - allow lazy loading
# Services are imported only when needed

__all__ = [
    'FaceAnalysisService',
    'VoiceAnalysisService',
    'TextAnalysisService',
    'FusionService',
    'MockAnalyzerService'
]
