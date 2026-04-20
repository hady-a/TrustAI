#!/bin/bash

# Quick Testing Guide for Live Audio Recording

echo "🎙️  Live Audio Recording - Testing Guide"
echo "========================================"
echo ""

# Check if MicrophoneStream component exists
echo "1. Verifying component files..."
if [ -f "apps/frontend/src/pages/MicrophoneStream.tsx" ]; then
  echo "   ✅ MicrophoneStream.tsx found"
else
  echo "   ❌ MicrophoneStream.tsx not found"
  exit 1
fi

if [ -f "apps/frontend/src/hooks/useAudioRecorder.ts" ]; then
  echo "   ✅ useAudioRecorder.ts found"
else
  echo "   ❌ useAudioRecorder.ts not found"
  exit 1
fi

# Check backend route
echo ""
echo "2. Checking backend route..."
grep -q "'/analyze/live'" apps/backend/src/routes/analyze.routes.ts && echo "   ✅ /analyze/live endpoint registered" || echo "   ❌ /analyze/live endpoint not found"

echo ""
echo "3. Manual Testing Steps:"
echo "   a. Start backend: npm run dev (in apps/backend)"
echo "   b. Start frontend: npm run dev (in apps/frontend)"
echo "   c. Navigate to: http://localhost:5173/microphone"
echo "   d. Click 'Start Recording'"
echo "   e. Speak into microphone for 10+ seconds"
echo "   f. Watch real-time results appear every 2.5 seconds"
echo "   g. Click 'Stop Recording'"
echo "   h. Verify MediaStream is stopped (check browser console)"
echo ""

echo "4. Testing Checklist:"
echo "   □ Microphone permission granted"
echo "   □ 'Recording...' indicator appears"
echo "   □ First chunk sent within 3 seconds"
echo "   □ Result appears in right panel"
echo "   □ Multiple chunks appear as continues"
echo "   □ Response time < 2 seconds per chunk"
echo "   □ Stop button works"
echo "   □ No console errors or memory warnings"
echo ""

echo "5. Mode Testing:"
echo "   □ Test BUSINESS mode"
echo "   □ Test INTERVIEW mode"
echo "   □ Test INVESTIGATION mode"
echo ""

echo "6. Error Scenarios:"
echo "   □ Deny microphone access (should show error)"
echo "   □ Disconnect network mid-recording (should handle gracefully)"
echo "   □ Stop and immediately start (should reset properly)"
echo ""

echo "7. Memory Check (Chrome DevTools):"
echo "   a. Open DevTools → Memory tab"
echo "   b. Record up to 30 seconds"
echo "   c. Stop recording"
echo "   d. Take heap snapshot"
echo "   e. Look for MediaRecorder and MediaStream objects"
echo "   f. They should be garbage collected"
echo ""

echo "✨ Testing guide complete!"
echo ""
echo "For detailed implementation info, see: LIVE_AUDIO_IMPLEMENTATION.md"
