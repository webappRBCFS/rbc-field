import React from 'react'

interface ScheduleViewProps {
  garbageSchedule: number[]
  recyclingSchedule: number[]
  organicsSchedule: number[]
  bulkSchedule: number[]
  interiorCleaningSchedule: number[]
  masterWeeklySchedule: number[]
  manualSchedules?: Array<{
    id: string
    name: string
    description: string
    color: string
    days: number[]
  }>
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  garbageSchedule,
  recyclingSchedule,
  organicsSchedule,
  bulkSchedule,
  interiorCleaningSchedule,
  masterWeeklySchedule,
  manualSchedules = [],
}) => {
  const dayNames = [
    { key: 0, label: 'Sunday', short: 'Sun' },
    { key: 1, label: 'Monday', short: 'Mon' },
    { key: 2, label: 'Tuesday', short: 'Tue' },
    { key: 3, label: 'Wednesday', short: 'Wed' },
    { key: 4, label: 'Thursday', short: 'Thu' },
    { key: 5, label: 'Friday', short: 'Fri' },
    { key: 6, label: 'Saturday', short: 'Sat' },
  ]

  const scheduleTypes = [
    {
      name: 'Master Weekly Schedule',
      schedule: masterWeeklySchedule,
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      description: 'All days we visit (any service)',
    },
    {
      name: 'Garbage Collection',
      schedule: garbageSchedule,
      color: 'bg-red-100 border-red-300 text-red-800',
      description: 'Day before garbage pickup',
    },
    {
      name: 'Recycling Collection',
      schedule: recyclingSchedule,
      color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
      description: 'Day before recycling pickup',
    },
    {
      name: 'Organics/Compost Collection',
      schedule: organicsSchedule,
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Day before organics pickup',
    },
    {
      name: 'Bulk Items Collection',
      schedule: bulkSchedule,
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      description: 'Day before bulk pickup',
    },
    {
      name: 'Interior Cleaning',
      schedule: interiorCleaningSchedule,
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      description: 'Manual interior cleaning schedule',
    },
    // Add dynamic manual schedules
    ...manualSchedules.map((manualSchedule) => ({
      name: manualSchedule.name || 'Custom Schedule',
      schedule: manualSchedule.days,
      color: manualSchedule.color || 'bg-gray-100 border-gray-300 text-gray-800',
      description: manualSchedule.description || 'Custom manual schedule',
    })),
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Detailed Schedule View</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduleTypes.map((scheduleType) => {
          const activeDays =
            scheduleType.schedule.length > 0
              ? scheduleType.schedule.map((day) => dayNames[day].short).join(', ')
              : 'None scheduled'

          return (
            <div
              key={scheduleType.name}
              className={`
                p-3 rounded-lg border-2 text-sm font-medium
                ${
                  scheduleType.schedule.length > 0
                    ? scheduleType.color
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{scheduleType.name}</h4>
                <span className="text-xs opacity-75">
                  {scheduleType.schedule.length > 0 ? '✓' : '○'}
                </span>
              </div>
              <div className="text-xs opacity-90 mb-1">{scheduleType.description}</div>
              <div className="font-medium">{activeDays}</div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-medium">DSNY Services:</span>
            <div className="mt-1 space-y-1">
              {garbageSchedule.length > 0 && (
                <div className="text-red-700">
                  • Garbage: {garbageSchedule.map((d) => dayNames[d].short).join(', ')}
                </div>
              )}
              {recyclingSchedule.length > 0 && (
                <div className="text-cyan-700">
                  • Recycling: {recyclingSchedule.map((d) => dayNames[d].short).join(', ')}
                </div>
              )}
              {organicsSchedule.length > 0 && (
                <div className="text-green-700">
                  • Organics: {organicsSchedule.map((d) => dayNames[d].short).join(', ')}
                </div>
              )}
              {bulkSchedule.length > 0 && (
                <div className="text-purple-700">
                  • Bulk: {bulkSchedule.map((d) => dayNames[d].short).join(', ')}
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium">Manual Services:</span>
            <div className="mt-1 space-y-1">
              {interiorCleaningSchedule.length > 0 && (
                <div className="text-orange-700">
                  • Interior Cleaning:{' '}
                  {interiorCleaningSchedule.map((d) => dayNames[d].short).join(', ')}
                </div>
              )}
              {manualSchedules.map(
                (schedule) =>
                  schedule.days.length > 0 && (
                    <div key={schedule.id} className="text-gray-700">
                      • {schedule.name}: {schedule.days.map((d) => dayNames[d].short).join(', ')}
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleView
