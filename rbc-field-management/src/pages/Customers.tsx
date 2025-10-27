import React, { useState } from 'react'
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  FileTextIcon,
} from 'lucide-react'

export function Customers() {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'ABC Corporation',
      email: 'contact@abccorp.com',
      phone: '(555) 123-4567',
      address: '123 Business St, New York, NY 10001',
      properties: 3,
      jobs: 12,
      status: 'active',
    },
    {
      id: 2,
      name: 'XYZ Industries',
      email: 'info@xyzind.com',
      phone: '(555) 987-6543',
      address: '456 Industrial Ave, Los Angeles, CA 90210',
      properties: 2,
      jobs: 8,
      status: 'active',
    },
    {
      id: 3,
      name: 'Tech Solutions Inc',
      email: 'hello@techsolutions.com',
      phone: '(555) 456-7890',
      address: '789 Tech Blvd, San Francisco, CA 94105',
      properties: 1,
      jobs: 5,
      status: 'inactive',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const handleCreateProposal = (customer: any) => {
    // Navigate to proposals page with customer ID
    window.location.href = `/proposals?customerId=${customer.id}`
  }

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    const customer = {
      id: customers.length + 1,
      ...newCustomer,
      properties: 0,
      jobs: 0,
      status: 'active',
    }
    setCustomers([...customers, customer])
    setNewCustomer({ name: '', email: '', phone: '', address: '' })
    setShowAddForm(false)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-gray-600">Manage your customer accounts and information</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <PlusIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {customers.filter((c) => c.status === 'active').length}
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
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {customers.reduce((sum, c) => sum + c.properties, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <EyeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {customers.reduce((sum, c) => sum + c.jobs, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <EyeIcon className="w-6 h-6" />
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => (window.location.href = '/customers/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Customer
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

        {/* Customers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Customer List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs
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
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MailIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.properties}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.jobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => (window.location.href = `/customers/edit/${customer.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCreateProposal(customer)}
                          className="text-green-600 hover:text-green-900"
                          title="Create Proposal"
                        >
                          <FileTextIcon className="w-4 h-4" />
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
