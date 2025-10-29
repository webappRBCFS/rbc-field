import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import {
  ArrowLeftIcon,
  EditIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  ChevronDownIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity, getEntityActivities, ActivityLog } from '../utils/activityLogger'

interface Contract {
  id: string
  contract_number: string
  title: string
  description?: string
  contract_type: 'one_time' | 'recurring'
  service_type?: string
  total_amount?: number
  billing_frequency?: string
  is_recurring: boolean
  recurrence_type?: string
  recurrence_days?: number[]
  dsny_integration?: boolean
  dsny_pickup_days?: string[]
  dsny_collection_types?: string[]
  interior_cleaning_schedule?: string[]
  // Comprehensive schedule system
  master_weekly_schedule?: number[]
  garbage_schedule?: number[]
  recycling_schedule?: number[]
  organics_schedule?: number[]
  bulk_schedule?: number[]
  // Dynamic manual schedules
  manual_schedules?: Array<{
    id: string
    name: string
    description: string
    color: string
    days: number[]
  }>
  status:
    | 'draft'
    | 'pending_signature'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | 'expired'
  start_date?: string
  end_date?: string
  signed_date?: string
  payment_terms?: string
  late_fee_percentage?: number
  cancellation_terms?: string
  notes?: string
  created_at: string
  updated_at: string
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
}

