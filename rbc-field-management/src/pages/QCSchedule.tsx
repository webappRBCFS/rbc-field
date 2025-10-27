import React, { useState } from 'react'
import {
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  UserIcon,
} from 'lucide-react'

export function QCSchedule() {
  const [schedule, setSchedule] = useState([
    {
      id: 1,
      jobId: 1234,
      jobTitle: 'Office Deep Clean',
      customer: 'ABC Corporation',
      property: 'ABC Corp Main Office',
      scheduledDate: '2024-01-22',
      scheduledTime: '10:00',
      qcInspector: 'Mike Wilson',
      status: 'scheduled',
      priority: 'high',
      notes: 'Post-completion inspection required',
    },
    {
      id: 2,
      jobId: 1235,
      jobTitle: 'Warehouse Maintenance',
      customer: 'ABC Corporation',
      property: 'ABC Corp Warehouse',
      scheduledDate: '2024-01-23',
      scheduledTime: '14:00',
      qcInspector: 'Sarah Johnson',
      status: 'completed',
      priority: 'medium',
      notes: 'Equipment inspection completed',
    },
    {
      id: 3,
      jobId: 1236,
      jobTitle: 'Post-Construction Cleanup',
      customer: 'XYZ Industries',
      property: 'XYZ Industries Facility',
      scheduledDate: '2024-01-25',
      scheduledTime: '09:00',
      qcInspector: 'Mike Wilson',
      status: 'pending',
      priority: 'high',
      notes: 'Heavy debris removal verification',
    },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    jobId: '',
    scheduledDate: '',
    scheduledTime: '',
    qcInspector: '',
    priority: 'medium',
    notes: '',
  })

  const qcInspectors = ['Mike Wilson', 'Sarah Johnson', 'John Smith', 'Emily Davis']

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const scheduleItem = {
      id: schedule.length + 1,
      jobId: parseInt(newSchedule.jobId),
      jobTitle: 'Sample Job',
      customer: 'Sample Customer',
      property: 'Sample Property',
      scheduledDate: newSchedule.scheduledDate,
      scheduledTime: newSchedule.scheduledTime,
      qcInspector: newSchedule.qcInspector,
      status: 'pending',
      priority: newSchedule.priority,
      notes: newSchedule.notes,
    }
    setSchedule([...schedule, scheduleItem])
    setNewSchedule({
      jobId: '',
      scheduledDate: '',
      scheduledTime: '',
      qcInspector: '',
      priority: 'medium',
      notes: '',
    })
    setShowAddForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QC Schedule</h1>
          <p className="mt-1 text-gray-600">Manage quality control inspections and scheduling</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {schedule.filter((s) => s.status === 'scheduled').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {schedule.filter((s) => s.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {schedule.filter((s) => s.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {schedule.filter((s) => s.priority === 'high').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">QC Schedule</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Schedule QC Visit
            </button>
          </div>
        </div>

        {/* Add Schedule Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule QC Visit</h2>
            <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <input
                  type="number"
                  required
                  value={newSchedule.jobId}
                  onChange={(e) => setNewSchedule({ ...newSchedule, jobId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QC Inspector</label>
                <select
                  required
                  value={newSchedule.qcInspector}
                  onChange={(e) => setNewSchedule({ ...newSchedule, qcInspector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Inspector</option>
                  {qcInspectors.map((inspector) => (
                    <option key={inspector} value={inspector}>
                      {inspector}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  required
                  value={newSchedule.scheduledDate}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  required
                  value={newSchedule.scheduledTime}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newSchedule.priority}
                  onChange={(e) => setNewSchedule({ ...newSchedule, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule QC Visit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">QC Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.jobTitle}</div>
                        <div className="text-sm text-gray-500">Job #{item.jobId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{item.customer}</div>
                        <div className="text-sm text-gray-500">{item.property}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{item.qcInspector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(item.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{item.scheduledTime}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.notes}
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
