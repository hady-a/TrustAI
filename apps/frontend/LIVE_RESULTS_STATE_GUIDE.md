# Live Results State Management - Reference Guide

## State Setup

The microphone streaming component now has comprehensive live results state management:

### Hook State (useMicrophoneStream)
```typescript
// From hook - updates automatically
state.liveResult: {
  timestamp: string;           // ISO timestamp
  status: 'processing' | 'complete' | 'error';
  data?: {
    deceptionScore?: number;   // 0-100
    credibilityScore?: number; // 0-100
    confidence?: number;       // 0-1
    insights?: string[];
    metrics?: Record<string, number | string>;
  };
  error?: string;
}
```

### Component State (MicrophoneStreaming)
```typescript
// Live results - simple format for quick access
const [liveResults, setLiveResults] = useState<LiveResult | null>(null);

interface LiveResult {
  timestamp: string;           // When analysis was completed
  score: number;              // Deception score (0-100)
  status: 'processing' | 'complete' | 'error';
  data?: any;                 // Full analysis data
}

// Result history - tracks last 10 analyses
const [resultHistory, setResultHistory] = useState<LiveResult[]>([]);
```

## State Updates Flow

```
WebSocket Message Received
    ↓
Hook (useMicrophoneStream) updates state.liveResult
    ↓
Component effect detects state.liveResult change
    ↓
Component creates LiveResult object
    ↓
setLiveResults() called
    ↓
setResultHistory() updated (keeps last 10)
    ↓
Components re-render with new data
```

## Usage Examples

### 1. Access Current Live Result
```typescript
// From hook (raw data)
console.log('Current analysis:', state.liveResult);

// From component state (simplified)
console.log('Latest result:', liveResults);
// Output: { timestamp, score, status, data }
```

### 2. Check Analysis Status
```typescript
if (liveResults) {
  if (liveResults.status === 'complete') {
    console.log(`Deception Score: ${liveResults.score}%`);
  } else if (liveResults.status === 'processing') {
    console.log('Analysis in progress...');
  } else if (liveResults.status === 'error') {
    console.log('Analysis failed');
  }
}
```

### 3. Use Result History
```typescript
// Display all recent results
resultHistory.forEach((result, idx) => {
  console.log(`Result ${idx + 1}:`, {
    time: result.timestamp,
    score: result.score,
    status: result.status,
  });
});

// Get last result
const lastResult = resultHistory[resultHistory.length - 1];
console.log('Previous analysis:', lastResult);

// Get average score from history
const avgScore = resultHistory.reduce((sum, r) => sum + r.score, 0) / resultHistory.length;
console.log('Average deception score:', Math.round(avgScore));
```

### 4. Handle Analysis Complete
```typescript
// Hook into analysis complete callback
const handleAnalysisComplete = (result: any) => {
  console.log('Analysis finished:', result);
  // Send to database
  // Update UI
  // Trigger notifications
};

<MicrophoneStreaming onAnalysisComplete={handleAnalysisComplete} />
```

### 5. Real-time Updates
```typescript
// Watch for new results
useEffect(() => {
  if (liveResults?.status === 'complete') {
    console.log('New analysis complete:', liveResults);
    // Trigger action
  }
}, [liveResults]);
```

## Component Integration

### MicrophoneStreaming Component
```typescript
// States available
state.liveResult          // From hook (detailed)
liveResults               // Component state (simplified)
resultHistory             // Last 10 results

// Effect that syncs states
useEffect(() => {
  if (state.liveResult) {
    const newResult: LiveResult = {
      timestamp: state.liveResult.timestamp || new Date().toISOString(),
      score: state.liveResult.data?.deceptionScore || 0,
      status: state.liveResult.status,
      data: state.liveResult.data,
    };
    setLiveResults(newResult);
    setResultHistory((prev) => [...prev, newResult].slice(-10));
    console.log('Live result update:', newResult);
  }
}, [state.liveResult]);
```

## Complete Example

```typescript
import { useMicrophoneStream } from '@/hooks/useMicrophoneStream';
import MicrophoneStreaming from '@/components/MicrophoneStreaming';
import { useState, useEffect } from 'react';

export default function AnalysisPage() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    averageScore: 0,
    lastScore: 0,
  });

  const handleAnalysisComplete = (result: any) => {
    // Update statistics
    setStats((prev) => ({
      totalAnalyses: prev.totalAnalyses + 1,
      averageScore: result.deceptionScore,
      lastScore: result.deceptionScore,
    }));

    // Save to database
    saveAnalysisResult(result);

    // Show notification
    showNotification(`Analysis complete: ${result.deceptionScore}%`);
  };

  return (
    <div>
      <MicrophoneStreaming onAnalysisComplete={handleAnalysisComplete} />

      <div className="mt-8">
        <p>Total Analyses: {stats.totalAnalyses}</p>
        <p>Last Score: {stats.lastScore}%</p>
        <p>Average: {Math.round(stats.averageScore)}%</p>
      </div>
    </div>
  );
}
```

