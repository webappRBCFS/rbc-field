import React from 'react'
import { MessageSquareIcon, PhoneIcon, MailIcon, ClockIcon } from 'lucide-react'

export function MessageDetails() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Message Details</h1>
          <p className="mt-1 text-gray-600">Detailed view of communication message</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg">
              <MessageSquareIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Message</h2>
              <p className="text-gray-600">From: John Smith (+1 555-123-4567)</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-900">
              Hi, I need to reschedule tomorrow's cleaning appointment. Can we move it to 2 PM
              instead of 10 AM?
            </p>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Reply
            </button>
            <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
              Mark as Read
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Customer:</span>
              <span className="ml-2 font-medium">ABC Corporation</span>
            </div>
            <div>
              <span className="text-gray-600">Job ID:</span>
              <span className="ml-2 font-medium">#1234</span>
            </div>
            <div>
              <span className="text-gray-600">Property:</span>
              <span className="ml-2 font-medium">ABC Corp Main Office</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">Scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
