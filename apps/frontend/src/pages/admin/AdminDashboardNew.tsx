import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Settings, Users, Zap, Database, TrendingUp, LogOut, Shield, Eye } from 'lucide-react'
import { Button } from '../../components/UI/Button'
import { Card } from '../../components/UI/Card'
import DashboardMetrics from '../../components/DashboardMetrics'

const systemMetrics = [
  { time: '00:00', cpu: 45, memory: 38, disk: 32 },
  { time: '04:00', cpu: 52, memory: 42, disk: 35 },
  { time: '08:00', cpu: 48, memory: 40, disk: 33 },
  { time: '12:00', cpu: 60, memory: 48, disk: 40 },
  { time: '16:00', cpu: 55, memory: 45, disk: 38 },
  { time: '20:00', cpu: 50, memory: 43, disk: 36 },
]

const recentActivities = [
  { id: 1, user: 'John Doe', action: 'Criminal Analysis', time: '2 hours ago', status: 'completed' },
  { id: 2, user: 'Jane Smith', action: 'Interview Analysis', time: '1 hour ago', status: 'completed' },
  { id: 3, user: 'Admin User', action: 'System Backup', time: '30 minutes ago', status: 'in-progress' },
  { id: 4, user: 'Mike Johnson', action: 'Business Analysis', time: '15 minutes ago', status: 'completed' },
]

export default function AdminDashboardNew() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')

  const handleMaintenanceToggle = useCallback(() => {
    setMaintenanceMode(!maintenanceMode)
  }, [maintenanceMode])

  const quickActions = useMemo(() => [
    { label: 'Export Users', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Generate Report', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { label: 'View Logs', icon: LogOut, color: 'from-orange-500 to-red-500' },
    { label: 'Backup System', icon: Database, color: 'from-emerald-500 to-teal-500' },
  ], [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">System overview and management</p>
        </div>
        <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400" />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <motion.div key={action.label} variants={itemVariants}>
              <Card
                variant="default"
                className="p-4 cursor-pointer hover:shadow-lg transition-all"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{action.label}</p>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* System Health & Maintenance */}
      <motion.div
        className="grid lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* System Status */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
            
            <div className="space-y-3">
              {[
                { label: 'API Server', status: 'healthy' },
                { label: 'Database', status: 'healthy' },
                { label: 'Cache Layer', status: 'healthy' },
                { label: 'Message Queue', status: 'warning' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'healthy'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Maintenance Mode */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable maintenance mode to perform system updates without affecting users.
              </p>

              <Button
                variant={maintenanceMode ? 'danger' : 'secondary'}
                fullWidth
                onClick={handleMaintenanceToggle}
              >
                {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
              </Button>

              {maintenanceMode && (
                <motion.div
                  className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    ⚠️ Maintenance mode is currently active. Users cannot access the system.
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* System Resources */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            
            <div className="space-y-4">
              {[
                { label: 'CPU Usage', value: 45, max: 100 },
                { label: 'Memory Usage', value: 62, max: 100 },
                { label: 'Disk Usage', value: 73, max: 100 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        item.value > 80
                          ? 'bg-red-500'
                          : item.value > 60
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* System Performance Chart */}
      <motion.div variants={itemVariants}>
        <Card variant="elevated" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Performance (24h)</h3>
            <div className="flex gap-2">
              {['24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={systemMetrics} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f3a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} isAnimationActive={false} />
              <Area type="monotone" dataKey="memory" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Recent Activities */}
      <motion.div variants={itemVariants}>
        <Card variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activities</h3>
          
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{activity.user}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{activity.time}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {activity.status === 'completed' ? '✓ Completed' : '⟳ In Progress'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Metrics Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>
        <DashboardMetrics />
      </motion.div>
    </motion.div>
  )
}
