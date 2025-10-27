import React from 'react'
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, CalendarIcon } from 'lucide-react'

export function EndOfDay() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">End of Day Report</h1>
          <p className="mt-1 text-gray-600">Daily operational summary and analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jobs Completed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">32.5</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QC Passed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">6</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">2</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h2>
          <p className="text-gray-600">
            End of day operational summary and analytics will be displayed here.
          </p>
        </div>
      </div>
    </div>
  )
}
