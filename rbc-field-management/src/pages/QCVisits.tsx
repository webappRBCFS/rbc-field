import React from 'react'
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, CalendarIcon } from 'lucide-react'

export function QCVisits() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QC Visits</h1>
          <p className="mt-1 text-gray-600">Quality control visit tracking and results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">24</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">18</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">QC Visit Results</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              QC visit results and tracking information will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