export function ContractDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [contractServices, setContractServices] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<any[]>([])
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'billing' | 'notes'>(
    'overview'
  )
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (id) {
      fetchContract(id)
      fetchContractServices(id)
      fetchContractLineItems(id)
      fetchActivities()
    }
  }, [id])

  const fetchActivities = async () => {
    if (!id) return
    try {
      const acts = await getEntityActivities('contract', id)
      setActivities(acts)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchContract = async (contractId: string) => {
    try {
      setLoading(true)

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name, email, phone),
          property:properties(id, name, address, city, state, zip_code),
          proposal:proposals(id, title, proposal_number)
        `
        )
        .eq('id', contractId)
        .single()

      if (contractError) throw contractError

      console.log('ContractDetails - Fetched contract data:', contractData)
      console.log('ContractDetails - Is recurring:', contractData.is_recurring)
      console.log('ContractDetails - Recurrence days:', contractData.recurrence_days)
      console.log('ContractDetails - DSNY integration:', contractData.dsny_integration)

      setContract(contractData)
      setNotesValue(contractData.notes || '')
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Error loading contract details')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!id) return

    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ notes: notesValue || null })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setContract((prev) => (prev ? { ...prev, notes: notesValue || undefined } : null))

      // Log activity
      await logActivity({
        activity_type: 'updated',
        entity_type: 'contract',
        entity_id: id,
        description: 'Contract notes were updated',
        metadata: { field: 'notes' },
      })

      setIsEditingNotes(false)
      alert('Notes saved successfully!')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Error saving notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleCancelEditNotes = () => {
    setNotesValue(contract?.notes || '')
    setIsEditingNotes(false)
  }

  const fetchContractServices = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_services')
        .select('*')
        .eq('contract_id', contractId)

      if (error) throw error
      console.log('Fetched contract services:', data)
      if (data && data.length > 0) {
        console.log('First service full data:', data[0])
        console.log('First service DSNY integration:', data[0]?.dsny_integration)
        console.log('First service garbage schedule:', data[0]?.garbage_schedule)
        console.log('First service recycling schedule:', data[0]?.recycling_schedule)
      }
      setContractServices(data || [])
    } catch (error) {
      console.error('Error fetching contract services:', error)
    }
  }

  const fetchContractLineItems = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_line_items')
        .select(
          `
          *,
          service_item:service_items(id, name)
        `
        )
        .eq('contract_id', contractId)
        .order('sort_order', { ascending: true })

      if (error) {
        // Table might not exist yet, that's okay
        console.warn('Error fetching contract line items (table may not exist):', error)
        return
      }

      console.log('Fetched contract line items:', data)
      setLineItems(data || [])
    } catch (error) {
      console.error('Error fetching contract line items:', error)
    }
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
      case 'pending_signature':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSchedule = (contract: Contract) => {
    if (!contract.is_recurring) {
      return 'One-time contract'
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const recurringDays = contract.recurrence_days || []
    const daysText = recurringDays.map((day) => dayNames[day]).join(', ')

    let scheduleText = `${contract.recurrence_type || 'Custom'}`
    if (daysText) {
      scheduleText += ` (${daysText})`
    }

    // Add DSNY info if available
    if (contract.dsny_integration && contract.dsny_collection_types?.length) {
      const dsnyTypes = contract.dsny_collection_types.join(', ')
      scheduleText += ` + DSNY (${dsnyTypes})`
    }

    return scheduleText
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading contract details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contract not found</h3>
            <p className="text-gray-500 mb-6">The requested contract could not be found.</p>
            <button
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Contracts
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
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Contracts
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
              <p className="text-gray-600 mt-1">Contract #{contract.contract_number}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/contracts/edit/${contract.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <EditIcon className="w-4 h-4" />
                Edit Contract
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Services & Schedule
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'billing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Billing & Financials
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Notes
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contract Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Contract Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              contract.status
                            )}`}
                          >
                            {contract.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Contract Type</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {contract.contract_type === 'recurring' ? 'Recurring' : 'One-time'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Service Type</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {contract.service_type || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Billing Frequency
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {contract.billing_frequency || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {contract.description && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{contract.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Customer & Property Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Customer & Property
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {contract.customer?.company_name ||
                            `${contract.customer?.contact_first_name} ${contract.customer?.contact_last_name}`}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Property</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {contract.property?.name || contract.property?.address || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Financial Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                        <p className="text-sm text-gray-900">
                          {contract.total_amount
                            ? `$${contract.total_amount.toLocaleString()}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Billing Frequency
                        </label>
                        <p className="text-sm text-gray-900">
                          {contract.billing_frequency || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Related Information */}
                  {contract.proposal && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Related</h2>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FileTextIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Proposal</label>
                            <p className="text-sm text-gray-900">
                              {contract.proposal.proposal_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Services & Schedule Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Contract Type */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Type</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {contract.contract_type === 'recurring' ? 'Recurring' : 'One Time'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
                <div className="space-y-4">
                  {contractServices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No individual services found.</p>
                      <p className="text-sm text-gray-400">
                        {contract.service_type
                          ? `Contract service type: ${contract.service_type}`
                          : 'This contract may use legacy schedule structure.'}
                      </p>
                    </div>
                  ) : (
                    contractServices.map((service) => {
                      const isExpanded = expandedServices.has(service.id)
                      return (
                        <div
                          key={service.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Collapsed Header */}
                          <button
                            type="button"
                            onClick={() => {
                              const newExpanded = new Set(expandedServices)
                              if (isExpanded) {
                                newExpanded.delete(service.id)
                              } else {
                                newExpanded.add(service.id)
                              }
                              setExpandedServices(newExpanded)
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-gray-900">{service.service_name}</h3>
                              <p className="text-sm text-gray-600">
                                ${service.amount?.toFixed(2) || '0.00'}
                              </p>
                              {service.dsny_integration && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  DSNY
                                </span>
                              )}
                            </div>
                            <ChevronDownIcon
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-gray-200">
                              {/* Service Schedule */}
                              {(service.dsny_integration ||
                                (service.garbage_schedule && service.garbage_schedule.length > 0) ||
                                (service.recycling_schedule &&
                                  service.recycling_schedule.length > 0) ||
                                (service.organics_schedule &&
                                  service.organics_schedule.length > 0) ||
                                (service.bulk_schedule && service.bulk_schedule.length > 0) ||
                                (service.interior_cleaning_schedule &&
                                  service.interior_cleaning_schedule.length > 0) ||
                                (service.recurrence_days &&
                                  service.recurrence_days.length > 0)) && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Schedule
                                  </h4>
                                  <ScheduleView
                                    garbageSchedule={service.garbage_schedule || []}
                                    recyclingSchedule={service.recycling_schedule || []}
                                    organicsSchedule={service.organics_schedule || []}
                                    bulkSchedule={service.bulk_schedule || []}
                                    interiorCleaningSchedule={(
                                      service.interior_cleaning_schedule || []
                                    ).map((day: string) => parseInt(day))}
                                    masterWeeklySchedule={service.recurrence_days || []}
                                    manualSchedules={[]}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Fallback: Show contract-level schedule if no services found and contract has schedule data */}
              {contractServices.length === 0 &&
                (contract.dsny_integration ||
                  (contract.garbage_schedule && contract.garbage_schedule.length > 0) ||
                  (contract.recycling_schedule && contract.recycling_schedule.length > 0) ||
                  (contract.organics_schedule && contract.organics_schedule.length > 0) ||
                  (contract.bulk_schedule && contract.bulk_schedule.length > 0) ||
                  (contract.interior_cleaning_schedule &&
                    contract.interior_cleaning_schedule.length > 0) ||
                  (contract.manual_schedules && contract.manual_schedules.length > 0) ||
                  (contract.master_weekly_schedule &&
                    contract.master_weekly_schedule.length > 0)) && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Schedule</h2>
                    <ScheduleView
                      garbageSchedule={contract.garbage_schedule || []}
                      recyclingSchedule={contract.recycling_schedule || []}
                      organicsSchedule={contract.organics_schedule || []}
                      bulkSchedule={contract.bulk_schedule || []}
                      interiorCleaningSchedule={(contract.interior_cleaning_schedule || []).map(
                        (day) => parseInt(day)
                      )}
                      masterWeeklySchedule={contract.master_weekly_schedule || []}
                      manualSchedules={contract.manual_schedules || []}
                    />
                  </div>
                )}

              {/* Schedule Information */}
              {contract.is_recurring && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Recurrence</label>
                        <p className="text-sm text-gray-900">{formatSchedule(contract)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contract Period</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(contract.start_date || '')} -{' '}
                          {formatDate(contract.end_date || '')}
                        </p>
                      </div>
                    </div>

                    {contract.dsny_integration && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">DSNY Integration</h3>
                        <div className="text-sm text-blue-800">
                          <p>
                            <strong>Collection Types:</strong>{' '}
                            {contract.dsny_collection_types?.join(', ') || 'None selected'}
                          </p>
                          {contract.interior_cleaning_schedule &&
                            contract.interior_cleaning_schedule.length > 0 && (
                              <p>
                                <strong>Interior Cleaning:</strong>{' '}
                                {contract.interior_cleaning_schedule.join(', ')}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Schedule Preview */}
                    {contract.recurrence_days && contract.recurrence_days.length > 0 && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Weekly Schedule</h3>
                        <div className="flex flex-wrap gap-2">
                          {contract.recurrence_days.map((day) => {
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                            return (
                              <span
                                key={day}
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {dayNames[day]}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Billing & Financials Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {contract.total_amount ? `$${contract.total_amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Billing Frequency</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {contract.billing_frequency || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.payment_terms || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Late Fee</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {contract.late_fee_percentage ? `${contract.late_fee_percentage}%` : 'N/A'}
                    </p>
                  </div>

                  {contract.signed_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Signed Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(contract.signed_date)}
                      </p>
                    </div>
                  )}
                </div>

                {contract.cancellation_terms && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Cancellation Terms</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.cancellation_terms}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Period</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(contract.start_date || '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-sm text-gray-900">{formatDate(contract.end_date || '')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {lineItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Type
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex flex-col gap-1">
                                <span>{item.description}</span>
                                {item.service_item && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    From Catalog: {item.service_item.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.unit_type
                                ? item.unit_type
                                    .split('_')
                                    .map(
                                      (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
                                    )
                                    .join(' ')
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              ${item.unit_price?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              ${item.total_price?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                          >
                            Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            $
                            {lineItems
                              .reduce((sum, item) => sum + (item.total_price || 0), 0)
                              .toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Notes Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Contract Notes</h2>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                      Edit Notes
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-4">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notes and additional information..."
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <SaveIcon className="w-4 h-4" />
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                      <button
                        onClick={handleCancelEditNotes}
                        disabled={savingNotes}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                      >
                        <XIcon className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : contract.notes ? (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{contract.notes}</p>
                ) : (
                  <p className="text-center text-gray-500 py-8">No notes available</p>
                )}
              </div>

              {/* Activity Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity</h2>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No recent activity</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
