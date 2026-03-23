#!/bin/bash
set -x  # Print commands as they execute

cd "/Users/hadyakram/Desktop/trustai/trust ai system"

echo "=== Starting Flask API ==="
echo "Python path: $(/usr/local/bin/python3.10 --version)"
echo "Current directory: $(pwd)"
echo ""

/usr/local/bin/python3.10 << 'PYEOF'
import sys
import os
print("Python version:", sys.version)
print("Python path:", sys.executable)
print("Current directory:", os.getcwd())
print("\nImporting Flask app...")

try:
    from flask_api import app
    print("✓ Flask app imported successfully")
    
    print("\nStarting Flask server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False, threaded=True)
    
except KeyboardInterrupt:
    print("\n✓ Flask server stopped")
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
PYEOF

echo "Flask exited with code: $?"
