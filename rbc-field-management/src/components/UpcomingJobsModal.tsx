import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface UpcomingJob {
  date: string
  day: string
  tasks: string[]
}

interface UpcomingJobsModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobData?: any
}

const UpcomingJobsModal: React.FC<UpcomingJobsModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobData,
}) => {
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([])
  const [loading, setLoading] = useState(false)
  const [daysAhead, setDaysAhead] = useState(30)

  // Extract tasks from job notes for a specific day
  const extractTasksFromNotes = (notes: string, day: string) => {
    const tasks = []
    const lines = notes.split('\n')
    let inDailyTasks = false

    for (const line of lines) {
      if (line.includes('Daily Tasks:')) {
        inDailyTasks = true
        continue
      }
      if (inDailyTasks && line.includes(`${day}:`)) {
        const taskLine = line.split(`${day}:`)[1]?.trim()
        if (taskLine) {
          tasks.push(...taskLine.split(',').map((t) => t.trim()))
        }
        break
      }
    }

    return tasks.length > 0 ? tasks : ['Maintenance Tasks']
  }

  // Generate upcoming jobs from recurring contract
  const generateUpcomingJobs = (contractData: any, daysAhead: number = 30) => {
    const upcomingJobs = []
    const today = new Date()

    // Get recurring days
    const recurringDays = contractData.recurrence_days || []
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    // Generate jobs for each recurring day
    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      const dayOfWeek = checkDate.getDay()

      if (recurringDays.includes(dayOfWeek)) {
        upcomingJobs.push({
          date: checkDate.toISOString().split('T')[0],
          day: dayNames[dayOfWeek],
          tasks: contractData.notes?.includes('Daily Tasks:')
            ? extractTasksFromNotes(contractData.notes, dayNames[dayOfWeek])
            : ['Maintenance Tasks'],
        })
      }
    }

    return upcomingJobs
  }

  useEffect(() => {
    if (isOpen && jobData) {
      setLoading(true)
      const jobs = generateUpcomingJobs(jobData, daysAhead)
      setUpcomingJobs(jobs)
      setLoading(false)
    }
  }, [isOpen, jobData, daysAhead])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Jobs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Recurring schedule for {jobData?.job_number || 'Job'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Show next:</label>
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">{upcomingJobs.length} upcoming jobs</div>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming jobs found for this schedule</p>
                </div>
              ) : (
                upcomingJobs.map((job, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(job.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{job.tasks.join(', ')}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {job.day}
                      </div>
                      <div className="text-xs text-gray-400">#{index + 1}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Summary */}
          {upcomingJobs.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Schedule Summary</h4>
              </div>
              <div className="text-sm text-blue-700">
                <p>
                  <strong>Recurring Days:</strong>{' '}
                  {jobData?.recurrence_days
                    ?.map(
                      (day: number) =>
                        [
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                        ][day]
                    )
                    .join(', ')}
                </p>
                <p className="mt-1">
                  <strong>Next Job:</strong>{' '}
                  {upcomingJobs[0]
                    ? new Date(upcomingJobs[0].date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
                {jobData?.property_id && (
                  <p className="mt-1">
                    <strong>Property:</strong> {jobData.property?.address || 'Property not found'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpcomingJobsModal
