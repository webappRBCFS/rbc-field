import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import { ArrowLeftIcon, SaveIcon, ChevronDownIcon } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'billing' | 'notes'>(
    'overview'
  )
  const [activities, setActivities] = useState<any[]>([])
  const [relatedItems, setRelatedItems] = useState<{
    jobs: any[]
    invoices: any[]
    proposals: any[]
  }>({ jobs: [], invoices: [], proposals: [] })
  const [contractServices, setContractServices] = useState<any[]>([])
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_type: '',
    contract_type: 'one_time',
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

  const fetchContractServices = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_services')
        .select('*')
        .eq('contract_id', contractId)

      if (error) throw error
      setContractServices(data || [])
    } catch (error) {
      console.error('Error fetching contract services:', error)
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

      // Fetch contract services
      await fetchContractServices(contractId)
      setFormData({
        title: contractData.title || '',
        description: contractData.description || '',
        template_type: contractData.template_type || '',
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
          template_type: formData.template_type || null,
          contract_type: formData.contract_type, // This is now one_time or recurring
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
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Services & Schedule
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'billing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Billing & Financials
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Notes
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  <h2 className="text-lg font-semibold text-gray-900">Contract Type & Proposal</h2>

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
                        onChange={(e) => setFormData({ ...formData, proposal_id: e.target.value })}
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
            </div>

            {/* Services List */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
              </div>
              <div className="space-y-4">
                {contractServices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No services added to this contract yet.
                  </div>
                ) : (
                  contractServices.map((service) => {
                    const isExpanded = expandedServices.has(service.id)
                    return (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Service Header */}
                        <button
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">{service.service_name}</h3>
                            <p className="text-sm text-gray-600">
                              ${service.amount?.toFixed(2) || '0.00'}
                            </p>
                            {service.dsny_integration && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                DSNY
                              </span>
                            )}
                          </div>
                          <ChevronDownIcon
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Service Schedule */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-gray-200">
                            {(service.dsny_integration ||
                              (service.garbage_schedule && service.garbage_schedule.length > 0) ||
                              (service.recycling_schedule &&
                                service.recycling_schedule.length > 0) ||
                              (service.organics_schedule && service.organics_schedule.length > 0) ||
                              (service.bulk_schedule && service.bulk_schedule.length > 0) ||
                              (service.interior_cleaning_schedule &&
                                service.interior_cleaning_schedule.length > 0) ||
                              (service.recurrence_days && service.recurrence_days.length > 0)) && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule</h4>
                                <ScheduleView
                                  garbageSchedule={service.garbage_schedule || []}
                                  recyclingSchedule={service.recycling_schedule || []}
                                  organicsSchedule={service.organics_schedule || []}
                                  bulkSchedule={service.bulk_schedule || []}
                                  interiorCleaningSchedule={(
                                    service.interior_cleaning_schedule || []
                                  ).map((day: string | number) => parseInt(String(day)))}
                                  masterWeeklySchedule={service.recurrence_days || []}
                                  manualSchedules={[]}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Legacy Services & Schedule Tab - Replaced above */}
        {false && (
          <div className="space-y-6">
            {/* Contract Type */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Type</h2>
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

        {/* Billing & Financials Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Configuration</h2>

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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Line items will be added here for invoice generation
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Add Line Item
                </button>
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
              onKeyDown={handleNotesKeyDown}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes or comments for this contract."
            />
            <p className="text-sm text-gray-500">Press Ctrl+Enter to save notes</p>
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
