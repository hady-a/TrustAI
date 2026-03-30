# Live Analysis Display - Real-Time Results Guide

## Overview

The **Live Analysis Display** component provides real-time visualization of analysis results as they stream in from the WebSocket server. It displays deception scores, credibility metrics, insights, and detailed metrics with smooth animations.

## Components

### LiveAnalysisDisplay Component
**Location:** `apps/frontend/src/components/LiveAnalysisDisplay.tsx`

A specialized component for displaying streaming analysis results with:
- Real-time score animations
- Progress bars with color coding
- Key insights panel
- Detailed metrics grid
- Result history timeline
- Error handling

**Props:**
```typescript
{
  result: LiveAnalysisResult | null;      // Current analysis result
  isAnalyzing: boolean;                   // Processing state
  bufferedChunks: number;                 // Chunks in buffer
  recordingTime: number;                  // Recording duration
}
```

**Result Structure:**
```typescript
{
  timestamp: string;                      // ISO timestamp
  status: 'processing' | 'complete' | 'error';
  data?: {
    deceptionScore?: number;              // 0-100
    credibilityScore?: number;            // 0-100
    confidence?: number;                  // 0-1
    metrics?: {
      [key: string]: number | string;     // Additional metrics
    };
    insights?: string[];                  // Key findings
  };
  error?: string;                         // Error message if failed
}
```

## Features

### 1. **Real-Time Score Display**
- Shows deception score (red gradient)
- Shows credibility score (green gradient)
- Shows model confidence level (blue)
- Animated number transitions when new results arrive

**Color Coding:**
```
Deception Score:
  75-100: Very High (Red)
  50-74:  Moderate (Orange)
  25-49:  Low (Yellow)
  0-24:   Very Low (Green)

Credibility Score:
  Inverse coloring (higher = greener)
```

### 2. **Score Progress Bars**
- Animated width transitions (0.3s duration)
- Gradient colors matching theme
- Percentage label on right
- Smooth easing animation

### 3. **Key Insights Panel**
- Displays important findings from analysis
- Staggered animation (each item appears sequentially)
- Bullet point format for clarity
- Support for multiple insights

### 4. **Detailed Metrics Grid**
- Shows all additional metrics from analysis
- 2-column on mobile, 3-column on desktop
- Individual scale animations
- Rounded boxes with dark theme support

### 5. **Result History Timeline**
- Shows all analysis results chronologically
- Maximum height with scrollable overflow
- Timestamp for each result
- Current deception score indicator
- Status indicator (✓, ✗)

### 6. **Status Indicators**
- Processing: Animated lightning bolt (⚡)
- Complete: Green checkmark (✓)
- Error: Red alert icon (⚠️)
- Connection status

### 7. **Error Handling**
- Displays error messages when analysis fails
- Shows error status in history
- User-friendly error presentation

## Integration with MicrophoneStreaming

The component is automatically integrated into `MicrophoneStreaming.tsx`:

```tsx
import LiveAnalysisDisplay from './LiveAnalysisDisplay';

// Inside MicrophoneStreaming component:
<LiveAnalysisDisplay
  result={state.liveResult}
  isAnalyzing={state.isAnalyzing}
  bufferedChunks={state.bufferedChunks}
  recordingTime={state.recordingTime}
/>
```

## WebSocket Message Format

The component expects analysis results in this format:

```json
{
  "type": "analysis_complete",
  "timestamp": "2024-03-26T12:34:56.789Z",
  "result": {
    "deceptionScore": 65,
    "credibilityScore": 35,
    "confidence": 0.92,
    "insights": [
      "Voice pattern shows elevated stress",
      "Speech rate increased by 15%",
      "Pauses indicate hesitation"
    ],
    "metrics": {
      "average_pitch": 145.3,
      "speech_rate": 125,
      "pause_duration": 2.1,
      "vocal_stress": 0.78
    }
  }
}
```

## Hook Updates

The `useMicrophoneStream` hook was updated to support streaming results:

**New State Field:**
```typescript
liveResult: {
  timestamp: string;
  status: 'processing' | 'complete' | 'error';
  data?: {...};
  error?: string;
}
```

**Message Handlers:**
- `analysis_complete`: Updates `liveResult` with results
- `analysis_error`: Updates `liveResult` with error status

## Usage Examples

### Basic Usage (Automatic)
```tsx
import MicrophoneStreaming from '@/components/MicrophoneStreaming';

export default function MyPage() {
  return <MicrophoneStreaming />;
  // LiveAnalysisDisplay is included automatically
}
```

### Custom Integration
```tsx
import { useMicrophoneStream } from '@/hooks/useMicrophoneStream';
import LiveAnalysisDisplay from '@/components/LiveAnalysisDisplay';

export default function CustomStream() {
  const { state } = useMicrophoneStream();

  return (
    <div>
      {/* Your content */}
      <LiveAnalysisDisplay
        result={state.liveResult}
        isAnalyzing={state.isAnalyzing}
        bufferedChunks={state.bufferedChunks}
        recordingTime={state.recordingTime}
      />
    </div>
  );
}
```

