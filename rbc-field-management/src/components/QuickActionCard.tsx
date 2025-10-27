import React from 'react'
import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color = 'blue',
}: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
    pink: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
  }

  return (
    <Link
      to={href}
      className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div
        className={`inline-flex p-3 rounded-lg ${colorClasses[color]} transition-colors`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </Link>
  )
}