import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3Icon,
  TrendingUpIcon,
  CalendarIcon,
  FileTextIcon,
  DownloadIcon,
  DollarSignIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from 'lucide-react'

export function Reports() {
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-01-31',
  })

  const reportCategories = [
    {
      title: 'Financial Reports',
      description: 'Revenue, expenses, and profitability analysis',
      icon: DollarSignIcon,
      color: 'blue',
      reports: [
        {
          name: 'Profit & Loss Statement',
          description: 'Comprehensive P&L analysis',
          href: '/reports/pnl',
          icon: TrendingUpIcon,
        },
        {
          name: 'Revenue Summary',
          description: 'Monthly and yearly revenue trends',
          href: '/reports/revenue',
          icon: BarChart3Icon,
        },
        {
          name: 'Customer Analysis',
          description: 'Customer profitability and trends',
          href: '/reports/customers',
          icon: UsersIcon,
        },
      ],
    },
    {
      title: 'Operational Reports',
      description: 'Job performance and operational metrics',
      icon: CheckCircleIcon,
      color: 'green',
      reports: [
        {
          name: 'Daily Dispatch',
          description: 'Daily job assignments and schedules',
          href: '/reports/dispatch',
          icon: CalendarIcon,
        },
        {
          name: 'End of Day Summary',
          description: 'Daily operational summary',
          href: '/reports/eod',
          icon: ClockIcon,
        },
        {
          name: 'Job Performance',
          description: 'Job completion rates and efficiency',
          href: '/reports/jobs',
          icon: CheckCircleIcon,
        },
      ],
    },
    {
      title: 'Quality Control',
      description: 'QC reports and compliance tracking',
      icon: AlertCircleIcon,
      color: 'yellow',
      reports: [
        {
          name: 'QC Schedule Report',
          description: 'Quality control scheduling',
          href: '/reports/qc-schedule',
          icon: CalendarIcon,
        },
        {
          name: 'QC Visit Results',
          description: 'QC visit outcomes and findings',
          href: '/reports/qc-visits',
          icon: CheckCircleIcon,
        },
        {
          name: 'Compliance Report',
          description: 'Regulatory compliance tracking',
          href: '/reports/compliance',
          icon: FileTextIcon,
        },
      ],
    },
  ]

  const quickStats = [
    {
      title: 'Total Revenue',
      value: '$45,250',
      change: '+12%',
      changeType: 'positive',
      icon: DollarSignIcon,
      color: 'green',
    },
    {
      title: 'Jobs Completed',
      value: '156',
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircleIcon,
      color: 'blue',
    },
    {
      title: 'Active Customers',
      value: '24',
      change: '+2',
      changeType: 'positive',
      icon: UsersIcon,
      color: 'purple',
    },
    {
      title: 'Avg Job Duration',
      value: '4.2h',
      change: '-0.3h',
      changeType: 'positive',
      icon: ClockIcon,
      color: 'orange',
    },
  ]

  const recentReports = [
    {
      name: 'January P&L Statement',
      type: 'Financial',
      generated: '2024-01-31',
      status: 'completed',
      size: '2.3 MB',
    },
    {
      name: 'Daily Dispatch - Jan 30',
      type: 'Operational',
      generated: '2024-01-30',
      status: 'completed',
      size: '1.1 MB',
    },
    {
      name: 'QC Visit Summary',
      type: 'Quality Control',
      generated: '2024-01-29',
      status: 'completed',
      size: '856 KB',
    },
    {
      name: 'Customer Analysis Q4',
      type: 'Financial',
      generated: '2024-01-28',
      status: 'completed',
      size: '3.2 MB',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-gray-600">Comprehensive reporting and business intelligence</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p
                    className={`mt-2 text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change} from last period
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Categories */}
        <div className="space-y-8 mb-8">
          {reportCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${getColorClasses(category.color)}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {category.reports.map((report, reportIndex) => (
                  <Link
                    key={reportIndex}
                    to={report.href}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <report.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                          {report.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
                <DownloadIcon className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.generated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View">
                          <FileTextIcon className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Download">
                          <DownloadIcon className="w-4 h-4" />
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
