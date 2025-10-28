import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, XIcon, BuildingIcon, UserIcon, MapPinIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AddressAutocomplete } from '../components/AddressAutocomplete'

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface Contact {
  id: string
  name: string
  phone: string
  cell: string
  email: string
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  property_type: string
  sqft: string
  notes: string
}

interface CustomerNote {
  timestamp: string
  note: string
}

export default function CustomerCreate() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'company' | 'contacts' | 'properties' | 'notes'>(
    'company'
  )

  // Company Information
  const [companyData, setCompanyData] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', phone: '', cell: '', email: '' },
  ])

  // Properties
  const [properties, setProperties] = useState<Property[]>([
    {
      id: '1',
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      property_type: '',
      sqft: '',
      notes: '',
    },
  ])
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())

  // Customer Management
  const [customerData, setCustomerData] = useState({
    status: 'active',
    assigned_to: '',
  })

  const [notes, setNotes] = useState('')
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      cell: '',
      email: '',
    }
    setContacts([...contacts, newContact])
  }

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id))
  }

  const updateContact = (id: string, field: string, value: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const addProperty = () => {
    const newProperty: Property = {
      id: Date.now().toString(),
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      property_type: '',
      sqft: '',
      notes: '',
    }
    setProperties([...properties, newProperty])
  }

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id))
  }

  const updateProperty = (id: string, field: string, value: string) => {
    setProperties(properties.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const updatePropertyAddress = (id: string, addressData: any) => {
    setProperties(
      properties.map((p) =>
        p.id === id
          ? {
              ...p,
              address: addressData.address,
              city: addressData.city,
              state: addressData.state,
              zip: addressData.zip,
            }
          : p
      )
    )
  }

  const addNote = () => {
    if (notes.trim()) {
      const newNote: CustomerNote = {
        timestamp: new Date().toISOString(),
        note: notes.trim(),
      }
      setCustomerNotes([newNote, ...customerNotes])
      setNotes('')
    }
  }

  const removeNote = (timestamp: string) => {
    setCustomerNotes(customerNotes.filter((n) => n.timestamp !== timestamp))
  }

  const propertyTypes = [
    'Residential Building',
    'Office Building',
    'Other Building',
    'Single Apartment',
    'Single Office Space',
    'Other Space',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get primary contact if exists
      const primaryContact = contacts[0] || null

      // Prepare contacts data (only contacts with names)
      const contactsData = contacts
        .filter((c) => c.name.trim() !== '')
        .map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          cell: c.cell,
          email: c.email,
        }))

      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            company_name: companyData.name || null,
            contact_first_name: primaryContact?.name.split(' ')[0] || '',
            contact_last_name: primaryContact?.name.split(' ').slice(1).join(' ') || '',
            phone: companyData.phone || null,
            email: companyData.email || null,
            address: companyData.address || null,
            city: companyData.city || null,
            state: companyData.state || null,
            zip_code: companyData.zip || null,
            is_active: customerData.status === 'active',
            notes: customerNotes.length > 0 ? customerNotes : null,
            contacts: contactsData.length > 0 ? contactsData : null,
          },
        ])
        .select()
        .single()

      if (customerError) throw customerError

      // Add properties if any
      if (properties.length > 0 && properties[0].name) {
        const propertiesData = properties
          .filter((p) => p.name) // Only add properties with names
          .map((p) => ({
            customer_id: customer.id,
            name: p.name,
            address: p.address || null,
            city: p.city || null,
            state: p.state || null,
            zip_code: p.zip || null,
            property_type: p.property_type || null,
            sqft: p.sqft ? parseInt(p.sqft) : null,
          }))

        if (propertiesData.length > 0) {
          const { error: propertiesError } = await supabase
            .from('properties')
            .insert(propertiesData)
          if (propertiesError) throw propertiesError
        }
      }

      alert('Customer created successfully!')
      navigate('/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Error creating customer: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('company')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'company'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'contacts'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contacts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Properties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes & Management
              </button>
            </div>
            <div className="p-6">
              {/* Company Tab */}
              {activeTab === 'company' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BuildingIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={(e) => {
                          const formatted = e.target.value.replace(/\D/g, '').slice(0, 10)
                          const display =
                            formatted.length > 0
                              ? formatted.length <= 3
                                ? formatted
                                : formatted.length <= 6
                                ? `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`
                                : `(${formatted.slice(0, 3)}) ${formatted.slice(
                                    3,
                                    6
                                  )}-${formatted.slice(6)}`
                              : ''
                          setCompanyData({ ...companyData, phone: display })
                        }}
                        placeholder="(123) 456-7890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="text"
                        value={companyData.website}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, website: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="www.example.com or example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <AddressAutocomplete
                        value={companyData.address}
                        onChange={(address) => setCompanyData({ ...companyData, address })}
                        onAddressSelect={(addressData) =>
                          setCompanyData({
                            ...companyData,
                            address: addressData.address,
                            city: addressData.city,
                            state: addressData.state,
                            zip: addressData.zip,
                          })
                        }
                        placeholder="Start typing address..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={companyData.state}
                        onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="NY"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={companyData.zip}
                        onChange={(e) => setCompanyData({ ...companyData, zip: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Tab */}
              {activeTab === 'contacts' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {contacts.map((contact, index) => (
                      <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Contact {index + 1} {index === 0 && '(Primary)'}
                          </h3>
                          {contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContact(contact.id)}
                              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XIcon className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name *
                            </label>
                            <input
                              type="text"
                              required={index === 0}
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => {
                                const formatted = e.target.value.replace(/\D/g, '').slice(0, 10)
                                const display =
                                  formatted.length > 0
                                    ? formatted.length <= 3
                                      ? formatted
                                      : formatted.length <= 6
                                      ? `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`
                                      : `(${formatted.slice(0, 3)}) ${formatted.slice(
                                          3,
                                          6
                                        )}-${formatted.slice(6)}`
                                    : ''
                                updateContact(contact.id, 'phone', display)
                              }}
                              placeholder="(123) 456-7890"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cell
                            </label>
                            <input
                              type="tel"
                              value={contact.cell}
                              onChange={(e) => {
                                const formatted = e.target.value.replace(/\D/g, '').slice(0, 10)
                                const display =
                                  formatted.length > 0
                                    ? formatted.length <= 3
                                      ? formatted
                                      : formatted.length <= 6
                                      ? `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`
                                      : `(${formatted.slice(0, 3)}) ${formatted.slice(
                                          3,
                                          6
                                        )}-${formatted.slice(6)}`
                                    : ''
                                updateContact(contact.id, 'cell', display)
                              }}
                              placeholder="(123) 456-7890"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addContact}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Contact
                    </button>
                  </div>
                </div>
              )}

              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Properties</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {properties.map((property, index) => (
                      <div key={property.id} className="border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedProperties(
                              new Set(
                                expandedProperties.has(property.id)
                                  ? Array.from(expandedProperties).filter(
                                      (id) => id !== property.id
                                    )
                                  : [...Array.from(expandedProperties), property.id]
                              )
                            )
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-lg font-medium text-gray-900">
                              Property {index + 1}
                            </span>
                            <span className="text-sm text-gray-600">
                              {property.name || 'No name'}
                            </span>
                          </div>
                        </button>
                        {expandedProperties.has(property.id) && (
                          <div className="border-t border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Property Name
                                </label>
                                <input
                                  type="text"
                                  value={property.name}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'name', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Building A, Office Suite, etc."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Type
                                </label>
                                <select
                                  value={property.property_type}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'property_type', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Type</option>
                                  {propertyTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Address
                                </label>
                                <AddressAutocomplete
                                  key={`property-address-${property.id}`}
                                  value={property.address}
                                  onChange={(address) =>
                                    updateProperty(property.id, 'address', address)
                                  }
                                  onAddressSelect={(addressData) =>
                                    updatePropertyAddress(property.id, addressData)
                                  }
                                  placeholder="Start typing property address..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={property.city}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'city', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="City"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  State
                                </label>
                                <input
                                  type="text"
                                  value={property.state}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'state', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="NY"
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Zip Code
                                </label>
                                <input
                                  type="text"
                                  value={property.zip}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'zip', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="10001"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Square Footage
                                </label>
                                <input
                                  type="number"
                                  value={property.sqft}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'sqft', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Notes
                                </label>
                                <textarea
                                  value={property.notes}
                                  onChange={(e) =>
                                    updateProperty(property.id, 'notes', e.target.value)
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Any additional notes about this property..."
                                />
                              </div>
                              {properties.length > 1 && (
                                <div className="md:col-span-2">
                                  <button
                                    type="button"
                                    onClick={() => removeProperty(property.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <XIcon className="w-5 h-5" />
                                    Remove Property
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addProperty}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Property
                    </button>
                  </div>
                </div>
              )}

              {/* Notes & Management Tab */}
              {activeTab === 'notes' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={customerData.status}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, status: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To
                        </label>
                        <select
                          value={customerData.assigned_to}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, assigned_to: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Notes</h2>
                    <div className="flex gap-2 mb-4">
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
                      {customerNotes.length > 0 ? (
                        customerNotes.map((note) => (
                          <div
                            key={note.timestamp}
                            className="flex gap-3 bg-gray-50 rounded-lg p-3"
                          >
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
