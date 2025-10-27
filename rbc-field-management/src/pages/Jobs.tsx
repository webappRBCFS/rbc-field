import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  FilterIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PlayIcon,
  PauseIcon,
  MoreHorizontalIcon,
  FileTextIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import UpcomingJobsModal from '../components/UpcomingJobsModal'

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
  contract_id?: string
  is_recurring?: boolean
  recurrence_type?: string
  recurrence_days?: number[]
  notes?: string
  created_at: string
  updated_at: string
  // Joined data
  customer?: {
    company_name?: string
    contact_first_name: string
    contact_last_name: string
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

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [upcomingJobsModal, setUpcomingJobsModal] = useState<{
    isOpen: boolean
    jobId: string
    jobData: Job | null
  }>({
    isOpen: false,
    jobId: '',
    jobData: null,
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)

      // Get jobs with joined customer, property, and proposal data
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name),
          property:properties(id, name, address, city, state),
          proposal:proposals(id, title, proposal_number)
        `
        )
        .order('scheduled_date', { ascending: true })

      if (jobsError) throw jobsError

      setJobs(jobsData || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const openUpcomingJobsModal = (job: Job) => {
    setUpcomingJobsModal({
      isOpen: true,
      jobId: job.id,
      jobData: job,
    })
  }

  const closeUpcomingJobsModal = () => {
    setUpcomingJobsModal({
      isOpen: false,
      jobId: '',
      jobData: null,
    })
  }

  const viewJob = (jobId: string) => {
    console.log('Viewing job:', jobId)
    // Navigate to job details page
    window.location.href = `/jobs/details/${jobId}`
  }

  const editJob = (jobId: string) => {
    console.log('Editing job:', jobId)
    // Navigate to job edit page
    window.location.href = `/jobs/edit/${jobId}`
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.property?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
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

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading jobs...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
              <p className="mt-1 text-gray-600">Manage and schedule field service jobs</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Navigate to job creation page
                  window.location.href = '/jobs/create'
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Job
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter((job) => job.status === 'scheduled').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter((job) => job.status === 'in_progress').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter((job) => job.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter((job) => job.status === 'pending_review').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending_review">Pending Review</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">#{job.job_number}</div>
                        {job.proposal && (
                          <div className="text-xs text-gray-400">
                            From: {job.proposal.proposal_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.customer?.company_name ||
                          `${job.customer?.contact_first_name} ${job.customer?.contact_last_name}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{job.property?.name}</div>
                        <div className="text-sm text-gray-500">{job.property?.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatDate(job.scheduled_date || '')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(job.scheduled_start_time || '')} -{' '}
                          {formatTime(job.scheduled_end_time || '')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          job.priority
                        )}`}
                      >
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.quoted_amount ? `$${job.quoted_amount.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewJob(job.id)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Job"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editJob(job.id)}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                          title="Edit Job"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        {job.is_recurring && (
                          <button
                            onClick={() => openUpcomingJobsModal(job)}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                            title="View Upcoming Jobs"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new job.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Jobs Modal */}
      <UpcomingJobsModal
        isOpen={upcomingJobsModal.isOpen}
        onClose={closeUpcomingJobsModal}
        jobId={upcomingJobsModal.jobId}
        jobData={upcomingJobsModal.jobData}
      />
    </div>
  )
}
