import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  EditIcon,
  HomeIcon,
  BuildingIcon,
  BriefcaseIcon,
  ClipboardListIcon,
  FileTextIcon,
  DollarSignIcon,
  PlusIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getEntityActivities, ActivityLog } from '../utils/activityLogger'

interface PropertyNote {
  timestamp: string
  note: string
}

export default function PropertyView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<
    'overview' | 'jobs' | 'contracts' | 'proposals' | 'invoices' | 'notes'
  >('overview')

  const [property, setProperty] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [notes, setNotes] = useState<PropertyNote[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPropertyData()
      fetchActivities()
    }
  }, [id])

  const fetchPropertyData = async () => {
    try {
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (propertyError) throw propertyError
      setProperty(propertyData)

      // Fetch customer
      if (propertyData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', propertyData.customer_id)
          .single()

        if (!customerError && customerData) {
          setCustomer(customerData)
        }
      }

      // Fetch notes if available
      if (propertyData.notes && Array.isArray(propertyData.notes)) {
        setNotes(propertyData.notes)
      }

      // Fetch related records
      await Promise.all([
        fetchJobs(propertyData.id),
        fetchContracts(propertyData.id),
        fetchProposals(propertyData.id),
        fetchInvoices(propertyData.id),
      ])
    } catch (error) {
      console.error('Error fetching property data:', error)
      alert('Error loading property: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const acts = await getEntityActivities('property', id!)
      setActivities(acts)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return

    setSavingNote(true)
    try {
      const noteToAdd: PropertyNote = {
        timestamp: new Date().toISOString(),
        note: newNote.trim(),
      }

      const updatedNotes = [...notes, noteToAdd]

      const { error } = await supabase
        .from('properties')
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

  const fetchJobs = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchContracts = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setContracts(data)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const fetchProposals = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProposals(data)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
  }

  const fetchInvoices = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Property not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Properties</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <HomeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
                <p className="text-gray-600">
                  {property.address || 'No address provided'}
                  {property.address_line_2 && (
                    <>
                      <br />
                      {property.address_line_2}
                    </>
                  )}
                  {property.city && `, ${property.city}`}
                  {property.state && ` ${property.state}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/properties/edit/${property.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EditIcon className="w-5 h-5" />
              Edit Property
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BriefcaseIcon className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Jobs</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardListIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Contracts</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{contracts.length}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileTextIcon className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Proposals</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{proposals.length}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSignIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Invoices</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
                  </div>
                </div>

                {/* Property Information */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BuildingIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Property Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{property.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Building Type
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {property.building_type || 'N/A'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {property.address || 'N/A'}
                        {property.address_line_2 && (
                          <>
                            <br />
                            {property.address_line_2}
                          </>
                        )}
                        {property.city && `, ${property.city}`}
                        {property.state && `, ${property.state}`}
                        {property.zip_code && ` ${property.zip_code}`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Units</label>
                      <p className="mt-1 text-sm text-gray-900">{property.units || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stories</label>
                      <p className="mt-1 text-sm text-gray-900">{property.stories || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Access Type</label>
                      <p className="mt-1 text-sm text-gray-900">{property.access_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Access Info</label>
                      <p className="mt-1 text-sm text-gray-900">{property.access_info || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {property.payment_method || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sales Tax Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {property.sales_tax_status || 'N/A'}
                      </p>
                    </div>
                    {customer && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {customer.company_name || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Access */}
                {property.additional_access &&
                  Array.isArray(property.additional_access) &&
                  property.additional_access.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Additional Access
                      </h2>
                      <div className="space-y-3">
                        {property.additional_access.map((access: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-900">
                              {access.location || 'Unknown Location'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {access.access_type} - {access.access_info}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="text-center py-12">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No jobs found for this property</p>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div className="text-center py-12">
                <ClipboardListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No contracts found for this property</p>
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === 'proposals' && (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No proposals found for this property</p>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="text-center py-12">
                <DollarSignIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invoices found for this property</p>
              </div>
            )}

            {/* Notes & Activity Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Notes Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Notes</h2>

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
