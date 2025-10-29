import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  EditIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FileTextIcon,
  UserCheckIcon,
  SaveIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { convertLeadToCustomer } from '../lib/leadConversion'
import { getEntityActivities, ActivityLog, logActivity } from '../utils/activityLogger'

interface Lead {
  id: string
  company_name?: string
  company_address?: string
  company_address_line_2?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  contacts?: Array<{
    id: string
    name: string
    phone: string
    extension?: string
    cell: string
    email: string
  }>
  projects?: Array<{
    id: string
    type: string
    address: string
    address_line_2?: string
    city?: string
    state?: string
    zip?: string
    unit_count: string
    work_type: string
    notes: string
  }>
  lead_notes?: Array<{ timestamp: string; note: string }>
  next_activity_date?: string
  contact_first_name: string
  contact_last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  property_type?: string
  property_type_detail?: string
  property_sqft?: number
  unit_count?: number
  service_needs?: string
  service_category?: string
  estimated_budget?: number
  billing_preference?: string
  lead_source_id?: string
  lead_source_other?: string
  stage: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  converted_to_customer_id?: string
  expected_close_date?: string
  created_at: string
  updated_at: string
  custom_fields: any
}

interface LeadSource {
  id: string
  name: string
  is_active: boolean
}

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

export function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewModalTab, setViewModalTab] = useState<'company' | 'contacts' | 'projects' | 'notes'>(
    'company'
  )
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({})
  const [saving, setSaving] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [newLeadNote, setNewLeadNote] = useState('')
  const [savingLeadNote, setSavingLeadNote] = useState(false)
  const [leadActivities, setLeadActivities] = useState<ActivityLog[]>([])
  const [isEditingNextActivityDate, setIsEditingNextActivityDate] = useState(false)
  const [nextActivityDateValue, setNextActivityDateValue] = useState<string>('')
  const [savingNextActivityDate, setSavingNextActivityDate] = useState(false)
  const [conversionData, setConversionData] = useState({
    company_name: '',
    contact_first_name: '',
    contact_last_name: '',
    email: '',
    phone: '',
    billing_address: '',
    billing_city: '',
    billing_state: '',
    billing_zip_code: '',
    properties: [] as Array<{
      name: string
      address: string
      type: string
      unit_count: string
      notes: string
    }>,
  })

  useEffect(() => {
    fetchLeads()
    fetchLeadSources()
    fetchUsers()
    fetchServiceCategories()
  }, [])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching leads:', error)
        throw error
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
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
        .eq('is_active', true)
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
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServiceCategories(data || [])
    } catch (error) {
      console.error('Error fetching service categories:', error)
    }
  }

  const getServiceCategoryName = (categoryId: string) => {
    const category = serviceCategories.find((c) => c.id === categoryId)
    return category ? category.name : categoryId
  }

  const updateLeadStage = async (leadId: string, newStage: Lead['stage']) => {
    try {
      const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', leadId)

      if (error) throw error
      fetchLeads()
    } catch (error) {
      console.error('Error updating lead stage:', error)
    }
  }

  const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return 'Not set'
    // Format date consistently - convert YYYY-MM-DD to readable format
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead)
    setShowViewModal(true)
    setNewLeadNote('') // Reset note input when opening modal
    // Ensure date is in YYYY-MM-DD format for the input field
    if (lead.next_activity_date) {
      const date = new Date(lead.next_activity_date + 'T00:00:00')
      const formattedDate = date.toISOString().split('T')[0]
      setNextActivityDateValue(formattedDate)
    } else {
      setNextActivityDateValue('')
    }
    setIsEditingNextActivityDate(false)
    if (lead.id) {
      try {
        const acts = await getEntityActivities('lead', lead.id)
        setLeadActivities(acts)
      } catch (error) {
        console.error('Error fetching lead activities:', error)
      }
    }
  }

  const handleAddLeadNote = async () => {
    if (!newLeadNote.trim() || !selectedLead?.id) return

    setSavingLeadNote(true)
    try {
      const noteToAdd = {
        timestamp: new Date().toISOString(),
        note: newLeadNote.trim(),
      }

      const currentNotes = selectedLead.lead_notes || []
      const updatedNotes = [...currentNotes, noteToAdd]

      const { error } = await supabase
        .from('leads')
        .update({ lead_notes: updatedNotes })
        .eq('id', selectedLead.id)

      if (error) throw error

      // Update local state
      setSelectedLead((prev) => (prev ? { ...prev, lead_notes: updatedNotes } : null))

      // Update leads list
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === selectedLead.id ? { ...lead, lead_notes: updatedNotes } : lead
        )
      )

      setNewLeadNote('')
    } catch (error) {
      console.error('Error adding lead note:', error)
      alert('Error adding note')
    } finally {
      setSavingLeadNote(false)
    }
  }

  const handleSaveNextActivityDate = async () => {
    if (!selectedLead?.id) return

    setSavingNextActivityDate(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ next_activity_date: nextActivityDateValue || null })
        .eq('id', selectedLead.id)

      if (error) throw error

      // Update local state
      setSelectedLead((prev) =>
        prev ? { ...prev, next_activity_date: nextActivityDateValue || undefined } : null
      )

      // Update leads list
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === selectedLead.id
            ? { ...lead, next_activity_date: nextActivityDateValue || undefined }
            : lead
        )
      )

      setIsEditingNextActivityDate(false)

      // Log activity
      await logActivity({
        activity_type: 'next_activity_date_updated',
        entity_type: 'lead',
        entity_id: selectedLead.id,
        description: `Next activity date ${
          nextActivityDateValue ? `set to ${nextActivityDateValue}` : 'cleared'
        }`,
      })

      fetchLeads()
      if (selectedLead.id) {
        const acts = await getEntityActivities('lead', selectedLead.id)
        setLeadActivities(acts)
      }
    } catch (error) {
      console.error('Error updating next activity date:', error)
      alert('Error updating next activity date')
    } finally {
      setSavingNextActivityDate(false)
    }
  }

  const handleCancelEditNextActivityDate = () => {
    // Reset to the current value from selectedLead, formatted for the date input
    if (selectedLead?.next_activity_date) {
      const date = new Date(selectedLead.next_activity_date + 'T00:00:00')
      const formattedDate = date.toISOString().split('T')[0]
      setNextActivityDateValue(formattedDate)
    } else {
      setNextActivityDateValue('')
    }
    setIsEditingNextActivityDate(false)
  }

  const handleEditLead = (lead: Lead) => {
    navigate(`/leads/edit/${lead.id}`)
  }

  const handleCreateProposal = (lead: Lead) => {
    // Navigate to proposals page with lead ID
    window.location.href = `/proposals?leadId=${lead.id}`
  }

  const handleConvertToCustomer = async (lead: Lead) => {
    // Populate the conversion form with lead data
    const primaryContact = lead.contacts && lead.contacts[0] ? lead.contacts[0] : null

    const properties =
      lead.projects && lead.projects.length > 0
        ? lead.projects.map((p) => {
            // Build full address: street + address_line_2 + city + state + zip
            const streetAddressParts = [p.address]
            if (p.address_line_2) {
              streetAddressParts.push(p.address_line_2)
            }
            const streetAddress = streetAddressParts.join(', ')

            // Combine all address components into full address
            const fullAddressParts = [streetAddress]
            if (p.city) fullAddressParts.push(p.city)
            if (p.state) fullAddressParts.push(p.state)
            if (p.zip) fullAddressParts.push(p.zip)
            const fullAddress = fullAddressParts.join(', ')

            return {
              name: p.address || 'Property',
              address: fullAddress || p.address || '',
              type: p.type || '',
              unit_count: p.unit_count || '',
              notes: p.notes || '',
            }
          })
        : []

    setConversionData({
      company_name: lead.company_name || '',
      contact_first_name: primaryContact?.name || lead.contact_first_name || '',
      contact_last_name: lead.contact_last_name || '',
      email: primaryContact?.email || lead.email || '',
      phone: primaryContact?.phone || lead.phone || '',
      billing_address: lead.company_address || lead.address || '',
      billing_city: lead.city || '',
      billing_state: lead.state || '',
      billing_zip_code: lead.zip_code || '',
      properties: properties,
    })

    setSelectedLead(lead)
    setShowConvertModal(true)
  }

  const handleConfirmConversion = async () => {
    if (!selectedLead) return

    try {
      setConverting(true)
      const customerId = await convertLeadToCustomer(selectedLead.id)
      alert('Lead converted to customer successfully!')
      setShowConvertModal(false)
      setSelectedLead(null)
      fetchLeads() // Refresh the list
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Error converting lead: ' + (error as any).message)
    } finally {
      setConverting(false)
    }
  }

  const handleConversionFormChange = (field: string, value: any) => {
    setConversionData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePropertyChange = (index: number, field: string, value: string) => {
    setConversionData((prev) => ({
      ...prev,
      properties: prev.properties.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }))
  }

  const addProperty = () => {
    setConversionData((prev) => ({
      ...prev,
      properties: [
        ...prev.properties,
        { name: '', address: '', type: '', unit_count: '', notes: '' },
      ],
    }))
  }

  const removeProperty = (index: number) => {
    setConversionData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }))
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setSelectedLead(null)
    setEditFormData({})
    setSaving(false)
    setViewModalTab('company')
    setIsEditingNextActivityDate(false)
    setNextActivityDateValue('')
  }

  const handleFormChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdateLead = async () => {
    if (!selectedLead) return

    // Validate required fields
    if (!editFormData.contact_first_name || !editFormData.contact_last_name) {
      alert('First name and last name are required.')
      return
    }

    setSaving(true)

    // Clean the data - convert empty strings to null for UUID fields
    const cleanedData: any = { ...editFormData }

    // Convert empty strings to null for UUID fields
    if (cleanedData.assigned_to === '') {
      cleanedData.assigned_to = null
    }
    if (cleanedData.lead_source_id === '') {
      cleanedData.lead_source_id = null
    }

    // Convert empty strings to null for optional fields
    const optionalFields = [
      'company_name',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip_code',
      'property_type',
      'service_needs',
      'lead_source_other',
      'expected_close_date',
    ]
    optionalFields.forEach((field) => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null
      }
    })

    // Convert empty strings to null for numeric fields
    if (cleanedData.property_sqft === '' || cleanedData.property_sqft === undefined) {
      cleanedData.property_sqft = null
    }
    if (cleanedData.estimated_budget === '' || cleanedData.estimated_budget === undefined) {
      cleanedData.estimated_budget = null
    }

    const updateData = {
      ...cleanedData,
      updated_at: new Date().toISOString(),
    }

    try {
      console.log('Attempting to update lead with data:', updateData)
      console.log('Lead ID:', selectedLead.id)

      const { error } = await supabase.from('leads').update(updateData).eq('id', selectedLead.id)

      if (error) throw error

      // Refresh the leads list
      await fetchLeads()

      // Close the modal
      handleCloseModals()

      console.log('Lead updated successfully')
    } catch (error: any) {
      console.error('Error updating lead:', error)
      console.error('Update data:', updateData)
      console.error('Selected lead ID:', selectedLead.id)
      alert(
        `Failed to update lead: ${error.message || 'Unknown error'}. Check console for details.`
      )
    } finally {
      setSaving(false)
    }
  }

  const getStageColor = (stage: Lead['stage']) => {
    switch (stage) {
      case 'new':
        return 'bg-gray-100 text-gray-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800'
      case 'proposal_sent':
        return 'bg-purple-100 text-purple-800'
      case 'won':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)

    const matchesStage = filterStage === 'all' || lead.stage === filterStage
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority

    return matchesSearch && matchesStage && matchesPriority
  })

  const stageStats = {
    new: leads.filter((l) => l.stage === 'new').length,
    contacted: leads.filter((l) => l.stage === 'contacted').length,
    qualified: leads.filter((l) => l.stage === 'qualified').length,
    proposal_sent: leads.filter((l) => l.stage === 'proposal_sent').length,
    won: leads.filter((l) => l.stage === 'won').length,
    lost: leads.filter((l) => l.stage === 'lost').length,
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading leads...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <p className="mt-1 text-gray-600">Track and manage your sales pipeline</p>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                fetchLeads()
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <SearchIcon className="w-4 h-4" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.new}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-gray-600">
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.contacted}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <PhoneIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualified</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.qualified}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proposal Sent</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.proposal_sent}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <MailIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.won}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lost</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stageStats.lost}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <TrendingDownIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stages</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button
              onClick={() => navigate('/leads/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Leads ({filteredLeads.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Needs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => handleViewLead(lead)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                        >
                          {lead.contact_first_name} {lead.contact_last_name}
                        </button>
                        {lead.company_name && (
                          <div className="text-sm text-gray-500">{lead.company_name}</div>
                        )}
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {lead.email && (
                            <>
                              <MailIcon className="w-3 h-3" />
                              {lead.email}
                            </>
                          )}
                        </div>
                        {lead.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.address && (
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {lead.address}
                        </div>
                      )}
                      {lead.property_type && (
                        <div className="text-sm text-gray-500">{lead.property_type}</div>
                      )}
                      {lead.property_sqft && (
                        <div className="text-sm text-gray-500">
                          {lead.property_sqft.toLocaleString()} sq ft
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">{lead.service_needs}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.estimated_budget ? `$${lead.estimated_budget.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.lead_source_other || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.stage}
                        onChange={(e) => updateLeadStage(lead.id, e.target.value as Lead['stage'])}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStageColor(
                          lead.stage
                        )}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal_sent">Proposal Sent</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          lead.priority
                        )}`}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.assigned_to ? 'Assigned' : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1 sm:gap-2">
                        {lead.converted_to_customer_id ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold">
                            <UserCheckIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Customer</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCreateProposal(lead)}
                              className="p-1 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                              title="Create Proposal"
                            >
                              <FileTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={() => handleConvertToCustomer(lead)}
                              className="p-1 sm:p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-md transition-colors"
                              title="Convert to Customer"
                            >
                              <UserCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Lead Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">View Lead</h3>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setViewModalTab('company')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-center ${
                    viewModalTab === 'company'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Company
                </button>
                <button
                  onClick={() => setViewModalTab('contacts')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-center ${
                    viewModalTab === 'contacts'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Contacts
                </button>
                <button
                  onClick={() => setViewModalTab('projects')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-center ${
                    viewModalTab === 'projects'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setViewModalTab('notes')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-center ${
                    viewModalTab === 'notes'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Notes & Activity
                </button>
              </div>

              {/* Company Tab */}
              {viewModalTab === 'company' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Company Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLead.company_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Address
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLead.company_address || 'N/A'}
                        {selectedLead.company_address_line_2 && (
                          <>
                            <br />
                            {selectedLead.company_address_line_2}
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Phone
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLead.company_phone ? (
                          <a
                            href={`tel:${selectedLead.company_phone.replace(/\D/g, '')}`}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {selectedLead.company_phone}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Email
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLead.company_email || 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Company Website
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLead.company_website ? (
                          <a
                            href={
                              selectedLead.company_website.startsWith('http')
                                ? selectedLead.company_website
                                : `https://${selectedLead.company_website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {selectedLead.company_website}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contacts Tab */}
              {viewModalTab === 'contacts' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {selectedLead.contacts && selectedLead.contacts.length > 0 ? (
                      selectedLead.contacts.map((contact, index) => (
                        <div key={contact.id || index} className="border-l-2 border-green-500 pl-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Name
                              </label>
                              <p className="text-sm text-gray-900">{contact.name || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Phone
                                {contact.extension && (
                                  <span className="text-gray-500 font-normal ml-1">
                                    (Ext: {contact.extension})
                                  </span>
                                )}
                              </label>
                              <p className="text-sm text-gray-900">
                                {contact.phone ? (
                                  <a
                                    href={`tel:${contact.phone.replace(/\D/g, '')}`}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {contact.phone}
                                  </a>
                                ) : (
                                  'N/A'
                                )}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Cell
                              </label>
                              <p className="text-sm text-gray-900">
                                {contact.cell ? (
                                  <a
                                    href={`tel:${contact.cell.replace(/\D/g, '')}`}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {contact.cell}
                                  </a>
                                ) : (
                                  'N/A'
                                )}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Email
                              </label>
                              <p className="text-sm text-gray-900">{contact.email || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No contacts found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {viewModalTab === 'projects' && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Projects</h4>
                  <div className="space-y-3">
                    {selectedLead.projects && selectedLead.projects.length > 0 ? (
                      selectedLead.projects.map((project, index) => (
                        <div
                          key={project.id || index}
                          className="border-l-2 border-purple-500 pl-3"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Type
                              </label>
                              <p className="text-sm text-gray-900">{project.type || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Unit Count
                              </label>
                              <p className="text-sm text-gray-900">{project.unit_count || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600">
                                Address
                              </label>
                              <p className="text-sm text-gray-900">
                                {project.address || 'N/A'}
                                {project.address_line_2 && (
                                  <>
                                    <br />
                                    {project.address_line_2}
                                  </>
                                )}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Work Type
                              </label>
                              <p className="text-sm text-gray-900">
                                {project.work_type
                                  ? getServiceCategoryName(project.work_type)
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-600">
                                Notes
                              </label>
                              <p className="text-sm text-gray-900">{project.notes || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No projects found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Notes Tab */}
              {viewModalTab === 'notes' && (
                <div className="space-y-6">
                  {/* Lead Management Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date for Next Activity
                        </label>
                        <div className="mt-1">
                          {isEditingNextActivityDate ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={nextActivityDateValue}
                                onChange={(e) => setNextActivityDateValue(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                disabled={savingNextActivityDate}
                              />
                              <button
                                onClick={handleSaveNextActivityDate}
                                disabled={savingNextActivityDate}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {savingNextActivityDate ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <SaveIcon className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelEditNextActivityDate}
                                disabled={savingNextActivityDate}
                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <CalendarIcon className="w-5 h-5 text-gray-500" />
                                <p className="text-sm text-gray-900">
                                  {formatDateForDisplay(selectedLead.next_activity_date)}
                                </p>
                              </div>
                              <button
                                onClick={() => setIsEditingNextActivityDate(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Notes</h2>

                    {/* Add Note Form */}
                    <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Add Note</h3>
                      <div className="flex gap-2">
                        <textarea
                          value={newLeadNote}
                          onChange={(e) => setNewLeadNote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey && newLeadNote.trim()) {
                              handleAddLeadNote()
                            }
                          }}
                          rows={3}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add a note... (Ctrl+Enter to submit)"
                        />
                        <button
                          onClick={handleAddLeadNote}
                          disabled={!newLeadNote.trim() || savingLeadNote}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start flex items-center gap-2"
                        >
                          {savingLeadNote ? (
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
                      <p className="text-xs text-gray-500 mt-2">
                        Press Ctrl+Enter to quickly submit
                      </p>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-3">
                      {selectedLead.lead_notes && selectedLead.lead_notes.length > 0 ? (
                        selectedLead.lead_notes
                          .slice()
                          .reverse()
                          .map((note, index) => (
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
                    {leadActivities.length > 0 ? (
                      <div className="space-y-3">
                        {leadActivities.map((activity) => (
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
                  handleEditLead(selectedLead)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit Lead
              </button>
              <button
                onClick={() => handleConvertToCustomer(selectedLead)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <UserCheckIcon className="w-4 h-4" />
                Convert to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Lead</h3>
              <button onClick={handleCloseModals} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleUpdateLead()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={editFormData.company_name || ''}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact First Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.contact_first_name || ''}
                    onChange={(e) => handleFormChange('contact_first_name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Last Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.contact_last_name || ''}
                    onChange={(e) => handleFormChange('contact_last_name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Type</label>
                  <select
                    value={editFormData.property_type || ''}
                    onChange={(e) => handleFormChange('property_type', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Property Type</option>
                    <optgroup label="Residential Multi-Unit">
                      <option value="Apartment Complex">Apartment Complex</option>
                      <option value="Condominium Complex">Condominium Complex</option>
                      <option value="Townhouse Community">Townhouse Community</option>
                      <option value="Student Housing">Student Housing</option>
                      <option value="Senior Living Community">Senior Living Community</option>
                    </optgroup>
                    <optgroup label="Office Buildings">
                      <option value="Small Office (1-10 employees)">
                        Small Office (1-10 employees)
                      </option>
                      <option value="Medium Office (11-50 employees)">
                        Medium Office (11-50 employees)
                      </option>
                      <option value="Large Office (50+ employees)">
                        Large Office (50+ employees)
                      </option>
                      <option value="Corporate Headquarters">Corporate Headquarters</option>
                      <option value="Medical Office">Medical Office</option>
                      <option value="Law Firm">Law Firm</option>
                      <option value="Accounting Firm">Accounting Firm</option>
                    </optgroup>
                    <optgroup label="Commercial Properties">
                      <option value="Retail Store">Retail Store</option>
                      <option value="Shopping Center">Shopping Center</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Manufacturing Facility">Manufacturing Facility</option>
                      <option value="Distribution Center">Distribution Center</option>
                    </optgroup>
                    <optgroup label="Specialized Properties">
                      <option value="Post-Construction Cleanup">Post-Construction Cleanup</option>
                      <option value="Apartment Turnover">Apartment Turnover</option>
                      <option value="New Construction">New Construction</option>
                      <option value="Renovation Project">Renovation Project</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Property Type Detail
                  </label>
                  <input
                    type="text"
                    value={editFormData.property_type_detail || ''}
                    onChange={(e) => handleFormChange('property_type_detail', e.target.value)}
                    placeholder="e.g., High-rise, Low-rise, Garden style"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Sq Ft</label>
                  <input
                    type="number"
                    value={editFormData.property_sqft || ''}
                    onChange={(e) => handleFormChange('property_sqft', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Count</label>
                  <input
                    type="number"
                    value={editFormData.unit_count || ''}
                    onChange={(e) => handleFormChange('unit_count', e.target.value)}
                    placeholder="Number of units"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Category
                  </label>
                  <select
                    value={editFormData.service_category || ''}
                    onChange={(e) => handleFormChange('service_category', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Service Category</option>
                    <option value="Maintenance">Maintenance (Janitorial)</option>
                    <option value="Office Cleaning">Office Cleaning</option>
                    <option value="Apartment Turnover">Apartment Turnover</option>
                    <option value="Residential Post-Construction">
                      Residential Post-Construction
                    </option>
                    <option value="Commercial Post-Construction">
                      Commercial Post-Construction
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billing Preference
                  </label>
                  <select
                    value={editFormData.billing_preference || ''}
                    onChange={(e) => handleFormChange('billing_preference', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Billing Preference</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Per Cleaning">Per Cleaning</option>
                    <option value="Per Unit">Per Unit</option>
                    <option value="Per Project">Per Project</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.estimated_budget || ''}
                    onChange={(e) => handleFormChange('estimated_budget', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Service Needs</label>
                <textarea
                  rows={3}
                  value={editFormData.service_needs || ''}
                  onChange={(e) => handleFormChange('service_needs', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage</label>
                  <select
                    value={editFormData.stage || 'new'}
                    onChange={(e) => handleFormChange('stage', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={editFormData.priority || 'medium'}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <select
                    value={editFormData.assigned_to || ''}
                    onChange={(e) => handleFormChange('assigned_to', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Customer Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Convert Lead to Customer</h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Review and confirm the customer information below.</strong> This will:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                <li>Create a new customer record</li>
                <li>Create property records from lead projects</li>
                <li>Mark the lead as "Won"</li>
              </ul>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      type="text"
                      value={conversionData.company_name}
                      onChange={(e) => handleConversionFormChange('company_name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact First Name
                    </label>
                    <input
                      type="text"
                      value={conversionData.contact_first_name}
                      onChange={(e) =>
                        handleConversionFormChange('contact_first_name', e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Last Name
                    </label>
                    <input
                      type="text"
                      value={conversionData.contact_last_name}
                      onChange={(e) =>
                        handleConversionFormChange('contact_last_name', e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={conversionData.email}
                      onChange={(e) => handleConversionFormChange('email', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={conversionData.phone}
                      onChange={(e) => handleConversionFormChange('phone', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={conversionData.billing_address}
                      onChange={(e) =>
                        handleConversionFormChange('billing_address', e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={conversionData.billing_city}
                      onChange={(e) => handleConversionFormChange('billing_city', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={conversionData.billing_state}
                      onChange={(e) => handleConversionFormChange('billing_state', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                    <input
                      type="text"
                      value={conversionData.billing_zip_code}
                      onChange={(e) =>
                        handleConversionFormChange('billing_zip_code', e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Properties */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Properties</h4>
                  <button
                    type="button"
                    onClick={addProperty}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Property
                  </button>
                </div>

                {conversionData.properties.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No properties. Click "Add Property" to add one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {conversionData.properties.map((property, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-gray-900">Property {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeProperty(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Property Name
                            </label>
                            <input
                              type="text"
                              value={property.name}
                              onChange={(e) => handlePropertyChange(index, 'name', e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Address
                            </label>
                            <input
                              type="text"
                              value={property.address}
                              onChange={(e) =>
                                handlePropertyChange(index, 'address', e.target.value)
                              }
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Property Type
                            </label>
                            <input
                              type="text"
                              value={property.type}
                              onChange={(e) => handlePropertyChange(index, 'type', e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Unit Count
                            </label>
                            <input
                              type="text"
                              value={property.unit_count}
                              onChange={(e) =>
                                handlePropertyChange(index, 'unit_count', e.target.value)
                              }
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                              value={property.notes}
                              onChange={(e) => handlePropertyChange(index, 'notes', e.target.value)}
                              rows={2}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConversion}
                disabled={converting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {converting ? 'Converting...' : 'Convert to Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
