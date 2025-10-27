import React from 'react'
import { ClockIcon, CalendarIcon, UserIcon, CheckCircleIcon } from 'lucide-react'

export function TimeReview() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Review</h1>
          <p className="mt-1 text-gray-600">Review and manage employee time entries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">156.5</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">144</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              Time entries will be displayed here for review and approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
