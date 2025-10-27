import React, { useState, useEffect } from 'react'
import { ProposalBuilder } from '../components/ProposalBuilder'
import { ProposalRequestForm } from '../components/ProposalRequestForm'
import { ProposalRequestsList } from '../components/ProposalRequestsList'
import {
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  SendIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
  DollarSignIcon,
  CalendarIcon,
  UserIcon,
  TrashIcon,
  FileIcon,
  ClipboardListIcon,
  LinkIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { convertLeadToCustomer } from '../lib/leadConversion'

interface Proposal {
  id: string
  lead_id?: string
  customer_id?: string
  property_id?: string
  template_id?: string
  proposal_number: string
  title: string
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
  total_amount: number
  valid_until?: string
  notes?: string
  terms_conditions?: string
  created_by?: string
  sent_at?: string
  viewed_at?: string
  approved_at?: string
  rejected_at?: string
  created_at: string
  updated_at: string
  // Joined data
  lead?: {
    company_name?: string
    contact_first_name: string
    contact_last_name: string
    email?: string
  }
  customer?: {
    id: string
    company_name?: string
    contact_first_name: string
    contact_last_name: string
    email?: string
  }
  property?: {
    id: string
    name: string
    address: string
    city?: string
    state?: string
  }
  created_by_user?: {
    first_name?: string
    last_name?: string
  }
}

interface Customer {
  id: string
  company_name?: string
  contact_first_name: string
  contact_last_name: string
  email?: string
  phone?: string
}

interface Lead {
  id: string
  company_name?: string
  contact_first_name: string
  contact_last_name: string
  email?: string
  phone?: string
}

interface Property {
  id: string
  customer_id: string
  name: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  property_type?: string
}

interface ServiceCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface ServiceItem {
  id: string
  category_id: string
  name: string
  description?: string
  unit_type: string
  base_price: number
  is_active: boolean
}

export function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Proposal>>({})
  const [saving, setSaving] = useState(false)

  // Proposal Request state
  const [activeTab, setActiveTab] = useState<'proposals' | 'requests'>('proposals')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showRequestViewModal, setShowRequestViewModal] = useState(false)
  const [showRequestEditModal, setShowRequestEditModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  // Handle URL parameters for leadId and customerId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const leadId = urlParams.get('leadId')
    const customerId = urlParams.get('customerId')

    if (leadId || customerId) {
      setShowCreateForm(true)
    }
  }, [])

  useEffect(() => {
    fetchProposals()
    fetchServiceCategories()
    fetchServiceItems()
    fetchCustomers()
    fetchProperties()
    fetchLeads()
  }, [])

  const fetchProposals = async () => {
    try {
      console.log('Fetching proposals...')

      // Get proposals with basic data
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false })

      if (proposalsError) {
        console.error('Proposals query error:', proposalsError)
        throw proposalsError
      }

      console.log('Proposals data:', proposalsData)

      if (!proposalsData || proposalsData.length === 0) {
        setProposals([])
        return
      }

      // For each proposal, fetch customer and lead data if they exist
      const enrichedProposals = await Promise.all(
        proposalsData.map(async (proposal) => {
          let customer = null
          let lead = null
          let property = null
          let createdByUser = null

          // Fetch customer if customer_id exists
          if (proposal.customer_id) {
            const { data: customerData } = await supabase
              .from('customers')
              .select('id, company_name, contact_first_name, contact_last_name, email')
              .eq('id', proposal.customer_id)
              .single()
            customer = customerData
          }

          // Fetch lead if lead_id exists
          if (proposal.lead_id) {
            const { data: leadData } = await supabase
              .from('leads')
              .select('company_name, contact_first_name, contact_last_name, email')
              .eq('id', proposal.lead_id)
              .single()
            lead = leadData
          }

          // Fetch property if property_id exists
          if (proposal.property_id) {
            const { data: propertyData } = await supabase
              .from('properties')
              .select('id, name, address, city, state')
              .eq('id', proposal.property_id)
              .single()
            property = propertyData
          }

          // Fetch user if created_by exists
          if (proposal.created_by) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', proposal.created_by)
              .single()
            createdByUser = userData
          }

          return {
            ...proposal,
            customer,
            lead,
            property,
            created_by_user: createdByUser,
          }
        })
      )

      console.log('Enriched proposals:', enrichedProposals)
      setProposals(enrichedProposals)
    } catch (error) {
      console.error('Error fetching proposals:', error)
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServiceCategories(data || [])
    } catch (error) {
      console.error('Error fetching service categories:', error)
    }
  }

  const fetchServiceItems = async () => {
    try {
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServiceItems(data || [])
    } catch (error) {
      console.error('Error fetching service items:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name, contact_first_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase.from('properties').select('*').order('name')

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('company_name, contact_first_name')

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setShowViewModal(true)
  }

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setEditFormData({
      title: proposal.title,
      customer_id: proposal.customer_id,
      lead_id: proposal.lead_id,
      property_id: proposal.property_id,
      status: proposal.status,
      total_amount: proposal.total_amount,
      valid_until: proposal.valid_until,
      notes: proposal.notes,
      terms_conditions: proposal.terms_conditions,
    })
    setShowEditModal(true)
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setShowCreateForm(false)
    setSelectedProposal(null)
    setEditFormData({})
  }

  const handleFormChange = (field: keyof Proposal, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // If customer changes, reset property selection
    if (field === 'customer_id') {
      setEditFormData((prev) => ({ ...prev, property_id: '' }))
    }
  }

  const getFilteredProperties = () => {
    if (!editFormData.customer_id) return properties
    return properties.filter((property) => property.customer_id === editFormData.customer_id)
  }

  const handleUpdateProposal = async () => {
    if (!selectedProposal) return

    setSaving(true)
    try {
      // Clean data - convert empty strings to null for optional fields
      const updateData = {
        title: editFormData.title || null,
        customer_id: editFormData.customer_id || null,
        lead_id: editFormData.lead_id || null,
        property_id: editFormData.property_id || null,
        status: editFormData.status || 'draft',
        total_amount: editFormData.total_amount || 0,
        valid_until: editFormData.valid_until || null,
        notes: editFormData.notes || null,
        terms_conditions: editFormData.terms_conditions || null,
        updated_at: new Date().toISOString(),
      }

      const previousStatus = selectedProposal.status

      const { error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', selectedProposal.id)

      if (error) {
        console.error('Error updating proposal:', error)
        alert('Failed to update proposal. Please try again.')
        return
      }

      // If proposal was just approved and it has a lead_id, convert lead to customer
      if (
        previousStatus !== 'approved' &&
        updateData.status === 'approved' &&
        selectedProposal.lead_id
      ) {
        try {
          await convertLeadToCustomer(selectedProposal.lead_id)
          console.log('Lead converted to customer automatically')

          // Update the proposal with the new customer_id
          const { data: leadData } = await supabase
            .from('leads')
            .select('id')
            .eq('id', selectedProposal.lead_id)
            .single()

          if (leadData) {
            const { data: customerData } = await supabase
              .from('customers')
              .select('id')
              .eq('converted_from_lead_id', selectedProposal.lead_id)
              .single()

            if (customerData) {
              await supabase
                .from('proposals')
                .update({ customer_id: customerData.id })
                .eq('id', selectedProposal.id)
            }
          }
        } catch (conversionError) {
          console.error('Error converting lead:', conversionError)
          // Don't fail the proposal update if conversion fails
        }
      }

      // Refresh proposals list
      await fetchProposals()

      // Close modal
      handleCloseModals()

      alert('Proposal updated successfully!')
    } catch (error) {
      console.error('Error updating proposal:', error)
      alert('Failed to update proposal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProposal = async (proposal: Proposal) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the proposal "${proposal.title}"? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const { error } = await supabase.from('proposals').delete().eq('id', proposal.id)

      if (error) {
        console.error('Error deleting proposal:', error)
        alert('Failed to delete proposal. Please try again.')
        return
      }

      // Refresh proposals list
      await fetchProposals()
      alert('Proposal deleted successfully!')
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Failed to delete proposal. Please try again.')
    }
  }

  const handleProposalSaved = (proposal: Proposal) => {
    setShowCreateForm(false)
    fetchProposals() // Refresh the list
  }

  // Proposal Request handlers
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
    setShowRequestViewModal(true)
  }

  const handleEditRequest = (request: any) => {
    setSelectedRequest(request)
    setShowRequestEditModal(true)
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this proposal request? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const { error } = await supabase.from('proposal_requests').delete().eq('id', requestId)

      if (error) throw error

      alert('Proposal request deleted successfully!')
      // The ProposalRequestsList component will refresh automatically
    } catch (error) {
      console.error('Error deleting proposal request:', error)
      alert('Failed to delete proposal request. Please try again.')
    }
  }

  const handleRequestFormSuccess = () => {
    setShowRequestForm(false)
    // The ProposalRequestsList component will refresh automatically
  }

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'draft':
        return <FileTextIcon className="w-4 h-4" />
      case 'sent':
        return <SendIcon className="w-4 h-4" />
      case 'viewed':
        return <EyeIcon className="w-4 h-4" />
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />
      case 'expired':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <FileTextIcon className="w-4 h-4" />
    }
  }

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.proposal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.lead?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${proposal.lead?.contact_first_name} ${proposal.lead?.contact_last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const statusStats = {
    draft: proposals.filter((p) => p.status === 'draft').length,
    sent: proposals.filter((p) => p.status === 'sent').length,
    viewed: proposals.filter((p) => p.status === 'viewed').length,
    approved: proposals.filter((p) => p.status === 'approved').length,
    rejected: proposals.filter((p) => p.status === 'rejected').length,
    expired: proposals.filter((p) => p.status === 'expired').length,
  }

  const totalValue = proposals.reduce((sum, proposal) => sum + proposal.total_amount, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading proposals...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
              <p className="mt-1 text-gray-600">Create and manage customer proposals</p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'proposals' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create Proposal
                </button>
              )}
              {activeTab === 'requests' && (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Submit Request
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('proposals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'proposals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  Proposals ({proposals.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardListIcon className="w-4 h-4" />
                  Proposal Requests
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{statusStats.draft}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-gray-600">
                <FileTextIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{statusStats.sent}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <SendIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Viewed</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{statusStats.viewed}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <EyeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{statusStats.approved}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{statusStats.rejected}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <XCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">{statusStats.expired}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <DollarSignIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'proposals' && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search proposals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="viewed">Viewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Proposals Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {proposal.title}
                            </div>
                            <div className="text-xs text-gray-500">{proposal.proposal_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {proposal.customer?.company_name ||
                                proposal.lead?.company_name ||
                                'No Owner Selected'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {proposal.customer?.contact_first_name ||
                                proposal.lead?.contact_first_name}{' '}
                              {proposal.customer?.contact_last_name ||
                                proposal.lead?.contact_last_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {proposal.customer ? 'Customer' : proposal.lead ? 'Lead' : 'Unknown'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              proposal.status
                            )}`}
                          >
                            {getStatusIcon(proposal.status)}
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${proposal.total_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {proposal.created_by_user?.first_name}{' '}
                          {proposal.created_by_user?.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={() => handleViewProposal(proposal)}
                              className="p-1 sm:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Proposal"
                            >
                              <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleEditProposal(proposal)}
                              className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                              title="Edit Proposal"
                            >
                              <EditIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProposal(proposal)}
                              className="p-1 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Proposal"
                            >
                              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredProposals.length === 0 && (
              <div className="text-center py-12">
                <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first proposal.'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Proposal
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Debug: Current proposals state:', proposals)
                        console.log('Debug: Loading state:', loading)
                        await fetchProposals()
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      🔍 Debug Refresh
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Proposal Requests Tab */}
        {activeTab === 'requests' && (
          <ProposalRequestsList
            onViewRequest={handleViewRequest}
            onEditRequest={handleEditRequest}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </div>

      {/* Proposal Builder Modal */}
      {showCreateForm && (
        <ProposalBuilder
          leadId={new URLSearchParams(window.location.search).get('leadId') || undefined}
          customerId={new URLSearchParams(window.location.search).get('customerId') || undefined}
          onClose={handleCloseModals}
          onSave={handleProposalSaved}
        />
      )}

      {/* View Proposal Modal */}
      {showViewModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">View Proposal</h3>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Proposal Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedProposal.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Proposal #{selectedProposal.proposal_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedProposal.total_amount.toFixed(2)}
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProposal.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : selectedProposal.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedProposal.status === 'viewed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedProposal.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : selectedProposal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {selectedProposal.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              {(selectedProposal.lead || selectedProposal.customer) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Customer Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="ml-2 font-medium">
                        {selectedProposal.customer?.company_name ||
                          selectedProposal.lead?.company_name ||
                          'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <span className="ml-2 font-medium">
                        {selectedProposal.customer?.contact_first_name ||
                          selectedProposal.lead?.contact_first_name}{' '}
                        {selectedProposal.customer?.contact_last_name ||
                          selectedProposal.lead?.contact_last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">
                        {selectedProposal.customer?.email || selectedProposal.lead?.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Information */}
              {selectedProposal.property && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Property Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Property Name:</span>
                      <span className="ml-2 font-medium">{selectedProposal.property.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">{selectedProposal.property.address}</span>
                    </div>
                    {selectedProposal.property.city && (
                      <div>
                        <span className="text-gray-600">City:</span>
                        <span className="ml-2 font-medium">{selectedProposal.property.city}</span>
                      </div>
                    )}
                    {selectedProposal.property.state && (
                      <div>
                        <span className="text-gray-600">State:</span>
                        <span className="ml-2 font-medium">{selectedProposal.property.state}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Proposal Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Proposal Details</h5>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedProposal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedProposal.valid_until && (
                    <div>
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedProposal.valid_until).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedProposal.created_by_user && (
                    <div>
                      <span className="text-gray-600">Created By:</span>
                      <span className="ml-2 font-medium">
                        {selectedProposal.created_by_user.first_name}{' '}
                        {selectedProposal.created_by_user.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedProposal.notes && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Notes</h5>
                  <p className="text-gray-700">{selectedProposal.notes}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              {selectedProposal.terms_conditions && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h5>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedProposal.terms_conditions}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseModals()
                  handleEditProposal(selectedProposal)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Proposal Modal */}
      {showEditModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Proposal</h3>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter proposal title"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select
                      value={
                        editFormData.customer_id
                          ? `customer_${editFormData.customer_id}`
                          : editFormData.lead_id
                          ? `lead_${editFormData.lead_id}`
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.startsWith('customer_')) {
                          handleFormChange('customer_id', value.replace('customer_', ''))
                          handleFormChange('lead_id', '')
                        } else if (value.startsWith('lead_')) {
                          handleFormChange('lead_id', value.replace('lead_', ''))
                          handleFormChange('customer_id', '')
                        } else {
                          handleFormChange('customer_id', '')
                          handleFormChange('lead_id', '')
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Owner</option>
                      <optgroup label="Customers">
                        {customers.map((customer) => (
                          <option key={`customer_${customer.id}`} value={`customer_${customer.id}`}>
                            {customer.company_name ||
                              `${customer.contact_first_name} ${customer.contact_last_name}`}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Leads">
                        {leads.map((lead) => (
                          <option key={`lead_${lead.id}`} value={`lead_${lead.id}`}>
                            {lead.company_name ||
                              `${lead.contact_first_name} ${lead.contact_last_name}`}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                    <select
                      value={editFormData.property_id || ''}
                      onChange={(e) => handleFormChange('property_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!editFormData.customer_id}
                    >
                      <option value="">Select Property</option>
                      {getFilteredProperties().map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editFormData.status || 'draft'}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="viewed">Viewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.total_amount || ''}
                      onChange={(e) =>
                        handleFormChange('total_amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={editFormData.valid_until ? editFormData.valid_until.split('T')[0] : ''}
                    onChange={(e) =>
                      handleFormChange(
                        'valid_until',
                        e.target.value ? new Date(e.target.value).toISOString() : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this proposal"
                />
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={editFormData.terms_conditions || ''}
                  onChange={(e) => handleFormChange('terms_conditions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter terms and conditions"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModals}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProposal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Request Form Modal */}
      {showRequestForm && (
        <ProposalRequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={handleRequestFormSuccess}
        />
      )}

      {/* Proposal Request View Modal */}
      {showRequestViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">View Proposal Request</h3>
              <button
                onClick={() => {
                  setShowRequestViewModal(false)
                  setSelectedRequest(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedRequest.title}</h4>
                    <p className="text-sm text-gray-600">
                      Request #{selectedRequest.request_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Submitted: {new Date(selectedRequest.submitted_at).toLocaleDateString()}
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedRequest.status === 'submitted'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedRequest.status === 'reviewing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedRequest.status === 'quoted'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedRequest.status === 'converted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedRequest.status.charAt(0).toUpperCase() +
                        selectedRequest.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Project Information</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>{' '}
                      {selectedRequest.project_type.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Property Type:</span>{' '}
                      {selectedRequest.property_type.replace('_', ' ')}
                    </div>
                    {selectedRequest.square_footage && (
                      <div>
                        <span className="font-medium">Square Footage:</span>{' '}
                        {selectedRequest.square_footage.toLocaleString()}
                      </div>
                    )}
                    {selectedRequest.estimated_budget && (
                      <div>
                        <span className="font-medium">Estimated Budget:</span> $
                        {selectedRequest.estimated_budget.toFixed(2)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Urgency:</span> {selectedRequest.urgency_level}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedRequest.contact_name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedRequest.contact_email}
                    </div>
                    {selectedRequest.contact_phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedRequest.contact_phone}
                      </div>
                    )}
                    {selectedRequest.company_name && (
                      <div>
                        <span className="font-medium">Company:</span> {selectedRequest.company_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Address */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Property Address</h5>
                <div className="text-sm text-gray-600">
                  {selectedRequest.property_address}
                  {selectedRequest.property_city && `, ${selectedRequest.property_city}`}
                  {selectedRequest.property_state && `, ${selectedRequest.property_state}`}
                  {selectedRequest.property_zip && ` ${selectedRequest.property_zip}`}
                </div>
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Description</h5>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </div>
                </div>
              )}

              {/* Special Requirements */}
              {(selectedRequest.special_requirements || selectedRequest.accessibility_needs) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Special Requirements</h5>
                  <div className="space-y-2 text-sm text-gray-600">
                    {selectedRequest.special_requirements && (
                      <div>
                        <span className="font-medium">Requirements:</span>
                        <div className="mt-1 whitespace-pre-wrap">
                          {selectedRequest.special_requirements}
                        </div>
                      </div>
                    )}
                    {selectedRequest.accessibility_needs && (
                      <div>
                        <span className="font-medium">Accessibility:</span>
                        <div className="mt-1 whitespace-pre-wrap">
                          {selectedRequest.accessibility_needs}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Attachments</h5>
                  <div className="space-y-2">
                    {selectedRequest.attachments.map((attachment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <FileTextIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{attachment.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blueprint Links */}
              {selectedRequest.blueprint_links && selectedRequest.blueprint_links.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Blueprint Links</h5>
                  <div className="space-y-2">
                    {selectedRequest.blueprint_links.map((link: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {link.title || link.url}
                          </a>
                        </div>
                        {link.description && (
                          <div className="text-xs text-gray-500 ml-6">{link.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowRequestViewModal(false)
                  setSelectedRequest(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
