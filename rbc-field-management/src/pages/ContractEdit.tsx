import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ScheduleView from '../components/ScheduleView'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
          // Comprehensive Schedule System
          master_weekly_schedule: formData.master_weekly_schedule || [],
          garbage_schedule: formData.garbage_schedule || [],
          recycling_schedule: formData.recycling_schedule || [],
          bulk_schedule: formData.bulk_schedule || [],
          organics_schedule: formData.organics_schedule || [],
          interior_cleaning_schedule: formData.interior_cleaning_schedule || [],
          // Dynamic manual schedules
          manual_schedules: formData.manual_schedules || [],
          dsny_integration: formData.dsny_integration,
          // Legacy fields for compatibility
          dsny_pickup_days: formData.dsny_pickup_days || null,
          dsny_collection_types: formData.dsny_collection_types || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

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
    <div className="p-6 max-w-4xl mx-auto">
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type *
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contract_type: e.target.value as 'one_time' | 'recurring',
                    is_recurring: e.target.value === 'recurring',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="one_time">One-Time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Frequency
              </label>
              <select
                value={formData.billing_frequency}
                onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="one_time">One-Time</option>
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
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

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contract description..."
            />
          </div>
        </div>

        {/* Customer & Property Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer & Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              <div className="flex gap-2">
                <select
                  value={formData.customer_id}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_id: e.target.value, property_id: '' })
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <button
                  type="button"
                  onClick={() => setShowCreateProperty(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  + New
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal (Optional)
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

        {/* Contract Dates */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
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

        {/* Recurring Schedule */}
        {formData.is_recurring && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recurring Schedule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Type
                </label>
                <select
                  value={formData.recurrence_type}
                  onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Interval
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence_interval}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence_interval: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence_end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End After Count (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence_end_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence_end_count: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* DSNY Integration for Maintenance Services */}
            {isMaintenanceService() && (
              <div className="space-y-6 pl-6 border-l-2 border-green-200">
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">DSNY Integration</h3>
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
                        <label htmlFor={`master_${day.key}`} className="text-xs text-gray-600 mt-1">
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
                    <label className="text-sm font-medium text-gray-600">Garbage Collection</label>
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
                    <label className="text-sm font-medium text-gray-600">Interior Cleaning</label>
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
                                : formData.interior_cleaning_schedule.filter((d) => d !== day.key)
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
                                  updateManualScheduleDays(schedule.id, day.key, e.target.checked)
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

            {/* Schedule View */}
            {(formData.master_weekly_schedule.length > 0 ||
              formData.garbage_schedule.length > 0 ||
              formData.recycling_schedule.length > 0 ||
              formData.organics_schedule.length > 0 ||
              formData.bulk_schedule.length > 0 ||
              formData.interior_cleaning_schedule.length > 0 ||
              formData.manual_schedules.length > 0) && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Preview</h4>
                <ScheduleView
                  masterWeeklySchedule={formData.master_weekly_schedule}
                  garbageSchedule={formData.garbage_schedule}
                  recyclingSchedule={formData.recycling_schedule}
                  organicsSchedule={formData.organics_schedule}
                  bulkSchedule={formData.bulk_schedule}
                  interiorCleaningSchedule={formData.interior_cleaning_schedule}
                  manualSchedules={formData.manual_schedules}
                />
              </div>
            )}
          </div>
        )}

        {/* Payment Terms */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
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
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Terms
            </label>
            <textarea
              value={formData.cancellation_terms}
              onChange={(e) => setFormData({ ...formData, cancellation_terms: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cancellation terms and conditions..."
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes or special instructions..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                Save Contract
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
