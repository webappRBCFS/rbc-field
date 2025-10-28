import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logActivity, ActivityTypes } from '../utils/activityLogger'

interface ProposalNote {
  timestamp: string
  note: string
}

interface Customer {
  id: string
  company_name?: string
  contact_first_name: string
  contact_last_name: string
}

interface Property {
  id: string
  name: string
  address: string
  customer_id: string
}

export default function ProposalCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'items' | 'notes'>('overview')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedCustomerProperties, setSelectedCustomerProperties] = useState<Property[]>([])

  const [proposalData, setProposalData] = useState({
    title: '',
    description: '',
    customer_id: '',
    property_id: '',
    total_amount: 0,
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    payment_terms: 30,
    valid_until: '',
    terms_and_conditions: '',
    status: 'draft' as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired',
  })

  const [notes, setNotes] = useState<ProposalNote[]>([])
  const [newNote, setNewNote] = useState('')

  const [lineItems, setLineItems] = useState<
    Array<{
      id: string
      name: string
      description: string
      quantity: number
      unit_price: number
      total: number
    }>
  >([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    const customerId = searchParams.get('customer')
    const propertyId = searchParams.get('property')
    if (customerId) {
      setProposalData((prev) => ({ ...prev, customer_id: customerId }))
    }
    if (propertyId) {
      setProposalData((prev) => ({ ...prev, property_id: propertyId }))
    }
  }, [searchParams])

  useEffect(() => {
    if (proposalData.customer_id) {
      fetchPropertiesForCustomer(proposalData.customer_id)
    } else {
      setSelectedCustomerProperties([])
    }
  }, [proposalData.customer_id])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, contact_first_name, contact_last_name')
        .order('company_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchPropertiesForCustomer = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, customer_id')
        .eq('customer_id', customerId)
        .order('name')

      if (error) throw error
      setSelectedCustomerProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const addNote = () => {
    if (newNote.trim()) {
      const timestamp = new Date().toISOString()
      setNotes([{ timestamp, note: newNote }, ...notes])
      setNewNote('')
    }
  }

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      addNote()
    }
  }

  // Validation and navigation
  const validateTab = (tab: 'overview' | 'details' | 'items' | 'notes'): boolean => {
    switch (tab) {
      case 'overview':
        return !!(proposalData.title && proposalData.customer_id && proposalData.status)
      case 'details':
        return true // Details are optional
      case 'items':
        return true // Line items are optional
      case 'notes':
        return true // Notes are optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!validateTab(activeTab)) {
      alert('Please fill in all required fields before continuing')
      return
    }

    const tabs: Array<'overview' | 'details' | 'items' | 'notes'> = [
      'overview',
      'details',
      'items',
      'notes',
    ]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const tabs: Array<'overview' | 'details' | 'items' | 'notes'> = [
      'overview',
      'details',
      'items',
      'notes',
    ]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Generate proposal number
      const proposalNumber = `PROP-${Date.now()}`

      const proposalInsert = {
        proposal_number: proposalNumber,
        title: proposalData.title,
        description: proposalData.description,
        customer_id: proposalData.customer_id || null,
        property_id: proposalData.property_id || null,
        subtotal: proposalData.subtotal,
        tax_rate: proposalData.tax_rate,
        tax_amount: proposalData.tax_amount,
        total: proposalData.total_amount,
        payment_terms: proposalData.payment_terms,
        valid_until: proposalData.valid_until || null,
        terms_and_conditions: proposalData.terms_and_conditions || null,
        status: proposalData.status,
        notes: notes.length > 0 ? notes : null,
      }

      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert(proposalInsert)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await logActivity({
        activity_type: ActivityTypes.PROPOSAL_CREATED,
        entity_type: 'proposal',
        entity_id: proposal.id,
        description: `Proposal "${proposalData.title}" created`,
        metadata: {
          customer_id: proposalData.customer_id,
          property_id: proposalData.property_id,
          total_amount: proposalData.total_amount,
        },
      })

      alert('Proposal created successfully!')
      navigate(`/proposals/view/${proposal.id}`)
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Error creating proposal: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            ← Back to Proposals
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Proposal</h1>
          <p className="text-gray-600 mt-2">Create a new proposal for a customer</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation - Read-only display */}
          <div className="flex border-b border-gray-200">
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'details' || activeTab === 'items' || activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Overview
            </div>
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'items' || activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Details
            </div>
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'items'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Line Items
            </div>
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'notes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'
              }`}
            >
              Notes & Activity
            </div>
          </div>

          <div>
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposal Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={proposalData.title}
                      onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter proposal title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={proposalData.description}
                      onChange={(e) =>
                        setProposalData({ ...proposalData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter proposal description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        required
                        value={proposalData.customer_id}
                        onChange={(e) => {
                          setProposalData({
                            ...proposalData,
                            customer_id: e.target.value,
                            property_id: '',
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select customer...</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.company_name ||
                              `${customer.contact_first_name} ${customer.contact_last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property
                      </label>
                      <select
                        value={proposalData.property_id}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, property_id: e.target.value })
                        }
                        disabled={!proposalData.customer_id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select property...</option>
                        {selectedCustomerProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name} - {property.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        required
                        value={proposalData.status}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            status: e.target.value as any,
                          })
                        }
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
                        value={proposalData.total_amount}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            total_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtotal
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={proposalData.subtotal}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            subtotal: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={proposalData.tax_rate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || 0
                          setProposalData({
                            ...proposalData,
                            tax_rate: rate,
                            tax_amount: (proposalData.subtotal * rate) / 100,
                            total_amount:
                              proposalData.subtotal + (proposalData.subtotal * rate) / 100,
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        value={proposalData.payment_terms}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            payment_terms: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        value={proposalData.valid_until}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, valid_until: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      value={proposalData.terms_and_conditions}
                      onChange={(e) =>
                        setProposalData({ ...proposalData, terms_and_conditions: e.target.value })
                      }
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter terms and conditions"
                    />
                  </div>
                </div>
              )}

              {/* Line Items Tab */}
              {activeTab === 'items' && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Add Line Items (Coming Soon)
                    </h3>
                    <p className="text-sm text-gray-500">
                      Line item functionality will be implemented in a future update.
                    </p>
                  </div>
                </div>
              )}

              {/* Notes & Activity Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Note</label>
                    <div className="flex gap-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a note (Ctrl+Enter to submit)"
                      />
                      <button
                        type="button"
                        onClick={addNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to quickly submit</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Notes History</h3>
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-500">No notes added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((note, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-xs text-gray-500">
                                {new Date(note.timestamp).toLocaleString()}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeNote(index)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <p className="text-sm text-gray-900">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Activity</h3>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-700">
                        Activities will appear here after the proposal is created
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 px-6 pt-6 border-t border-gray-200">
              {/* Left side: Cancel button */}
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>

              {/* Right side: Back and Next/Create buttons */}
              <div className="flex gap-3">
                {activeTab !== 'overview' && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Back
                  </button>
                )}
                {activeTab === 'notes' ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Proposal'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateTab(activeTab)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
