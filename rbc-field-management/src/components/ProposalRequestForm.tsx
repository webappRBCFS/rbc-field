import React, { useState } from 'react'
import {
  XIcon,
  UploadIcon,
  LinkIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  BuildingIcon,
  DollarSignIcon,
  FileTextIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { AddressAutocomplete } from './AddressAutocomplete'
import { supabase } from '../lib/supabase'

interface ProposalRequestFormProps {
  onClose: () => void
  onSuccess: () => void
  initialLeadId?: string
  initialCustomerId?: string
}

interface Attachment {
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

interface BlueprintLink {
  title: string
  url: string
  description: string
}

export function ProposalRequestForm({
  onClose,
  onSuccess,
  initialLeadId,
  initialCustomerId,
}: ProposalRequestFormProps) {
  const [leads, setLeads] = React.useState<any[]>([])
  const [customers, setCustomers] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [properties, setProperties] = React.useState<any[]>([])
  const [ownerType, setOwnerType] = React.useState<'lead' | 'customer'>(
    initialLeadId ? 'lead' : initialCustomerId ? 'customer' : 'lead'
  )
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    property_type: '',
    square_footage: '',
    estimated_budget: '',
    preferred_start_date: '',
    preferred_completion_date: '',
    urgency_level: 'normal',
    special_requirements: '',
    accessibility_needs: '',
    existing_contractor: false,
    contractor_details: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    lead_id: initialLeadId || '',
    customer_id: initialCustomerId || '',
    property_id: '',
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [blueprintLinks, setBlueprintLinks] = useState<BlueprintLink[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  React.useEffect(() => {
    fetchLeadsAndCustomers()
  }, [])

  React.useEffect(() => {
    if (ownerType === 'lead' && formData.lead_id) {
      fetchProjectsForLead(formData.lead_id)
    } else if (ownerType === 'customer' && formData.customer_id) {
      fetchPropertiesForCustomer(formData.customer_id)
    }
  }, [ownerType, formData.lead_id, formData.customer_id])

  const fetchLeadsAndCustomers = async () => {
    try {
      const [leadsResult, customersResult] = await Promise.all([
        supabase
          .from('leads')
          .select('id, contact_first_name, contact_last_name, company_name')
          .order('company_name'),
        supabase.from('customers').select('id, company_name').order('company_name'),
      ])
      setLeads(leadsResult.data || [])
      setCustomers(customersResult.data || [])
    } catch (error) {
      console.error('Error fetching leads and customers:', error)
    }
  }

  const fetchProjectsForLead = async (leadId: string) => {
    try {
      const { data: leadData, error } = await supabase
        .from('leads')
        .select('projects')
        .eq('id', leadId)
        .single()
      if (error) throw error
      setProjects(leadData?.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    }
  }

  const fetchPropertiesForCustomer = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, property_name, property_address')
        .eq('customer_id', customerId)
        .order('property_name')
      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties([])
    }
  }

  const projectTypes = [
    { value: 'deep_clean', label: 'Deep Clean' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'post_construction', label: 'Post-Construction Cleanup' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'office_cleaning', label: 'Office Cleaning' },
    { value: 'move_in_out', label: 'Move In/Out Cleaning' },
    { value: 'event_cleaning', label: 'Event Cleaning' },
    { value: 'other', label: 'Other' },
  ]

  const propertyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'multi_unit', label: 'Multi-Unit Building' },
    { value: 'office', label: 'Office Building' },
    { value: 'retail', label: 'Retail Space' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'other', label: 'Other' },
  ]

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Project title is required'
    if (!formData.property_address.trim())
      newErrors.property_address = 'Property address is required'
    if (!formData.contact_name.trim()) newErrors.contact_name = 'Contact name is required'
    if (!formData.contact_email.trim()) newErrors.contact_email = 'Contact email is required'
    if (!formData.project_type) newErrors.project_type = 'Project type is required'
    if (!formData.property_type) newErrors.property_type = 'Property type is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.contact_email && !emailRegex.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = async (file: File) => {
    try {
      // In a real implementation, you would upload to a file storage service
      // For now, we'll simulate the upload
      const attachment: Attachment = {
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for demo
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      }
      setAttachments((prev) => [...prev, attachment])
    } catch (error) {
      console.error('File upload error:', error)
      alert('Error uploading file')
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const addBlueprintLink = () => {
    setBlueprintLinks((prev) => [...prev, { title: '', url: '', description: '' }])
  }

  const updateBlueprintLink = (index: number, field: keyof BlueprintLink, value: string) => {
    setBlueprintLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    )
  }

  const removeBlueprintLink = (index: number) => {
    setBlueprintLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddressSelect = (address: {
    address: string
    city: string
    state: string
    zip: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      property_address: address.address,
      property_city: address.city,
      property_state: address.state,
      property_zip: address.zip,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')

      const { error } = await supabase.from('proposal_requests').insert({
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        property_address: formData.property_address,
        property_city: formData.property_city,
        property_state: formData.property_state,
        property_zip: formData.property_zip,
        property_type: formData.property_type,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        preferred_start_date: formData.preferred_start_date || null,
        preferred_completion_date: formData.preferred_completion_date || null,
        urgency_level: formData.urgency_level,
        special_requirements: formData.special_requirements,
        accessibility_needs: formData.accessibility_needs,
        existing_contractor: formData.existing_contractor,
        contractor_details: formData.contractor_details,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        company_name: formData.company_name,
        lead_id: formData.lead_id || null,
        customer_id: formData.customer_id || null,
        property_id: formData.property_id || null,
        attachments: attachments,
        blueprint_links: blueprintLinks,
        status: 'submitted',
      })

      if (error) throw error

      alert('Proposal request submitted successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting proposal request:', error)
      alert('Error submitting proposal request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit Proposal Request</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Owner Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Type</label>
                  <select
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value as 'lead' | 'customer')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                {ownerType === 'lead' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lead</label>
                    <select
                      value={formData.lead_id}
                      onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a Lead</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {ownerType === 'customer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Project/Property Selection */}
            {ownerType === 'lead' && formData.lead_id && projects.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Project</h3>
                <select
                  value={formData.property_id}
                  onChange={(e) => {
                    const project = projects.find((p) => p.id === e.target.value)
                    if (project) {
                      setFormData({
                        ...formData,
                        property_id: project.id,
                        property_address: project.address || '',
                        property_city: project.city || '',
                        property_state: project.state || '',
                        property_zip: project.zip || '',
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.type} - {project.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {ownerType === 'customer' && formData.customer_id && properties.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Property</h3>
                <select
                  value={formData.property_id}
                  onChange={(e) => {
                    const property = properties.find((p) => p.id === e.target.value)
                    if (property) {
                      setFormData({
                        ...formData,
                        property_id: property.id,
                        property_address: property.property_address || '',
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.property_name} - {property.property_address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Project Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Office Building Deep Clean"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.project_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.project_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.project_type}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the project requirements, scope, and any specific needs..."
                  />
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Property Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address *
                  </label>
                  <AddressAutocomplete
                    value={formData.property_address}
                    onChange={(value) => setFormData({ ...formData, property_address: value })}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing address..."
                    className={errors.property_address ? 'border-red-500' : ''}
                  />
                  {errors.property_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.property_address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.property_city}
                    onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.property_state}
                    onChange={(e) => setFormData({ ...formData, property_state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.property_zip}
                    onChange={(e) => setFormData({ ...formData, property_zip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.property_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.property_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.property_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    value={formData.square_footage}
                    onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2500"
                  />
                </div>
              </div>
            </div>

            {/* Timeline & Budget */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Timeline & Budget
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, preferred_start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferred_completion_date}
                    onChange={(e) =>
                      setFormData({ ...formData, preferred_completion_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency_level}
                    onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Budget
                  </label>
                  <div className="relative">
                    <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_budget}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_budget: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5000.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.contact_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.contact_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.contact_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.contact_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC Corporation"
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5" />
                Special Requirements
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements
                  </label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, special_requirements: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requirements, preferences, or constraints..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accessibility Needs
                  </label>
                  <textarea
                    value={formData.accessibility_needs}
                    onChange={(e) =>
                      setFormData({ ...formData, accessibility_needs: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any accessibility requirements or considerations..."
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.existing_contractor}
                      onChange={(e) =>
                        setFormData({ ...formData, existing_contractor: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Working with existing contractor</span>
                  </label>
                </div>

                {formData.existing_contractor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contractor Details
                    </label>
                    <textarea
                      value={formData.contractor_details}
                      onChange={(e) =>
                        setFormData({ ...formData, contractor_details: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Details about the existing contractor and their role..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* File Attachments */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                File Attachments
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(handleFileUpload)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload photos, documents, or other files related to the project
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white border rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <FileTextIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{attachment.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Blueprint Links */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Blueprint & Document Links
              </h3>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={addBlueprintLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Blueprint Link
                </button>

                {blueprintLinks.map((link, index) => (
                  <div key={index} className="p-4 bg-white border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Link {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeBlueprintLink(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateBlueprintLink(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Floor Plan, Blueprint"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateBlueprintLink(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/blueprint.pdf"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={link.description}
                          onChange={(e) =>
                            updateBlueprintLink(index, 'description', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Brief description of the document"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
