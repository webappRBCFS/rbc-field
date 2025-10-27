import React, { useState, useEffect } from 'react'
import {
  EyeIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DollarSignIcon,
  AlertCircleIcon,
  FileTextIcon,
  LinkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ProposalRequest {
  id: string
  request_number: string
  title: string
  description?: string
  project_type: string
  property_address: string
  property_city?: string
  property_state?: string
  property_zip?: string
  property_type: string
  square_footage?: number
  estimated_budget?: number
  preferred_start_date?: string
  preferred_completion_date?: string
  urgency_level: string
  special_requirements?: string
  accessibility_needs?: string
  existing_contractor: boolean
  contractor_details?: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  company_name?: string
  lead_id?: string
  customer_id?: string
  property_id?: string
  status: string
  assigned_to?: string
  review_notes?: string
  internal_notes?: string
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
    uploaded_at: string
  }>
  blueprint_links: Array<{
    title: string
    url: string
    description: string
  }>
  submitted_at: string
  reviewed_at?: string
  quoted_at?: string
  converted_at?: string
  created_at: string
  updated_at: string
}

interface ProposalRequestsListProps {
  onViewRequest: (request: ProposalRequest) => void
  onEditRequest: (request: ProposalRequest) => void
  onDeleteRequest: (id: string) => void
}

export function ProposalRequestsList({
  onViewRequest,
  onEditRequest,
  onDeleteRequest,
}: ProposalRequestsListProps) {
  const [requests, setRequests] = useState<ProposalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUrgency, setFilterUrgency] = useState<string>('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_requests')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching proposal requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800'
      case 'quoted':
        return 'bg-purple-100 text-purple-800'
      case 'converted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesUrgency = filterUrgency === 'all' || request.urgency_level === filterUrgency

    return matchesSearch && matchesStatus && matchesUrgency
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="reviewing">Reviewing</option>
              <option value="quoted">Quoted</option>
              <option value="converted">Converted</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Urgency Levels</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposal requests found</h3>
            <p className="text-gray-500">No requests match your current filters.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(
                        request.urgency_level
                      )}`}
                    >
                      {request.urgency_level.charAt(0).toUpperCase() +
                        request.urgency_level.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>{request.contact_name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span>{request.property_address}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(request.submitted_at)}</span>
                    </div>

                    {request.estimated_budget && (
                      <div className="flex items-center space-x-2">
                        <DollarSignIcon className="h-4 w-4 text-gray-400" />
                        <span>{formatCurrency(request.estimated_budget)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FileTextIcon className="h-4 w-4" />
                      <span>
                        {request.attachments.length} file
                        {request.attachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <LinkIcon className="h-4 w-4" />
                      <span>
                        {request.blueprint_links.length} blueprint
                        {request.blueprint_links.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="capitalize">{request.project_type.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="capitalize">{request.property_type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {request.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{request.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onViewRequest(request)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Request"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onEditRequest(request)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Edit Request"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteRequest(request.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Request"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
