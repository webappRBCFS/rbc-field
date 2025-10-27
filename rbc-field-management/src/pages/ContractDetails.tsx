import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import {
  ArrowLeftIcon,
  EditIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  DollarSignIcon,
  FileTextIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

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

  useEffect(() => {
    if (id) {
      fetchContract(id)
    }
  }, [id])

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
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Error loading contract details')
    } finally {
      setLoading(false)
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

        {/* Contract Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h2>

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
                  <p className="mt-1 text-sm text-gray-900">{contract.service_type || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Billing Frequency</label>
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

                  {/* Detailed Schedule View */}
                  {(contract.dsny_integration ||
                    (contract.garbage_schedule && contract.garbage_schedule.length > 0) ||
                    (contract.recycling_schedule && contract.recycling_schedule.length > 0) ||
                    (contract.organics_schedule && contract.organics_schedule.length > 0) ||
                    (contract.bulk_schedule && contract.bulk_schedule.length > 0) ||
                    (contract.interior_cleaning_schedule &&
                      contract.interior_cleaning_schedule.length > 0) ||
                    (contract.manual_schedules && contract.manual_schedules.length > 0)) && (
                    <div className="mt-4">
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
                </div>
              </div>
            )}

            {/* Contract Terms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="mt-1 text-sm text-gray-900">{formatDate(contract.signed_date)}</p>
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

            {/* Notes */}
            {contract.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{contract.notes}</p>
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
                      {contract.customer?.company_name ||
                        `${contract.customer?.contact_first_name} ${contract.customer?.contact_last_name}`}
                    </p>
                    {contract.customer?.email && (
                      <p className="text-xs text-gray-500">{contract.customer.email}</p>
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
                    <p className="text-sm font-medium text-gray-900">{contract.property?.name}</p>
                    <p className="text-xs text-gray-500">{contract.property?.address}</p>
                    {(contract.property?.city || contract.property?.state) && (
                      <p className="text-xs text-gray-500">
                        {contract.property?.city}, {contract.property?.state}{' '}
                        {contract.property?.zip_code}
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
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-sm text-gray-900">
                      {contract.total_amount ? `$${contract.total_amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
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
                      <p className="text-sm text-gray-900">{contract.proposal.proposal_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
