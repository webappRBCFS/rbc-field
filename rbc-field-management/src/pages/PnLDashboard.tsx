import React from 'react'
import { TrendingUpIcon, DollarSignIcon, CalendarIcon, BarChart3Icon } from 'lucide-react'

export function PnLDashboard() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">P&L Dashboard</h1>
          <p className="mt-1 text-gray-600">Profit and loss analysis and reporting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">$45,250</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <DollarSignIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">$28,150</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">$17,100</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <BarChart3Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">37.8%</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">P&L Analysis</h2>
          <p className="text-gray-600">Detailed profit and loss analysis will be displayed here.</p>
        </div>
      </div>
    </div>
  )
}
