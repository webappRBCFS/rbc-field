import React, { useState, useEffect } from 'react'
import { X, FileTextIcon, CalendarIcon, DollarSignIcon, MapPinIcon } from 'lucide-react'
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
  status: string
  start_date?: string
  end_date?: string
  customer?: {
    id: string
    company_name?: string
    contact_first_name?: string
    contact_last_name?: string
  }
  property?: {
    id: string
    name?: string
    address?: string
    city?: string
    state?: string
  }
}

interface ContractGenerationProps {
  onClose: () => void
}

export function ContractGeneration({ onClose }: ContractGenerationProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchActiveContracts()
  }, [])

  const fetchActiveContracts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contracts')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name),
          property:properties(id, name, address, city, state)
        `
        )
        .eq('status', 'active')
        .eq('is_recurring', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateJobFromContract = async () => {
    if (!selectedContract) return

    try {
      setGenerating(true)

      // Generate a single job from the contract
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          title: selectedContract.title,
          description: selectedContract.description,
          service_type: selectedContract.service_type,
          customer_id: selectedContract.customer?.id,
          property_id: selectedContract.property?.id,
          contract_id: selectedContract.id,
          scheduled_date: new Date().toISOString().split('T')[0],
          quoted_amount: selectedContract.total_amount,
          status: 'scheduled',
          priority: 'medium',
          notes: selectedContract.description,
          is_recurring: false, // Single job from contract
          recurrence_type: selectedContract.recurrence_type,
          recurrence_days: selectedContract.recurrence_days,
          dsny_integration: false, // Will be set based on contract if needed
          dsny_pickup_days: [],
          dsny_collection_types: [],
          interior_cleaning_schedule: [],
        })
        .select()
        .single()

      if (error) throw error

      alert('Job created successfully from contract!')
      onClose()
    } catch (error) {
      console.error('Error creating job from contract:', error)
      alert('Error creating job from contract')
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRecurrenceText = (contract: Contract) => {
    if (!contract.is_recurring) return 'One Time'

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const recurringDays = contract.recurrence_days?.map((day) => dayNames[day]).join(', ') || 'N/A'

    return `${contract.recurrence_type} (${recurringDays})`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Job from Contract</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select an active recurring contract to create a job
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contracts</h3>
              <p className="text-gray-500">
                No active recurring contracts found. Create a contract first.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedContract?.id === contract.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{contract.title}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {contract.contract_number}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>
                              {contract.customer?.company_name ||
                                `${contract.customer?.contact_first_name} ${contract.customer?.contact_last_name}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{contract.property?.address}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{getRecurrenceText(contract)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSignIcon className="w-4 h-4" />
                            <span>
                              {contract.total_amount
                                ? formatCurrency(contract.total_amount)
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {contract.description && (
                          <p className="text-sm text-gray-500 mt-2">{contract.description}</p>
                        )}
                      </div>

                      <div className="ml-4">
                        <input
                          type="radio"
                          name="contract"
                          checked={selectedContract?.id === contract.id}
                          onChange={() => setSelectedContract(contract)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedContract && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Selected Contract Details
                  </h4>
                  <div className="text-sm text-blue-700">
                    <p>
                      <strong>Contract:</strong> {selectedContract.title}
                    </p>
                    <p>
                      <strong>Customer:</strong>{' '}
                      {selectedContract.customer?.company_name ||
                        `${selectedContract.customer?.contact_first_name} ${selectedContract.customer?.contact_last_name}`}
                    </p>
                    <p>
                      <strong>Property:</strong> {selectedContract.property?.address}
                    </p>
                    <p>
                      <strong>Service:</strong> {selectedContract.service_type}
                    </p>
                    <p>
                      <strong>Amount:</strong>{' '}
                      {selectedContract.total_amount
                        ? formatCurrency(selectedContract.total_amount)
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Schedule:</strong> {getRecurrenceText(selectedContract)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateJobFromContract}
            disabled={!selectedContract || generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Creating Job...
              </>
            ) : (
              'Create Job'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
