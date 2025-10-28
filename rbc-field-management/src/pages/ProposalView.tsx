import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  EditIcon,
  BuildingIcon,
  MapPinIcon,
  FileTextIcon,
  DollarSignIcon,
  UserIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getEntityActivities, ActivityLog } from '../utils/activityLogger'

interface ProposalNote {
  timestamp: string
  note: string
}

export default function ProposalView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<
    'overview' | 'details' | 'items' | 'notes'
  >('overview')

  const [proposal, setProposal] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [notes, setNotes] = useState<ProposalNote[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (id) {
      fetchProposalData()
      fetchActivities()
    }
  }, [id])

  const fetchProposalData = async () => {
    try {
      // Fetch proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single()

      if (proposalError) throw proposalError
      setProposal(proposalData)

      // Fetch notes
      if (proposalData.notes && Array.isArray(proposalData.notes)) {
        setNotes(proposalData.notes)
      }

      // Fetch customer
      if (proposalData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', proposalData.customer_id)
          .single()

        if (!customerError && customerData) {
          setCustomer(customerData)
        }
      }

      // Fetch property
      if (proposalData.property_id) {
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', proposalData.property_id)
          .single()

        if (!propertyError && propertyData) {
          setProperty(propertyData)
        }
      }
    } catch (error) {
      console.error('Error fetching proposal data:', error)
      alert('Error loading proposal: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const acts = await getEntityActivities('proposal', id!)
      setActivities(acts)
    } catch (error) {
      console.error('Error fetching activities:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Proposal not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            ← Back to Proposals
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
              <p className="text-gray-600 mt-1">Proposal #{proposal.proposal_number}</p>
            </div>
            <button
              onClick={() => navigate(`/proposals/edit/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EditIcon className="w-4 h-4" />
              Edit Proposal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'items'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line Items
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notes & Activity
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Customer</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {customer?.company_name ||
                        `${customer?.contact_first_name} ${customer?.contact_last_name}` ||
                        'N/A'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">Property</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {property?.name || property?.address || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSignIcon className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Total Amount</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(proposal.total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Proposal Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Proposal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            proposal.status
                          )}`}
                        >
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {proposal.valid_until && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Valid Until</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(proposal.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                      <p className="mt-1 text-sm text-gray-900">
                        Net {proposal.payment_terms || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {proposal.description && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {proposal.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Pricing Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subtotal</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        ${(proposal.subtotal || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax Rate</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {proposal.tax_rate || 0}%
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        ${(proposal.tax_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total</label>
                      <p className="mt-1 text-lg font-semibold text-blue-600">
                        ${(proposal.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {proposal.terms_and_conditions && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {proposal.terms_and_conditions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Line Items Tab */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Line Items</h3>
                  <p className="text-sm text-gray-500">
                    Line item functionality will be implemented in a future update.
                  </p>
                </div>
              </div>
            )}

            {/* Notes & Activity Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Notes */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Notes</h3>
                  {notes.length === 0 ? (
                    <p className="text-sm text-gray-500">No notes added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">
                            {new Date(note.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-900">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Activity</h3>
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No activity recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-medium text-blue-900">
                              {activity.activity_type}
                            </p>
                            <p className="text-xs text-blue-700">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-blue-800">{activity.description}</p>
                        </div>
                      ))}
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

