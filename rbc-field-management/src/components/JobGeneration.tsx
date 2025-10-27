import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  DollarSignIcon,
  AlertCircleIcon,
  PlayIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Proposal {
  id: string
  proposal_number: string
  title: string
  status: string
  total_amount: number
  customer_id: string
  property_id: string
  service_category_id?: string
  billing_frequency?: string
  service_frequency?: string
  contract_start_date?: string
  contract_end_date?: string
  visits_per_week?: number
  visits_per_month?: number
  custom_schedule_notes?: string
  visit_duration_hours?: number
  created_at: string
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
  service_category?: {
    name: string
  }
}

interface JobGenerationForm {
  proposal_id: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  estimated_duration: number
  priority: 'low' | 'medium' | 'high'
  notes: string
}

interface JobGenerationProps {
  onClose: () => void
}

export function JobGeneration({ onClose }: JobGenerationProps) {
  console.log('JobGeneration component rendered')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [showGenerationForm, setShowGenerationForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState<JobGenerationForm>({
    proposal_id: '',
    scheduled_date: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    estimated_duration: 0,
    priority: 'medium',
    notes: '',
  })

  useEffect(() => {
    fetchApprovedProposals()
  }, [])

  const fetchApprovedProposals = async () => {
    try {
      setLoading(true)
      console.log('Fetching approved proposals...')

      // First, let's test a simple query to see if proposals exist
      const { data: simpleProposals, error: simpleError } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'approved')

      console.log('Simple proposals query result:', simpleProposals)
      console.log('Simple proposals query error:', simpleError)

      if (simpleError) {
        console.error('Simple proposals query error:', simpleError)
        throw simpleError
      }

      // If we have proposals, try the complex query with joins
      if (simpleProposals && simpleProposals.length > 0) {
        console.log('Found proposals, trying complex query...')

        const { data: proposalsData, error: proposalsError } = await supabase
          .from('proposals')
          .select(
            `
            *,
            customer:customers(id, company_name, contact_first_name, contact_last_name),
            property:properties(id, name, address, city, state),
            service_category:service_categories(id, name)
          `
          )
          .eq('status', 'approved')
          .order('created_at', { ascending: false })

        if (proposalsError) {
          console.error('Complex proposals query error:', proposalsError)
          // Fall back to simple data
          console.log('Falling back to simple data...')
          setProposals(simpleProposals)
        } else {
          console.log('Complex query successful:', proposalsData)
          setProposals(proposalsData || [])
        }
      } else {
        console.log('No approved proposals found')
        setProposals([])
      }
    } catch (error) {
      console.error('Error fetching approved proposals:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to fetch approved proposals: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateJob = async () => {
    if (!selectedProposal) {
      console.log('No proposal selected')
      return
    }

    try {
      setGenerating(true)
      console.log('Generating job from proposal:', selectedProposal)
      console.log('Form data:', formData)

      // Generate job number
      const jobNumber = await generateJobNumber()
      console.log('Generated job number:', jobNumber)

      // Create job from proposal
      const jobInsertData = {
        job_number: jobNumber,
        title: selectedProposal.title,
        description: `Generated from proposal ${selectedProposal.proposal_number}`,
        service_type: selectedProposal.service_category?.name,
        scheduled_date: formData.scheduled_date,
        scheduled_start_time: formData.scheduled_start_time,
        scheduled_end_time: formData.scheduled_end_time,
        estimated_duration: formData.estimated_duration,
        status: 'scheduled',
        priority: formData.priority,
        quoted_amount: selectedProposal.total_amount,
        customer_id: selectedProposal.customer_id,
        property_id: selectedProposal.property_id,
        proposal_id: selectedProposal.id,
        notes: formData.notes,
      }

      console.log('Job insert data:', jobInsertData)

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert(jobInsertData)
        .select()
        .single()

      if (jobError) {
        console.error('Job insert error:', jobError)
        throw jobError
      }

      console.log('Job created successfully:', jobData)

      // Update proposal status to 'job_created' (if the enum has been updated)
      try {
        const { error: updateError } = await supabase
          .from('proposals')
          .update({ status: 'job_created' })
          .eq('id', selectedProposal.id)

        if (updateError) {
          console.warn('Could not update proposal status to job_created:', updateError)
          console.log('This is expected if the proposal_status enum has not been updated yet')
        } else {
          console.log('Proposal status updated to job_created')
        }
      } catch (error) {
        console.warn('Error updating proposal status:', error)
      }

      alert('Job created successfully!')

      // Reset form and refresh data
      setShowGenerationForm(false)
      setSelectedProposal(null)
      setFormData({
        proposal_id: '',
        scheduled_date: '',
        scheduled_start_time: '',
        scheduled_end_time: '',
        estimated_duration: 0,
        priority: 'medium',
        notes: '',
      })

      await fetchApprovedProposals()
    } catch (error) {
      console.error('Error generating job:', error)
      alert('Failed to create job. Please check the console for details.')
    } finally {
      setGenerating(false)
    }
  }

  const generateJobNumber = async (): Promise<string> => {
    try {
      // Get the latest job number
      const { data: latestJob, error } = await supabase
        .from('jobs')
        .select('job_number')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNumber = 1
      if (latestJob && latestJob.length > 0) {
        const lastNumber = parseInt(latestJob[0].job_number.replace('JOB-', ''))
        nextNumber = lastNumber + 1
      }

      return `JOB-${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating job number:', error)
      return `JOB-${Date.now()}`
    }
  }

  const handleSelectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setFormData({
      proposal_id: proposal.id,
      scheduled_date: '',
      scheduled_start_time: '',
      scheduled_end_time: '',
      estimated_duration: proposal.visit_duration_hours ? proposal.visit_duration_hours * 60 : 120, // Convert hours to minutes
      priority: 'medium',
      notes: '',
    })
    setShowGenerationForm(true)
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime || !duration) return ''

    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(start.getTime() + duration * 60000) // Add duration in minutes

    return end.toTimeString().slice(0, 5)
  }

  const handleDurationChange = (duration: number) => {
    setFormData((prev) => ({
      ...prev,
      estimated_duration: duration,
      scheduled_end_time: prev.scheduled_start_time
        ? calculateEndTime(prev.scheduled_start_time, duration)
        : '',
    }))
  }

  const handleStartTimeChange = (startTime: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduled_start_time: startTime,
      scheduled_end_time: calculateEndTime(startTime, prev.estimated_duration),
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading approved proposals...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Job Generation</h1>
              <p className="mt-1 text-gray-600">Convert approved proposals into scheduled jobs</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>{proposals.length} approved proposals ready for job creation</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSignIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${proposals.reduce((sum, p) => sum + p.total_amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready to Schedule</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Approved Proposals</h2>
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No approved proposals</h3>
              <p className="mt-1 text-sm text-gray-500">
                Approved proposals will appear here and can be converted to jobs.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                        <span className="text-sm text-gray-500">#{proposal.proposal_number}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span>
                            {proposal.customer?.company_name ||
                              `${proposal.customer?.contact_first_name} ${proposal.customer?.contact_last_name}` ||
                              'Customer ID: ' + proposal.customer_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span>
                            {proposal.property?.name || 'Property ID: ' + proposal.property_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSignIcon className="w-4 h-4" />
                          <span>${proposal.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {proposal.service_category && (
                        <div className="mt-2 text-sm text-gray-500">
                          Service: {proposal.service_category.name}
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <button
                        onClick={() => handleSelectProposal(proposal)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Generate Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Generation Modal */}
        {showGenerationForm && selectedProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Generate Job from Proposal</h3>
                <button
                  onClick={() => setShowGenerationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Proposal Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">{selectedProposal.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Proposal: #{selectedProposal.proposal_number}</div>
                  <div>Amount: ${selectedProposal.total_amount.toLocaleString()}</div>
                  <div>
                    Customer:{' '}
                    {selectedProposal.customer?.company_name ||
                      `${selectedProposal.customer?.contact_first_name} ${selectedProposal.customer?.contact_last_name}` ||
                      'Customer ID: ' + selectedProposal.customer_id}
                  </div>
                  <div>
                    Property:{' '}
                    {selectedProposal.property?.name ||
                      'Property ID: ' + selectedProposal.property_id}
                  </div>
                </div>
              </div>

              {/* Job Details Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.scheduled_start_time}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.scheduled_end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduled_end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min="30"
                      step="30"
                      value={formData.estimated_duration}
                      onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes for the job..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Generate Job button clicked!')
                      alert('Generate Job button clicked!')
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Generate Job
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerationForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
