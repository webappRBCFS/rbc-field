import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Contract {
  id: string
  contract_number: string
  title: string
  contract_type: 'one_time' | 'recurring'
  service_type?: string
  is_recurring: boolean
  recurrence_type?: string
  recurrence_days?: number[]
  dsny_integration?: boolean
  dsny_collection_types?: string[]
  interior_cleaning_schedule?: string[]
  start_date?: string
  end_date?: string
  notes?: string
  customer?: {
    id?: string
    company_name?: string
    contact_first_name?: string
    contact_last_name?: string
  }
  property?: {
    id?: string
    name?: string
    address?: string
  }
}

interface UpcomingSchedule {
  date: string
  day: string
  tasks: string[]
  isDSNY: boolean
  isInteriorCleaning: boolean
}

interface ContractScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  contract: Contract
}

export function ContractScheduleModal({ isOpen, onClose, contract }: ContractScheduleModalProps) {
  const [upcomingSchedule, setUpcomingSchedule] = useState<UpcomingSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [daysAhead, setDaysAhead] = useState(30)

  useEffect(() => {
    if (isOpen && contract) {
      generateUpcomingSchedule()
    }
  }, [isOpen, contract, daysAhead])

  const generateUpcomingSchedule = () => {
    console.log('ContractScheduleModal - Contract data:', contract)
    console.log('ContractScheduleModal - Is recurring:', contract.is_recurring)
    console.log('ContractScheduleModal - Recurrence days:', contract.recurrence_days)

    if (!contract.is_recurring) {
      setUpcomingSchedule([])
      return
    }

    setLoading(true)
    const schedule: UpcomingSchedule[] = []
    const today = new Date()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Get recurring days
    const recurringDays = contract.recurrence_days || []
    console.log('ContractScheduleModal - Processing recurring days:', recurringDays)

    // Generate schedule for each recurring day
    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      const dayOfWeek = checkDate.getDay()

      if (recurringDays.includes(dayOfWeek)) {
        const tasks: string[] = []
        let isDSNY = false
        let isInteriorCleaning = false

        // Check for DSNY tasks
        if (contract.dsny_integration && contract.dsny_collection_types?.length) {
          isDSNY = true
          tasks.push(...contract.dsny_collection_types.map((type) => `${type} preparation`))
        }

        // Check for interior cleaning
        if (contract.interior_cleaning_schedule?.includes(dayOfWeek.toString())) {
          isInteriorCleaning = true
          tasks.push('Interior cleaning')
        }

        // If no specific tasks, add general maintenance
        if (tasks.length === 0) {
          tasks.push('Maintenance tasks')
        }

        schedule.push({
          date: checkDate.toISOString().split('T')[0],
          day: dayNames[dayOfWeek],
          tasks,
          isDSNY,
          isInteriorCleaning,
        })
      }
    }

    console.log('ContractScheduleModal - Generated schedule:', schedule)
    setUpcomingSchedule(schedule)
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTaskColor = (task: string) => {
    if (
      task.includes('garbage') ||
      task.includes('recycling') ||
      task.includes('organics') ||
      task.includes('bulk')
    ) {
      return 'bg-blue-100 text-blue-800'
    }
    if (task.includes('Interior cleaning')) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contract Schedule</h2>
            <p className="text-sm text-gray-600">
              {contract.contract_number} - {contract.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Contract Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contract.customer?.company_name ||
                      `${contract.customer?.contact_first_name || ''} ${
                        contract.customer?.contact_last_name || ''
                      }`.trim() ||
                      'Unknown Customer'}
                  </p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contract.property?.name || 'Unknown Property'}
                  </p>
                  <p className="text-xs text-gray-500">Property</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contract.recurrence_type || 'Custom'} Schedule
                  </p>
                  <p className="text-xs text-gray-500">Frequency</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Show next:</label>
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">{upcomingSchedule.length} scheduled visits</div>
          </div>

          {/* Schedule List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : upcomingSchedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled visits</h3>
              <p className="text-gray-500">
                {contract.is_recurring
                  ? 'This contract has no recurring schedule configured.'
                  : 'This is a one-time contract with no recurring schedule.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedule.map((schedule, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(schedule.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{schedule.day}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {schedule.isDSNY && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          DSNY
                        </span>
                      )}
                      {schedule.isInteriorCleaning && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Interior
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {schedule.tasks.map((task, taskIndex) => (
                      <span
                        key={taskIndex}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskColor(
                          task
                        )}`}
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {upcomingSchedule.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Schedule Summary</h3>
              <div className="text-sm text-blue-800">
                <p>
                  This contract has {upcomingSchedule.length} scheduled visits over the next{' '}
                  {daysAhead} days.
                </p>
                {contract.dsny_integration && (
                  <p className="mt-1">
                    DSNY integration is active with {contract.dsny_collection_types?.length || 0}{' '}
                    collection types.
                  </p>
                )}
                {contract.interior_cleaning_schedule &&
                  contract.interior_cleaning_schedule.length > 0 && (
                    <p className="mt-1">
                      Interior cleaning is scheduled for{' '}
                      {contract.interior_cleaning_schedule.length} days per week.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