## Visual Components

### Analysis Status Header
Shows connection status and analysis state with animated indicator:
- 🟢 Connected (green)
- 🔴 Disconnected (red)
- ⚡ Analyzing (amber, rotating)
- ✓ Complete (green checkmark)

### Metric Cards
Three cards showing key metrics:
1. **Deception Score** - Main deception indicator
2. **Credibility Score** - Inverse of deception
3. **Confidence** - Model confidence level

Each card:
- Displays percentage (0-100)
- Shows interpretation label
- Color-coded background
- Hover scale animation

### Insight Items
Each insight:
- Appears with fade-in animation
- Staggered timing for visual interest
- Blue bullet point
- Dark mode compatible

### Metrics Grid
Displays all additional analysis metrics:
- Auto-scaling based on metrics count
- 2-3 column responsive layout
- Individual scale animations
- Formatted values (rounded to 2 decimals)

### History Timeline
Scrollable list of all results:
- Timestamp
- Deception score with color
- Status indicator
- Compact format

## Animation Details

### Score Animation
- Duration: 1000ms (1 second)
- Easing: smooth curves
- Re-animates on new results

### Progress Bars
- Duration: 300ms (0.3 seconds)
- Easing: easeOut
- Width animates from 0 to target %

### Staggered Items
- Each item: 100ms apart
- Used for insights and metrics
- Creates cascading effect

### Hover Effects
- Metric cards: scale 1.02x on hover
- Smooth 200ms transition
- Non-intrusive feedback

## Responsive Design

### Mobile (< 768px)
- 3-column metrics grid
- Single column layout for history
- Touch-friendly spacing
- Readable font sizes

### Tablet (768px - 1024px)
- 2-column metrics grid
- 2-column layout for insights
- Balanced proportions

### Desktop (> 1024px)
- 3-column metrics grid
- Full-width panels
- Generous spacing
- Large font sizes

## Dark Mode Support

All components have full dark mode support:
- Background colors with `dark:` variants
- Text colors inverted appropriately
- Border colors adjusted
- Color indicators maintained

## Accessibility

- Semantic HTML elements
- Proper heading hierarchy
- Color not sole differentiator
- Large enough touch targets
- Readable contrast ratios

## Performance Optimizations

1. **Memoized Components** - Only re-render on prop changes
2. **Staggered Animations** - Using Framer Motion for GPU acceleration
3. **Limited History** - Max 50 items with scroll
4. **Requestanimationframe** - Smooth score animations
5. **Lazy Updates** - State updates batched

## Styling

### Color System
```typescript
// Deception Score Colors
Red:     text-red-600 dark:text-red-400
Orange:  text-orange-600 dark:text-orange-400
Yellow:  text-yellow-600 dark:text-yellow-400
Green:   text-green-600 dark:text-green-400

// Background Colors
Gradient backgrounds from lighter to darker
```

### Spacing & Typography
```
Card Padding:       16px (p-4)
Grid Gap:          16px
History Max Height: 192px (max-h-48)
Font Sizes:        xs (12px), sm (14px), base (16px)
Line Heights:      tight to relaxed
```

## Example Response Mapping

### Flask API Response (Expected Format)
```json
{
  "deceptionScore": 65,
  "credibilityScore": 35,
  "confidence": 0.92,
  "insights": [
    "Voice shows signs of stress",
    "Increased speech rate detected",
    "Hesitation patterns identified"
  ],
  "metrics": {
    "pitch_average": 145.5,
    "speech_rate_wpm": 125,
    "pause_duration_ms": 2100,
    "stress_index": 0.78
  }
}
```

## Troubleshooting

### Scores Not Animating
- Check `liveResult.status === 'complete'`
- Verify WebSocket message includes all data
- Check browser console for errors

### Insights Not Showing
- Ensure Flask API returns `insights` array
- Check for undefined/null values
- Verify array format

### History Not Scrolling
- Set parent max-height (already done: `max-h-48`)
- Check overflow-y property
- Verify items are being added

### Performance Issues
- Reduce history size if needed
- Check for frequent re-renders
- Profile with React DevTools

## Future Enhancements

1. **Export Results** - Save as PDF/JSON
2. **Charts & Graphs** - Visual trend display
3. **Comparison View** - Compare multiple analyses
4. **Custom Metrics** - User-defined metrics display
5. **Alerts & Warnings** - Threshold-based notifications
6. **Real-time Streaming** - Progressive update display
7. **Voice Feedback** - Audio notifications
8. **Recording Playback** - Show audio with results

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

## Notes

- Component updates automatically when WebSocket messages arrive
- All animations use GPU acceleration for smoothness
- Results persist until new analysis starts
- History is cleared on component unmount
- Empty state shows helpful message when no results
