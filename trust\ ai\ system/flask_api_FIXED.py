"""
Flask API for TrustAI - AI Model Integration
Exposes Python AI analysis system via REST API endpoints

FIXED VERSION:
- Added debug logging before all responses
- Standardized response structure across all endpoints
- Fixed credibility analyzer reference
- Preserved voice analysis sub-component structure
- Consistent error tracking
"""
import sys
import os
import json
import tempfile
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from aimodel.main import AIAnalysisSystem

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'wav', 'mp3', 'ogg', 'm4a', 'flac'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file):
    """Save uploaded file and return path"""
    if not file or file.filename == '':
        return None

    if not allowed_file(file.filename):
        return None

    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    return filepath


def debug_log_response(endpoint, status_code, response_data):
    """Log API response for debugging"""
    print("\n" + "="*80)
    print(f"🔍 FINAL API RESPONSE [{endpoint}]")
    print("="*80)
    print(f"Status: {status_code}")
    print(f"Response Keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'N/A'}")
    print(f"Full Response:\n{json.dumps(response_data, indent=2, default=str)}")
    print("="*80 + "\n")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    response = {
        'status': 'healthy',
        'service': 'TrustAI Flask API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    }
    debug_log_response('/health', 200, response)
    return jsonify(response), 200


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Main analysis endpoint

    Expected form data:
    - image (FILE): Facial image file (optional)
    - audio (FILE): Audio file (optional)
    - report_type (STR): Type of report (general, hr, criminal, business) - default: general

    Returns:
    - Complete analysis results with face, voice, credibility, and report
    """
    try:
        report_type = request.form.get('report_type', 'general')
        return run_complete_analysis(report_type)

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/api/analyze', 500, error_response)
        return jsonify(error_response), 500


def run_complete_analysis(report_type):
    """Shared complete analysis logic for mode-specific endpoints."""
    try:

        # Validate report type
        valid_types = ['general', 'hr', 'criminal', 'business']
        if report_type not in valid_types:
            error_response = {
                'success': False,
                'error': f'Invalid report_type. Must be one of: {", ".join(valid_types)}'
            }
            debug_log_response('/run_complete_analysis', 400, error_response)
            return jsonify(error_response), 400

        # Handle image upload
        image_path = None
        if 'image' in request.files:
            image_file = request.files['image']
            image_path = save_uploaded_file(image_file)
            if not image_path:
                error_response = {
                    'success': False,
                    'error': 'Invalid image file'
                }
                debug_log_response('/run_complete_analysis', 400, error_response)
                return jsonify(error_response), 400

        # Handle audio upload
        audio_path = None
        if 'audio' in request.files:
            audio_file = request.files['audio']
            audio_path = save_uploaded_file(audio_file)
            if not audio_path:
                error_response = {
                    'success': False,
                    'error': 'Invalid audio file'
                }
                debug_log_response('/run_complete_analysis', 400, error_response)
                return jsonify(error_response), 400

        # Require at least image or audio
        if not image_path and not audio_path:
            error_response = {
                'success': False,
                'error': 'At least one of image or audio file is required'
            }
            debug_log_response('/run_complete_analysis', 400, error_response)
            return jsonify(error_response), 400

        # Initialize AI system
        ai_system = AIAnalysisSystem(report_type=report_type)

        # Run analysis
        video_duration = request.form.get('video_duration', 5, type=int)
        results = ai_system.analyze_complete(
            image_path=image_path,
            audio_path=audio_path,
            video_duration=video_duration
        )

        # Cleanup temp files
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except:
                pass

        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass

        # STANDARDIZED RESPONSE STRUCTURE
        response = {
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat(),
            'report_type': report_type
        }
        debug_log_response('/run_complete_analysis', 200, response)
        return jsonify(response), 200

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/run_complete_analysis', 500, error_response)
        return jsonify(error_response), 500


@app.route('/analyze/business', methods=['POST'])
def analyze_business_mode():
    """Business endpoint expected by backend service."""
    return run_complete_analysis('business')


@app.route('/analyze/interview', methods=['POST'])
def analyze_interview_mode():
    """Interview endpoint expected by backend service."""
    return run_complete_analysis('hr')


@app.route('/analyze/investigation', methods=['POST'])
def analyze_investigation_mode():
    """Investigation endpoint expected by backend service."""
    return run_complete_analysis('criminal')


@app.route('/api/analyze/business', methods=['POST'])
def analyze_business_mode_api():
    """Business endpoint alias with /api prefix."""
    return run_complete_analysis('business')


@app.route('/api/analyze/interview', methods=['POST'])
def analyze_interview_mode_api():
    """Interview endpoint alias with /api prefix."""
    return run_complete_analysis('hr')


@app.route('/api/analyze/investigation', methods=['POST'])
def analyze_investigation_mode_api():
    """Investigation endpoint alias with /api prefix."""
    return run_complete_analysis('criminal')


@app.route('/api/analyze/face', methods=['POST'])
def analyze_face():
    """
    Face analysis endpoint

    Expected form data:
    - image (FILE): Facial image file (required)

    Returns:
    - Face analysis results including age, gender, emotion, race
    """
    try:
        if 'image' not in request.files:
            error_response = {
                'success': False,
                'error': 'Image file is required',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/face', 400, error_response)
            return jsonify(error_response), 400

        image_file = request.files['image']
        image_path = save_uploaded_file(image_file)

        if not image_path:
            error_response = {
                'success': False,
                'error': 'Invalid image file',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/face', 400, error_response)
            return jsonify(error_response), 400

        try:
            ai_system = AIAnalysisSystem()
            face_results = ai_system.face_analyzer.analyze_image(image_path)

            # STANDARDIZED RESPONSE STRUCTURE (NOW WITH report_type)
            response = {
                'success': True,
                'data': face_results,
                'timestamp': datetime.now().isoformat(),
                'report_type': 'general'
            }
            debug_log_response('/api/analyze/face', 200, response)
            return jsonify(response), 200

        finally:
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except:
                    pass

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Face analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/api/analyze/face', 500, error_response)
        return jsonify(error_response), 500


@app.route('/api/analyze/voice', methods=['POST'])
def analyze_voice():
    """
    Voice analysis endpoint

    Expected form data:
    - audio (FILE): Audio file (required)

    Returns:
    - Voice analysis results including transcription, stress, emotion
    """
    try:
        if 'audio' not in request.files:
            error_response = {
                'success': False,
                'error': 'Audio file is required',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/voice', 400, error_response)
            return jsonify(error_response), 400

        audio_file = request.files['audio']
        audio_path = save_uploaded_file(audio_file)

        if not audio_path:
            error_response = {
                'success': False,
                'error': 'Invalid audio file',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/voice', 400, error_response)
            return jsonify(error_response), 400

        try:
            ai_system = AIAnalysisSystem()
            ai_system.voice_analyzer.load_models()

            # Transcribe
            transcription = ai_system.voice_analyzer.transcribe_audio(audio_path)

            # Analyze stress
            stress_analysis = ai_system.voice_analyzer.analyze_audio_file(audio_path)

            # Detect emotion
            emotion_analysis = ai_system.voice_analyzer.detect_emotion(audio_path)

            # FIXED: Preserve structure with sub-components instead of merging
            results = {
                "transcription": transcription,
                "stress": stress_analysis,
                "emotion": emotion_analysis
            }

            # STANDARDIZED RESPONSE STRUCTURE (NOW WITH report_type)
            response = {
                'success': True,
                'data': results,
                'timestamp': datetime.now().isoformat(),
                'report_type': 'general'
            }
            debug_log_response('/api/analyze/voice', 200, response)
            return jsonify(response), 200

        finally:
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except:
                    pass

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Voice analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/api/analyze/voice', 500, error_response)
        return jsonify(error_response), 500


@app.route('/api/analyze/credibility', methods=['POST'])
def analyze_credibility():
    """
    Credibility/Lie detection endpoint

    Expected form data:
    - image (FILE): Facial image file (optional)
    - audio (FILE): Audio file (optional)
    - report_type (STR): Type of report (general, hr, criminal, business) - default: general

    Returns:
    - Credibility assessment and lie detection results
    """
    try:
        report_type = request.form.get('report_type', 'general')

        # Handle image upload
        image_path = None
        if 'image' in request.files:
            image_file = request.files['image']
            image_path = save_uploaded_file(image_file)

        # Handle audio upload
        audio_path = None
        if 'audio' in request.files:
            audio_file = request.files['audio']
            audio_path = save_uploaded_file(audio_file)

        # Require at least image or audio
        if not image_path and not audio_path:
            error_response = {
                'success': False,
                'error': 'At least one of image or audio file is required',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/credibility', 400, error_response)
            return jsonify(error_response), 400

        try:
            ai_system = AIAnalysisSystem(report_type=report_type)

            # Get face and voice results if files provided
            face_results = None
            voice_results = None
            credibility_results = None
            errors = []

            if image_path:
                try:
                    face_results = ai_system.face_analyzer.analyze_image(image_path)
                except Exception as e:
                    errors.append(f"Face analysis error: {str(e)}")

            if audio_path:
                try:
                    ai_system.voice_analyzer.load_models()

                    # Get all voice analysis components
                    transcription = ai_system.voice_analyzer.transcribe_audio(audio_path)
                    stress_analysis = ai_system.voice_analyzer.analyze_audio_file(audio_path)
                    emotion_analysis = ai_system.voice_analyzer.detect_emotion(audio_path)

                    # Combine voice results
                    voice_results = {
                        "transcription": transcription,
                        "stress": stress_analysis,
                        "emotion": emotion_analysis
                    }
                except Exception as e:
                    errors.append(f"Voice analysis error: {str(e)}")

            # FIXED: Use correct analyzer method
            if face_results and voice_results:
                try:
                    credibility_results = ai_system.credibility_analyzer.analyze(
                        face_results,
                        voice_results
                    )
                except Exception as e:
                    errors.append(f"Credibility analysis error: {str(e)}")

            # STANDARDIZED RESPONSE STRUCTURE (FLAT data, consistent with other endpoints)
            response = {
                'success': True,
                'data': {
                    'face': face_results,
                    'voice': voice_results,
                    'credibility': credibility_results
                },
                'errors': errors,
                'timestamp': datetime.now().isoformat(),
                'report_type': report_type
            }
            debug_log_response('/api/analyze/credibility', 200, response)
            return jsonify(response), 200

        finally:
            if image_path and os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except:
                    pass
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except:
                    pass

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Credibility analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/api/analyze/credibility', 500, error_response)
        return jsonify(error_response), 500


@app.route('/api/analyze/report', methods=['POST'])
def generate_report():
    """
    Report generation endpoint

    Expected JSON body:
    - face_data (DICT): Face analysis results
    - voice_data (DICT): Voice analysis results
    - credibility_data (DICT): Lie detection results
    - report_type (STR): Type of report (general, hr, criminal, business)

    Returns:
    - Generated report
    """
    try:
        data = request.get_json()

        if not data:
            error_response = {
                'success': False,
                'error': 'JSON body is required',
                'timestamp': datetime.now().isoformat()
            }
            debug_log_response('/api/analyze/report', 400, error_response)
            return jsonify(error_response), 400

        report_type = data.get('report_type', 'general')
        face_data = data.get('face_data')
        voice_data = data.get('voice_data')
        credibility_data = data.get('credibility_data')

        ai_system = AIAnalysisSystem(report_type=report_type)

        # Generate report
        report = ai_system.report_generator.generate_report(
            face_data=face_data,
            voice_data=voice_data,
            credibility_data=credibility_data
        )

        # STANDARDIZED RESPONSE STRUCTURE
        response = {
            'success': True,
            'data': report,
            'timestamp': datetime.now().isoformat(),
            'report_type': report_type
        }
        debug_log_response('/api/analyze/report', 200, response)
        return jsonify(response), 200

    except Exception as e:
        error_response = {
            'success': False,
            'error': f'Report generation failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
        debug_log_response('/api/analyze/report', 500, error_response)
        return jsonify(error_response), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get API status and available endpoints"""
    response = {
        'status': 'active',
        'service': 'TrustAI Flask API',
        'version': '1.0.0',
        'endpoints': {
            'health': 'GET /health',
            'analyze_complete': 'POST /api/analyze',
            'analyze_business': 'POST /analyze/business',
            'analyze_interview': 'POST /analyze/interview',
            'analyze_investigation': 'POST /analyze/investigation',
            'analyze_face': 'POST /api/analyze/face',
            'analyze_voice': 'POST /api/analyze/voice',
            'analyze_credibility': 'POST /api/analyze/credibility',
            'generate_report': 'POST /api/analyze/report',
            'status': 'GET /api/status'
        },
        'timestamp': datetime.now().isoformat()
    }
    debug_log_response('/api/status', 200, response)
    return jsonify(response), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    response = {
        'success': False,
        'error': 'Endpoint not found',
        'timestamp': datetime.now().isoformat()
    }
    debug_log_response('404', 404, response)
    return jsonify(response), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    response = {
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.now().isoformat()
    }
    debug_log_response('500', 500, response)
    return jsonify(response), 500


if __name__ == '__main__':
    # Run Flask development server
    # In production, use: gunicorn -w 4 -b 0.0.0.0:5000 flask_api:app
    port = os.environ.get('FLASK_PORT', 5000)
    debug = os.environ.get('FLASK_DEBUG', True)
    app.run(host='0.0.0.0', port=port, debug=debug)
