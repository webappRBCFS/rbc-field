import React from 'react'
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, CalendarIcon } from 'lucide-react'

export function ReviewDetails() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Review Details</h1>
          <p className="mt-1 text-gray-600">Detailed review of completed job</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Review</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-900">
                    All areas cleaned according to specifications
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-900">Equipment properly maintained</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-900">
                    Minor touch-up needed in kitchen area
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Checklist</h2>
              <div className="space-y-3">
                {['Conference Rooms', 'Kitchen', 'Reception', 'Offices', 'Restrooms'].map(
                  (area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{area}</span>
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Actions</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Approve Job
                </button>
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  Request Revision
                </button>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Rating:</span>
                  <span className="font-medium text-green-600">4.8/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion:</span>
                  <span className="font-medium text-green-600">95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-blue-600">Under Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
