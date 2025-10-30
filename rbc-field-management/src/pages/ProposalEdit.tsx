import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusIcon, TrashIcon, FileTextIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity, ActivityTypes } from '../utils/activityLogger'
import { fetchServiceItemsGrouped, ServiceItemGrouped } from '../utils/serviceItems'
import { convertLeadToCustomer } from '../lib/leadConversion'

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

export default function ProposalEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

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
  const [savingNote, setSavingNote] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [originalStatus, setOriginalStatus] = useState<string>('')
  const [pendingAction, setPendingAction] = useState<'create-contract' | 'create-job' | null>(null)
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
    if (id) {
      fetchProposalData()
    }
    fetchCustomers()
    fetchLeads()
    fetchServiceItems()
  }, [id])

  const fetchServiceItems = async () => {
    const items = await fetchServiceItemsGrouped()
    setServiceItemsGrouped(items)
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
      // Only clear if we're actively changing, not on initial load
      if (proposalData.property_id || proposalData.template_type) {
        // Keep existing title if we're just loading data
        return
      }
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

  const fetchProposalData = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, project_address')
        .eq('id', id)
        .single()

      if (error) throw error

      // Determine entity type based on which ID is present
      // If customer_id exists, use customer (even if lead_id also exists - lead was converted)
      const hasCustomerId = !!data.customer_id
      const hasLeadId = !!data.lead_id && data.lead_id !== ''

      if (hasCustomerId) {
        setEntityType('customer')
      } else if (hasLeadId) {
        setEntityType('lead')
      } else {
        // Default to customer if neither exists (shouldn't happen, but safety check)
        setEntityType('customer')
      }

      // If it's a lead, fetch the lead and projects first to properly set property_id
      let resolvedPropertyId = data.property_id || ''

      if (hasLeadId && !hasCustomerId) {
        // It's a lead proposal - need to fetch lead and match project
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', data.lead_id)
          .single()

        if (!leadError && leadData) {
          setSelectedLead(leadData)

          // Try to match the project
          if (leadData.projects && leadData.projects.length > 0) {
            // Method 1: Match by project_address if stored
            if (data.project_address) {
              const projectIndex = leadData.projects.findIndex(
                (p: any) => p.address === data.project_address
              )
              if (projectIndex >= 0) {
                resolvedPropertyId = leadData.projects[projectIndex].id || `project-${projectIndex}`
              }
            }
            // Method 2: Match by property_id if it contains project-${index}
            else if (
              data.property_id &&
              typeof data.property_id === 'string' &&
              data.property_id.includes('project-')
            ) {
              const projectIndex = parseInt(data.property_id.replace('project-', ''))
              if (projectIndex >= 0 && leadData.projects[projectIndex]) {
                resolvedPropertyId = leadData.projects[projectIndex].id || `project-${projectIndex}`
              }
            }
            // Method 3: Try to match by project ID
            else if (
              data.property_id &&
              typeof data.property_id === 'string' &&
              !data.property_id.match(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
              )
            ) {
              const projectIndex = leadData.projects.findIndex(
                (p: any) => p.id === data.property_id
              )
              if (projectIndex >= 0) {
                resolvedPropertyId = leadData.projects[projectIndex].id || `project-${projectIndex}`
              }
            }
          }
        }
      }

      const originalStatusValue = data.status || 'draft'
      setOriginalStatus(originalStatusValue)

      setProposalData({
        title: data.title || '',
        description: data.description || '',
        template_type: data.template_type || '',
        customer_id: data.customer_id || '',
        lead_id: data.lead_id || '',
        property_id: resolvedPropertyId,
        total_amount: data.total || 0,
        subtotal: data.subtotal || 0,
        tax_rate: data.tax_rate || 0,
        tax_amount: data.tax_amount || 0,
        sales_tax_status: data.sales_tax_status || '',
        payment_terms: data.payment_terms || 30,
        valid_until: data.valid_until || '',
        terms_and_conditions: data.terms_and_conditions || '',
        status: originalStatusValue as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired',
      })

      // If lead was converted but proposal still has lead_id, update to use customer
      // This handles the case where the proposal needs to be updated after conversion
      if (hasLeadId && hasCustomerId) {
        // Lead was converted, proposal should use customer mode
        setEntityType('customer')
        // Fetch customer properties if needed
        if (data.customer_id) {
          fetchPropertiesForCustomer(data.customer_id)
        }
      }

      // Fetch notes - handle both JSONB array and JSON string
      let parsedNotes: ProposalNote[] = []
      if (data.notes) {
        if (Array.isArray(data.notes)) {
          parsedNotes = data.notes
        } else if (typeof data.notes === 'string') {
          try {
            const parsed = JSON.parse(data.notes)
            if (Array.isArray(parsed)) {
              parsedNotes = parsed
            }
          } catch (e) {
            console.warn('Failed to parse notes as JSON:', e)
          }
        }
      }
      setNotes(parsedNotes)
      console.log('Fetched notes:', parsedNotes)

      // Fetch line items
      await fetchProposalLineItems()
    } catch (error) {
      console.error('Error fetching proposal data:', error)
      alert('Error loading proposal: ' + (error as any).message)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchProposalLineItems = async () => {
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('proposal_line_items')
        .select('*')
        .eq('proposal_id', id)
        .order('sort_order', { ascending: true })

      if (error) {
        // Table might not exist yet, that's okay
        console.warn('Error fetching proposal line items (table may not exist):', error)
        return
      }

      if (data) {
        setLineItems(
          data.map((item) => ({
            id: item.id,
            service_item_id: item.service_item_id || undefined,
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_type: item.unit_type || 'flat_rate',
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            sort_order: item.sort_order || 0,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching proposal line items:', error)
    }
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

  const addNote = async () => {
    if (!newNote.trim() || !id) return

    setSavingNote(true)
    try {
      const noteToAdd: ProposalNote = {
        timestamp: new Date().toISOString(),
        note: newNote.trim(),
      }

      const updatedNotes = [noteToAdd, ...notes]

      console.log('Saving notes:', updatedNotes)

      const { error } = await supabase
        .from('proposals')
        .update({ notes: updatedNotes }) // Supabase should handle JSONB arrays automatically
        .eq('id', id)

      if (error) throw error

      setNotes(updatedNotes)
      setNewNote('')

      // Log activity
      await logActivity({
        activity_type: 'note_added',
        entity_type: 'proposal',
        entity_id: id!,
        description: 'Note added to proposal',
      })
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note')
    } finally {
      setSavingNote(false)
    }
  }

  const removeNote = async (index: number) => {
    if (!id) return

    setSavingNote(true)
    try {
      const updatedNotes = notes.filter((_, i) => i !== index)

      const { error } = await supabase
        .from('proposals')
        .update({ notes: updatedNotes.length > 0 ? updatedNotes : null })
        .eq('id', id)

      if (error) throw error

      setNotes(updatedNotes)

      // Log activity
      await logActivity({
        activity_type: 'note_removed',
        entity_type: 'proposal',
        entity_id: id!,
        description: 'Note removed from proposal',
      })
    } catch (error) {
      console.error('Error removing note:', error)
      alert('Error removing note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      addNote()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('ProposalEdit submit check:', {
      status: proposalData.status,
      originalStatus: originalStatus,
      entityType: entityType,
      lead_id: proposalData.lead_id,
      customer_id: proposalData.customer_id,
      hasSelectedLead: !!selectedLead,
      needsConversion: proposalData.status === 'approved' &&
        originalStatus !== 'approved' &&
        proposalData.lead_id &&
        proposalData.lead_id !== '' &&
        !proposalData.customer_id,
    })

    // If changing to "approved" and proposal is linked to a lead (not a customer), show convert modal
    // Check both entityType and direct lead_id/customer_id to be safe
    const isApproving = proposalData.status === 'approved' && originalStatus !== 'approved'
    const hasLead = proposalData.lead_id && proposalData.lead_id !== ''
    const hasCustomer = !!proposalData.customer_id

    if (isApproving && hasLead && !hasCustomer) {
      console.log('Proposal needs conversion - fetching lead if not loaded')

      // If lead isn't loaded, fetch it
      if (!selectedLead && proposalData.lead_id) {
        try {
          const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', proposalData.lead_id)
            .single()

          if (!leadError && leadData) {
            setSelectedLead(leadData)
            populateConversionData(leadData)
            setShowConvertModal(true)
            return
          } else {
            console.error('Error fetching lead for conversion:', leadError)
          }
        } catch (error) {
          console.error('Error fetching lead:', error)
        }
      } else if (selectedLead) {
        console.log('Showing convert modal in ProposalEdit')
        populateConversionData(selectedLead)
        setShowConvertModal(true)
        return
      }
    }

    console.log('Submitting proposal normally')
    // Otherwise, proceed with normal submission
    await submitProposal()
  }

  const submitProposal = async () => {
    setLoading(true)

    try {
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
      if (entityType === 'lead' && proposalData.property_id && selectedLead?.projects) {
        // Extract project info for matching after conversion
        if (proposalData.property_id.includes('project-')) {
          const projectIndex = parseInt(proposalData.property_id.replace('project-', ''))
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

      const proposalUpdate: any = {
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
        updated_at: new Date().toISOString(),
      }

      // Store project address for lead conversion mapping (if column exists)
      if (projectAddress) {
        proposalUpdate.project_address = projectAddress
      }

      // Add description if provided (column should exist after running migration)
      if (proposalData.description) {
        proposalUpdate.description = proposalData.description
      }

      // Add payment_terms conditionally (may not exist in all schemas)
      if (proposalData.payment_terms) {
        proposalUpdate.payment_terms = proposalData.payment_terms
      }

      // Add fields conditionally - only include if column exists and has a value
      // Some schemas use 'terms_and_conditions', others use 'terms_conditions'
      if (proposalData.terms_and_conditions && proposalData.terms_and_conditions.trim()) {
        proposalUpdate.terms_and_conditions = proposalData.terms_and_conditions
      }

      const { error } = await supabase.from('proposals').update(proposalUpdate).eq('id', id)

      if (error) throw error

      // Delete existing line items
      await supabase.from('proposal_line_items').delete().eq('proposal_id', id!)

      // Insert new line items if any
      if (lineItems.length > 0 && lineItems.some((item) => item.description.trim())) {
        const lineItemsToInsert = lineItems
          .filter((item) => item.description.trim())
          .map((item) => ({
            proposal_id: id!,
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
        activity_type: ActivityTypes.PROPOSAL_UPDATED,
        entity_type: 'proposal',
        entity_id: id!,
        description: `Proposal "${proposalData.title}" updated`,
        metadata: {
          customer_id: proposalData.customer_id,
          property_id: proposalData.property_id,
        },
      })

      alert('Proposal updated successfully!')
      navigate(`/proposals/view/${id}`)
    } catch (error) {
      console.error('Error updating proposal:', error)
      alert('Error updating proposal: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const populateConversionData = (lead: any) => {
    const primaryContact = lead.contacts && lead.contacts[0] ? lead.contacts[0] : null

    // Handle backwards compatibility: if contact has 'name' but not first_name/last_name, split it
    let contactFirstName = ''
    let contactLastName = ''
    if (primaryContact) {
      if (primaryContact.first_name || primaryContact.last_name) {
        contactFirstName = primaryContact.first_name || ''
        contactLastName = primaryContact.last_name || ''
      } else if (primaryContact.name) {
        const nameParts = primaryContact.name.trim().split(' ')
        contactFirstName = nameParts[0] || ''
        contactLastName = nameParts.slice(1).join(' ') || ''
      }
    }

    const properties =
      lead.projects && lead.projects.length > 0
        ? lead.projects.map((p: any) => {
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
      contact_first_name: contactFirstName || lead.contact_first_name || '',
      contact_last_name: contactLastName || lead.contact_last_name || '',
      email: primaryContact?.email || lead.email || '',
      phone: primaryContact?.phone || lead.phone || '',
      billing_address: lead.company_address || lead.address || '',
      billing_city: lead.city || '',
      billing_state: lead.state || '',
      billing_zip_code: lead.zip_code || '',
      properties: properties,
    })
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

  const ensureProposalConverted = async (): Promise<boolean> => {
    // Check if proposal is linked to a lead (not a customer)
    if (proposalData.lead_id && !proposalData.customer_id) {
      // Need to convert lead to customer
      if (!selectedLead) {
        // Fetch lead if not loaded
        try {
          const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', proposalData.lead_id)
            .single()

          if (!leadError && leadData) {
            setSelectedLead(leadData)
            populateConversionData(leadData)
            // Show conversion modal
            setShowConvertModal(true)
            return false // Conversion not completed yet
          } else {
            console.error('Error fetching lead for conversion:', leadError)
            alert('Error: Could not load lead information')
            return false
          }
        } catch (error) {
          console.error('Error fetching lead:', error)
          alert('Error: Could not load lead information')
          return false
        }
      } else {
        // Lead already loaded, show conversion modal
        populateConversionData(selectedLead)
        setShowConvertModal(true)
        return false // Conversion not completed yet
      }
    }
    // Already has a customer or no lead, ready to proceed
    return true
  }

  const handleCreateContract = async () => {
    if (!id) return

    // If already linked to customer/property, just approve and proceed
    if (proposalData.customer_id && !proposalData.lead_id) {
      // Already linked to customer - just approve if not already approved
      if (proposalData.status !== 'approved') {
        await ensureProposalApproved()
      }
      navigate(`/contracts/create?proposalId=${id}`)
      return
    }

    // Otherwise, ensure conversion happens first
    const ready = await ensureProposalConverted()
    if (!ready) {
      // Conversion modal is showing, store action to perform after conversion
      setPendingAction('create-contract')
      return
    }

    // After conversion, approve the proposal
    await ensureProposalApproved()

    // Navigate to contract create with proposal_id
    navigate(`/contracts/create?proposalId=${id}`)
  }

  const handleCreateJob = async () => {
    if (!id) return

    // If already linked to customer/property, just approve and proceed
    if (proposalData.customer_id && !proposalData.lead_id) {
      // Already linked to customer - just approve if not already approved
      if (proposalData.status !== 'approved') {
        await ensureProposalApproved()
      }
      navigate(`/jobs/create?proposalId=${id}`)
      return
    }

    // Otherwise, ensure conversion happens first
    const ready = await ensureProposalConverted()
    if (!ready) {
      // Conversion modal is showing, store action to perform after conversion
      setPendingAction('create-job')
      return
    }

    // After conversion, approve the proposal
    await ensureProposalApproved()

    // Navigate to job create with proposal_id
    navigate(`/jobs/create?proposalId=${id}`)
  }

  const ensureProposalApproved = async () => {
    if (!id || !proposalData) return

    try {
      // Only update if status is not already approved
      if (proposalData.status !== 'approved') {
        const { error } = await supabase
          .from('proposals')
          .update({ status: 'approved' })
          .eq('id', id)

        if (error) throw error

        // Update local state
        setProposalData({
          ...proposalData,
          status: 'approved',
        })

        // Log activity
        await logActivity({
          activity_type: ActivityTypes.PROPOSAL_UPDATED,
          entity_type: 'proposal',
          entity_id: id,
          description: 'Proposal approved for contract/job creation',
          metadata: {
            status: 'approved',
          },
        })
      }
    } catch (error) {
      console.error('Error updating proposal:', error)
      alert('Error updating proposal: ' + (error as any).message)
    }
  }

  const handleConfirmConversion = async () => {
    if (!selectedLead || !id || !proposalData.lead_id) return

    try {
      setConverting(true)

      // Update the lead data with conversion form data before converting
      const primaryContact = selectedLead.contacts && selectedLead.contacts[0] ? selectedLead.contacts[0] : null

      // Update selectedLead with conversion data
      const updatedLead = {
        ...selectedLead,
        company_name: conversionData.company_name,
        contact_first_name: conversionData.contact_first_name,
        contact_last_name: conversionData.contact_last_name,
        email: conversionData.email,
        phone: conversionData.phone,
        company_address: conversionData.billing_address,
        address: conversionData.billing_address,
        city: conversionData.billing_city,
        state: conversionData.billing_state,
        zip_code: conversionData.billing_zip_code,
        contacts: primaryContact ? [{
          ...primaryContact,
          name: conversionData.contact_first_name + ' ' + conversionData.contact_last_name,
          email: conversionData.email,
          phone: conversionData.phone,
        }] : [],
        projects: conversionData.properties.map((prop) => {
          // Parse the full address back into components
          const addressParts = prop.address.split(', ')
          const streetAddress = addressParts[0] || ''
          const addressLine2 = addressParts.length > 4 ? addressParts[1] : undefined
          const city = addressParts[addressParts.length - 3] || ''
          const state = addressParts[addressParts.length - 2] || ''
          const zip = addressParts[addressParts.length - 1] || ''

          return {
            address: streetAddress,
            address_line_2: addressLine2,
            city: city,
            state: state,
            zip: zip,
            type: prop.type,
            unit_count: prop.unit_count,
            notes: prop.notes,
          }
        }),
      }

      // First update the lead with the new data
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({
          company_name: conversionData.company_name,
          contact_first_name: conversionData.contact_first_name,
          contact_last_name: conversionData.contact_last_name,
          email: conversionData.email,
          phone: conversionData.phone,
          company_address: conversionData.billing_address,
          city: conversionData.billing_city,
          state: conversionData.billing_state,
          zip_code: conversionData.billing_zip_code,
          contacts: updatedLead.contacts,
          projects: updatedLead.projects,
        })
        .eq('id', proposalData.lead_id)

      if (leadUpdateError) {
        console.error('Error updating lead:', leadUpdateError)
        throw leadUpdateError
      }

      // Now convert with the updated lead data
      // This function also marks the lead as 'won' and links proposal to customer/property
      const customerId = await convertLeadToCustomer(proposalData.lead_id)

      // Update proposal data to reflect customer instead of lead
      setProposalData({
        ...proposalData,
        customer_id: customerId,
        lead_id: '', // Clear lead_id after conversion
        status: 'approved', // Update status to approved
      })
      setEntityType('customer')
      setOriginalStatus('approved') // Update original status

      // Now submit the proposal with the updated customer_id
      await submitProposal()

      // Check if there's a pending action to perform after conversion
      if (pendingAction === 'create-contract') {
        setPendingAction(null)
        setShowConvertModal(false)
        navigate(`/contracts/create?proposalId=${id}`)
        return
      } else if (pendingAction === 'create-job') {
        setPendingAction(null)
        setShowConvertModal(false)
        navigate(`/jobs/create?proposalId=${id}`)
        return
      }

      setShowConvertModal(false)
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Error converting lead: ' + (error as any).message)
    } finally {
      setConverting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Proposal</h1>
              <p className="text-gray-600 mt-2">Update proposal details</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreateContract}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileTextIcon className="w-4 h-4" />
                Convert to Contract
              </button>
              <button
                type="button"
                onClick={handleCreateJob}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Convert to Job
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'items'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
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
              Notes & Activity
            </button>
          </div>

          <form onSubmit={handleSubmit}>
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
                        Auto-calculated: Subtotal × Tax Rate (if taxable)
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
                    />
                  </div>
                </div>
              )}

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
                        disabled={!newNote.trim() || savingNote}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingNote ? 'Saving...' : 'Add'}
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
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Convert Lead to Customer Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Convert Lead to Customer</h3>
              <button
                onClick={() => {
                  setShowConvertModal(false)
                  // Reset status to original if cancelled
                  setProposalData({
                    ...proposalData,
                    status: originalStatus as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired',
                  })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>This proposal is about to be approved.</strong> To complete the approval,
                please confirm the lead conversion:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                <li>Create a new customer record from this lead</li>
                <li>Create property records from lead projects</li>
                <li>Mark the lead as "Won"</li>
                <li>Link the proposal to the new customer</li>
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
                onClick={() => {
                  setShowConvertModal(false)
                  // Reset status to original if cancelled
                  setProposalData({
                    ...proposalData,
                    status: originalStatus as 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired',
                  })
                }}
                disabled={converting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConversion}
                disabled={converting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {converting ? 'Converting...' : 'Confirm & Approve Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
