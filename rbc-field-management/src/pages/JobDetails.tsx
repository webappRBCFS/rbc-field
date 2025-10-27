import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  EditIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  DollarSignIcon,
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
    email?: string
    phone?: string
  }
  property?: {
    name: string
    address: string
    city?: string
    state?: string
    zip_code?: string
  }
  proposal?: {
    title: string
    proposal_number: string
  }
  contract?: {
    contract_number: string
    title: string
  }
}

export function JobDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchJob(id)
    }
  }, [id])

  const fetchJob = async (jobId: string) => {
    try {
      setLoading(true)

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name, email, phone),
          property:properties(id, name, address, city, state, zip_code),
          proposal:proposals(id, title, proposal_number),
          contract:contracts(id, contract_number, title)
        `
        )
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError

      setJob(jobData)
    } catch (error) {
      console.error('Error fetching job:', error)
      alert('Error loading job details')
    } finally {
      setLoading(false)
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading job details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
            <p className="text-gray-500 mb-6">The requested job could not be found.</p>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1">Job #{job.job_number}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/jobs/edit/${job.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <EditIcon className="w-4 h-4" />
                Edit Job
              </button>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        job.priority
                      )}`}
                    >
                      {job.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <p className="mt-1 text-sm text-gray-900">{job.service_type || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Duration</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {job.estimated_duration ? `${job.estimated_duration} hours` : 'N/A'}
                  </p>
                </div>
              </div>

              {job.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{job.description}</p>
                </div>
              )}
            </div>

            {/* Schedule Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                    <p className="text-sm text-gray-900">{formatDate(job.scheduled_date || '')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Time</label>
                    <p className="text-sm text-gray-900">
                      {formatTime(job.scheduled_start_time || '')} -{' '}
                      {formatTime(job.scheduled_end_time || '')}
                    </p>
                  </div>
                </div>
              </div>

              {job.is_recurring && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Recurring Schedule</h3>
                  <p className="text-sm text-blue-800">
                    Type: {job.recurrence_type || 'Custom'}
                    {job.recurrence_days && job.recurrence_days.length > 0 && (
                      <span> • Days: {job.recurrence_days.join(', ')}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {job.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.customer?.company_name ||
                        `${job.customer?.contact_first_name} ${job.customer?.contact_last_name}`}
                    </p>
                    {job.customer?.email && (
                      <p className="text-xs text-gray-500">{job.customer.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.property?.name}</p>
                    <p className="text-xs text-gray-500">{job.property?.address}</p>
                    {(job.property?.city || job.property?.state) && (
                      <p className="text-xs text-gray-500">
                        {job.property?.city}, {job.property?.state} {job.property?.zip_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DollarSignIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quoted Amount</label>
                    <p className="text-sm text-gray-900">
                      {job.quoted_amount ? `$${job.quoted_amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>

                {job.actual_amount && (
                  <div className="flex items-center gap-3">
                    <DollarSignIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Actual Amount</label>
                      <p className="text-sm text-gray-900">${job.actual_amount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Information */}
            {(job.proposal || job.contract) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Related</h2>

                <div className="space-y-3">
                  {job.proposal && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Proposal</label>
                      <p className="text-sm text-gray-900">{job.proposal.proposal_number}</p>
                    </div>
                  )}

                  {job.contract && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract</label>
                      <p className="text-sm text-gray-900">{job.contract.contract_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
