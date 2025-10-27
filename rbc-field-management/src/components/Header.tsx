import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserIcon, MenuIcon, ListIcon } from 'lucide-react'

export function Header() {
  const location = useLocation()

  const navItems = [
    {
      path: '/leads',
      label: 'Leads',
    },
    {
      path: '/customers',
      label: 'Customers',
    },
    {
      path: '/properties',
      label: 'Properties',
    },
    {
      path: '/jobs',
      label: 'Jobs',
    },
    {
      path: '/billing',
      label: 'Billing',
    },
    {
      path: '/reports',
      label: 'Reports',
    },
  ]

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                RBC
              </div>
            </Link>
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/directory"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Application Directory"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Directory</span>
            </Link>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="md:hidden p-2 rounded-full hover:bg-gray-100">
              <MenuIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
