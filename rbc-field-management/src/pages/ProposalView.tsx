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
  PlusIcon,
  SaveIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getEntityActivities, ActivityLog, logActivity } from '../utils/activityLogger'

interface ProposalNote {
  timestamp: string
  note: string
}

export default function ProposalView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'items' | 'notes'>('overview')

  const [proposal, setProposal] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [lead, setLead] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [notes, setNotes] = useState<ProposalNote[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [lineItems, setLineItems] = useState<any[]>([])
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [statusValue, setStatusValue] = useState<string>('')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProposalData()
      fetchActivities()
      fetchProposalLineItems()
    }
  }, [id])

  useEffect(() => {
    if (proposal) {
      setStatusValue(proposal.status || 'draft')
    }
  }, [proposal])

  const fetchProposalLineItems = async () => {
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('proposal_line_items')
        .select(
          `
          *,
          service_item:service_items(id, name)
        `
        )
        .eq('proposal_id', id)
        .order('sort_order', { ascending: true })

      if (error) {
        // Table might not exist yet, that's okay
        console.warn('Error fetching proposal line items (table may not exist):', error)
        return
      }

      console.log('Fetched proposal line items:', data)
      setLineItems(data || [])
    } catch (error) {
      console.error('Error fetching proposal line items:', error)
    }
  }

  const fetchProposalData = async () => {
    try {
      // Fetch proposal with project_address field
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*, project_address')
        .eq('id', id)
        .single()

      if (proposalError) throw proposalError
      setProposal(proposalData)

      // Fetch notes
      if (proposalData.notes && Array.isArray(proposalData.notes)) {
        setNotes(proposalData.notes)
      }

      // Fetch customer (if exists)
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

      // Fetch lead (if exists - may exist even if customer exists for converted leads)
      let leadDataForProject = null
      if (proposalData.lead_id) {
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', proposalData.lead_id)
          .single()

        if (!leadError && leadData) {
          setLead(leadData)
          leadDataForProject = leadData
        }
      }

      // Fetch property (for customers)
      if (proposalData.property_id && proposalData.customer_id) {
        // Only fetch if it's a valid UUID (not project-${index})
        if (
          typeof proposalData.property_id === 'string' &&
          !proposalData.property_id.startsWith('project-')
        ) {
          const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', proposalData.property_id)
            .single()

          if (!propertyError && propertyData) {
            setProperty(propertyData)
          }
        }
      }

      // Find project (for leads) - match by project_address or property_id
      if (leadDataForProject && leadDataForProject.projects) {
        let matchedProject = null

        // Method 1: Try to match project by project_address stored in proposal
        if (proposalData.project_address) {
          matchedProject = leadDataForProject.projects.find(
            (p: any) => p.address === proposalData.project_address
          )
        }

        // Method 2: Try to match by property_id if it contains project-${index}
        if (
          !matchedProject &&
          proposalData.property_id &&
          typeof proposalData.property_id === 'string' &&
          proposalData.property_id.includes('project-')
        ) {
          const projectIndex = parseInt(proposalData.property_id.replace('project-', ''))
          if (projectIndex >= 0 && leadDataForProject.projects[projectIndex]) {
            matchedProject = leadDataForProject.projects[projectIndex]
          }
        }

        // Method 3: Try to find by project ID (if property_id is not a UUID)
        if (
          !matchedProject &&
          proposalData.property_id &&
          typeof proposalData.property_id === 'string' &&
          !proposalData.property_id.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          matchedProject = leadDataForProject.projects.find(
            (p: any) => p.id === proposalData.property_id
          )
        }

        if (matchedProject) {
          setProject(matchedProject)
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

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return

    setSavingNote(true)
    try {
      const noteToAdd: ProposalNote = {
        timestamp: new Date().toISOString(),
        note: newNote.trim(),
      }

      const updatedNotes = [...notes, noteToAdd]

      const { error } = await supabase
        .from('proposals')
        .update({ notes: updatedNotes })
        .eq('id', id)

      if (error) throw error

      setNotes(updatedNotes)
      setNewNote('')

      // Log activity
      await logActivity({
        activity_type: 'note_added',
        entity_type: 'proposal',
        entity_id: id,
        description: 'Note added to proposal',
      })

      fetchActivities()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleSaveStatus = async () => {
    if (!id || !statusValue || statusValue === proposal.status) {
      setIsEditingStatus(false)
      return
    }

    setSavingStatus(true)
    try {
      const oldStatus = proposal.status
      const { error } = await supabase
        .from('proposals')
        .update({ status: statusValue })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setProposal({ ...proposal, status: statusValue })
      setIsEditingStatus(false)

      // Log activity
      await logActivity({
        activity_type: 'status_changed',
        entity_type: 'proposal',
        entity_id: id,
        description: `Proposal status changed from ${oldStatus} to ${statusValue}`,
        metadata: { old_status: oldStatus, new_status: statusValue },
      })

      fetchActivities()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleCancelEditStatus = () => {
    setStatusValue(proposal.status || 'draft')
    setIsEditingStatus(false)
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
                      <span className="text-sm font-medium text-gray-600">
                        {customer ? 'Customer' : lead ? 'Lead' : 'Customer/Lead'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {customer
                        ? customer.company_name ||
                          `${customer.contact_first_name || ''} ${
                            customer.contact_last_name || ''
                          }`.trim() ||
                          'N/A'
                        : lead
                        ? lead.company_name ||
                          `${lead.contact_first_name || ''} ${
                            lead.contact_last_name || ''
                          }`.trim() ||
                          'N/A'
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {property ? 'Property' : project ? 'Project' : 'Property/Project'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {property
                        ? property.name || property.address || 'N/A'
                        : project
                        ? `${project.type || 'Project'} - ${project.address || 'N/A'}`
                        : 'N/A'}
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
                        {isEditingStatus ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={statusValue}
                              onChange={(e) => setStatusValue(e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              disabled={savingStatus}
                            >
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="viewed">Viewed</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="expired">Expired</option>
                            </select>
                            <button
                              onClick={handleSaveStatus}
                              disabled={savingStatus}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {savingStatus ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <SaveIcon className="w-3 h-3" />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEditStatus}
                              disabled={savingStatus}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                proposal.status
                              )}`}
                            >
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                            <button
                              onClick={() => setIsEditingStatus(true)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
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
                      <label className="text-sm font-medium text-gray-500">Sales Tax Status</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {proposal.sales_tax_status
                          ? proposal.sales_tax_status
                              .split('-')
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')
                          : 'Use Owner Default'}
                      </p>
                    </div>
                    {proposal.sales_tax_status === 'taxable' && proposal.tax_rate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tax Rate</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {proposal.tax_rate || 0}%
                        </p>
                      </div>
                    )}
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
              <div className="space-y-6">
                {lineItems.length > 0 ? (
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
                                        (word: string) =>
                                          word.charAt(0).toUpperCase() + word.slice(1)
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
                              Subtotal:
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
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-8 text-gray-500">
                      <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm">No line items have been added to this proposal.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes & Activity Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Notes Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Notes</h2>

                  {/* Add Note Form */}
                  <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Add Note</h3>
                    <div className="flex gap-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey && newNote.trim()) {
                            handleAddNote()
                          }
                        }}
                        rows={3}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add a note... (Ctrl+Enter to submit)"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || savingNote}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start flex items-center gap-2"
                      >
                        {savingNote ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to quickly submit</p>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.length > 0 ? (
                      notes.map((note, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(note.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No notes available</p>
                    )}
                  </div>
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
    </div>
  )
}
