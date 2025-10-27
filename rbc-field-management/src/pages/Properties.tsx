import React, { useState } from 'react'
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  EyeIcon,
  MapPinIcon,
  HomeIcon,
  CalendarIcon,
} from 'lucide-react'

export function Properties() {
  const [properties, setProperties] = useState([
    {
      id: 1,
      name: 'ABC Corp Main Office',
      address: '123 Business St, New York, NY 10001',
      customer: 'ABC Corporation',
      customerId: 1,
      type: 'Office',
      sqft: 5000,
      jobs: 4,
      lastService: '2024-01-15',
      status: 'active',
    },
    {
      id: 2,
      name: 'ABC Corp Warehouse',
      address: '456 Industrial Ave, New York, NY 10002',
      customer: 'ABC Corporation',
      customerId: 1,
      type: 'Warehouse',
      sqft: 15000,
      jobs: 6,
      lastService: '2024-01-10',
      status: 'active',
    },
    {
      id: 3,
      name: 'XYZ Industries Facility',
      address: '789 Manufacturing Blvd, Los Angeles, CA 90210',
      customer: 'XYZ Industries',
      customerId: 2,
      type: 'Manufacturing',
      sqft: 25000,
      jobs: 8,
      lastService: '2024-01-12',
      status: 'active',
    },
    {
      id: 4,
      name: 'Tech Solutions HQ',
      address: '321 Innovation Dr, San Francisco, CA 94105',
      customer: 'Tech Solutions Inc',
      customerId: 3,
      type: 'Office',
      sqft: 8000,
      jobs: 2,
      lastService: '2024-01-05',
      status: 'inactive',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    customerId: '',
    type: 'Office',
    sqft: '',
  })

  const customers = [
    { id: 1, name: 'ABC Corporation' },
    { id: 2, name: 'XYZ Industries' },
    { id: 3, name: 'Tech Solutions Inc' },
  ]

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault()
    const customer = customers.find((c) => c.id === parseInt(newProperty.customerId))
    const property = {
      id: properties.length + 1,
      name: newProperty.name,
      address: newProperty.address,
      customerId: parseInt(newProperty.customerId),
      type: newProperty.type,
      sqft: parseInt(newProperty.sqft),
      customer: customer?.name || '',
      jobs: 0,
      lastService: new Date().toISOString().split('T')[0],
      status: 'active',
    }
    setProperties([...properties, property])
    setNewProperty({ name: '', address: '', customerId: '', type: 'Office', sqft: '' })
    setShowAddForm(false)
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
                <EyeIcon className="w-6 h-6" />
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
                <CalendarIcon className="w-6 h-6" />
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
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Property
            </button>
          </div>
        </div>

        {/* Add Property Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Property</h2>
            <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  required
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  required
                  value={newProperty.customerId}
                  onChange={(e) => setNewProperty({ ...newProperty, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={newProperty.type}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Office">Office</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Residential">Residential</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Feet</label>
                <input
                  type="number"
                  required
                  value={newProperty.sqft}
                  onChange={(e) => setNewProperty({ ...newProperty, sqft: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Property
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <EditIcon className="w-4 h-4" />
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
