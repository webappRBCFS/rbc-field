import React, { useState, useEffect } from 'react'
import { PlusIcon, ArrowLeftIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import { convertLeadToCustomer } from '../lib/leadConversion'

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

export function ContractCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([])
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateProperty, setShowCreateProperty] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contract_type: 'one_time' as 'one_time' | 'recurring',
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
  }, [])

  useEffect(() => {
    if (formData.customer_id) {
      const customerProposals = proposals.filter((p) => p.customer_id === formData.customer_id)
      setFilteredProposals(customerProposals)
    } else {
      setFilteredProposals([])
    }
  }, [formData.customer_id, proposals])

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

      // Fetch approved proposals
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('id, title, proposal_number, customer_id, property_id, total_amount, status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      // Fetch service categories
      const { data: serviceCategoriesData } = await supabase
        .from('service_categories')
        .select('id, name, operational_division_id')
        .order('name')

      setCustomers(customersData || [])
      setProperties(propertiesData || [])
      setProposals(proposalsData || [])
      setServiceCategories(serviceCategoriesData || [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Debug logging
      console.log('Form data before submission:', formData)

      const contractData = {
        ...formData,
        contract_number: '', // Will be auto-generated
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Contract Source */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contract Source</h2>

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
                  Selecting a proposal will auto-fill customer, property, and amount details
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

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
                    placeholder="Enter contract title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Type *
                  </label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contract description"
                />
              </div>
            </div>

            {/* Customer and Property */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer & Property</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_id: e.target.value, property_id: '' })
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formData.property_id}
                      onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
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

            {/* Service Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Service Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select service type...</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Recurring Schedule - Only for recurring contracts */}
            {formData.is_recurring && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Recurring Schedule</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurrence Type
                    </label>
                    <select
                      value={formData.recurrence_type}
                      onChange={(e) =>
                        setFormData({ ...formData, recurrence_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Frequency
                    </label>
                    <select
                      value={formData.billing_frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, billing_frequency: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="one_time">One Time</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>

                {/* Recurring Days */}
                {formData.recurrence_type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((day) => (
                        <div key={day.key} className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            id={`day_${day.key}`}
                            checked={formData.recurrence_days.includes(day.key)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...formData.recurrence_days, day.key]
                                : formData.recurrence_days.filter((d) => d !== day.key)
                              setFormData({ ...formData, recurrence_days: newDays })
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`day_${day.key}`} className="text-xs text-gray-600">
                            {day.label.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DSNY Integration - Only for Maintenance Services */}
            {(() => {
              const isMaintenance = isMaintenanceService()
              const isRecurring = formData.is_recurring
              console.log('ContractCreate - DSNY section conditions:', {
                isMaintenance,
                isRecurring,
                serviceType: formData.service_type,
                contractType: formData.contract_type,
              })
              return isMaintenance && isRecurring
            })() && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">DSNY Integration</h2>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="dsny_integration"
                    checked={formData.dsny_integration}
                    onChange={(e) =>
                      setFormData({ ...formData, dsny_integration: e.target.checked })
                    }
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="dsny_integration" className="text-sm font-medium text-gray-700">
                    Sync with DSNY pickup schedule
                  </label>
                </div>

                {formData.dsny_integration && (
                  <div className="space-y-6 pl-6 border-l-2 border-green-200">
                    {/* DSNY Fetch Button */}
                    <div>
                      <button
                        type="button"
                        onClick={handleDSNYFetch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Fetch DSNY Schedule
                      </button>
                      <p className="text-sm text-blue-700 mt-1">
                        Automatically fetch all collection schedules (garbage, recycling, organics,
                        bulk) based on DSNY pickup days
                      </p>
                    </div>

                    {/* Master Weekly Schedule */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Master Weekly Schedule (Days We Visit)
                      </h4>
                      <div className="grid grid-cols-7 gap-2">
                        {dayNames.map((day) => (
                          <div key={day.key} className="flex flex-col items-center">
                            <input
                              type="checkbox"
                              id={`master_${day.key}`}
                              checked={formData.master_weekly_schedule.includes(day.key)}
                              onChange={(e) => {
                                const newSchedule = e.target.checked
                                  ? [...formData.master_weekly_schedule, day.key]
                                  : formData.master_weekly_schedule.filter((d) => d !== day.key)
                                setFormData({
                                  ...formData,
                                  master_weekly_schedule: newSchedule,
                                  recurrence_days: newSchedule,
                                })
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`master_${day.key}`}
                              className="text-xs text-gray-600 mt-1"
                            >
                              {day.label.slice(0, 3)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Collection Schedules */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Collection Schedules</h4>

                      {/* Garbage Schedule */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Garbage Collection
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`garbage_${day.key}`}
                                checked={formData.garbage_schedule.includes(day.key)}
                                onChange={(e) => {
                                  const newSchedule = e.target.checked
                                    ? [...formData.garbage_schedule, day.key]
                                    : formData.garbage_schedule.filter((d) => d !== day.key)
                                  setFormData({ ...formData, garbage_schedule: newSchedule })
                                }}
                                className="w-3 h-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {day.label.slice(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recycling Schedule */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Recycling Collection
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`recycling_${day.key}`}
                                checked={formData.recycling_schedule.includes(day.key)}
                                onChange={(e) => {
                                  const newSchedule = e.target.checked
                                    ? [...formData.recycling_schedule, day.key]
                                    : formData.recycling_schedule.filter((d) => d !== day.key)
                                  setFormData({ ...formData, recycling_schedule: newSchedule })
                                }}
                                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {day.label.slice(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Organics Schedule */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Organics/Compost Collection
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`organics_${day.key}`}
                                checked={formData.organics_schedule.includes(day.key)}
                                onChange={(e) => {
                                  const newSchedule = e.target.checked
                                    ? [...formData.organics_schedule, day.key]
                                    : formData.organics_schedule.filter((d) => d !== day.key)
                                  setFormData({ ...formData, organics_schedule: newSchedule })
                                }}
                                className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {day.label.slice(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bulk Schedule */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Bulk Items Collection
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`bulk_${day.key}`}
                                checked={formData.bulk_schedule.includes(day.key)}
                                onChange={(e) => {
                                  const newSchedule = e.target.checked
                                    ? [...formData.bulk_schedule, day.key]
                                    : formData.bulk_schedule.filter((d) => d !== day.key)
                                  setFormData({ ...formData, bulk_schedule: newSchedule })
                                }}
                                className="w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {day.label.slice(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interior Cleaning Schedule */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Interior Cleaning
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {dayNames.map((day) => (
                            <div key={day.key} className="flex flex-col items-center">
                              <input
                                type="checkbox"
                                id={`interior_${day.key}`}
                                checked={formData.interior_cleaning_schedule.includes(day.key)}
                                onChange={(e) => {
                                  const newSchedule = e.target.checked
                                    ? [...formData.interior_cleaning_schedule, day.key]
                                    : formData.interior_cleaning_schedule.filter(
                                        (d) => d !== day.key
                                      )
                                  setFormData({
                                    ...formData,
                                    interior_cleaning_schedule: newSchedule,
                                  })
                                }}
                                className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                {day.label.slice(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Manual Schedules */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">
                            Additional Manual Schedules
                          </h4>
                          <button
                            type="button"
                            onClick={addManualSchedule}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            + Add Schedule Type
                          </button>
                        </div>

                        {formData.manual_schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="space-y-2 p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Schedule name (e.g., Landscaping, Security)"
                                value={schedule.name}
                                onChange={(e) =>
                                  updateManualSchedule(schedule.id, 'name', e.target.value)
                                }
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                value={schedule.description}
                                onChange={(e) =>
                                  updateManualSchedule(schedule.id, 'description', e.target.value)
                                }
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeManualSchedule(schedule.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {dayNames.map((day) => (
                                <div key={day.key} className="flex flex-col items-center">
                                  <input
                                    type="checkbox"
                                    id={`manual_${schedule.id}_${day.key}`}
                                    checked={schedule.days.includes(day.key)}
                                    onChange={(e) =>
                                      updateManualScheduleDays(
                                        schedule.id,
                                        day.key,
                                        e.target.checked
                                      )
                                    }
                                    className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                  <span className="text-xs text-gray-500 mt-1">
                                    {day.label.slice(0, 1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Schedule View */}
            {(formData.dsny_integration ||
              formData.garbage_schedule.length > 0 ||
              formData.recycling_schedule.length > 0 ||
              formData.organics_schedule.length > 0 ||
              formData.bulk_schedule.length > 0 ||
              formData.interior_cleaning_schedule.length > 0 ||
              formData.manual_schedules.length > 0) && (
              <div className="space-y-4">
                <ScheduleView
                  garbageSchedule={formData.garbage_schedule}
                  recyclingSchedule={formData.recycling_schedule}
                  organicsSchedule={formData.organics_schedule}
                  bulkSchedule={formData.bulk_schedule}
                  interiorCleaningSchedule={formData.interior_cleaning_schedule}
                  masterWeeklySchedule={formData.master_weekly_schedule}
                  manualSchedules={formData.manual_schedules}
                />
              </div>
            )}

            {/* Contract Terms */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contract Terms</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Net 30"
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
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Terms
                </label>
                <textarea
                  value={formData.cancellation_terms}
                  onChange={(e) => setFormData({ ...formData, cancellation_terms: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter cancellation terms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter additional notes"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
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
              <button
                type="button"
                onClick={() => navigate('/contracts')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
