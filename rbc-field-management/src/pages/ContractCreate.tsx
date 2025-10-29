import React, { useState, useEffect } from 'react'
import { PlusIcon, ArrowLeftIcon, TrashIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import { convertLeadToCustomer } from '../lib/leadConversion'
import { fetchServiceItemsGrouped, ServiceItemGrouped } from '../utils/serviceItems'

interface Customer {
  id: string
  company_name?: string
  contact_first_name?: string
  contact_last_name?: string
}

interface Property {
  id: string
  name?: string
  address?: string
  city?: string
  state?: string
  customer_id: string
}

interface Proposal {
  id: string
  title: string
  proposal_number: string
  customer_id: string
  property_id: string
  total_amount?: number
  status: string
}

interface ServiceCategory {
  id: string
  name: string
  operational_division_id: string
}

interface ServiceItem {
  id: string
  service_category_id: string
  name: string
  description?: string
  unit_type: string
  base_price: number
  is_active: boolean
  categories?: {
    id: string
    name: string
  }
}

export function ContractCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [maintenanceDSNYCategoryId, setMaintenanceDSNYCategoryId] = useState<string>('')
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([])
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateProperty, setShowCreateProperty] = useState(false)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)

  // Add Service Modal state
  const [newService, setNewService] = useState({
    service_type: '',
    service_name: '',
    amount: 0,
    recurrence_type: 'weekly',
    recurrence_days: [] as number[],
    dsny_integration: false,
    // DSNY schedules
    garbage_schedule: [] as number[],
    recycling_schedule: [] as number[],
    organics_schedule: [] as number[],
    bulk_schedule: [] as number[],
    interior_cleaning_schedule: [] as number[],
  })

  // Services with individual schedules
  const [contractServices, setContractServices] = useState<
    Array<{
      id: string
      service_item_id: string
      service_type: string
      service_name: string
      amount: number
      is_maintenance: boolean
      schedule: {
        recurrence_type: string
        recurrence_days: number[]
        dsny_integration: boolean
        garbage_schedule: number[]
        recycling_schedule: number[]
        organics_schedule: number[]
        bulk_schedule: number[]
        interior_cleaning_schedule: number[]
      }
    }>
  >([])

  // Line items for billing
  interface ContractLineItem {
    id: string
    service_item_id?: string
    description: string
    quantity: number
    unit_type: string
    unit_price: number
    total_price: number
    sort_order: number
  }

  const [lineItems, setLineItems] = useState<ContractLineItem[]>([
    {
      id: `line_item_${Date.now()}`,
      service_item_id: undefined,
      description: '',
      quantity: 1,
      unit_type: 'flat_rate',
      unit_price: 0,
      total_price: 0,
      sort_order: 0,
    },
  ])

  const [serviceItemsGrouped, setServiceItemsGrouped] = useState<ServiceItemGrouped[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_type: '', // Template type (maintenance, cleaning, etc.)
    contract_type: 'one_time', // Contract type (one_time, recurring)
    service_type: '',
    customer_id: '',
    property_id: '',
    proposal_id: '',
    total_amount: 0,
    billing_frequency: 'one_time',
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_interval: 1,
    recurrence_days: [] as number[],
    recurrence_end_date: '',
    recurrence_end_count: 0,
    status: 'draft',
    start_date: '',
    end_date: '',
    payment_terms: 'Net 30',
    late_fee_percentage: 0,
    cancellation_terms: '',
    notes: '',
    // Comprehensive Schedule System
    master_weekly_schedule: [] as number[], // Days of week we visit (0-6)
    garbage_schedule: [] as number[], // Days for garbage prep
    recycling_schedule: [] as number[], // Days for recycling prep
    bulk_schedule: [] as number[], // Days for bulk prep
    organics_schedule: [] as number[], // Days for organics prep
    interior_cleaning_schedule: [] as number[], // Days for interior cleaning
    // Dynamic manual schedules
    manual_schedules: [] as Array<{
      id: string
      name: string
      description: string
      color: string
      days: number[]
    }>,
    dsny_integration: false,
    // Legacy fields for compatibility
    dsny_pickup_days: [] as string[],
    dsny_collection_types: [] as string[],
  })

  useEffect(() => {
    fetchData()
    fetchServiceItems()
  }, [])

  const fetchServiceItems = async () => {
    const items = await fetchServiceItemsGrouped()
    setServiceItemsGrouped(items)
  }

  // Update total amount when services change
  useEffect(() => {
    const total = contractServices.reduce((sum, service) => sum + service.amount, 0)
    setFormData((prev) => ({ ...prev, total_amount: total }))
  }, [contractServices])

  // Update total amount when line items change
  useEffect(() => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.total_price, 0)
    // Only update if line items total is greater than 0, otherwise use service total
    if (lineItemsTotal > 0) {
      setFormData((prev) => ({ ...prev, total_amount: lineItemsTotal }))
    }
  }, [lineItems])

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
    const newItem: ContractLineItem = {
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
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  // Auto-generate contract title from property address and template type
  useEffect(() => {
    if (formData.property_id && formData.template_type) {
      const selectedProperty = properties.find((p) => p.id === formData.property_id)
      if (selectedProperty?.address) {
        const streetAddress = selectedProperty.address.split(',')[0].trim()
        // Capitalize first letter of each word in template type
        const templateType = formData.template_type
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        setFormData((prev) => ({
          ...prev,
          title: `${streetAddress} - ${templateType}`,
        }))
      }
    } else if (!formData.property_id || !formData.template_type) {
      // Clear title if property or template type is not selected
      setFormData((prev) => ({
        ...prev,
        title: '',
      }))
    }
  }, [formData.property_id, formData.template_type, properties])

  useEffect(() => {
    if (formData.customer_id) {
      // Filter proposals by customer_id (only show proposals linked to customers, not leads)
      let customerProposals = proposals.filter((p) => p.customer_id === formData.customer_id)

      // If property is selected, filter by property_id (but also include proposals without property_id for backwards compatibility)
      if (formData.property_id) {
        customerProposals = customerProposals.filter(
          (p) => !p.property_id || p.property_id === formData.property_id
        )
      }

      setFilteredProposals(customerProposals)
    } else {
      setFilteredProposals([])
    }
  }, [formData.customer_id, formData.property_id, proposals])

  // Remove this useEffect - it was incorrectly overwriting the properties state

  const fetchData = async () => {
    try {
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, company_name, contact_first_name, contact_last_name')
        .order('company_name')

      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, name, address, city, state, customer_id')
        .order('name')

      // Fetch proposals (approved, sent, viewed) - only those linked to customers (not just leads)
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('id, title, proposal_number, customer_id, property_id, total_amount, status')
        .in('status', ['approved', 'sent', 'viewed'])
        .not('customer_id', 'is', null) // Only proposals with customer_id (not just leads)
        .order('created_at', { ascending: false })

      // Fetch service categories
      const { data: serviceCategoriesData } = await supabase
        .from('service_categories')
        .select('id, name, operational_division_id')
        .order('name')

      // Fetch service items
      const { data: serviceItemsData } = await supabase
        .from('service_items')
        .select('*')
        .eq('is_active', true)
        .order('name')

      // Manually attach category info to service items
      const itemsWithCategories = (serviceItemsData || []).map((item) => {
        const category = serviceCategoriesData?.find((c) => c.id === item.service_category_id)
        return {
          ...item,
          categories: category,
        }
      })

      // Find the "Maintenance - DSNY" category ID - must match exactly
      const maintenanceDSNY = serviceCategoriesData?.find(
        (cat) => cat.name.toLowerCase() === 'maintenance - dsny'
      )
      if (maintenanceDSNY) {
        console.log('Found Maintenance - DSNY category with ID:', maintenanceDSNY.id)
        setMaintenanceDSNYCategoryId(maintenanceDSNY.id)
      } else {
        console.log('Maintenance - DSNY category not found')
        console.log(
          'Available categories:',
          serviceCategoriesData?.map((c) => c.name)
        )
      }

      setCustomers(customersData || [])
      setProperties(propertiesData || [])
      setProposals(proposalsData || [])
      setServiceCategories(serviceCategoriesData || [])
      setServiceItems(itemsWithCategories)

      // Debug logging
      console.log('Fetched data:', {
        customers: customersData?.length || 0,
        properties: propertiesData?.length || 0,
        proposals: proposalsData?.length || 0,
        serviceCategories: serviceCategoriesData?.length || 0,
      })
      console.log('Service categories:', serviceCategoriesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleProposalSelect = (proposalId: string) => {
    const proposal = proposals.find((p) => p.id === proposalId)
    if (proposal) {
      setFormData({
        ...formData,
        proposal_id: proposalId,
        customer_id: proposal.customer_id,
        property_id: proposal.property_id,
        total_amount: proposal.total_amount || 0,
        title: proposal.title,
      })
    }
  }

  const isMaintenanceService = () => {
    if (!formData.service_type) {
      console.log('ContractCreate - No service type selected')
      return false
    }
    const selectedCategory = serviceCategories.find((cat) => cat.name === formData.service_type)
    console.log('ContractCreate - Selected service type:', formData.service_type)
    console.log('ContractCreate - Selected category:', selectedCategory)
    console.log('ContractCreate - Maintenance division ID:', 'aad2c279-31a9-4f3d-bc5e-195f218b38d7')
    console.log(
      'ContractCreate - Is maintenance service:',
      selectedCategory?.operational_division_id === 'aad2c279-31a9-4f3d-bc5e-195f218b38d7'
    )
    return selectedCategory?.operational_division_id === 'aad2c279-31a9-4f3d-bc5e-195f218b38d7' // Maintenance division ID
  }

  // Manual Schedule Management Functions
  const addManualSchedule = () => {
    const newSchedule = {
      id: `manual_${Date.now()}`,
      name: '',
      description: '',
      color: 'bg-gray-100 border-gray-300 text-gray-800',
      days: [] as number[],
    }
    setFormData((prev) => ({
      ...prev,
      manual_schedules: [...prev.manual_schedules, newSchedule],
    }))
  }

  const updateManualSchedule = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      manual_schedules: prev.manual_schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, [field]: value } : schedule
      ),
    }))
  }

  const removeManualSchedule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      manual_schedules: prev.manual_schedules.filter((schedule) => schedule.id !== id),
    }))
  }

  const updateManualScheduleDays = (id: string, day: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      manual_schedules: prev.manual_schedules.map((schedule) =>
        schedule.id === id
          ? {
              ...schedule,
              days: checked ? [...schedule.days, day] : schedule.days.filter((d) => d !== day),
            }
          : schedule
      ),
    }))
  }

  // DSNY Integration Functions
  const fetchDSNYPickupSchedule = async (address: string) => {
    try {
      console.log('Fetching real DSNY pickup schedule for:', address)

      // Use the official DSNY API directly
      const apiUrl = `https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection?address=${encodeURIComponent(
        address
      )}`
      console.log('Making request to:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      console.log('DSNY API response status:', response.status)
      console.log('DSNY API response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('DSNY API response:', data)
        console.log('DSNY API response keys:', Object.keys(data))

        // Parse the DSNY response
        const schedules = {
          garbage: [],
          recycling: [],
          organics: [],
          bulk: [],
        }

        // Extract collection schedules from the response
        if (data.RegularCollectionSchedule) {
          const pickupDays = data.RegularCollectionSchedule.split(',')
            .map((day: string) => {
              const dayMap: { [key: string]: number } = {
                Sunday: 0,
                Monday: 1,
                Tuesday: 2,
                Wednesday: 3,
                Thursday: 4,
                Friday: 5,
                Saturday: 6,
              }
              return dayMap[day.trim()]
            })
            .filter((day: number) => day !== undefined)

          // Convert pickup days to maintenance days (day before pickup)
          const maintenanceDays = pickupDays.map((pickupDay: number) => {
            return pickupDay === 0 ? 6 : pickupDay - 1 // Day before (Sunday becomes Saturday)
          })
          schedules.garbage = maintenanceDays
        }

        if (data.RecyclingCollectionSchedule) {
          const pickupDays = data.RecyclingCollectionSchedule.split(',')
            .map((day: string) => {
              const dayMap: { [key: string]: number } = {
                Sunday: 0,
                Monday: 1,
                Tuesday: 2,
                Wednesday: 3,
                Thursday: 4,
                Friday: 5,
                Saturday: 6,
              }
              return dayMap[day.trim()]
            })
            .filter((day: number) => day !== undefined)

          // Convert pickup days to maintenance days (day before pickup)
          const maintenanceDays = pickupDays.map((pickupDay: number) => {
            return pickupDay === 0 ? 6 : pickupDay - 1 // Day before (Sunday becomes Saturday)
          })
          schedules.recycling = maintenanceDays
        }

        if (data.OrganicsCollectionSchedule) {
          const pickupDays = data.OrganicsCollectionSchedule.split(',')
            .map((day: string) => {
              const dayMap: { [key: string]: number } = {
                Sunday: 0,
                Monday: 1,
                Tuesday: 2,
                Wednesday: 3,
                Thursday: 4,
                Friday: 5,
                Saturday: 6,
              }
              return dayMap[day.trim()]
            })
            .filter((day: number) => day !== undefined)

          // Convert pickup days to maintenance days (day before pickup)
          const maintenanceDays = pickupDays.map((pickupDay: number) => {
            return pickupDay === 0 ? 6 : pickupDay - 1 // Day before (Sunday becomes Saturday)
          })
          schedules.organics = maintenanceDays
        }

        if (data.BulkPickupCollectionSchedule) {
          const pickupDays = data.BulkPickupCollectionSchedule.split(',')
            .map((day: string) => {
              const dayMap: { [key: string]: number } = {
                Sunday: 0,
                Monday: 1,
                Tuesday: 2,
                Wednesday: 3,
                Thursday: 4,
                Friday: 5,
                Saturday: 6,
              }
              return dayMap[day.trim()]
            })
            .filter((day: number) => day !== undefined)

          // Convert pickup days to maintenance days (day before pickup)
          const maintenanceDays = pickupDays.map((pickupDay: number) => {
            return pickupDay === 0 ? 6 : pickupDay - 1 // Day before (Sunday becomes Saturday)
          })
          schedules.bulk = maintenanceDays
        }

        return {
          address,
          zone: data.Zone || 'Unknown Zone',
          schedules,
          nextPickup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      } else {
        console.warn('DSNY API request failed:', response.status, response.statusText)
        console.warn('Response text:', await response.text())
        throw new Error(`API request failed: ${response.status}`)
      }
    } catch (error) {
      console.warn('DSNY API failed:', error)
      console.warn('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      })
      // Fallback to simulation
      return generateFallbackDSNYData(address)
    }
  }

  const generateFallbackDSNYData = (address: string) => {
    const zones = [
      { name: 'Zone 1 (Tuesday, Friday)', pickupDays: [2, 5], types: ['garbage', 'recycling'] },
      { name: 'Zone 2 (Monday, Thursday)', pickupDays: [1, 4], types: ['garbage', 'recycling'] },
      { name: 'Zone 3 (Wednesday, Saturday)', pickupDays: [3, 6], types: ['garbage', 'recycling'] },
    ]

    const randomZone = zones[Math.floor(Math.random() * zones.length)]

    // Convert pickup days to maintenance days (day before pickup)
    const maintenanceDays = randomZone.pickupDays.map((pickupDay: number) => {
      return pickupDay === 0 ? 6 : pickupDay - 1 // Day before (Sunday becomes Saturday)
    })

    return {
      address,
      zone: randomZone.name,
      schedules: {
        garbage: maintenanceDays,
        recycling: maintenanceDays,
        organics: [],
        bulk: [],
      },
      nextPickup: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    }
  }

  const handleDSNYFetch = async () => {
    if (!formData.property_id) {
      alert('Please select a property first')
      return
    }

    const selectedProperty = properties.find((p) => p.id === formData.property_id)
    if (!selectedProperty?.address) {
      alert('Selected property does not have an address')
      return
    }

    try {
      const dsnyData = await fetchDSNYPickupSchedule(selectedProperty.address)
      if (dsnyData) {
        // Update form data with DSNY schedule
        const garbageDays = dsnyData.schedules?.garbage || []
        const recyclingDays = dsnyData.schedules?.recycling || []
        const organicsDays = dsnyData.schedules?.organics || []
        const bulkDays = dsnyData.schedules?.bulk || []

        // Combine all DSNY days
        const allDSNYDays = Array.from(
          new Set([...garbageDays, ...recyclingDays, ...organicsDays, ...bulkDays])
        )

        setFormData((prev) => ({
          ...prev,
          dsny_integration: true,
          // Populate individual collection schedules
          garbage_schedule: garbageDays,
          recycling_schedule: recyclingDays,
          organics_schedule: organicsDays,
          bulk_schedule: bulkDays,
          // Master weekly schedule = only DSNY days (excluding interior cleaning)
          master_weekly_schedule: allDSNYDays,
          recurrence_days: allDSNYDays,
          recurrence_type: 'custom',
          // Keep existing collection types selection, don't override
          dsny_collection_types:
            prev.dsny_collection_types.length > 0
              ? prev.dsny_collection_types
              : ['garbage', 'recycling'],
          // DO NOT touch interior_cleaning_schedule - keep it separate from DSNY
        }))

        alert(
          `DSNY schedule loaded for ${selectedProperty.address}!\nZone: ${dsnyData.zone}\nSchedule updated with DSNY pickup days.`
        )
      }
    } catch (error) {
      console.error('Error fetching DSNY schedule:', error)
      alert('Error fetching DSNY schedule')
    }
  }

  const handleAddService = () => {
    if (!newService.service_type || !newService.service_name || newService.amount <= 0) {
      alert('Please fill in all required fields')
      return
    }

    // Find the selected service item to get its category ID
    const selectedItem = serviceItems.find((item) => item.id === newService.service_type)
    const selectedCategory = serviceCategories.find(
      (c) => c.id === selectedItem?.service_category_id
    )
    const isMaintenance = selectedCategory?.name?.toLowerCase().includes('dsny') || false

    const service = {
      id: `service_${Date.now()}`,
      service_item_id: newService.service_type, // Store the service item ID
      service_type: selectedItem?.service_category_id || '', // Store the category ID for database
      service_name: newService.service_name,
      amount: newService.amount,
      is_maintenance: isMaintenance,
      schedule: {
        recurrence_type: newService.recurrence_type,
        recurrence_days: newService.recurrence_days,
        dsny_integration: newService.dsny_integration && isMaintenance,
        garbage_schedule: [],
        recycling_schedule: [],
        organics_schedule: [],
        bulk_schedule: [],
        interior_cleaning_schedule: [],
      },
    }

    setContractServices([...contractServices, service])
    setNewService({
      service_type: '',
      service_name: '',
      amount: 0,
      recurrence_type: 'weekly',
      recurrence_days: [],
      dsny_integration: false,
      garbage_schedule: [],
      recycling_schedule: [],
      organics_schedule: [],
      bulk_schedule: [],
      interior_cleaning_schedule: [],
    })
    setShowAddServiceModal(false)
  }

  const isMaintenanceServiceById = (serviceItemId: string) => {
    const selectedItem = serviceItems.find((item) => item.id === serviceItemId)

    if (!selectedItem) {
      console.log('Service item not found for ID:', serviceItemId)
      return false
    }

    if (!selectedItem.categories) {
      console.log('Service item has no category:', selectedItem.name)
      return false
    }

    if (!maintenanceDSNYCategoryId) {
      console.log('Maintenance - DSNY category ID not set')
      return false
    }

    const isDSNY = selectedItem.service_category_id === maintenanceDSNYCategoryId
    console.log('Checking DSNY integration for:', selectedItem.name, {
      itemCategoryId: selectedItem.service_category_id,
      itemCategoryName: selectedItem.categories.name,
      maintenanceDSNYId: maintenanceDSNYCategoryId,
      matches: isDSNY,
    })

    return isDSNY
  }

  // Validation and navigation
  const validateTab = (tab: 'overview' | 'services' | 'billing' | 'notes'): boolean => {
    switch (tab) {
      case 'overview':
        return !!(
          formData.customer_id &&
          formData.property_id &&
          formData.contract_type &&
          formData.title
        )
      case 'services':
        return contractServices.length > 0
      case 'billing':
        return formData.billing_frequency !== '' && formData.payment_terms !== ''
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

    const tabs: Array<'overview' | 'services' | 'billing' | 'notes'> = [
      'overview',
      'services',
      'billing',
      'notes',
    ]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const tabs: Array<'overview' | 'services' | 'billing' | 'notes'> = [
      'overview',
      'services',
      'billing',
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
      // Debug logging
      console.log('Form data before submission:', formData)

      const contractData = {
        ...formData,
        contract_number: '', // Will be auto-generated
        template_type: formData.template_type || null,
        contract_type: formData.is_recurring ? 'recurring' : 'one_time', // Convert is_recurring to contract_type
        customer_id: formData.customer_id || null,
        property_id: formData.property_id || null,
        proposal_id: formData.proposal_id || null,
        total_amount: formData.total_amount || null,
        recurrence_end_count: formData.recurrence_end_count || null,
        late_fee_percentage: formData.late_fee_percentage || null,
        recurrence_end_date: formData.recurrence_end_date || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        signed_date: formData.status === 'active' ? new Date().toISOString().split('T')[0] : null,
        // Comprehensive schedule system (now enabled after schema update)
        master_weekly_schedule: formData.master_weekly_schedule || [],
        garbage_schedule: formData.garbage_schedule || [],
        recycling_schedule: formData.recycling_schedule || [],
        bulk_schedule: formData.bulk_schedule || [],
        organics_schedule: formData.organics_schedule || [],
        interior_cleaning_schedule: formData.interior_cleaning_schedule || [],
        // Dynamic manual schedules
        manual_schedules: formData.manual_schedules || [],
        // Legacy fields for backward compatibility
        dsny_pickup_days: formData.dsny_pickup_days || [],
        dsny_collection_types: formData.dsny_collection_types || [],
      }

      console.log('Contract data to submit:', contractData)

      const { data, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single()

      if (error) {
        console.error('Contract creation error:', error)
        throw error
      }

      console.log('Contract created successfully:', data)

      // Save contract services if any exist
      if (contractServices.length > 0 && data?.id) {
        try {
          console.log('Saving contract services:', contractServices)

          const serviceInserts = contractServices.map((service) => ({
            contract_id: data.id,
            service_type_id: service.service_type,
            service_name: service.service_name,
            amount: service.amount,
            recurrence_type: service.schedule.recurrence_type,
            recurrence_days: service.schedule.recurrence_days,
            dsny_integration: service.schedule.dsny_integration,
            garbage_schedule: service.schedule.garbage_schedule,
            recycling_schedule: service.schedule.recycling_schedule,
            organics_schedule: service.schedule.organics_schedule,
            bulk_schedule: service.schedule.bulk_schedule,
            interior_cleaning_schedule: service.schedule.interior_cleaning_schedule,
          }))

          const { error: servicesError } = await supabase
            .from('contract_services')
            .insert(serviceInserts)

          if (servicesError) {
            console.error('Error saving contract services:', servicesError)
            throw servicesError
          }

          console.log('Contract services saved successfully')
        } catch (servicesError) {
          console.error('Error saving services:', servicesError)
          // Don't fail the whole operation, just log the error
        }
      }

      // Save contract line items if any exist
      if (lineItems.length > 0 && data?.id) {
        try {
          console.log('Saving contract line items:', lineItems)

          const lineItemInserts = lineItems
            .filter((item) => item.description.trim() !== '') // Only save items with descriptions
            .map((item) => ({
              contract_id: data.id,
              service_item_id: item.service_item_id || null,
              description: item.description,
              quantity: item.quantity,
              unit_type: item.unit_type,
              unit_price: item.unit_price,
              total_price: item.total_price,
              sort_order: item.sort_order,
            }))

          if (lineItemInserts.length > 0) {
            const { error: lineItemsError } = await supabase
              .from('contract_line_items')
              .insert(lineItemInserts)

            if (lineItemsError) {
              console.error('Error saving contract line items:', lineItemsError)
              // Don't fail the whole operation, just log the error
              // Table might not exist yet - user can create it later
            } else {
              console.log('Contract line items saved successfully')
            }
          }
        } catch (lineItemsError) {
          console.error('Error saving line items:', lineItemsError)
          // Don't fail the whole operation, just log the error
        }
      }

      // If contract was created from a proposal linked to a lead, convert lead to customer
      if (contractData.proposal_id) {
        try {
          // Get the proposal to check if it has a lead_id
          const { data: proposal } = await supabase
            .from('proposals')
            .select('lead_id')
            .eq('id', contractData.proposal_id)
            .single()

          if (proposal?.lead_id) {
            await convertLeadToCustomer(proposal.lead_id)
            console.log('Lead converted to customer automatically')
          }
        } catch (conversionError) {
          console.error('Error converting lead:', conversionError)
          // Don't fail contract creation if conversion fails
        }
      }

      alert('Contract created successfully!')
      navigate('/contracts')
    } catch (error) {
      console.error('Error creating contract:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        fullError: error,
      })

      // Handle Supabase-specific errors
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any
        console.error('Supabase error details:', {
          code: supabaseError.code,
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
        })
        alert(`Contract creation failed: ${supabaseError.message || 'Database error'}`)
      } else {
        alert(
          `Error creating contract: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const dayNames = [
    { key: 0, label: 'Sunday' },
    { key: 1, label: 'Monday' },
    { key: 2, label: 'Tuesday' },
    { key: 3, label: 'Wednesday' },
    { key: 4, label: 'Thursday' },
    { key: 5, label: 'Friday' },
    { key: 6, label: 'Saturday' },
  ]

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'billing' | 'notes'>(
    'overview'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Contracts
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Contract</h1>
          <p className="text-gray-600 mt-2">
            Create a new service contract from a proposal or from scratch
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation - Read-only display */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <div
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                Overview
              </div>
              <div
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'services'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : activeTab === 'billing' || activeTab === 'notes'
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                Services & Schedule
              </div>
              <div
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'billing'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : activeTab === 'notes'
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                Billing & Financials
              </div>
              <div
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                Notes
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contract Title and Status - At the top */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 149 Skillman Street - Maintenance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as
                            | 'draft'
                            | 'pending_signature'
                            | 'active'
                            | 'paused'
                            | 'completed'
                            | 'cancelled'
                            | 'expired',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_signature">Pending Signature</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>

                {/* Two Column Layout: Customer/Property on left, Template/Proposal on right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Customer & Property */}
                  <div className="flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Customer & Property</h2>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Customer *
                            </label>
                            <div className="flex gap-2">
                              <select
                                required
                                value={formData.customer_id}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    customer_id: e.target.value,
                                    property_id: '',
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select customer...</option>
                                {customers.map((customer) => (
                                  <option key={customer.id} value={customer.id}>
                                    {customer.company_name ||
                                      `${customer.contact_first_name} ${customer.contact_last_name}`}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setShowCreateCustomer(true)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                              >
                                + New
                              </button>
                            </div>
                          </div>

                          <div className="pt-[27px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Property *
                            </label>
                            <div className="flex gap-2">
                              <select
                                required
                                value={formData.property_id}
                                onChange={(e) =>
                                  setFormData({ ...formData, property_id: e.target.value })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!formData.customer_id}
                              >
                                <option value="">Select property...</option>
                                {properties
                                  .filter((p) => p.customer_id === formData.customer_id)
                                  .map((property) => (
                                    <option key={property.id} value={property.id}>
                                      {property.name || property.address}
                                    </option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setShowCreateProperty(true)}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                disabled={!formData.customer_id}
                              >
                                + New
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Spacer to align with right column height */}
                    <div className="flex-grow"></div>
                  </div>

                  {/* Right Column: Template Type & Proposal Selection */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Contract Type & Proposal
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Type *
                          </label>
                          <select
                            required
                            value={formData.template_type}
                            onChange={(e) => {
                              const newType = e.target.value
                              setFormData({
                                ...formData,
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
                            This determines the template used when printing the contract
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Create from Proposal (Optional)
                          </label>
                          <select
                            value={formData.proposal_id}
                            onChange={(e) => handleProposalSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a proposal...</option>
                            {filteredProposals.map((proposal) => (
                              <option key={proposal.id} value={proposal.id}>
                                {proposal.proposal_number} - {proposal.title}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Selecting a proposal will auto-fill service details and amount
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Description - Below the two columns */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Contract Description</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter contract description"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Services & Schedule Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Contract Type */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Type</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                      <select
                        required
                        value={formData.contract_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contract_type: e.target.value as 'one_time' | 'recurring',
                            is_recurring: e.target.value === 'recurring',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="one_time">One Time</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Service
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Add services for this contract. Maintenance services will include DSNY schedule
                    integration.
                  </p>
                  <div className="space-y-4">
                    {contractServices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No services added yet. Click "Add Service" to get started.
                      </div>
                    ) : (
                      contractServices.map((service) => (
                        <div
                          key={service.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{service.service_name}</h3>
                              <p className="text-sm text-gray-600">
                                {service.is_maintenance
                                  ? '🧹 Maintenance Service'
                                  : '🔧 Other Service'}{' '}
                                • ${service.amount.toFixed(2)}
                              </p>
                              {service.is_maintenance && service.schedule.dsny_integration && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ DSNY schedule integrated
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setContractServices(
                                    contractServices.filter((s) => s.id !== service.id)
                                  )
                                }
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Billing & Financials Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Billing Configuration
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.total_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated from line items below
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Frequency *
                      </label>
                      <select
                        value={formData.billing_frequency}
                        onChange={(e) =>
                          setFormData({ ...formData, billing_frequency: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="after_each_service">After Each Service</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                        <option value="one_time">One-Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms *
                      </label>
                      <input
                        type="text"
                        value={formData.payment_terms}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_terms: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Net 30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee Percentage
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.late_fee_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            late_fee_percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Percentage applied to overdue invoices
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Tax Status
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Use Customer Default</option>
                        <option value="taxable">Taxable</option>
                        <option value="exempt">Tax Exempt</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Defaults to customer's sales tax status but can be overridden per contract
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Line Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
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
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                              placeholder="Service description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  index,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
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
                            {lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
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

                  {/* Line Items Total */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Line Items Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${lineItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any additional notes or comments for this contract."
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
              {/* Left side: Cancel button */}
              <button
                type="button"
                onClick={() => navigate('/contracts')}
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
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Contract...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        Create Contract
                      </>
                    )}
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

        {/* Add Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Service</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Item *
                  </label>
                  <select
                    value={newService.service_type}
                    onChange={(e) => {
                      const selectedItem = serviceItems.find((item) => item.id === e.target.value)
                      setNewService({
                        ...newService,
                        service_type: e.target.value,
                        service_name: selectedItem?.name || '',
                        amount: selectedItem?.base_price || 0,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select service item...</option>
                    {serviceItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.categories ? `(${item.categories.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newService.amount}
                    onChange={(e) =>
                      setNewService({ ...newService, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {isMaintenanceServiceById(newService.service_type) && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="dsny_integration_new"
                          checked={newService.dsny_integration}
                          onChange={(e) =>
                            setNewService({ ...newService, dsny_integration: e.target.checked })
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label
                          htmlFor="dsny_integration_new"
                          className="text-sm font-medium text-gray-700"
                        >
                          Enable DSNY Schedule Integration
                        </label>
                      </div>
                      {newService.dsny_integration && formData.property_id && (
                        <button
                          type="button"
                          onClick={async () => {
                            const selectedProperty = properties.find(
                              (p) => p.id === formData.property_id
                            )
                            if (!selectedProperty) {
                              alert('Please select a property first')
                              return
                            }

                            try {
                              const dsnyData = await fetchDSNYPickupSchedule(
                                selectedProperty.address || ''
                              )
                              const garbageDays = dsnyData.schedules.garbage || []
                              const recyclingDays = dsnyData.schedules.recycling || []
                              const organicsDays = dsnyData.schedules.organics || []
                              const bulkDays = dsnyData.schedules.bulk || []

                              // Combine all collection days to determine when to visit
                              const allCollectionDays = Array.from(
                                new Set([
                                  ...garbageDays,
                                  ...recyclingDays,
                                  ...organicsDays,
                                  ...bulkDays,
                                ])
                              )

                              // Update newService with ALL DSNY schedules
                              setNewService({
                                ...newService,
                                recurrence_days:
                                  allCollectionDays.length > 0
                                    ? allCollectionDays
                                    : newService.recurrence_days,
                                garbage_schedule: garbageDays,
                                recycling_schedule: recyclingDays,
                                organics_schedule: organicsDays,
                                bulk_schedule: bulkDays,
                                interior_cleaning_schedule: [], // Optional - user can add manually
                              })

                              alert(
                                `DSNY schedule loaded for ${selectedProperty.address}!\nGarbage: ${garbageDays.length} days\nRecycling: ${recyclingDays.length} days\nOrganics: ${organicsDays.length} days\nBulk: ${bulkDays.length} days`
                              )
                            } catch (error) {
                              console.error('Error fetching DSNY schedule:', error)
                              alert('Error fetching DSNY schedule')
                            }
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Fetch DSNY Schedule
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      When enabled, this maintenance service will automatically sync with DSNY
                      pickup schedules for garbage, recycling, organics, and bulk collection.
                    </p>
                    {newService.dsny_integration && !formData.property_id && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        ⚠️ Please select a property in the Overview tab to fetch DSNY schedule
                      </div>
                    )}

                    {/* DSNY Schedule Display - Show fetched schedules */}
                    {newService.dsny_integration &&
                      (newService.garbage_schedule.length > 0 ||
                        newService.recycling_schedule.length > 0 ||
                        newService.organics_schedule.length > 0 ||
                        newService.bulk_schedule.length > 0) && (
                        <div className="mt-6 space-y-4 border-l-2 border-green-200 pl-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            DSNY Collection Schedules
                          </h4>

                          {/* Garbage Schedule */}
                          {newService.garbage_schedule.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">
                                Garbage Collection
                              </label>
                              <div className="grid grid-cols-7 gap-1">
                                {dayNames.map((day) => (
                                  <div key={day.key} className="flex flex-col items-center">
                                    <input
                                      type="checkbox"
                                      checked={newService.garbage_schedule.includes(day.key)}
                                      disabled
                                      className="w-3 h-3 text-red-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                      {day.label.slice(0, 1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recycling Schedule */}
                          {newService.recycling_schedule.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">
                                Recycling Collection
                              </label>
                              <div className="grid grid-cols-7 gap-1">
                                {dayNames.map((day) => (
                                  <div key={day.key} className="flex flex-col items-center">
                                    <input
                                      type="checkbox"
                                      checked={newService.recycling_schedule.includes(day.key)}
                                      disabled
                                      className="w-3 h-3 text-blue-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                      {day.label.slice(0, 1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Organics Schedule */}
                          {newService.organics_schedule.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">
                                Organics/Compost Collection
                              </label>
                              <div className="grid grid-cols-7 gap-1">
                                {dayNames.map((day) => (
                                  <div key={day.key} className="flex flex-col items-center">
                                    <input
                                      type="checkbox"
                                      checked={newService.organics_schedule.includes(day.key)}
                                      disabled
                                      className="w-3 h-3 text-green-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                      {day.label.slice(0, 1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bulk Schedule */}
                          {newService.bulk_schedule.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">
                                Bulk Items Collection
                              </label>
                              <div className="grid grid-cols-7 gap-1">
                                {dayNames.map((day) => (
                                  <div key={day.key} className="flex flex-col items-center">
                                    <input
                                      type="checkbox"
                                      checked={newService.bulk_schedule.includes(day.key)}
                                      disabled
                                      className="w-3 h-3 text-purple-600 border-gray-300 rounded opacity-50 cursor-not-allowed"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                      {day.label.slice(0, 1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Visit Schedule Configuration
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recurrence Type *
                      </label>
                      <select
                        value={newService.recurrence_type}
                        onChange={(e) =>
                          setNewService({ ...newService, recurrence_type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Days</option>
                      </select>
                    </div>

                    {newService.recurrence_type === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Days
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`new_service_day_${day.key}`}
                                checked={newService.recurrence_days.includes(day.key)}
                                onChange={(e) => {
                                  const newDays = e.target.checked
                                    ? [...newService.recurrence_days, day.key]
                                    : newService.recurrence_days.filter((d) => d !== day.key)
                                  setNewService({ ...newService, recurrence_days: newDays })
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`new_service_day_${day.key}`}
                                className="text-xs text-gray-600 mt-1"
                              >
                                {day.label.slice(0, 3)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(newService.recurrence_type === 'weekly' ||
                      newService.recurrence_type === 'bi_weekly') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Days
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`new_service_day_${day.key}`}
                                checked={newService.recurrence_days.includes(day.key)}
                                onChange={(e) => {
                                  const newDays = e.target.checked
                                    ? [...newService.recurrence_days, day.key]
                                    : newService.recurrence_days.filter((d) => d !== day.key)
                                  setNewService({ ...newService, recurrence_days: newDays })
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`new_service_day_${day.key}`}
                                className="text-xs text-gray-600 mt-1"
                              >
                                {day.label.slice(0, 3)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
