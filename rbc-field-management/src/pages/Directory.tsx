import React from 'react'
import { Link } from 'react-router-dom'
import {
  UsersIcon,
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  MessageSquareIcon,
  DollarSignIcon,
  CheckCircleIcon,
  BarChart3Icon,
  TrendingUpIcon,
  FileTextIcon,
  EyeIcon,
  UserCheckIcon,
  SettingsIcon,
  GlobeIcon,
  ClipboardListIcon,
  TimerIcon,
  CalendarDaysIcon,
  ReceiptIcon,
  BuildingIcon,
} from 'lucide-react'

export function Directory() {
  const pageCategories = [
    {
      title: 'Core Management',
      description: 'Essential business operations',
      color: 'blue',
      pages: [
        {
          name: 'Dashboard',
          description: 'Main dashboard with overview and quick actions',
          href: '/dashboard',
          icon: HomeIcon,
        },
        {
          name: 'Leads',
          description: 'Lead management and sales pipeline tracking',
          href: '/leads',
          icon: UsersIcon,
        },
        {
          name: 'Proposals',
          description: 'Create and manage customer proposals',
          href: '/proposals',
          icon: FileTextIcon,
        },
        {
          name: 'Jobs',
          description: 'Manage field operations and job scheduling',
          href: '/jobs',
          icon: ClipboardListIcon,
        },
        {
          name: 'Job Details',
          description: 'Detailed view of specific job information',
          href: '/jobs/:id',
          icon: EyeIcon,
        },
        {
          name: 'Daily Dispatch',
          description: 'Daily job dispatch lists and scheduling',
          href: '/daily-dispatch',
          icon: CalendarIcon,
        },
      ],
    },
    {
      title: 'Time & Attendance',
      description: 'Employee time tracking and management',
      color: 'green',
      pages: [
        {
          name: 'Time Clock',
          description: 'Clock in/out and track work hours',
          href: '/time-clock',
          icon: ClockIcon,
        },
        {
          name: 'Time Review',
          description: 'Review and manage employee time entries',
          href: '/time-review',
          icon: TimerIcon,
        },
      ],
    },
    {
      title: 'Quality Control',
      description: 'Quality assurance and inspection management',
      color: 'yellow',
      pages: [
        {
          name: 'QC Visits',
          description: 'Track QC visit results and outcomes',
          href: '/qc-visits',
          icon: CheckCircleIcon,
        },
        {
          name: 'QC Schedule',
          description: 'Schedule quality control inspections',
          href: '/qc-schedule',
          icon: CalendarDaysIcon,
        },
      ],
    },
    {
      title: 'Review & Approval',
      description: 'Job review and approval workflows',
      color: 'purple',
      pages: [
        {
          name: 'Review',
          description: 'Review completed jobs for approval',
          href: '/review',
          icon: CheckCircleIcon,
        },
        {
          name: 'Review Details',
          description: 'Detailed review of specific job',
          href: '/review/:id',
          icon: EyeIcon,
        },
        {
          name: 'End of Day',
          description: 'Daily operational summary and closing',
          href: '/end-of-day',
          icon: CalendarIcon,
        },
      ],
    },
    {
      title: 'Financial Management',
      description: 'Invoice management and financial operations',
      color: 'indigo',
      pages: [
        {
          name: 'Billing',
          description: 'Manage invoices and billing operations',
          href: '/billing',
          icon: DollarSignIcon,
        },
        {
          name: 'Invoice Generation',
          description: 'Automated invoice generation from jobs',
          href: '/invoice-generation',
          icon: ReceiptIcon,
        },
        {
          name: 'P&L Dashboard',
          description: 'Profit and loss analysis and reporting',
          href: '/pnl-dashboard',
          icon: TrendingUpIcon,
        },
      ],
    },
    {
      title: 'Reports & Analytics',
      description: 'Business intelligence and reporting',
      color: 'orange',
      pages: [
        {
          name: 'Reports',
          description: 'Central hub for all reporting functionality',
          href: '/reports',
          icon: BarChart3Icon,
        },
      ],
    },
    {
      title: 'Customer Management',
      description: 'Customer and property management',
      color: 'teal',
      pages: [
        {
          name: 'Customers',
          description: 'Manage customer accounts and information',
          href: '/customers',
          icon: UsersIcon,
        },
        {
          name: 'Properties',
          description: 'Track property locations and details',
          href: '/properties',
          icon: BuildingIcon,
        },
        {
          name: 'Directory',
          description: 'Complete application directory (this page)',
          href: '/directory',
          icon: UserCheckIcon,
        },
      ],
    },
    {
      title: 'Communication',
      description: 'Unified messaging and communication hub',
      color: 'pink',
      pages: [
        {
          name: 'Inbox',
          description: 'WhatsApp, Email, and VOIP message management',
          href: '/inbox',
          icon: MessageSquareIcon,
        },
        {
          name: 'Message Details',
          description: 'Detailed view of specific message',
          href: '/inbox/:id',
          icon: MessageSquareIcon,
        },
      ],
    },
    {
      title: 'Client Portal',
      description: 'Public-facing client access',
      color: 'emerald',
      pages: [
        {
          name: 'Client Portal',
          description: 'Public client portal for job reports and photos',
          href: '/client-portal',
          icon: GlobeIcon,
        },
      ],
    },
    {
      title: 'System',
      description: 'System configuration and settings',
      color: 'gray',
      pages: [
        {
          name: 'Settings',
          description: 'System configuration and settings',
          href: '/settings',
          icon: SettingsIcon,
        },
        {
          name: 'Service Catalog',
          description: 'Manage service categories and items',
          href: '/service-catalog',
          icon: FileTextIcon,
        },
      ],
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      pink: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      teal: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
      gray: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const totalPages = pageCategories.reduce((sum, category) => sum + category.pages.length, 0)

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Directory</h1>
          <p className="mt-1 text-gray-600">
            Complete navigation to all {totalPages} pages in the RBC Field Management application
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pages</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{totalPages}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <FileTextIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{pageCategories.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <SettingsIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Core Features</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">4</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <BarChart3Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Page Categories */}
        <div className="space-y-8">
          {pageCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.pages.map((page, pageIndex) => {
                  const Icon = page.icon
                  return (
                    <Link
                      key={pageIndex}
                      to={page.href}
                      className={`group p-4 border rounded-lg transition-all hover:shadow-md ${getColorClasses(
                        category.color
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white/50 group-hover:bg-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                            {page.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {page.description}
                          </p>
                          <div className="mt-2 text-xs text-gray-500 font-mono">{page.href}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              to="/dashboard"
              className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <HomeIcon className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Dashboard</span>
            </Link>
            <Link
              to="/leads"
              className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-green-800">Leads</span>
            </Link>
            <Link
              to="/proposals"
              className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileTextIcon className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">Proposals</span>
            </Link>
            <Link
              to="/jobs"
              className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <ClipboardListIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-800">Jobs</span>
            </Link>
            <Link
              to="/time-clock"
              className="flex flex-col items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">Time Clock</span>
            </Link>
            <Link
              to="/billing"
              className="flex flex-col items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <DollarSignIcon className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-medium text-orange-800">Billing</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
