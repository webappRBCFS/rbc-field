import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  FileTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  DollarSignIcon,
  BarChart3Icon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingIcon,
  ClipboardListIcon,
  EyeIcon,
  UserCheckIcon,
  TrendingUpIcon,
  FileIcon,
  MessageSquareIcon,
  ReceiptIcon,
  GlobeIcon,
  CalendarDaysIcon,
  TimerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Leads', href: '/leads', icon: UsersIcon },
    { name: 'Proposals', href: '/proposals', icon: FileTextIcon },
    { name: 'Contracts', href: '/contracts', icon: FileIcon },
    { name: 'Jobs', href: '/jobs', icon: ClipboardListIcon },
    { name: 'Daily Dispatch', href: '/daily-dispatch', icon: CalendarIcon },
    {
      name: 'Time Management',
      href: '/time-clock',
      icon: ClockIcon,
      subPages: [
        { name: 'Time Clock', href: '/time-clock', icon: ClockIcon },
        { name: 'Time Review', href: '/time-review', icon: TimerIcon },
      ],
    },
    {
      name: 'Quality Control',
      href: '/qc-visits',
      icon: CheckCircleIcon,
      subPages: [
        { name: 'QC Visits', href: '/qc-visits', icon: CheckCircleIcon },
        { name: 'QC Schedule', href: '/qc-schedule', icon: CalendarDaysIcon },
      ],
    },
    {
      name: 'Review & Approval',
      href: '/review',
      icon: CheckCircleIcon,
      subPages: [
        { name: 'Review', href: '/review', icon: CheckCircleIcon },
        { name: 'End of Day', href: '/end-of-day', icon: CalendarIcon },
      ],
    },
    {
      name: 'Financial',
      href: '/billing',
      icon: DollarSignIcon,
      subPages: [
        { name: 'Billing', href: '/billing', icon: DollarSignIcon },
        { name: 'Invoice Generation', href: '/invoice-generation', icon: ReceiptIcon },
        { name: 'P&L Dashboard', href: '/pnl-dashboard', icon: TrendingUpIcon },
      ],
    },
    { name: 'Reports', href: '/reports', icon: BarChart3Icon },
    {
      name: 'Customer Management',
      href: '/customers',
      icon: BuildingIcon,
      subPages: [
        { name: 'Customers', href: '/customers', icon: BuildingIcon },
        { name: 'Properties', href: '/properties', icon: BuildingIcon },
        { name: 'Directory', href: '/directory', icon: UserCheckIcon },
      ],
    },
    { name: 'Communication', href: '/inbox', icon: MessageSquareIcon },
    { name: 'Client Portal', href: '/client-portal', icon: GlobeIcon },
    {
      name: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
      subPages: [{ name: 'Service Catalog', href: '/service-catalog', icon: FileTextIcon }],
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(href)
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  return (
    <div
      className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col h-screen`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RBC</span>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold">Field Management</h1>
              <p className="text-xs text-gray-400">Business System</p>
            </div>
          </div>
        )}
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const hasSubPages = item.subPages && item.subPages.length > 0
            const isExpanded = expandedItems.has(item.name)

            return (
              <div key={item.name}>
                {hasSubPages ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <div className="ml-2">
                        {isExpanded ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )}

                {/* Sub-pages */}
                {!isCollapsed && hasSubPages && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subPages.map((subPage) => {
                      const SubIcon = subPage.icon
                      const subActive = isActive(subPage.href)

                      return (
                        <Link
                          key={subPage.name}
                          to={subPage.href}
                          className={`group flex items-center px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            subActive
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <SubIcon className="w-4 h-4 mr-2" />
                          <span className="truncate">{subPage.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">AU</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@rbcfield.com</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">AU</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
