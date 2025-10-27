import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  SendIcon,
  XIcon,
  CalculatorIcon,
  FileTextIcon,
  DollarSignIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ProposalBuilderProps {
  leadId?: string
  customerId?: string
  onClose: () => void
  onSave: (proposal: any) => void
}

interface ServiceCategory {
  id: string
  name: string
  description?: string
}

interface ServiceItem {
  id: string
  category_id: string
  name: string
  description?: string
  unit_type: string
  base_price: number
}

interface ProposalLineItem {
  id?: string
  service_item_id?: string
  description: string
  quantity: number
  unit_type: string
  unit_price: number
  total_price: number
  sort_order: number
}

interface ProposalTemplate {
  id: string
  name: string
  description?: string
  template_data: any
}

interface Customer {
  id: string
  company_name?: string
  contact_first_name: string
  contact_last_name: string
  email?: string
  phone?: string
}

interface Property {
  id: string
  customer_id: string
  name: string
  address: string
  city?: string
  state?: string
  zip_code?: string
  property_type?: string
}

interface Lead {
  id: string
  company_name?: string
  contact_first_name: string
  contact_last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  property_type?: string
}

export function ProposalBuilder({ leadId, customerId, onClose, onSave }: ProposalBuilderProps) {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    lead_id: leadId || '',
    customer_id: customerId || '',
    property_id: '',
    template_id: '',
    service_category_id: '',
    property_type_detail: '',
    unit_count: '',
    billing_frequency: '',
    service_frequency: '',
    contract_start_date: '',
    contract_end_date: '',
    contract_duration_months: '',
    visits_per_week: '',
    visits_per_month: '',
    custom_schedule_notes: '',
    visit_duration_hours: '',
    notes: '',
    terms_conditions:
      'Payment terms: Net 30 days\nService frequency: As specified\nContract term: 12 months',
    valid_until: '',
  })

  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([
    {
      description: '',
      quantity: 1,
      unit_type: 'flat_rate',
      unit_price: 0,
      total_price: 0,
      sort_order: 0,
    },
  ])

  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [
        categoriesResult,
        itemsResult,
        templatesResult,
        customersResult,
        propertiesResult,
        leadsResult,
      ] = await Promise.all([
        supabase.from('service_categories').select('*').eq('is_active', true).order('name'),
        supabase.from('service_items').select('*').eq('is_active', true).order('name'),
        supabase.from('proposal_templates').select('*').eq('is_active', true).order('name'),
        supabase.from('customers').select('*').order('company_name, contact_first_name'),
        supabase.from('properties').select('*').order('name'),
        supabase.from('leads').select('*').order('company_name, contact_first_name'),
      ])

      if (categoriesResult.error) throw categoriesResult.error
      if (itemsResult.error) throw itemsResult.error
      if (templatesResult.error) throw templatesResult.error
      if (customersResult.error) throw customersResult.error
      if (propertiesResult.error) throw propertiesResult.error
      if (leadsResult.error) throw leadsResult.error

      setServiceCategories(categoriesResult.data || [])
      setServiceItems(itemsResult.data || [])
      setTemplates(templatesResult.data || [])
      setCustomers(customersResult.data || [])
      setProperties(propertiesResult.data || [])
      setLeads(leadsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // If customer changes, reset property selection
    if (field === 'customer_id') {
      setFormData((prev) => ({ ...prev, property_id: '' }))
    }
  }

  const getFilteredProperties = () => {
    if (!formData.customer_id) return properties
    return properties.filter((property) => property.customer_id === formData.customer_id)
  }

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const newLineItems = [...lineItems]
    newLineItems[index] = { ...newLineItems[index], [field]: value }

    // Recalculate total if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      newLineItems[index].total_price =
        Number(newLineItems[index].quantity) * Number(newLineItems[index].unit_price)
    }

    setLineItems(newLineItems)
  }

  const addLineItem = () => {
    const newItem: ProposalLineItem = {
      description: '',
      quantity: 1,
      unit_type: 'flat_rate',
      unit_price: 0,
      total_price: 0,
      sort_order: lineItems.length,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const addServiceItem = (serviceItem: ServiceItem) => {
    const newItem: ProposalLineItem = {
      service_item_id: serviceItem.id,
      description: serviceItem.name,
      quantity: 1,
      unit_type: serviceItem.unit_type,
      unit_price: serviceItem.base_price,
      total_price: serviceItem.base_price,
      sort_order: lineItems.length,
    }
    setLineItems([...lineItems, newItem])
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const generateProposalNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_proposal_number')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating proposal number:', error)
      return `PROP-${Date.now()}`
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a proposal title.')
      return
    }

    if (!formData.customer_id && !formData.lead_id) {
      alert('Please select an owner (customer or lead).')
      return
    }

    if (lineItems.some((item) => !item.description.trim() || item.total_price <= 0)) {
      alert('Please ensure all line items have descriptions and valid prices.')
      return
    }

    setSaving(true)

    try {
      // Generate proposal number
      const proposalNumber = await generateProposalNumber()

      // Create proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          lead_id: formData.lead_id || null,
          customer_id: formData.customer_id || null,
          property_id: formData.property_id || null,
          template_id: formData.template_id || null,
          service_category_id: formData.service_category_id || null,
          property_type_detail: formData.property_type_detail || null,
          unit_count: formData.unit_count ? parseInt(formData.unit_count) : null,
          billing_frequency: formData.billing_frequency || null,
          service_frequency: formData.service_frequency || null,
          contract_start_date: formData.contract_start_date || null,
          contract_end_date: formData.contract_end_date || null,
          contract_duration_months: formData.contract_duration_months
            ? parseInt(formData.contract_duration_months)
            : null,
          visits_per_week: formData.visits_per_week ? parseInt(formData.visits_per_week) : null,
          visits_per_month: formData.visits_per_month ? parseInt(formData.visits_per_month) : null,
          custom_schedule_notes: formData.custom_schedule_notes || null,
          visit_duration_hours: formData.visit_duration_hours
            ? parseFloat(formData.visit_duration_hours)
            : null,
          proposal_number: proposalNumber,
          title: formData.title,
          status: 'draft',
          total_amount: calculateTotal(),
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          terms_conditions: formData.terms_conditions || null,
        })
        .select()
        .single()

      if (proposalError) throw proposalError

      // Create line items
      const lineItemsData = lineItems.map((item, index) => ({
        proposal_id: proposalData.id,
        service_item_id: item.service_item_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_type: item.unit_type,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: index,
      }))

      const { error: lineItemsError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsData)

      if (lineItemsError) throw lineItemsError

      // Create activity record
      const { error: activityError } = await supabase.from('proposal_activities').insert({
        proposal_id: proposalData.id,
        activity_type: 'created',
        description: 'Proposal created',
      })

      if (activityError) throw activityError

      onSave(proposalData)
      alert('Proposal saved successfully!')
    } catch (error: any) {
      console.error('Error saving proposal:', error)
      alert(`Failed to save proposal: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredServiceItems = selectedCategory
    ? serviceItems.filter((item) => item.category_id === selectedCategory)
    : serviceItems

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Proposal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Office Cleaning Proposal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={formData.template_id}
                    onChange={(e) => handleFormChange('template_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <select
                    value={
                      formData.customer_id
                        ? `customer_${formData.customer_id}`
                        : formData.lead_id
                        ? `lead_${formData.lead_id}`
                        : ''
                    }
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.startsWith('customer_')) {
                        handleFormChange('customer_id', value.replace('customer_', ''))
                        handleFormChange('lead_id', '')
                      } else if (value.startsWith('lead_')) {
                        handleFormChange('lead_id', value.replace('lead_', ''))
                        handleFormChange('customer_id', '')
                      } else {
                        handleFormChange('customer_id', '')
                        handleFormChange('lead_id', '')
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Owner</option>
                    <optgroup label="Customers">
                      {customers.map((customer) => (
                        <option key={`customer_${customer.id}`} value={`customer_${customer.id}`}>
                          {customer.company_name ||
                            `${customer.contact_first_name} ${customer.contact_last_name}`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Leads">
                      {leads.map((lead) => (
                        <option key={`lead_${lead.id}`} value={`lead_${lead.id}`}>
                          {lead.company_name ||
                            `${lead.contact_first_name} ${lead.contact_last_name}`}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => handleFormChange('property_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.customer_id}
                  >
                    <option value="">Select Property</option>
                    {getFilteredProperties().map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Category
                  </label>
                  <select
                    value={formData.service_category_id}
                    onChange={(e) => handleFormChange('service_category_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Service Category</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type Detail
                  </label>
                  <input
                    type="text"
                    value={formData.property_type_detail}
                    onChange={(e) => handleFormChange('property_type_detail', e.target.value)}
                    placeholder="e.g., High-rise, Low-rise, Garden style"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Count</label>
                  <input
                    type="number"
                    value={formData.unit_count}
                    onChange={(e) => handleFormChange('unit_count', e.target.value)}
                    placeholder="Number of units"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={formData.billing_frequency}
                    onChange={(e) => handleFormChange('billing_frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Billing Frequency</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Per Cleaning">Per Cleaning</option>
                    <option value="Per Unit">Per Unit</option>
                    <option value="Per Project">Per Project</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Frequency
                  </label>
                  <select
                    value={formData.service_frequency}
                    onChange={(e) => handleFormChange('service_frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Service Frequency</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom Schedule</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => handleFormChange('contract_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => handleFormChange('contract_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.contract_duration_months}
                    onChange={(e) => handleFormChange('contract_duration_months', e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visits Per Week
                  </label>
                  <input
                    type="number"
                    value={formData.visits_per_week}
                    onChange={(e) => handleFormChange('visits_per_week', e.target.value)}
                    placeholder="e.g., 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visits Per Month
                  </label>
                  <input
                    type="number"
                    value={formData.visits_per_month}
                    onChange={(e) => handleFormChange('visits_per_month', e.target.value)}
                    placeholder="e.g., 8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Schedule Notes
                  </label>
                  <textarea
                    value={formData.custom_schedule_notes}
                    onChange={(e) => handleFormChange('custom_schedule_notes', e.target.value)}
                    placeholder="e.g., Every Tuesday and Thursday, First Monday of each month"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visit Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.visit_duration_hours}
                    onChange={(e) => handleFormChange('visit_duration_hours', e.target.value)}
                    placeholder="e.g., 2.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleFormChange('valid_until', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <button
                  onClick={addLineItem}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(index, 'description', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Service description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Type
                        </label>
                        <select
                          value={item.unit_type}
                          onChange={(e) => handleLineItemChange(index, 'unit_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="flat_rate">Flat Rate</option>
                          <option value="per_sqft">Per Sq Ft</option>
                          <option value="per_hour">Per Hour</option>
                          <option value="per_visit">Per Visit</option>
                          <option value="per_month">Per Month</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              'unit_price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium">
                            ${item.total_price.toFixed(2)}
                          </div>
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Remove item"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Notes & Terms</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes or special instructions..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={formData.terms_conditions}
                    onChange={(e) => handleFormChange('terms_conditions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Payment terms, service conditions, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Catalog Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Service Catalog</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredServiceItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer"
                    onClick={() => addServiceItem(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.unit_type.replace('_', ' ')} • ${item.base_price}
                        </p>
                      </div>
                      <PlusIcon className="w-4 h-4 text-blue-600 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SaveIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Proposal'}
          </button>
        </div>
      </div>
    </div>
  )
}
