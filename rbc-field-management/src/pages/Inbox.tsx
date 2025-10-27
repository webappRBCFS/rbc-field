import React, { useState } from 'react'
import {
  SearchIcon,
  FilterIcon,
  MessageSquareIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  UserIcon,
} from 'lucide-react'

export function Inbox() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'whatsapp',
      sender: 'John Smith',
      phone: '+1 (555) 123-4567',
      content:
        "Hi, I need to reschedule tomorrow's cleaning appointment. Can we move it to 2 PM instead of 10 AM?",
      timestamp: '2024-01-20T14:30:00',
      status: 'unread',
      jobId: 1234,
      customer: 'ABC Corporation',
    },
    {
      id: 2,
      type: 'email',
      sender: 'Sarah Johnson',
      email: 'sarah@xyzind.com',
      content: 'Thank you for the excellent service yesterday. The office looks amazing!',
      timestamp: '2024-01-20T09:15:00',
      status: 'read',
      jobId: 1235,
      customer: 'XYZ Industries',
    },
    {
      id: 3,
      type: 'voip',
      sender: 'Mike Wilson',
      phone: '+1 (555) 987-6543',
      content: 'Call regarding urgent maintenance request for warehouse equipment',
      timestamp: '2024-01-19T16:45:00',
      status: 'unread',
      jobId: null,
      customer: 'ABC Corporation',
    },
    {
      id: 4,
      type: 'whatsapp',
      sender: 'Emily Davis',
      phone: '+1 (555) 456-7890',
      content: 'Can you confirm the time for our weekly cleaning service?',
      timestamp: '2024-01-19T11:20:00',
      status: 'read',
      jobId: 1236,
      customer: 'Tech Solutions Inc',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || message.type === typeFilter
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return MessageSquareIcon
      case 'email':
        return MailIcon
      case 'voip':
        return PhoneIcon
      default:
        return MessageSquareIcon
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'bg-green-50 text-green-600'
      case 'email':
        return 'bg-blue-50 text-blue-600'
      case 'voip':
        return 'bg-purple-50 text-purple-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communications Hub</h1>
          <p className="mt-1 text-gray-600">Unified messaging across WhatsApp, Email, and VOIP</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{messages.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <MessageSquareIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {messages.filter((m) => m.status === 'unread').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {messages.filter((m) => m.type === 'whatsapp').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <MessageSquareIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {messages.filter((m) => m.type === 'email').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <MailIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="voip">VOIP</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FilterIcon className="w-5 h-5" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => {
              const TypeIcon = getTypeIcon(message.type)
              return (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    message.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(message.type)}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{message.sender}</h3>
                          <span className="text-xs text-gray-500">
                            {message.type === 'email' ? message.email : message.phone}
                          </span>
                          {message.status === 'unread' && (
                            <span className="inline-flex w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3" />
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{message.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {message.customer}
                        </span>
                        {message.jobId && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            Job #{message.jobId}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded ${
                            message.type === 'whatsapp'
                              ? 'bg-green-100 text-green-800'
                              : message.type === 'email'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {message.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