## Data Access Patterns

### Pattern 1: Simple Result Check
```typescript
if (liveResults?.status === 'complete') {
  const deceptionScore = liveResults.score;
  // Use score
}
```

### Pattern 2: Full Data Access
```typescript
if (state.liveResult?.data?.insights) {
  state.liveResult.data.insights.forEach(insight => {
    console.log('• ' + insight);
  });
}
```

### Pattern 3: History Analysis
```typescript
const successfulResults = resultHistory.filter(r => r.status === 'complete');
const failedResults = resultHistory.filter(r => r.status === 'error');
const avgScore = successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length;
```

### Pattern 4: Real-time Display
```typescript
{liveResults && (
  <div>
    <p>Score: {liveResults.score}%</p>
    <p>Status: {liveResults.status}</p>
    <p>Time: {new Date(liveResults.timestamp).toLocaleTimeString()}</p>
  </div>
)}
```

## State Lifecycle

```
Initial State:
  liveResults = null
  resultHistory = []

First Analysis:
  state.liveResult updated by hook
  ↓
  Component effect fires
  ↓
  liveResults = { timestamp, score, status, data }
  resultHistory = [result]

Second Analysis:
  state.liveResult updated
  ↓
  Component effect fires
  ↓
  liveResults = { new result }
  resultHistory = [old_result, new_result]

After 10 Analyses:
  resultHistory keeps only last 10 (slice(-10))
  ↓
  resultHistory.length = 10
```

## Console Logging

All live result updates are logged to console (development):
```javascript
console.log('Live result update:', newResult);
// Output: {
//   timestamp: "2024-03-26T12:34:56.789Z",
//   score: 65,
//   status: "complete",
//   data: { ...details }
// }
```

## Accessing from Other Components

### Via Props
```typescript
<MicrophoneStreaming
  onAnalysisComplete={(result) => {
    // Use result here
    console.log(result);
  }}
/>
```

### Via Custom Hook
```typescript
function useAnalysisResults() {
  const { state } = useMicrophoneStream();
  return state.liveResult;
}

// In another component
const result = useAnalysisResults();
```

### Via Context
```typescript
// Create context
export const AnalysisContext = createContext(null);

// Provider component
<AnalysisContext.Provider value={{ liveResults, resultHistory }}>
  {children}
</AnalysisContext.Provider>

// Use in any component
const { liveResults, resultHistory } = useContext(AnalysisContext);
```

## Performance Considerations

1. **History Limit**: Keeps only last 10 results to prevent memory bloat
   ```typescript
   setResultHistory((prev) => [...prev, newResult].slice(-10))
   ```

2. **State Updates**: Only triggered when `state.liveResult` changes
   ```typescript
   useEffect(() => {
     // Only runs on liveResult change
   }, [state.liveResult]);
   ```

3. **Component Re-renders**: LiveAnalysisDisplay handles its own animations efficiently

## Troubleshooting

### Results Not Updating
```typescript
// Check if hook state is updating
console.log('Hook state:', state.liveResult);

// Check if component state is updating
console.log('Component state:', liveResults);

// Verify effect is firing
useEffect(() => {
  console.log('Effect fired - liveResult changed');
}, [state.liveResult]);
```

### History Not Tracking
```typescript
// Verify history is accumulating
console.log('Result history length:', resultHistory.length);
console.log('All results:', resultHistory);

// Check if limit is working
console.log('History limited to 10:', resultHistory.length <= 10);
```

### Analysis Results Not Appearing
1. Verify WebSocket connection (should show "Connected")
2. Check Flask API is running on localhost:8000
3. Verify buffer reaches 5 chunks
4. Look for error messages in console

## Summary

- **Hook State**: `state.liveResult` - detailed real-time result from WebSocket
- **Component State**: `liveResults` - simplified current result
- **History**: `resultHistory` - last 10 results for trends/comparison
- **Auto-sync**: Component effect keeps states in sync
- **Logging**: All updates logged to console for debugging
