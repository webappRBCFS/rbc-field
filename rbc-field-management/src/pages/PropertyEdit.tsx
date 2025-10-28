import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, XIcon, HomeIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AddressAutocomplete } from '../components/AddressAutocomplete'
import { logActivity, ActivityTypes, getEntityActivities, ActivityLog } from '../utils/activityLogger'

interface Customer {
  id: string
  company_name: string
}

interface PropertyNote {
  timestamp: string
  note: string
}

interface AdditionalAccess {
  id: string
  location: string
  access_type: string
  access_info: string
}

export default function PropertyEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'address' | 'info' | 'payment' | 'notes'>('address')

  // Property Information
  const [propertyData, setPropertyData] = useState({
    customer_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    building_type: '',
    units: '',
    stories: '',
    access_type: '',
    access_info: '',
    payment_method: '',
    sales_tax_status: '',
  })

  const [additionalAccess, setAdditionalAccess] = useState<AdditionalAccess[]>([])
  const [notes, setNotes] = useState('')
  const [propertyNotes, setPropertyNotes] = useState<PropertyNote[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])

  const buildingTypes = ['Residential', 'Commercial', 'Office', 'Other']
  const accessTypes = ['Keypad', 'Key', 'Keyfob', 'Lockbox', 'Numberlock', 'Other']
  const paymentMethods = ['Check', 'CC', 'ACH', 'Other']
  const salesTaxStatuses = ['Taxable', 'Non-Taxable', 'Exempt']

  useEffect(() => {
    fetchCustomers()
    if (id) fetchProperty()
  }, [id])

  useEffect(() => {
    if (id) {
      fetchActivities()
    }
  }, [id])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .order('company_name')
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      alert('Error loading customers: ' + (error as any).message)
    }
  }

  const fetchProperty = async () => {
    try {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (propertyError) throw propertyError

      setPropertyData({
        customer_id: property.customer_id || '',
        name: property.name || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zip: property.zip_code || '',
        building_type: property.building_type || '',
        units: property.units?.toString() || '',
        stories: property.stories?.toString() || '',
        access_type: property.access_type || '',
        access_info: property.access_info || '',
        payment_method: property.payment_method || '',
        sales_tax_status: property.sales_tax_status || '',
      })

      // Fetch notes if available
      if (property.notes && Array.isArray(property.notes)) {
        setPropertyNotes(property.notes)
      }

      // Fetch additional access if available
      if (property.additional_access && Array.isArray(property.additional_access)) {
        const formattedAccess = property.additional_access.map((a: any, index: number) => ({
          id: `access-${index}`,
          location: a.location || '',
          access_type: a.access_type || '',
          access_info: a.access_info || '',
        }))
        setAdditionalAccess(formattedAccess)
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      alert('Error loading property: ' + (error as any).message)
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

  const addNote = () => {
    if (notes.trim()) {
      const newNote: PropertyNote = {
        timestamp: new Date().toISOString(),
        note: notes.trim(),
      }
      setPropertyNotes([newNote, ...propertyNotes])
      setNotes('')
    }
  }

  const removeNote = (timestamp: string) => {
    setPropertyNotes(propertyNotes.filter((n) => n.timestamp !== timestamp))
  }

  const handleAddressChange = (address: string) => {
    setPropertyData({ ...propertyData, address })
  }

  const handleAddressSelect = (addressData: any) => {
    setPropertyData({
      ...propertyData,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
    })
  }

  const addAdditionalAccess = () => {
    const newAccess: AdditionalAccess = {
      id: Date.now().toString(),
      location: '',
      access_type: '',
      access_info: '',
    }
    setAdditionalAccess([...additionalAccess, newAccess])
  }

  const removeAdditionalAccess = (id: string) => {
    setAdditionalAccess(additionalAccess.filter((a) => a.id !== id))
  }

  const updateAdditionalAccess = (id: string, field: string, value: string) => {
    setAdditionalAccess(
      additionalAccess.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!propertyData.customer_id) {
        alert('Please select a customer')
        setLoading(false)
        return
      }

      if (!propertyData.name) {
        alert('Property name is required')
        setLoading(false)
        return
      }

      // Prepare additional access data
      const additionalAccessData = additionalAccess
        .filter((a) => a.location && a.access_type && a.access_info)
        .map((a) => ({
          location: a.location,
          access_type: a.access_type,
          access_info: a.access_info,
        }))

      // Update property
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          customer_id: propertyData.customer_id,
          name: propertyData.name,
          address: propertyData.address || null,
          city: propertyData.city || null,
          state: propertyData.state || null,
          zip_code: propertyData.zip || null,
          building_type: propertyData.building_type || null,
          units: propertyData.units ? parseInt(propertyData.units) : null,
          stories: propertyData.stories ? parseInt(propertyData.stories) : null,
          access_type: propertyData.access_type || null,
          access_info: propertyData.access_info || null,
          additional_access: additionalAccessData.length > 0 ? additionalAccessData : null,
          payment_method: propertyData.payment_method || null,
          sales_tax_status: propertyData.sales_tax_status || null,
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update notes
      if (propertyNotes.length > 0) {
        const { error: notesError } = await supabase
          .from('properties')
          .update({ notes: propertyNotes })
          .eq('id', id)
        if (notesError) throw notesError
      }

      // Log activity
      await logActivity({
        activity_type: ActivityTypes.PROPERTY_UPDATED,
        entity_type: 'property',
        entity_id: id!,
        description: `Property "${propertyData.name}" updated`,
      })

      alert('Property updated successfully!')
      navigate('/properties')
    } catch (error) {
      console.error('Error updating property:', error)
      alert('Error updating property: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Properties</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <HomeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
              <p className="text-gray-600">Update property information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'address'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'payment'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payment and Sales Tax
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes and Activity
              </button>
            </div>
            <div className="p-6">
              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        required
                        value={propertyData.customer_id}
                        onChange={(e) =>
                          setPropertyData({ ...propertyData, customer_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={propertyData.name}
                        onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Main Office Building"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <AddressAutocomplete
                        value={propertyData.address}
                        onChange={handleAddressChange}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Enter full address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={propertyData.city}
                        onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={propertyData.state}
                        onChange={(e) => setPropertyData({ ...propertyData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={propertyData.zip}
                        onChange={(e) => setPropertyData({ ...propertyData, zip: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Building Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Building Type
                      </label>
                      <select
                        value={propertyData.building_type}
                        onChange={(e) =>
                          setPropertyData({ ...propertyData, building_type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type</option>
                        {buildingTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                      <input
                        type="number"
                        value={propertyData.units}
                        onChange={(e) => setPropertyData({ ...propertyData, units: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stories</label>
                      <input
                        type="number"
                        value={propertyData.stories}
                        onChange={(e) =>
                          setPropertyData({ ...propertyData, stories: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 3"
                      />
                    </div>
                  </div>

                  {/* Access Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Access Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Type
                      </label>
                      <select
                        value={propertyData.access_type}
                        onChange={(e) =>
                          setPropertyData({ ...propertyData, access_type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select access type</option>
                        {accessTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Info
                      </label>
                      <input
                        type="text"
                        value={propertyData.access_info}
                        onChange={(e) =>
                          setPropertyData({ ...propertyData, access_info: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Code: 1234 or Location: Under mat"
                      />
                    </div>

                    {/* Additional Access */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900">Additional Access</h4>
                      {additionalAccess.map((access) => (
                        <div key={access.id} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input
                            type="text"
                            value={access.location}
                            onChange={(e) => updateAdditionalAccess(access.id, 'location', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Location (e.g., Basement)"
                          />
                          <select
                            value={access.access_type}
                            onChange={(e) =>
                              updateAdditionalAccess(access.id, 'access_type', e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select type</option>
                            {accessTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={access.access_info}
                            onChange={(e) =>
                              updateAdditionalAccess(access.id, 'access_info', e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Access info"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalAccess(access.id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addAdditionalAccess}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Additional Access
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={propertyData.payment_method}
                      onChange={(e) =>
                        setPropertyData({ ...propertyData, payment_method: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Tax Status
                    </label>
                    <select
                      value={propertyData.sales_tax_status}
                      onChange={(e) =>
                        setPropertyData({ ...propertyData, sales_tax_status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select status</option>
                      {salesTaxStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          addNote()
                        }
                      }}
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a note... (Ctrl+Enter to submit)"
                    />
                    <button
                      type="button"
                      onClick={addNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start"
                    >
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-3">
                    {propertyNotes.length > 0 ? (
                      propertyNotes
                        .slice()
                        .reverse()
                        .map((note) => (
                          <div key={note.timestamp} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{note.note}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(note.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNote(note.timestamp)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <XIcon className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No notes yet</p>
                    )}
                  </div>

                  {/* Activity Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity</h4>
                    {activities.length > 0 ? (
                      <div className="space-y-2">
                        {activities.map((activity) => (
                          <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recent activity</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Property'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
