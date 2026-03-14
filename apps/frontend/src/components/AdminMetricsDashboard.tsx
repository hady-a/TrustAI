import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
} from 'lucide-react';

export interface SystemMetrics {
  totalUsers: number;
  totalAnalyses: number;
  analysesToday: number;
  averageProcessingTimeMs: number;
  successRate: number;
  successRatePercentage: number;
  failedAnalyses: number;
  completedAnalyses: number;
  processingAnalyses: number;
}

export interface TrendData {
  date: string;
  analysesCreated: number;
}

export interface AdminMetricsDashboardProps {
  onError?: (error: string) => void;
}

/**
 * AdminMetricsDashboard Component
 * Displays comprehensive system metrics and analytics
 * Includes charts for trends, success rates, and user activity
 */
export const AdminMetricsDashboard: React.FC<AdminMetricsDashboardProps> = ({ onError }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);

      // Fetch system metrics
      const metricsRes = await fetch('/api/admin/system-metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }

      // Fetch trend data
      const trendsRes = await fetch('/api/admin/metrics/trends?daysBack=7', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data);
      }

      setError(null);
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch metrics';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No metrics data available</p>
      </div>
    );
  }

  // Prepare data for status distribution
  const statusData = [
    { name: 'Completed', value: metrics.completedAnalyses, fill: '#10b981' },
    { name: 'Processing', value: metrics.processingAnalyses, fill: '#f59e0b' },
    { name: 'Failed', value: metrics.failedAnalyses, fill: '#ef4444' },
  ];

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Total Analyses */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalAnalyses}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics.successRatePercentage.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Processing</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatTime(metrics.averageProcessingTimeMs)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Analyses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Analyses Today</span>
              <span className="text-2xl font-bold text-blue-600">{metrics.analysesToday}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Completed</span>
              <span className="text-2xl font-bold text-green-600">{metrics.completedAnalyses}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-700">Processing</span>
              <span className="text-2xl font-bold text-yellow-600">
                {metrics.processingAnalyses}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-gray-700">Failed</span>
              <span className="text-2xl font-bold text-red-600">{metrics.failedAnalyses}</span>
            </div>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Status Distribution</h3>
          {statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} analyses`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No analysis data yet
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyses Trend (7 Days)</h3>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="analysesCreated"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No trend data available
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.successRatePercentage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Avg Time</p>
            <p className="text-2xl font-bold text-gray-900">{formatTime(metrics.averageProcessingTimeMs)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalAnalyses > 0
                ? ((metrics.completedAnalyses / metrics.totalAnalyses) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">User Engagement</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalUsers > 0
                ? ((metrics.totalAnalyses / metrics.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-gray-500 text-sm">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default AdminMetricsDashboard;
