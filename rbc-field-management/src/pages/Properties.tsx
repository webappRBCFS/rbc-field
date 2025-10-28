import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  SearchIcon,
  FileTextIcon,
  ClipboardListIcon,
  BriefcaseIcon,
  DollarSignIcon,
  MapPinIcon,
  HomeIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Properties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, customers!inner(company_name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match the expected format
      const transformedData =
        data?.map((p) => ({
          id: p.id,
          name: p.name,
          address: `${p.address || ''} ${p.city || ''} ${p.state || ''} ${p.zip_code || ''}`.trim(),
          customer: (p.customers as any)?.company_name || 'N/A',
          customerId: p.customer_id,
          type: p.property_type || 'N/A',
          sqft: p.sqft || 0,
          jobs: 0,
          lastService: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '',
          status: 'active',
        })) || []

      setProperties(transformedData)
    } catch (error) {
      console.error('Error fetching properties:', error)
      alert('Error loading properties: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.customer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="mt-1 text-gray-600">Manage property locations and details</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <HomeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Properties</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {properties.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <HomeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sq Ft</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {properties.reduce((sum, p) => sum + p.sqft, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <MapPinIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {properties.reduce((sum, p) => sum + p.jobs, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => navigate('/properties/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Property
            </button>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Property List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => navigate(`/properties/view/${property.id}`)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                        >
                          {property.name}
                        </button>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {property.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {property.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.sqft.toLocaleString()} sq ft
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.jobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(property.lastService).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/proposals/create?property=${property.id}`)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Create Proposal"
                        >
                          <FileTextIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/contracts/create?property=${property.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Create Contract"
                        >
                          <ClipboardListIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/jobs/create?property=${property.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Create Job"
                        >
                          <BriefcaseIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/invoices/create?property=${property.id}`)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Create Invoice"
                        >
                          <DollarSignIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
