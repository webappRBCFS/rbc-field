import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Proposal {
  id: string
  proposal_number: string
  title: string
  customer_id?: string
  lead_id?: string
  property_id?: string
  total_amount: number
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
  created_at: string
  customer?: {
    company_name?: string
    contact_first_name?: string
    contact_last_name?: string
  }
  lead?: {
    company_name?: string
    contact_first_name?: string
    contact_last_name?: string
  }
  property?: {
    name?: string
    address?: string
  }
}

export function Proposals() {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false })

      if (proposalsError) throw proposalsError

      if (!proposalsData || proposalsData.length === 0) {
        setProposals([])
        return
      }

      // Enrich proposals with customer/lead and property data
      const enrichedProposals = await Promise.all(
        proposalsData.map(async (proposal) => {
          let customer = null
          let lead = null
          let property = null

          // Fetch customer if exists
          if (proposal.customer_id) {
            const { data: customerData } = await supabase
              .from('customers')
              .select('id, company_name, contact_first_name, contact_last_name')
              .eq('id', proposal.customer_id)
              .single()
            customer = customerData
          }

          // Fetch lead if exists (may exist even if customer exists for converted leads)
          if (proposal.lead_id) {
            const { data: leadData } = await supabase
              .from('leads')
              .select('id, company_name, contact_first_name, contact_last_name')
              .eq('id', proposal.lead_id)
              .single()
            lead = leadData
          }

          // Fetch property if exists and it's a valid UUID (for customers)
          if (proposal.property_id && proposal.customer_id) {
            // Only fetch if it's a valid UUID (not project-${index})
            if (
              typeof proposal.property_id === 'string' &&
              !proposal.property_id.startsWith('project-')
            ) {
              const { data: propertyData } = await supabase
                .from('properties')
                .select('id, name, address')
                .eq('id', proposal.property_id)
                .single()
              property = propertyData
            }
          }

          return {
            ...proposal,
            customer,
            lead,
            property,
            total_amount: proposal.total || 0,
          }
        })
      )

      setProposals(enrichedProposals)
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProposal = (proposal: Proposal) => {
    navigate(`/proposals/view/${proposal.id}`)
  }

  const handleEditProposal = (proposal: Proposal) => {
    navigate(`/proposals/edit/${proposal.id}`)
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

      await fetchProposals()
      alert('Proposal deleted successfully!')
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Failed to delete proposal. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
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

  const filteredProposals = proposals.filter((proposal) => {
    const customerName = proposal.customer
      ? proposal.customer.company_name ||
        `${proposal.customer.contact_first_name || ''} ${
          proposal.customer.contact_last_name || ''
        }`.trim()
      : ''
    const leadName = proposal.lead
      ? proposal.lead.company_name ||
        `${proposal.lead.contact_first_name || ''} ${proposal.lead.contact_last_name || ''}`.trim()
      : ''

    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leadName.toLowerCase().includes(searchTerm.toLowerCase())

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
            <button
              onClick={() => navigate('/proposals/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Proposal
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{proposals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{statusStats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{statusStats.draft}</p>
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
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Proposal List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                        <button
                          onClick={() => handleViewProposal(proposal)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                        >
                          {proposal.title}
                        </button>
                        <div className="text-sm text-gray-500">{proposal.proposal_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {proposal.customer
                          ? proposal.customer.company_name ||
                            `${proposal.customer.contact_first_name || ''} ${
                              proposal.customer.contact_last_name || ''
                            }`.trim() ||
                            'N/A'
                          : proposal.lead
                          ? proposal.lead.company_name ||
                            `${proposal.lead.contact_first_name || ''} ${
                              proposal.lead.contact_last_name || ''
                            }`.trim() ||
                            'N/A'
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${proposal.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          proposal.status
                        )}`}
                      >
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteProposal(proposal)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Proposal"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12 px-6">
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'No proposals match your search criteria.'
                : 'No proposals found. Get started by creating your first proposal.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
