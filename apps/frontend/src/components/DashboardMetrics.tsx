import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react'
import { Card } from './UI/Card'

interface DashboardMetricsProps {
  data?: any
  isLoading?: boolean
}

// Memoized Stat Card component
const StatCard = React.memo(({ icon: Icon, label, value, trend, color }: any) => (
  <Card variant="default" className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
))

StatCard.displayName = 'StatCard'

// Memoized analytics chart
const AnalyticsChart = React.memo(({ data: chartData, title }: any) => (
  <Card variant="default" className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1f3a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#8b5cf6" dot={false} strokeWidth={2} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </Card>
))

AnalyticsChart.displayName = 'AnalyticsChart'

// Memoized distribution chart
const DistributionChart = React.memo(({ chartData, title }: any) => (
  <Card variant="default" className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          isAnimationActive={false}
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </Card>
))

DistributionChart.displayName = 'DistributionChart'

export default function DashboardMetrics({ isLoading }: DashboardMetricsProps) {
  const analyticsData = useMemo(() => [
    { name: 'Week 1', value: 45 },
    { name: 'Week 2', value: 52 },
    { name: 'Week 3', value: 48 },
    { name: 'Week 4', value: 61 },
    { name: 'Week 5', value: 55 },
  ], [])

  const distributionData = useMemo(() => [
    { name: 'Criminal', value: 35, color: '#ef4444' },
    { name: 'Interview', value: 45, color: '#3b82f6' },
    { name: 'Business', value: 20, color: '#10b981' },
  ], [])

  if (isLoading) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Key Metrics */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {[
          {
            icon: CheckCircle2,
            label: 'Total Analyses',
            value: '156',
            trend: 12,
            color: 'from-emerald-600 to-teal-600',
          },
          {
            icon: Users,
            label: 'Active Sessions',
            value: '24',
            trend: 8,
            color: 'from-blue-600 to-cyan-600',
          },
          {
            icon: TrendingUp,
            label: 'Accuracy Rate',
            value: '94.2%',
            trend: 2.3,
            color: 'from-purple-600 to-indigo-600',
          },
          {
            icon: Clock,
            label: 'Avg Processing',
            value: '2.3s',
            trend: -5,
            color: 'from-orange-600 to-red-600',
          },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <StatCard {...item} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        className="grid lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <AnalyticsChart data={analyticsData} title="Analysis Trends" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <DistributionChart chartData={distributionData} title="Analysis Distribution" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
