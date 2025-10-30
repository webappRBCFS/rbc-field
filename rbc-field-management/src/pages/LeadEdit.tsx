import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, XIcon, BuildingIcon, UserIcon, FileTextIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AddressAutocomplete } from '../components/AddressAutocomplete'

interface LeadSource {
  id: string
  name: string
}

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  name?: string // Keep for backwards compatibility
  phone: string
  extension?: string
  cell: string
  email: string
}

interface Project {
  id: string
  type: string
  address: string
  address_line_2?: string
  city: string
  state: string
  zip: string
  unit_count: string
  work_type: string
  notes: string
}

export default function LeadEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'company' | 'contacts' | 'projects' | 'notes'>(
    'company'
  )
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Company Information
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    address_line_2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
  })

  // Contact Information (array of contacts)
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', first_name: '', last_name: '', phone: '', extension: '', cell: '', email: '' },
  ])

  // Projects (array of projects)
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      type: '',
      address: '',
      address_line_2: '',
      city: '',
      state: '',
      zip: '',
      unit_count: '',
      work_type: '',
      notes: '',
    },
  ])

  // Lead Management
  const [leadData, setLeadData] = useState({
    notes: '',
    lead_source_id: '',
    assigned_to: '',
    next_activity_date: '',
  })

  // Lead Notes (time-stamped)
  const [leadNotes, setLeadNotes] = useState<Array<{ timestamp: string; note: string }>>([])
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchLeadSources()
    fetchUsers()
    fetchServiceCategories()
    if (id) {
      fetchLead()
    }
  }, [id])

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
      if (error) throw error
      if (data) {
        setCompanyData({
          name: data.company_name || '',
          address: data.company_address || '',
          address_line_2: data.company_address_line_2 || '',
          city: data.company_city || '',
          state: data.company_state || '',
          zip: data.company_zip || '',
          phone: data.company_phone || '',
          email: data.company_email || '',
          website: data.company_website || '',
        })
        // Load contacts, handling backwards compatibility with 'name' field
        const loadedContacts = data.contacts || []
        const normalizedContacts = loadedContacts.map((c: any) => {
          // If contact has 'name' but not first_name/last_name, split it
          if (c.name && !c.first_name && !c.last_name) {
            const nameParts = c.name.trim().split(' ')
            return {
              ...c,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
            }
          }
          // Otherwise use first_name/last_name if available, or empty strings
          return {
            ...c,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
          }
        })
        setContacts(
          normalizedContacts.length > 0
            ? normalizedContacts
            : [{ id: '1', first_name: '', last_name: '', phone: '', extension: '', cell: '', email: '' }]
        )
        setProjects(
          data.projects || [
            {
              id: '1',
              type: '',
              address: '',
              address_line_2: '',
              city: '',
              state: '',
              zip: '',
              unit_count: '',
              work_type: '',
              notes: '',
            },
          ]
        )
        setLeadNotes(data.lead_notes || [])
        setLeadData({
          notes: '',
          lead_source_id: data.lead_source_id || '',
          assigned_to: data.assigned_to || '',
          next_activity_date: data.next_activity_date || '',
        })
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
    }
  }

  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setLeadSources(data || [])
    } catch (error) {
      console.error('Error fetching lead sources:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .order('first_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name')
        .order('name')

      if (error) throw error
      setServiceCategories(data || [])
    } catch (error) {
      console.error('Error fetching service categories:', error)
    }
  }

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      first_name: '',
      last_name: '',
      phone: '',
      extension: '',
      cell: '',
      email: '',
    }
    setContacts([...contacts, newContact])
  }

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id))
  }

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      type: '',
      address: '',
      address_line_2: '',
      city: '',
      state: '',
      zip: '',
      unit_count: '',
      work_type: '',
      notes: '',
    }
    setProjects([...projects, newProject])
  }

  const removeProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const updateProjectAddress = (
    id: string,
    addressData: { address: string; city: string; state: string; zip: string }
  ) => {
    setProjects(
      projects.map((p) =>
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
    if (newNote.trim()) {
      setLeadNotes([...leadNotes, { timestamp: new Date().toISOString(), note: newNote.trim() }])
      setNewNote('')
    }
  }

  const removeNote = (timestamp: string) => {
    setLeadNotes(leadNotes.filter((n) => n.timestamp !== timestamp))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get primary contact if exists
      const primaryContact = contacts[0] || null

      // Build update object conditionally to avoid errors if column doesn't exist yet
      const updateData: any = {
        // Company Information
        company_name: companyData.name || null,
        company_address: companyData.address || null,
        company_city: companyData.city || null,
        company_state: companyData.state || null,
        company_zip: companyData.zip || null,
        company_phone: companyData.phone || null,
        company_email: companyData.email || null,
        company_website: companyData.website || null,
      }

      // Only include address_line_2 if it has a value (column may not exist in DB yet)
      if (companyData.address_line_2) {
        updateData.company_address_line_2 = companyData.address_line_2
      }

      const { error } = await supabase
        .from('leads')
        .update({
          ...updateData,

          // Contact Information (primary contact in legacy fields)
          contact_first_name: primaryContact?.first_name || primaryContact?.name?.split(' ')[0] || '',
          contact_last_name: primaryContact?.last_name || primaryContact?.name?.split(' ').slice(1).join(' ') || '',
          phone: primaryContact?.phone || null,
          email: primaryContact?.email || null,

          // New Structured Data Fields
          contacts: contacts.length > 0 && (contacts[0].first_name || contacts[0].last_name || contacts[0].name) ? contacts : [],
          projects: projects.length > 0 && projects[0].type ? projects : [],
          lead_notes: leadNotes.length > 0 ? leadNotes : [],

          // Lead Management
          lead_source_id: leadData.lead_source_id || null,
          assigned_to: leadData.assigned_to || null,
          next_activity_date: leadData.next_activity_date || null,
          stage: 'new' as const,
          priority: 'medium' as const,
        })
        .eq('id', id)

      if (error) throw error

      alert('Lead updated successfully!')
      navigate('/leads')
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Error updating lead: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const projectTypes = [
    'Residential Building',
    'Office Building',
    'Other Building',
    'Single Apartment',
    'Single Office Space',
    'Other Space',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Leads</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
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
                onClick={() => setActiveTab('projects')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects
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
                Notes & Activity
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
                        Company Name
                      </label>
                      <input
                        type="text"
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={companyData.address_line_2}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, address_line_2: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Office #, Suite, Unit, etc."
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
                    <button
                      type="button"
                      onClick={addContact}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Contact
                    </button>
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
                              First Name *
                            </label>
                            <input
                              type="text"
                              required={index === 0}
                              value={contact.first_name}
                              onChange={(e) => updateContact(contact.id, 'first_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              required={index === 0}
                              value={contact.last_name}
                              onChange={(e) => updateContact(contact.id, 'last_name', e.target.value)}
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
                          <div className="flex gap-2">
                            <div className="flex-1">
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
                            <div className="w-24">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ext. <span className="text-gray-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={contact.extension || ''}
                                onChange={(e) =>
                                  updateContact(contact.id, 'extension', e.target.value)
                                }
                                placeholder="Ext"
                                maxLength={10}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
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
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Potential Projects</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {projects.map((project, index) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedProjects(
                              new Set(
                                expandedProjects.has(project.id)
                                  ? Array.from(expandedProjects).filter((id) => id !== project.id)
                                  : [...Array.from(expandedProjects), project.id]
                              )
                            )
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-lg font-medium text-gray-900">
                              Project {index + 1}
                            </span>
                            <span className="text-sm text-gray-600">
                              {project.address || 'No address'}
                            </span>
                          </div>
                          {projects.length > 1 && !expandedProjects.has(project.id) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeProject(project.id)
                              }}
                              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XIcon className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </button>
                        {expandedProjects.has(project.id) && (
                          <div className="border-t border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Type
                                </label>
                                <select
                                  value={project.type}
                                  onChange={(e) =>
                                    updateProject(project.id, 'type', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Type</option>
                                  {projectTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unit Count
                                </label>
                                <input
                                  type="number"
                                  value={project.unit_count}
                                  onChange={(e) =>
                                    updateProject(project.id, 'unit_count', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Address
                                </label>
                                <AddressAutocomplete
                                  key={`project-address-${project.id}`}
                                  value={project.address}
                                  onChange={(address) =>
                                    updateProject(project.id, 'address', address)
                                  }
                                  onAddressSelect={(addressData) =>
                                    updateProjectAddress(project.id, addressData)
                                  }
                                  placeholder="Start typing project address..."
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Apt/Suite #{' '}
                                  <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                  type="text"
                                  value={project.address_line_2 || ''}
                                  onChange={(e) =>
                                    updateProject(project.id, 'address_line_2', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Apartment, Suite, Unit, etc."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={project.city}
                                  onChange={(e) =>
                                    updateProject(project.id, 'city', e.target.value)
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
                                  value={project.state}
                                  onChange={(e) =>
                                    updateProject(project.id, 'state', e.target.value)
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
                                  value={project.zip}
                                  onChange={(e) => updateProject(project.id, 'zip', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="10001"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Work Type
                                </label>
                                <select
                                  value={project.work_type}
                                  onChange={(e) =>
                                    updateProject(project.id, 'work_type', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Work Type</option>
                                  {serviceCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Project Notes
                                </label>
                                <textarea
                                  value={project.notes}
                                  onChange={(e) =>
                                    updateProject(project.id, 'notes', e.target.value)
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              {projects.length > 1 && (
                                <div className="md:col-span-2">
                                  <button
                                    type="button"
                                    onClick={() => removeProject(project.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <XIcon className="w-5 h-5" />
                                    Remove Project
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
                      onClick={addProject}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Add Project
                    </button>
                  </div>
                </div>
              )}

              {/* Notes & Activity Tab */}
              {activeTab === 'notes' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  {/* Lead Management Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lead Source
                        </label>
                        <select
                          value={leadData.lead_source_id}
                          onChange={(e) =>
                            setLeadData({ ...leadData, lead_source_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Source</option>
                          {leadSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned To
                        </label>
                        <select
                          value={leadData.assigned_to}
                          onChange={(e) =>
                            setLeadData({ ...leadData, assigned_to: e.target.value })
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date for Next Activity
                        </label>
                        <input
                          type="date"
                          value={leadData.next_activity_date}
                          onChange={(e) =>
                            setLeadData({ ...leadData, next_activity_date: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead Notes Section */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Notes</h2>
                    <div className="flex gap-2 mb-4">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
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
                      {leadNotes.length > 0 ? (
                        leadNotes
                          .slice()
                          .reverse()
                          .map((note) => (
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
              onClick={() => navigate('/leads')}
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
              {loading ? 'Updating...' : 'Update Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
