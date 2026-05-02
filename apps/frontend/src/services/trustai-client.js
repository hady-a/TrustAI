/**
 * TrustAI Frontend - API Client
 * Handles communication with Flask AI Analysis API
 * 
 * Usage:
 * const client = new TrustAIClient('http://localhost:5000');
 * const response = await client.analyzeBusinessMode(audioFile, imageFile, transcript);
 */

class TrustAIClient {
  /**
   * Initialize TrustAI API Client
   * @param {string} apiBaseUrl - Flask API base URL (default: http://localhost:5000)
   */
  constructor(apiBaseUrl = 'http://localhost:5000') {
    this.apiBaseUrl = apiBaseUrl;
    this.timeout = 300000; // 5 minutes
  }

  /**
   * Make API request with error handling
   * @private
   */
  async _request(endpoint, method = 'GET', data = null, isFormData = false) {
    try {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          ...(!isFormData && { 'Content-Type': 'application/json' })
        },
        timeout: this.timeout
      };

      if (data) {
        options.body = isFormData ? data : JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `API Error: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * Business Mode Analysis
   * Analyzes facial expressions and voice during business interaction
   * 
   * @param {File} audioFile - Audio file (WAV, MP3, M4A, OGG, FLAC)
   * @param {File} imageFile - Image file (JPG, PNG, BMP)
   * @param {string} text - Optional meeting transcript or text
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeBusinessMode(audioFile, imageFile, text = '') {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('image', imageFile);
    if (text) formData.append('text', text);

    return this._request('/api/analyze/business', 'POST', formData, true);
  }

  /**
   * HR Mode Analysis
   * Analyzes candidate during HR interview - stress, deception, emotion
   * 
   * @param {File} audioFile - Audio file (WAV, MP3, M4A, OGG, FLAC)
   * @param {File} imageFile - Image file (JPG, PNG, BMP)
   * @param {string} text - Optional interview transcript
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeHRMode(audioFile, imageFile, text = '') {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('image', imageFile);
    if (text) formData.append('text', text);

    return this._request('/api/analyze/hr', 'POST', formData, true);
  }

  /**
   * Investigation Mode Analysis
   * Deep analysis for criminal investigation - deception detection, credibility
   * 
   * @param {File} audioFile - Audio file (WAV, MP3, M4A, OGG, FLAC)
   * @param {File} imageFile - Image file (JPG, PNG, BMP)
   * @param {string} text - Optional statement/transcript
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeInvestigationMode(audioFile, imageFile, text = '') {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('image', imageFile);
    if (text) formData.append('text', text);

    return this._request('/api/analyze/investigation', 'POST', formData, true);
  }

  /**
   * Health Check
   * @returns {Promise<Object>} API health status
   */
  async healthCheck() {
    return this._request('/api/health');
  }

  /**
   * Get API Information
   * @returns {Promise<Object>} Available endpoints and info
   */
  async getAPIInfo() {
    return this._request('/api/info');
  }
}


// ========================================
// EXAMPLE USAGE
// ========================================

/**
 * Example 1: Simple Business Analysis
 */
async function example1_businessAnalysis() {
  try {
    const client = new TrustAIClient('http://localhost:5000');

    // Get files from input elements
    const audioFile = document.getElementById('audioInput').files[0];
    const imageFile = document.getElementById('imageInput').files[0];
    const transcript = document.getElementById('textInput').value;

    console.log('Starting business analysis...');
    const result = await client.analyzeBusinessMode(audioFile, imageFile, transcript);

    console.log('Analysis Result:', result);
    displayResults(result);
  } catch (error) {
    console.error('Error:', error);
    displayError(error.message);
  }
}

/**
 * Example 2: HR Interview Analysis with Progress
 */
async function example2_hrAnalysisWithProgress() {
  try {
    const client = new TrustAIClient('http://localhost:5000');

    // Get files
    const audioFile = document.getElementById('audioInput').files[0];
    const imageFile = document.getElementById('imageInput').files[0];

    // Show loading state
    showLoadingIndicator('Analyzing HR interview...');

    const result = await client.analyzeHRMode(audioFile, imageFile);

    // Hide loading and show results
    hideLoadingIndicator();

    if (result.success) {
      console.log('✓ HR Analysis Complete');
      displayHRResults(result.data);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoadingIndicator();
    console.error('Error:', error);
    displayError(error.message);
  }
}

/**
 * Example 3: Investigation Analysis with Detailed Report
 */
async function example3_investigationAnalysis() {
  try {
    const client = new TrustAIClient('http://localhost:5000');

    // Get files
    const audioFile = document.getElementById('audioInput').files[0];
    const imageFile = document.getElementById('imageInput').files[0];
    const statement = document.getElementById('statementInput').value;

    console.log('Starting investigation analysis...');
    showLoadingIndicator('Analyzing statement...');

    const result = await client.analyzeInvestigationMode(audioFile, imageFile, statement);

    hideLoadingIndicator();

    if (result.success) {
      const analysis = result.data;

      // Display comprehensive results
      console.log('Face Analysis:', analysis.analysis.face);
      console.log('Voice Analysis:', analysis.analysis.voice);
      console.log('Credibility:', analysis.analysis.credibility);
      console.log('Final Report:', analysis.report);

      displayInvestigationReport(analysis);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoadingIndicator();
    console.error('Error:', error);
    displayError(error.message);
  }
}

/**
 * Example 4: File Upload with Validation
 */
async function example4_fileUploadWithValidation() {
  const audioInput = document.getElementById('audioInput');
  const imageInput = document.getElementById('imageInput');

  // Validate files
  if (!audioInput.files[0]) {
    displayError('Please select an audio file');
    return;
  }
  if (!imageInput.files[0]) {
    displayError('Please select an image file');
    return;
  }

  // Validate file sizes
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (audioInput.files[0].size > maxSize) {
    displayError('Audio file too large (max 50MB)');
    return;
  }
  if (imageInput.files[0].size > maxSize) {
    displayError('Image file too large (max 50MB)');
    return;
  }

  // Proceed with upload
  try {
    const client = new TrustAIClient('http://localhost:5000');
    const result = await client.analyzeBusinessMode(
      audioInput.files[0],
      imageInput.files[0]
    );
    displayResults(result);
  } catch (error) {
    displayError(error.message);
  }
}

/**
 * Example 5: Batch Analysis
 */
async function example5_batchAnalysis() {
  const client = new TrustAIClient('http://localhost:5000');
  const analyses = [];

  try {
    // Get multiple file sets
    const sets = [
      {
        audio: document.getElementById('audio1').files[0],
        image: document.getElementById('image1').files[0],
        mode: 'business'
      },
      {
        audio: document.getElementById('audio2').files[0],
        image: document.getElementById('image2').files[0],
        mode: 'hr'
      }
    ];

    // Process each set
    for (const set of sets) {
      showLoadingIndicator(`Analyzing ${set.mode} mode...`);

      let result;
      if (set.mode === 'business') {
        result = await client.analyzeBusinessMode(set.audio, set.image);
      } else if (set.mode === 'hr') {
        result = await client.analyzeHRMode(set.audio, set.image);
      }

      analyses.push({
        mode: set.mode,
        result
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between requests
    }

    hideLoadingIndicator();
    console.log('Batch Analysis Complete:', analyses);
    displayBatchResults(analyses);
  } catch (error) {
    hideLoadingIndicator();
    displayError(error.message);
  }
}

// ========================================
// UI HELPER FUNCTIONS
// ========================================

/**
 * Display analysis results
 */
function displayResults(result) {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `
      <div class="alert alert-success">
        <h3>✓ Analysis Complete</h3>
        <pre>${JSON.stringify(result, null, 2)}</pre>
      </div>
    `;
  }
}

/**
 * Display HR analysis results
 */
function displayHRResults(data) {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `
      <div class="alert alert-info">
        <h3>HR Analysis Results</h3>
        <div class="card">
          <h4>Face Analysis</h4>
          <p>${JSON.stringify(data.analysis.face, null, 2)}</p>
        </div>
        <div class="card">
          <h4>Voice Analysis</h4>
          <p>${JSON.stringify(data.analysis.voice, null, 2)}</p>
        </div>
        <div class="card">
          <h4>Deception Analysis</h4>
          <p>${JSON.stringify(data.analysis.deception, null, 2)}</p>
        </div>
      </div>
    `;
  }
}

/**
 * Display investigation report
 */
function displayInvestigationReport(analysis) {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    const credibility = analysis.analysis.credibility || {};
    resultsDiv.innerHTML = `
      <div class="alert alert-warning">
        <h3>Investigation Analysis Report</h3>
        
        <div class="metric">
          <label>Trustworthiness:</label>
          <div class="progress">
            <div class="progress-bar" style="width: ${(credibility.overall_trustworthiness || 0) * 100}%">
              ${Math.round((credibility.overall_trustworthiness || 0) * 100)}%
            </div>
          </div>
        </div>

        <div class="metric">
          <label>Deception Probability:</label>
          <div class="progress">
            <div class="progress-bar bg-danger" style="width: ${(credibility.deception_score?.probability || 0) * 100}%">
              ${Math.round((credibility.deception_score?.probability || 0) * 100)}%
            </div>
          </div>
        </div>

        <div class="report">
          <h4>Full Report</h4>
          <pre>${JSON.stringify(analysis.report, null, 2)}</pre>
        </div>
      </div>
    `;
  }
}

/**
 * Display batch results
 */
function displayBatchResults(analyses) {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    let html = '<div class="alert alert-success"><h3>Batch Analysis Complete</h3>';
    analyses.forEach((item, index) => {
      html += `<div class="batch-item"><h4>${item.mode}</h4><pre>${JSON.stringify(item.result, null, 2)}</pre></div>`;
    });
    html += '</div>';
    resultsDiv.innerHTML = html;
  }
}

/**
 * Display error message
 */
function displayError(message) {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `<div class="alert alert-danger"><h3>✗ Error</h3><p>${message}</p></div>`;
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator(message = 'Processing...') {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'block';
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) messageEl.textContent = message;
  }
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrustAIClient;
}
