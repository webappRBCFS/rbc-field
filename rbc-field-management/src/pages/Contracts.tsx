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
  DollarSignIcon,
  CalendarDaysIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ContractScheduleModal } from '../components/ContractScheduleModal'

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
  notes?: string
  created_at: string
  updated_at: string
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
  proposal?: {
    id: string
    title?: string
    proposal_number?: string
  }
}

export function Contracts() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean
    contract: Contract | null
  }>({
    isOpen: false,
    contract: null,
  })

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true)

      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name),
          property:properties(id, name, address, city, state),
          proposal:proposals(id, title, proposal_number)
        `
        )
        .order('created_at', { ascending: false })

      if (contractsError) throw contractsError

      console.log('Contracts - Fetched contracts data:', contractsData)
      contractsData?.forEach((contract, index) => {
        console.log(`Contract ${index + 1}:`, {
          id: contract.id,
          title: contract.title,
          is_recurring: contract.is_recurring,
          recurrence_days: contract.recurrence_days,
          dsny_integration: contract.dsny_integration,
        })
      })

      setContracts(contractsData || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property?.address?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesType = typeFilter === 'all' || contract.contract_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

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
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'one_time':
        return 'bg-blue-100 text-blue-800'
      case 'recurring':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const generateJobsFromContract = async (contractId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_jobs_from_contract', {
        contract_uuid: contractId,
      })

      if (error) throw error

      alert(`Successfully generated ${data?.length || 0} jobs from contract`)
      // Refresh contracts to show updated status
      fetchContracts()
    } catch (error) {
      console.error('Error generating jobs from contract:', error)
      alert('Error generating jobs from contract')
    }
  }

  const viewContract = (contractId: string) => {
    console.log('Viewing contract:', contractId)
    // Navigate to contract details page
    navigate(`/contracts/details/${contractId}`)
  }

  const editContract = (contractId: string) => {
    console.log('Editing contract:', contractId)
    // Navigate to contract edit page
    navigate(`/contracts/edit/${contractId}`)
  }

  const viewSchedule = (contract: Contract) => {
    console.log('Viewing schedule for contract:', contract.id)
    // Open schedule modal
    setScheduleModal({
      isOpen: true,
      contract: contract,
    })
  }

  const closeScheduleModal = () => {
    setScheduleModal({
      isOpen: false,
      contract: null,
    })
  }

  const formatSchedule = (contract: Contract) => {
    if (!contract.is_recurring) {
      return <span className="text-gray-500">One-time</span>
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

    return (
      <div className="text-sm">
        <div className="text-gray-900">{scheduleText}</div>
        {contract.dsny_integration && <div className="text-xs text-blue-600">DSNY Integrated</div>}
      </div>
    )
  }

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    recurring: contracts.filter((c) => c.contract_type === 'recurring').length,
    totalValue: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600">Manage service contracts and recurring agreements</p>
        </div>
        <button
          onClick={() => navigate('/contracts/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create Contract
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recurring</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recurring}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSignIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="one_time">One Time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <FileTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new contract.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                        <div className="text-sm text-gray-500">#{contract.contract_number}</div>
                        {contract.proposal && (
                          <div className="text-xs text-gray-400">
                            From: {contract.proposal.proposal_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.customer?.company_name ||
                          `${contract.customer?.contact_first_name} ${contract.customer?.contact_last_name}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{contract.property?.name}</div>
                        <div className="text-sm text-gray-500">{contract.property?.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                          contract.contract_type
                        )}`}
                      >
                        {contract.contract_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.total_amount ? formatCurrency(contract.total_amount) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {contract.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          Start: {formatDate(contract.start_date || '')}
                        </div>
                        <div className="text-sm text-gray-500">
                          End: {formatDate(contract.end_date || '')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewContract(contract.id)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Contract"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editContract(contract.id)}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                          title="Edit Contract"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        {contract.is_recurring && (
                          <button
                            onClick={() => viewSchedule(contract)}
                            className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors"
                            title="View Schedule"
                          >
                            <CalendarDaysIcon className="w-4 h-4" />
                          </button>
                        )}
                        {contract.is_recurring && contract.status === 'active' && (
                          <button
                            onClick={() => generateJobsFromContract(contract.id)}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                            title="Generate Jobs"
                          >
                            <PlayIcon className="w-4 h-4" />
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
        )}
      </div>

      {/* Contract Schedule Modal */}
      {scheduleModal.contract && (
        <ContractScheduleModal
          isOpen={scheduleModal.isOpen}
          onClose={closeScheduleModal}
          contract={scheduleModal.contract}
        />
      )}
    </div>
  )
}
