import React, { useState, useEffect } from 'react'
import { ClockIcon, PlayIcon, PauseIcon, SquareIcon, CalendarIcon, UserIcon } from 'lucide-react'

export function TimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [selectedJob, setSelectedJob] = useState('')
  const [notes, setNotes] = useState('')
  const [timeEntries, setTimeEntries] = useState([
    {
      id: 1,
      date: '2024-01-20',
      clockIn: '08:00',
      clockOut: '17:00',
      job: 'Office Deep Clean',
      customer: 'ABC Corporation',
      duration: 9,
      notes: 'Completed deep clean of conference rooms',
    },
    {
      id: 2,
      date: '2024-01-19',
      clockIn: '09:00',
      clockOut: '15:30',
      job: 'Warehouse Maintenance',
      customer: 'ABC Corporation',
      duration: 6.5,
      notes: 'Equipment inspection and maintenance',
    },
  ])

  const jobs = [
    { id: 1, title: 'Office Deep Clean', customer: 'ABC Corporation' },
    { id: 2, title: 'Warehouse Maintenance', customer: 'ABC Corporation' },
    { id: 3, title: 'Post-Construction Cleanup', customer: 'XYZ Industries' },
    { id: 4, title: 'Regular Office Clean', customer: 'Tech Solutions Inc' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClockIn = () => {
    if (!selectedJob) {
      alert('Please select a job before clocking in')
      return
    }
    setIsClockedIn(true)
    setClockInTime(new Date())
  }

  const handleClockOut = () => {
    if (!clockInTime) return

    const clockOutTime = new Date()
    const duration = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) // hours

    const job = jobs.find((j) => j.id === parseInt(selectedJob))
    const newEntry = {
      id: timeEntries.length + 1,
      date: clockInTime.toISOString().split('T')[0],
      clockIn: clockInTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      clockOut: clockOutTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      job: job?.title || '',
      customer: job?.customer || '',
      duration: Math.round(duration * 100) / 100,
      notes: notes,
    }

    setTimeEntries([newEntry, ...timeEntries])
    setIsClockedIn(false)
    setClockInTime(null)
    setSelectedJob('')
    setNotes('')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getElapsedTime = () => {
    if (!clockInTime) return '00:00:00'
    const elapsed = new Date().getTime() - clockInTime.getTime()
    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Clock</h1>
          <p className="mt-1 text-gray-600">Track your work hours and job time</p>
        </div>

        {/* Current Time Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 text-center">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{formatDate(currentTime)}</h2>
            <div className="text-6xl font-mono font-bold text-blue-600 mt-4">
              {formatTime(currentTime)}
            </div>
          </div>

          {isClockedIn && (
            <div className="mt-4">
              <div className="text-lg text-gray-600 mb-2">Time Elapsed</div>
              <div className="text-4xl font-mono font-bold text-green-600">{getElapsedTime()}</div>
            </div>
          )}
        </div>

        {/* Clock In/Out Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Clock In/Out</h2>

          {!isClockedIn ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job</label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a job...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.customer}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about your work..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleClockIn}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
              >
                <PlayIcon className="w-6 h-6" />
                Clock In
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="text-lg text-gray-600">Currently working on:</div>
                <div className="text-xl font-semibold text-gray-900">
                  {jobs.find((j) => j.id === parseInt(selectedJob))?.title}
                </div>
                <div className="text-sm text-gray-500">
                  {jobs.find((j) => j.id === parseInt(selectedJob))?.customer}
                </div>
              </div>
              <button
                onClick={handleClockOut}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold mx-auto"
              >
                <SquareIcon className="w-6 h-6" />
                Clock Out
              </button>
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Hours</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {timeEntries
                    .filter((entry) => entry.date === currentTime.toISOString().split('T')[0])
                    .reduce((sum, entry) => sum + entry.duration, 0)
                    .toFixed(1)}
                  h
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jobs Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {
                    timeEntries.filter(
                      (entry) => entry.date === currentTime.toISOString().split('T')[0]
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </p>
                <p className={`text-sm ${isClockedIn ? 'text-green-600' : 'text-gray-500'}`}>
                  {isClockedIn ? 'Working' : 'Not Working'}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isClockedIn ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}
              >
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Time Entries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeEntries.slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.job}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.clockIn} - {entry.clockOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.duration}h
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.notes}
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
