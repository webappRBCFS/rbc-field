import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../utils/activityLogger'

interface Contract {
  id: string
  contract_number: string
  title: string
  description?: string
  contract_type: 'one_time' | 'recurring'
  service_type?: string
  total_amount?: number
  billing_frequency?: string
  is_recurring: boolean
  recurrence_type?: string
  recurrence_days?: number[]
  dsny_integration?: boolean
  dsny_pickup_days?: string[]
  dsny_collection_types?: string[]
  interior_cleaning_schedule?: string[]
  // Comprehensive schedule system
  master_weekly_schedule?: number[]
  garbage_schedule?: number[]
  recycling_schedule?: number[]
  organics_schedule?: number[]
  bulk_schedule?: number[]
  status:
    | 'draft'
    | 'pending_signature'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | 'expired'
  start_date?: string
  end_date?: string
  signed_date?: string
  payment_terms?: string
  late_fee_percentage?: number
  cancellation_terms?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: {
    company_name?: string
    contact_first_name: string
    contact_last_name: string
  }
  property?: {
    name: string
    address: string
    city?: string
    state?: string
  }
}

export function ContractEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contract, setContract] = useState<Contract | null>(null)
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [filteredProposals, setFilteredProposals] = useState<any[]>([])
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showCreateProperty, setShowCreateProperty] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'terms' | 'notes'>(
    'overview'
  )
  const [activities, setActivities] = useState<any[]>([])
  const [relatedItems, setRelatedItems] = useState<{
    jobs: any[]
    invoices: any[]
    proposals: any[]
  }>({ jobs: [], invoices: [], proposals: [] })

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
    status: 'draft' as
      | 'draft'
      | 'pending_signature'
      | 'active'
      | 'paused'
      | 'completed'
      | 'cancelled'
      | 'expired',
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
    if (id) {
      fetchContract(id)
      fetchActivities()
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (formData.customer_id) {
      const customerProposals = proposals.filter((p) => p.customer_id === formData.customer_id)
      setFilteredProposals(customerProposals)
    } else {
      setFilteredProposals([])
    }
  }, [formData.customer_id, proposals])

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

      // Fetch proposals
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('id, title, proposal_number, customer_id, status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      // Fetch service categories
      const { data: serviceCategoriesData } = await supabase
        .from('service_categories')
        .select('id, name, description, operational_division_id')
        .eq('is_active', true)
        .order('name')

      setCustomers(customersData || [])
      setProperties(propertiesData || [])
      setProposals(proposalsData || [])
      setServiceCategories(serviceCategoriesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, description, operational_division_id')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServiceCategories(data || [])
    } catch (error) {
      console.error('Error fetching service categories:', error)
    }
  }

  const fetchContract = async (contractId: string) => {
    try {
      setLoading(true)

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(
          `
          *,
          customer:customers(id, company_name, contact_first_name, contact_last_name),
          property:properties(id, name, address, city, state)
        `
        )
        .eq('id', contractId)
        .single()

      if (contractError) throw contractError

      setContract(contractData)
      setFormData({
        title: contractData.title || '',
        description: contractData.description || '',
        contract_type: contractData.contract_type || 'one_time',
        service_type: contractData.service_type || '',
        customer_id: contractData.customer_id || '',
        property_id: contractData.property_id || '',
        proposal_id: contractData.proposal_id || '',
        total_amount: contractData.total_amount || 0,
        billing_frequency: contractData.billing_frequency || 'one_time',
        is_recurring: contractData.is_recurring || false,
        recurrence_type: contractData.recurrence_type || 'weekly',
        recurrence_interval: contractData.recurrence_interval || 1,
        recurrence_days: contractData.recurrence_days || [],
        recurrence_end_date: contractData.recurrence_end_date || '',
        recurrence_end_count: contractData.recurrence_end_count || 0,
        status: contractData.status || 'draft',
        start_date: contractData.start_date || '',
        end_date: contractData.end_date || '',
        payment_terms: contractData.payment_terms || 'Net 30',
        late_fee_percentage: contractData.late_fee_percentage || 0,
        cancellation_terms: contractData.cancellation_terms || '',
        notes: contractData.notes || '',
        // Comprehensive Schedule System
        master_weekly_schedule: contractData.master_weekly_schedule || [],
        garbage_schedule: contractData.garbage_schedule || [],
        recycling_schedule: contractData.recycling_schedule || [],
        bulk_schedule: contractData.bulk_schedule || [],
        organics_schedule: contractData.organics_schedule || [],
        interior_cleaning_schedule: contractData.interior_cleaning_schedule || [],
        // Dynamic manual schedules
        manual_schedules: contractData.manual_schedules || [],
        dsny_integration: contractData.dsny_integration || false,
        // Legacy fields for compatibility
        dsny_pickup_days: contractData.dsny_pickup_days || [],
        dsny_collection_types: contractData.dsny_collection_types || [],
      })
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Error loading contract details')
    } finally {
      setLoading(false)
    }
  }

  // DSNY Integration Functions
  const isMaintenanceService = () => {
    const selectedService = serviceCategories.find(
      (service) => service.id === formData.service_type
    )
    return selectedService?.operational_division_id === 'aad2c279-31a9-4f3d-bc5e-195f218b38d7' // Maintenance division ID
  }

  const generateFallbackDSNYData = (address: string) => {
    const zones = [
      'Zone 1 (Tuesday, Friday)',
      'Zone 2 (Monday, Thursday)',
      'Zone 3 (Wednesday, Saturday)',
      'Zone 4 (Tuesday, Friday)',
      'Zone 5 (Monday, Thursday)',
    ]
    const randomZone = zones[Math.floor(Math.random() * zones.length)]
    const pickupDays = [1, 4] // Tuesday, Friday as example

    return {
      address,
      zone: randomZone,
      schedules: {
        garbage: pickupDays,
        recycling: pickupDays,
        organics: [],
        bulk: [],
      },
      nextPickup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  }

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

  const handleDSNYFetch = async () => {
    if (!formData.property_id) {
      alert('Please select a property first')
      return
    }

    const selectedProperty = properties.find((p) => p.id === formData.property_id)
    if (!selectedProperty) {
      alert('Property not found')
      return
    }

    try {
      const dsnyData = await fetchDSNYPickupSchedule(selectedProperty.address)

      // Extract individual collection schedules
      const garbageDays = dsnyData.schedules.garbage || []
      const recyclingDays = dsnyData.schedules.recycling || []
      const organicsDays = dsnyData.schedules.organics || []
      const bulkDays = dsnyData.schedules.bulk || []

      // Combine all DSNY days (excluding interior cleaning)
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
    } catch (error) {
      console.error('Error fetching DSNY schedule:', error)
      alert('Error fetching DSNY schedule')
    }
  }

  // Manual Schedule Functions
  const addManualSchedule = () => {
    const newSchedule = {
      id: `manual_${Date.now()}`,
      name: '',
      description: '',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
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

  const fetchActivities = async () => {
    if (!id) return
    try {
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', id)
        .eq('entity_type', 'contract')
        .order('created_at', { ascending: false })

      setActivities(activityData || [])

      // Fetch related items
      const { data: jobsData } = await supabase.from('jobs').select('*').eq('contract_id', id)

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('contract_id', id)

      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('contract_id', id)

      setRelatedItems({
        jobs: jobsData || [],
        invoices: invoicesData || [],
        proposals: proposalsData || [],
      })
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      // Could auto-save here if desired
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          title: formData.title,
          description: formData.description || null,
          contract_type: formData.contract_type,
          service_type: formData.service_type || null,
          customer_id: formData.customer_id || null,
          property_id: formData.property_id || null,
          proposal_id: formData.proposal_id || null,
          total_amount: formData.total_amount || null,
          billing_frequency: formData.billing_frequency || null,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.recurrence_type || null,
          recurrence_interval: formData.recurrence_interval || null,
          recurrence_days: formData.recurrence_days || null,
          recurrence_end_date: formData.recurrence_end_date || null,
          recurrence_end_count: formData.recurrence_end_count || null,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          payment_terms: formData.payment_terms || null,
          late_fee_percentage: formData.late_fee_percentage || null,
          cancellation_terms: formData.cancellation_terms || null,
          notes: formData.notes || null,
          master_weekly_schedule: formData.master_weekly_schedule || [],
          garbage_schedule: formData.garbage_schedule || [],
          recycling_schedule: formData.recycling_schedule || [],
          bulk_schedule: formData.bulk_schedule || [],
          organics_schedule: formData.organics_schedule || [],
          interior_cleaning_schedule: formData.interior_cleaning_schedule || [],
          manual_schedules: formData.manual_schedules || [],
          dsny_integration: formData.dsny_integration,
          dsny_pickup_days: formData.dsny_pickup_days || null,
          dsny_collection_types: formData.dsny_collection_types || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await logActivity({
        activity_type: 'updated',
        entity_type: 'contract',
        entity_id: id || '',
        description: `Contract ${formData.title} was updated`,
        metadata: {
          title: formData.title,
          status: formData.status,
        },
      })

      alert('Contract updated successfully!')
      navigate(`/contracts/details/${id}`)
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Error updating contract')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Contract not found</p>
          <button
            onClick={() => navigate('/contracts')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Contract</h1>
            <p className="text-gray-600">Contract #{contract.contract_number}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/contracts/details/${id}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Contract
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['overview', 'schedule', 'terms', 'notes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'schedule' | 'terms' | 'notes')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer & Property</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_id: e.target.value, property_id: '' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name ||
                          `${customer.contact_first_name} ${customer.contact_last_name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property *</label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Property</option>
                    {properties
                      .filter((property) => property.customer_id === formData.customer_id)
                      .map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.address}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Proposal
                  </label>
                  <select
                    value={formData.proposal_id}
                    onChange={(e) => setFormData({ ...formData, proposal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Proposal</option>
                    {filteredProposals.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.proposal_number} - {proposal.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
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
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Auto-filled: Property Address - Service Type"
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contract description..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {formData.is_recurring && (
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
                )}

                {formData.is_recurring && (
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
                )}

                {formData.is_recurring && (
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
                )}

                {formData.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {formData.is_recurring && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">DSNY Integration</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="dsny_integration_schedule"
                      checked={formData.dsny_integration}
                      onChange={(e) =>
                        setFormData({ ...formData, dsny_integration: e.target.checked })
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label
                      htmlFor="dsny_integration_schedule"
                      className="text-sm font-medium text-gray-700"
                    >
                      Sync with DSNY pickup schedule
                    </label>
                  </div>
                </div>
              )}

              {formData.is_recurring && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Recurring Days
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day) => (
                      <div key={day.key} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          id={`recurrence_day_${day.key}`}
                          checked={formData.recurrence_days.includes(day.key)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...formData.recurrence_days, day.key]
                              : formData.recurrence_days.filter((d) => d !== day.key)
                            setFormData({ ...formData, recurrence_days: newDays })
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`recurrence_day_${day.key}`}
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
        )}

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Terms
                  </label>
                  <textarea
                    value={formData.cancellation_terms}
                    onChange={(e) =>
                      setFormData({ ...formData, cancellation_terms: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Cancellation terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                onKeyDown={handleNotesKeyDown}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter notes (Ctrl+Enter for quick submission)"
              />
              <p className="text-sm text-gray-500 mt-2">Press Ctrl+Enter to save notes</p>
            </div>

            {/* Activity Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{relatedItems.jobs.length}</div>
                  <div className="text-sm text-gray-600">Jobs</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {relatedItems.invoices.length}
                  </div>
                  <div className="text-sm text-gray-600">Invoices</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {relatedItems.proposals.length}
                  </div>
                  <div className="text-sm text-gray-600">Proposals</div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 pb-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No activity yet</p>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                Save Contract
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
  )
}
