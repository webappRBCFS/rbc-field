import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ActivityItemProps {
  icon: LucideIcon
  title: string
  time: string
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}

export function ActivityItem({
  icon: Icon,
  title,
  time,
  color = 'blue',
}: ActivityItemProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
    </div>
  )
}