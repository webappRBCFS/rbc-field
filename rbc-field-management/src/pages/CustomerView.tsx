import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PlusIcon,
  XIcon,
  BuildingIcon,
  MapPinIcon,
  FileTextIcon,
  ClipboardIcon,
  UsersIcon,
  SaveIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getEntityActivities, ActivityLog } from '../utils/activityLogger'

interface CustomerNote {
  timestamp: string
  note: string
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  sqft: number
  notes: string
}

export default function CustomerView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<
    'overview' | 'properties' | 'contracts' | 'jobs' | 'proposals' | 'invoices' | 'notes'
  >('overview')

  const [customer, setCustomer] = useState<any>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (id) {
      fetchCustomerData()
      fetchActivities()
    }
  }, [id])

  const fetchActivities = async () => {
    if (!id) return
    try {
      const acts = await getEntityActivities('customer', id)
      setActivities(acts)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchCustomerData = async () => {
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) throw customerError
      setCustomer(customerData)

      // Fetch notes if available
      if (customerData.notes) {
        setNotes(Array.isArray(customerData.notes) ? customerData.notes : [])
      }

      // Fetch contacts if available
      if (customerData.contacts && Array.isArray(customerData.contacts)) {
        setContacts(customerData.contacts)
      }

      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('customer_id', id)

      if (!propertiesError && propertiesData) {
        setProperties(propertiesData)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      alert('Error loading customer: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return

    setSavingNote(true)
    try {
      const noteToAdd: CustomerNote = {
        timestamp: new Date().toISOString(),
        note: newNote.trim(),
      }

      const updatedNotes = [...notes, noteToAdd]

      const { error } = await supabase
        .from('customers')
        .update({ notes: updatedNotes })
        .eq('id', id)

      if (error) throw error

      setNotes(updatedNotes)
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note')
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Customers</span>
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{customer.company_name}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/customers/edit/${id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Customer
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span>{customer.email}</span>
            <span>{customer.phone}</span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {customer.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'properties'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'contracts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contracts
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'proposals'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Proposals
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPinIcon className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Properties</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Contracts</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileTextIcon className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Jobs</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BuildingIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{customer.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {customer.address || 'N/A'}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && `, ${customer.state}`}
                        {customer.zip_code && ` ${customer.zip_code}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contacts Section */}
                {contacts.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <UsersIcon className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contacts.map((contact, index) => (
                        <div
                          key={contact.id || index}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        >
                          <h3 className="font-semibold text-gray-900 mb-2">{contact.name}</h3>
                          <div className="space-y-1 text-sm">
                            {contact.phone && (
                              <p className="text-gray-600">
                                <span className="font-medium">Phone:</span>{' '}
                                <a
                                  href={`tel:${contact.phone.replace(/\D/g, '')}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {contact.phone}
                                </a>
                              </p>
                            )}
                            {contact.cell && (
                              <p className="text-gray-600">
                                <span className="font-medium">Cell:</span>{' '}
                                <a
                                  href={`tel:${contact.cell.replace(/\D/g, '')}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {contact.cell}
                                </a>
                              </p>
                            )}
                            {contact.email && (
                              <p className="text-gray-600">
                                <span className="font-medium">Email:</span>{' '}
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {contact.email}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{property.name}</h3>
                          <p className="text-sm text-gray-600">
                            {property.address} {property.city ? property.city + ', ' : ''}
                            {property.state} {property.zip_code}
                          </p>
                          <div className="mt-2 flex gap-4 text-sm text-gray-600">
                            <span>Type: {property.property_type || 'N/A'}</span>
                            {property.sqft && <span>Sqft: {property.sqft.toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No properties found</p>
                )}
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div className="text-center text-gray-500 py-8">No contracts found</div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="text-center text-gray-500 py-8">No jobs found</div>
            )}

            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <div className="text-center text-gray-500 py-8">No proposals found</div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="text-center text-gray-500 py-8">No invoices found</div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Notes Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Notes</h2>

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
                      notes
                        .slice()
                        .reverse()
                        .map((note) => (
                          <div key={note.timestamp} className="bg-gray-50 rounded-lg p-4">
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
