import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
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
  }
  property?: {
    name: string
    address: string
    city?: string
    state?: string
  }
}

export function JobEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState<Job | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_type: '',
    scheduled_date: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    estimated_duration: 0,
    status: 'draft' as
      | 'draft'
      | 'scheduled'
      | 'in_progress'
      | 'completed'
      | 'cancelled'
      | 'pending_review',
    priority: 'medium' as 'low' | 'medium' | 'high',
    quoted_amount: 0,
    actual_amount: 0,
    notes: '',
  })

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
          customer:customers(id, company_name, contact_first_name, contact_last_name),
          property:properties(id, name, address, city, state)
        `
        )
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError

      setJob(jobData)
      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        service_type: jobData.service_type || '',
        scheduled_date: jobData.scheduled_date || '',
        scheduled_start_time: jobData.scheduled_start_time || '',
        scheduled_end_time: jobData.scheduled_end_time || '',
        estimated_duration: jobData.estimated_duration || 0,
        status: jobData.status || 'draft',
        priority: jobData.priority || 'medium',
        quoted_amount: jobData.quoted_amount || 0,
        actual_amount: jobData.actual_amount || 0,
        notes: jobData.notes || '',
      })
    } catch (error) {
      console.error('Error fetching job:', error)
      alert('Error loading job details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          description: formData.description || null,
          service_type: formData.service_type || null,
          scheduled_date: formData.scheduled_date || null,
          scheduled_start_time: formData.scheduled_start_time || null,
          scheduled_end_time: formData.scheduled_end_time || null,
          estimated_duration: formData.estimated_duration || null,
          status: formData.status,
          priority: formData.priority,
          quoted_amount: formData.quoted_amount || null,
          actual_amount: formData.actual_amount || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      alert('Job updated successfully!')
      navigate(`/jobs/details/${id}`)
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Error updating job')
    } finally {
      setSaving(false)
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
            onClick={() => navigate(`/jobs/details/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Job Details
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
              <p className="text-gray-600 mt-1">Job #{job.job_number}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <SaveIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter service type"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter job description"
                />
              </div>
            </div>

            {/* Schedule Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_duration: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Status and Priority */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Status & Priority</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending_review">Pending Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Financial</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quoted Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quoted_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, quoted_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.actual_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, actual_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any additional notes or instructions"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
