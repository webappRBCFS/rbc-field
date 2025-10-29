import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity, ActivityTypes } from '../utils/activityLogger'
import { fetchServiceItemsGrouped, ServiceItemGrouped } from '../utils/serviceItems'

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

  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'details' | 'notes'>('overview')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [selectedCustomerProperties, setSelectedCustomerProperties] = useState<Property[]>([])
  const [entityType, setEntityType] = useState<'customer' | 'lead'>('customer')

  const [proposalData, setProposalData] = useState({
    title: '',
    description: '',
    template_type: '', // Template type (maintenance, cleaning, etc.)
    customer_id: '',
    lead_id: '',
    property_id: '',
    total_amount: 0,
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    sales_tax_status: '', // 'taxable', 'non-tax', 'exempt', or '' for 'use owner default'
    payment_terms: 30,
    valid_until: '',
    terms_and_conditions: '',
    status: 'draft' as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired',
  })

  const [notes, setNotes] = useState<ProposalNote[]>([])
  const [newNote, setNewNote] = useState('')

  interface ProposalLineItem {
    id: string
    service_item_id?: string
    description: string
    quantity: number
    unit_type: string
    unit_price: number
    total_price: number
    sort_order: number
  }

  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([])
  const [serviceItemsGrouped, setServiceItemsGrouped] = useState<ServiceItemGrouped[]>([])

  useEffect(() => {
    fetchCustomers()
    fetchLeads()
    fetchServiceItems()
  }, [])

  const fetchServiceItems = async () => {
    try {
      const items = await fetchServiceItemsGrouped()
      console.log('Fetched service items:', items)
      setServiceItemsGrouped(items)
      if (items.length === 0) {
        console.warn('No service items found. Check if service_items table has active items.')
      }
    } catch (error) {
      console.error('Error fetching service items in ProposalCreate:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, company_name, contact_first_name, contact_last_name')
        .order('company_name')
        .order('contact_first_name')

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }

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
    if (entityType === 'customer' && proposalData.customer_id) {
      fetchPropertiesForCustomer(proposalData.customer_id)
    } else {
      setSelectedCustomerProperties([])
    }
  }, [proposalData.customer_id, entityType])

  // Fetch lead and its projects when lead is selected
  useEffect(() => {
    if (entityType === 'lead' && proposalData.lead_id) {
      fetchLeadWithProjects(proposalData.lead_id)
    } else {
      setSelectedLead(null)
    }
  }, [proposalData.lead_id, entityType])

  // Auto-generate proposal title from address/project and template type
  useEffect(() => {
    let address = ''

    if (entityType === 'customer' && proposalData.property_id) {
      const selectedProperty = selectedCustomerProperties.find(
        (p) => p.id === proposalData.property_id
      )
      if (selectedProperty?.address) {
        address = selectedProperty.address.split(',')[0].trim()
      }
    } else if (entityType === 'lead' && proposalData.property_id && selectedLead?.projects) {
      // For leads, property_id could be either project.id or project-${index}
      let selectedProject = null

      // First, try to find by project ID
      if (selectedLead.projects.some((p: any) => p.id === proposalData.property_id)) {
        selectedProject = selectedLead.projects.find((p: any) => p.id === proposalData.property_id)
      } else if (proposalData.property_id.includes('project-')) {
        // Fall back to index-based lookup
        const projectIndex = parseInt(proposalData.property_id.replace('project-', ''))
        if (projectIndex >= 0 && selectedLead.projects[projectIndex]) {
          selectedProject = selectedLead.projects[projectIndex]
        }
      }

      if (selectedProject?.address) {
        address = selectedProject.address.split(',')[0].trim()
      }
    }

    if (address && proposalData.template_type) {
      // Capitalize first letter of each word in template type
      const templateType = proposalData.template_type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      setProposalData((prev) => ({
        ...prev,
        title: `${address} - ${templateType}`,
      }))
    } else if (!address || !proposalData.template_type) {
      // Clear title if property/project or template type is not selected
      setProposalData((prev) => ({
        ...prev,
        title: '',
      }))
    }
  }, [
    proposalData.property_id,
    proposalData.template_type,
    entityType,
    selectedCustomerProperties,
    selectedLead,
  ])

  const fetchLeadWithProjects = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, projects')
        .eq('id', leadId)
        .single()

      if (error) throw error
      setSelectedLead(data)
    } catch (error) {
      console.error('Error fetching lead with projects:', error)
      setSelectedLead(null)
    }
  }

  // Update subtotal and total when line items or tax settings change
  useEffect(() => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.total_price, 0)
    // Tax calculation based on sales_tax_status
    // Only calculate tax if status is 'taxable', otherwise tax is 0
    const shouldCalculateTax = proposalData.sales_tax_status === 'taxable'
    const taxAmount = shouldCalculateTax ? lineItemsTotal * (proposalData.tax_rate / 100) : 0
    const total = lineItemsTotal + taxAmount

    setProposalData((prev) => ({
      ...prev,
      subtotal: lineItemsTotal,
      tax_amount: taxAmount,
      total_amount: total,
    }))
  }, [lineItems, proposalData.tax_rate, proposalData.sales_tax_status])

  // Line item management functions
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

  const handleServiceItemSelect = (index: number, serviceItemId: string) => {
    if (!serviceItemId) {
      // Clear service item link
      const newLineItems = [...lineItems]
      newLineItems[index] = {
        ...newLineItems[index],
        service_item_id: undefined,
      }
      setLineItems(newLineItems)
      return
    }

    // Find the selected service item
    let selectedItem: { name: string; unit_type: string; base_price: number } | null = null
    for (const group of serviceItemsGrouped) {
      const item = group.items.find((i) => i.id === serviceItemId)
      if (item) {
        selectedItem = item
        break
      }
    }

    if (selectedItem) {
      const newLineItems = [...lineItems]
      newLineItems[index] = {
        ...newLineItems[index],
        service_item_id: serviceItemId,
        description: selectedItem.name, // Auto-populate description
        unit_type: selectedItem.unit_type, // Auto-populate unit_type
        unit_price: selectedItem.base_price, // Auto-populate unit_price
        total_price: Number(newLineItems[index].quantity) * Number(selectedItem.base_price), // Recalculate total
      }
      setLineItems(newLineItems)
    }
  }

  const addLineItem = () => {
    const newItem: ProposalLineItem = {
      id: `line_item_${Date.now()}`,
      service_item_id: undefined,
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
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

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
  const validateTab = (tab: 'overview' | 'items' | 'details' | 'notes'): boolean => {
    switch (tab) {
      case 'overview':
        return !!(
          proposalData.title &&
          proposalData.status &&
          proposalData.template_type &&
          proposalData.property_id &&
          ((entityType === 'customer' && proposalData.customer_id) ||
            (entityType === 'lead' && proposalData.lead_id))
        )
      case 'items':
        return true // Line items are optional
      case 'details':
        return true // Details are optional
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

    const tabs: Array<'overview' | 'items' | 'details' | 'notes'> = [
      'overview',
      'items',
      'details',
      'notes',
    ]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const tabs: Array<'overview' | 'items' | 'details' | 'notes'> = [
      'overview',
      'items',
      'details',
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

      // Validate property_id - only use it if it's a valid UUID (for customers)
      // For leads with projects, property_id contains project identifier, not a UUID
      let propertyIdForDB = null
      if (entityType === 'customer' && proposalData.property_id) {
        // Check if it's a valid UUID (not starting with "project-")
        if (!proposalData.property_id.startsWith('project-')) {
          propertyIdForDB = proposalData.property_id
        }
      }

      // For leads, store project reference for later conversion
      let projectAddress = null
      let projectIndex = null
      if (entityType === 'lead' && proposalData.property_id && selectedLead?.projects) {
        // Extract project info for matching after conversion
        if (proposalData.property_id.includes('project-')) {
          projectIndex = parseInt(proposalData.property_id.replace('project-', ''))
          if (projectIndex >= 0 && selectedLead.projects[projectIndex]?.address) {
            projectAddress = selectedLead.projects[projectIndex].address
          }
        } else {
          // Try to find by project ID
          const project = selectedLead.projects.find((p: any) => p.id === proposalData.property_id)
          if (project?.address) {
            projectAddress = project.address
          }
        }
      }

      const proposalInsert: any = {
        proposal_number: proposalNumber,
        title: proposalData.title,
        customer_id:
          entityType === 'customer' && proposalData.customer_id ? proposalData.customer_id : null,
        lead_id: entityType === 'lead' && proposalData.lead_id ? proposalData.lead_id : null,
        property_id: propertyIdForDB,
        subtotal: proposalData.subtotal,
        tax_rate: proposalData.tax_rate,
        tax_amount: proposalData.tax_amount,
        sales_tax_status: proposalData.sales_tax_status || null,
        total: proposalData.total_amount,
        valid_until: proposalData.valid_until || null,
        status: proposalData.status,
        template_type: proposalData.template_type || null,
        notes: notes.length > 0 ? notes : null,
      }

      // Add description if provided (column should exist after running migration)
      if (proposalData.description) {
        proposalInsert.description = proposalData.description
      }

      // Store project address for lead conversion mapping (if column exists)
      if (projectAddress) {
        proposalInsert.project_address = projectAddress
      }

      // Add payment_terms conditionally (may not exist in all schemas)
      if (proposalData.payment_terms) {
        proposalInsert.payment_terms = proposalData.payment_terms
      }

      // Add fields conditionally - only include if column exists and has a value
      // Some schemas use 'terms_and_conditions', others use 'terms_conditions'
      if (proposalData.terms_and_conditions && proposalData.terms_and_conditions.trim()) {
        proposalInsert.terms_and_conditions = proposalData.terms_and_conditions
      }

      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert(proposalInsert)
        .select()
        .single()

      if (error) throw error

      // Insert line items if any
      if (lineItems.length > 0 && lineItems.some((item) => item.description.trim())) {
        const lineItemsToInsert = lineItems
          .filter((item) => item.description.trim())
          .map((item) => ({
            proposal_id: proposal.id,
            service_item_id: item.service_item_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_type: item.unit_type,
            unit_price: item.unit_price,
            total_price: item.total_price,
            sort_order: item.sort_order,
          }))

        if (lineItemsToInsert.length > 0) {
          const { error: lineItemsError } = await supabase
            .from('proposal_line_items')
            .insert(lineItemsToInsert)

          if (lineItemsError) throw lineItemsError
        }
      }

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
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'items' || activeTab === 'details' || activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Overview
            </div>
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'items'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'details' || activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Line Items
            </div>
            <div
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : activeTab === 'notes'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              Details
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
                <div className="space-y-6">
                  {/* Proposal Title and Status - At the top */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposal Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={proposalData.title}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 149 Skillman Street - Maintenance"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={proposalData.status}
                        onChange={(e) =>
                          setProposalData({
                            ...proposalData,
                            status: e.target.value as
                              | 'draft'
                              | 'sent'
                              | 'viewed'
                              | 'approved'
                              | 'rejected'
                              | 'expired',
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
                  </div>

                  {/* Two Column Layout: Customer/Property on left, Template/Proposal on right */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Customer/Lead & Property/Project */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {entityType === 'customer' ? 'Customer & Property' : 'Lead & Project'}
                          </h2>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Send To *
                              </label>
                              <select
                                value={entityType}
                                onChange={(e) => {
                                  const newType = e.target.value as 'customer' | 'lead'
                                  setEntityType(newType)
                                  setProposalData({
                                    ...proposalData,
                                    customer_id: '',
                                    lead_id: '',
                                    property_id: '',
                                  })
                                  setSelectedCustomerProperties([])
                                  setSelectedLead(null)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                              >
                                <option value="customer">Customer</option>
                                <option value="lead">Lead</option>
                              </select>
                              <select
                                required
                                value={
                                  entityType === 'customer'
                                    ? proposalData.customer_id
                                    : proposalData.lead_id
                                }
                                onChange={(e) => {
                                  if (entityType === 'customer') {
                                    setProposalData({
                                      ...proposalData,
                                      customer_id: e.target.value,
                                      property_id: '',
                                    })
                                  } else {
                                    setProposalData({
                                      ...proposalData,
                                      lead_id: e.target.value,
                                      property_id: '',
                                    })
                                    setSelectedLead(null) // Reset selected lead to trigger fetch
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">
                                  {entityType === 'customer'
                                    ? 'Select customer...'
                                    : 'Select lead...'}
                                </option>
                                {entityType === 'customer'
                                  ? customers.map((customer) => (
                                      <option key={customer.id} value={customer.id}>
                                        {customer.company_name ||
                                          `${customer.contact_first_name} ${customer.contact_last_name}`}
                                      </option>
                                    ))
                                  : leads.map((lead) => (
                                      <option key={lead.id} value={lead.id}>
                                        {lead.company_name ||
                                          `${lead.contact_first_name || ''} ${
                                            lead.contact_last_name || ''
                                          }`.trim()}
                                      </option>
                                    ))}
                              </select>
                            </div>

                            <div className="pt-[27px]">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {entityType === 'customer' ? 'Property' : 'Project'} *
                              </label>
                              <select
                                value={proposalData.property_id}
                                onChange={(e) =>
                                  setProposalData({ ...proposalData, property_id: e.target.value })
                                }
                                disabled={
                                  entityType === 'customer'
                                    ? !proposalData.customer_id
                                    : !proposalData.lead_id ||
                                      !selectedLead?.projects ||
                                      selectedLead.projects.length === 0
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                required
                              >
                                <option value="">
                                  {entityType === 'customer'
                                    ? 'Select property...'
                                    : 'Select project...'}
                                </option>
                                {entityType === 'customer'
                                  ? selectedCustomerProperties.map((property) => (
                                      <option key={property.id} value={property.id}>
                                        {property.name || property.address}
                                      </option>
                                    ))
                                  : selectedLead?.projects?.map((project: any, index: number) => (
                                      <option
                                        key={project.id || index}
                                        value={project.id || `project-${index}`}
                                      >
                                        {project.type || 'Project'} -{' '}
                                        {project.address || 'No address'}
                                      </option>
                                    ))}
                              </select>
                              {entityType === 'lead' && selectedLead?.projects?.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  No projects found for this lead
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Spacer to align with right column height */}
                      <div className="flex-grow"></div>
                    </div>

                    {/* Right Column: Template Type */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Template Type</h2>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Template Type *
                            </label>
                            <select
                              required
                              value={proposalData.template_type}
                              onChange={(e) => {
                                const newType = e.target.value
                                setProposalData({
                                  ...proposalData,
                                  template_type: newType,
                                })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Please select...</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="cleaning">Cleaning</option>
                              <option value="landscaping">Landscaping</option>
                              <option value="security">Security</option>
                              <option value="custom">Custom</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              This determines the template used when printing the proposal
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal Description - Below the two columns */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Proposal Description</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={proposalData.description}
                        onChange={(e) =>
                          setProposalData({ ...proposalData, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter proposal description"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Tab */}
              {activeTab === 'items' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {lineItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Link to Service Item{' '}
                              <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <select
                              value={item.service_item_id || ''}
                              onChange={(e) => handleServiceItemSelect(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">None - Custom Entry</option>
                              {serviceItemsGrouped.map((group) => (
                                <optgroup key={group.category.id} label={group.category.name}>
                                  {group.items.map((serviceItem) => (
                                    <option key={serviceItem.id} value={serviceItem.id}>
                                      {serviceItem.name} - ${serviceItem.base_price.toFixed(2)}/
                                      {serviceItem.unit_type.replace('_', ' ')}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Selecting a service item will auto-fill description, unit type, and
                              price (you can still edit)
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  handleLineItemChange(index, 'description', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Item description"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleLineItemChange(
                                    index,
                                    'quantity',
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit Type
                              </label>
                              <select
                                value={item.unit_type}
                                onChange={(e) =>
                                  handleLineItemChange(index, 'unit_type', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="flat_rate">Flat Rate</option>
                                <option value="per_sqft">Per Sq Ft</option>
                                <option value="per_hour">Per Hour</option>
                                <option value="per_visit">Per Visit</option>
                                <option value="per_month">Per Month</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Total
                                </label>
                                <div className="px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm font-medium">
                                  ${item.total_price.toFixed(2)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors mt-6"
                                title="Remove item"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {lineItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No line items added yet.</p>
                        <p className="text-xs mt-1">Click "Add Item" to get started.</p>
                      </div>
                    )}

                    {/* Line Items Total */}
                    {lineItems.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">
                            Line Items Subtotal:
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            ${lineItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Subtotal, Tax Amount, and Total are automatically
                      calculated from the Line Items you added in the previous tab.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtotal
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                        ${proposalData.subtotal.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from line items</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Tax Status
                      </label>
                      <select
                        value={proposalData.sales_tax_status}
                        onChange={(e) => {
                          const status = e.target.value
                          setProposalData({
                            ...proposalData,
                            sales_tax_status: status,
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Use Owner Default</option>
                        <option value="taxable">Taxable</option>
                        <option value="non-tax">Non-Tax</option>
                        <option value="exempt">Exempt</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Defaults to owner's sales tax status but can be overridden per proposal
                      </p>
                    </div>

                    {proposalData.sales_tax_status === 'taxable' && (
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
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Amount
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                        ${proposalData.tax_amount.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated: Subtotal × Tax Rate
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <div className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-xl font-bold text-blue-600">
                        ${proposalData.total_amount.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated: Subtotal + Tax Amount
                      </p>
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
