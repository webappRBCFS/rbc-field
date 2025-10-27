import React, { useState, useEffect } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  EyeIcon,
  EditIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FilterIcon,
  RefreshCwIcon,
  NavigationIcon,
  BarChart3Icon,
  ListIcon,
  GridIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Job {
  id: string
  job_number: string
  title: string
  description?: string
  service_type?: string
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  estimated_duration?: number
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'pending_review'
  priority: 'low' | 'medium' | 'high'
  quoted_amount?: number
  actual_amount?: number
  customer_id: string
  property_id: string
  proposal_id?: string
  created_at: string
  updated_at: string
  // Joined data
  customer?: {
    company_name?: string
    contact_first_name: string
    contact_last_name: string
    phone?: string
  }
  property?: {
    name: string
    address: string
    city?: string
    state?: string
  }
  proposal?: {
    title: string
    proposal_number: string
  }
}

type ViewMode = 'schedule' | 'progress' | 'routing' | 'analytics'

export function DailyDispatch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('schedule')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
  }, [selectedDate])

  const fetchJobs = async () => {
    try {
      setLoading(true)

      // Get jobs for selected date with joined data
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name, phone),
          property:properties(id, name, address, city, state),
          proposal:proposals(id, title, proposal_number)
        `
        )
        .eq('scheduled_date', selectedDate)
        .order('scheduled_start_time', { ascending: true })

      if (jobsError) throw jobsError

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    return statusFilter === 'all' || job.status === statusFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending_review':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />
      case 'in_progress':
        return <PlayIcon className="w-4 h-4" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled':
        return <AlertTriangleIcon className="w-4 h-4" />
      case 'pending_review':
        return <PauseIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const renderScheduleView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                  job.priority
                )}`}
              >
                {job.priority}
              </span>
            </div>

            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">#{job.job_number}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>
                  {job.customer?.company_name ||
                    `${job.customer?.contact_first_name} ${job.customer?.contact_last_name}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span>{job.property?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {formatTime(job.scheduled_start_time || '')} -{' '}
                  {formatTime(job.scheduled_end_time || '')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {job.estimated_duration ? `${job.estimated_duration} min` : 'N/A'}
              </div>
              <div className="flex gap-2">
                <button className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors">
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                  <EditIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProgressView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">{getStatusIcon(job.status)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">#{job.job_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.replace('_', ' ')}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                    job.priority
                  )}`}
                >
                  {job.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>
                  {job.customer?.company_name ||
                    `${job.customer?.contact_first_name} ${job.customer?.contact_last_name}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span>{job.property?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {formatTime(job.scheduled_start_time || '')} -{' '}
                  {formatTime(job.scheduled_end_time || '')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Estimated Duration:{' '}
                {job.estimated_duration ? `${job.estimated_duration} minutes` : 'N/A'}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
                <button className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors">
                  <EyeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRoutingView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Route Optimization</h3>
          <button className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <NavigationIcon className="w-4 h-4" />
            Optimize Route
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job, index) => (
            <div key={job.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-gray-900">{job.title}</span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{job.property?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-3 h-3" />
                  <span>{formatTime(job.scheduled_start_time || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3 h-3" />
                  <span>
                    {job.customer?.company_name ||
                      `${job.customer?.contact_first_name} ${job.customer?.contact_last_name}`}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.replace('_', ' ')}
                </span>
                <button className="text-blue-600 hover:text-blue-900 text-sm">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAnalyticsView = () => {
    const totalJobs = jobs.length
    const completedJobs = jobs.filter((job) => job.status === 'completed').length
    const inProgressJobs = jobs.filter((job) => job.status === 'in_progress').length
    const scheduledJobs = jobs.filter((job) => job.status === 'scheduled').length
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <PlayIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Status Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Scheduled</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{scheduledJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{inProgressJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{completedJobs}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {filteredJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.property?.name}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'schedule':
        return renderScheduleView()
      case 'progress':
        return renderProgressView()
      case 'routing':
        return renderRoutingView()
      case 'analytics':
        return renderAnalyticsView()
      default:
        return renderScheduleView()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading dispatch data...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Dispatch</h1>
              <p className="mt-1 text-gray-600">Manage daily operations and job dispatch</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={fetchJobs}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Today's Schedule
            </button>
            <button
              onClick={() => setViewMode('progress')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PlayIcon className="w-4 h-4" />
              Job Progress
            </button>
            <button
              onClick={() => setViewMode('routing')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'routing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <NavigationIcon className="w-4 h-4" />
              Route Planning
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3Icon className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {renderCurrentView()}

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== 'all'
                ? 'No jobs found with the selected status filter.'
                : `No jobs are scheduled for ${new Date(selectedDate).toLocaleDateString()}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
