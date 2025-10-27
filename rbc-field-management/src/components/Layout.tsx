import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { DivisionProvider, DivisionFilter } from '../contexts/DivisionContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <DivisionProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar for mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RBC</span>
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900">Field Management</span>
              </div>
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop header with division filter */}
          <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">RBC Field Management</h1>
                <DivisionFilter />
              </div>
              <div className="flex items-center space-x-4">
                {/* Add other header elements here if needed */}
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DivisionProvider>
  )
}
