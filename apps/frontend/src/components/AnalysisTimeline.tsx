import React, { useEffect, useState } from 'react';
import { Check, Clock, AlertCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';

export interface StatusHistoryEntry {
  id: string;
  analysisId: string;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
}

export interface AnalysisTimelineProps {
  analysisId: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> =
  {
    UPLOADED: {
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-gray-100 text-gray-600 border-gray-300',
      label: 'File Uploaded',
    },
    QUEUED: {
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-600 border-blue-300',
      label: 'Queued for Processing',
    },
    PROCESSING: {
      icon: <Loader className="w-5 h-5 animate-spin" />,
      color: 'bg-yellow-100 text-yellow-600 border-yellow-300',
      label: 'Processing',
    },
    AI_ANALYZED: {
      icon: <Check className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-600 border-purple-300',
      label: 'AI Analysis Complete',
    },
    COMPLETED: {
      icon: <Check className="w-5 h-5" />,
      color: 'bg-green-100 text-green-600 border-green-300',
      label: 'Completed',
    },
    FAILED: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-red-100 text-red-600 border-red-300',
      label: 'Failed',
    },
  };

/**
 * AnalysisTimeline Component
 * Displays the processing stages of an analysis in a visual timeline
 * Shows status history with timestamps
 */
export const AnalysisTimeline: React.FC<AnalysisTimelineProps> = ({
  analysisId,
  isLoading: externalLoading = false,
  onError,
}) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatusHistory();

    // Poll for updates every 2 seconds if analysis is still processing
    const interval = setInterval(fetchStatusHistory, 2000);
    return () => clearInterval(interval);
  }, [analysisId]);

  const fetchStatusHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/analyses/${analysisId}/status-history`);

      if (response.data.success && response.data.data.history) {
        setHistory(response.data.data.history);
        setError(null);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch status history';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || externalLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600">
        <p>No status history available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-gray-300"></div>

        {/* Timeline entries */}
        <div className="space-y-6">
          {history.map((entry, index) => {
            const statusInfo = STATUS_CONFIG[entry.newStatus] || {
              icon: <Clock className="w-5 h-5" />,
              color: 'bg-gray-100 text-gray-600 border-gray-300',
              label: entry.newStatus,
            };

            const isLatest = index === history.length - 1;

            return (
              <div key={entry.id} className="flex items-start">
                {/* Timeline point */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 ${statusInfo.color}`}
                >
                  {statusInfo.icon}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{statusInfo.label}</h4>
                      <p className="text-sm text-gray-500">
                        {entry.oldStatus} → {entry.newStatus}
                      </p>
                    </div>
                    {isLatest && (
                      <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(entry.changedAt), 'MMM dd, yyyy HH:mm:ss')}
                  </p>

                  {/* Processing duration (if not first entry) */}
                  {index > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {calculateDuration(
                        new Date(history[index - 1].changedAt),
                        new Date(entry.changedAt)
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Processing Time */}
      {history.length > 1 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Total Processing Time:</span>{' '}
            {calculateDuration(new Date(history[0].changedAt), new Date(history[history.length - 1].changedAt))}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Utility function to calculate duration between two dates
 */
function calculateDuration(startDate: Date, endDate: Date): string {
  const ms = endDate.getTime() - startDate.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default AnalysisTimeline;
