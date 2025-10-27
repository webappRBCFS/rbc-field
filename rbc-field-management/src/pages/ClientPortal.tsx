import React, { useState } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  DownloadIcon,
  EyeIcon,
} from 'lucide-react'

export function ClientPortal() {
  const [jobData] = useState({
    id: 1234,
    title: 'Office Deep Clean',
    customer: 'ABC Corporation',
    property: 'ABC Corp Main Office',
    address: '123 Business St, New York, NY 10001',
    scheduledDate: '2024-01-20',
    completedDate: '2024-01-20',
    status: 'completed',
    assignedTechs: ['John Smith', 'Sarah Johnson'],
    photos: [
      { id: 1, url: '/api/placeholder/300/200', caption: 'Conference Room Before' },
      { id: 2, url: '/api/placeholder/300/200', caption: 'Conference Room After' },
      { id: 3, url: '/api/placeholder/300/200', caption: 'Kitchen Area Cleaned' },
      { id: 4, url: '/api/placeholder/300/200', caption: 'Reception Area' },
    ],
    report: {
      summary:
        'Deep cleaning completed successfully. All areas cleaned according to specifications.',
      areasCleaned: ['Conference Rooms', 'Kitchen', 'Reception', 'Offices'],
      materialsUsed: ['Eco-friendly cleaners', 'Microfiber cloths', 'Vacuum'],
      duration: '4 hours',
      qualityRating: 5,
    },
  })

  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: EyeIcon },
    { id: 'photos', label: 'Photos', icon: EyeIcon },
    { id: 'report', label: 'Report', icon: DownloadIcon },
  ]

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RBC Field Management</h1>
              <p className="text-gray-600">Client Portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Job #{jobData.id}</p>
              <p className="text-sm font-medium text-gray-900">{jobData.customer}</p>
            </div>
          </div>
        </div>
        {/* Job Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{jobData.title}</h2>
              <p className="text-gray-600">{jobData.property}</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600 capitalize">
                {jobData.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">
                {new Date(jobData.completedDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{jobData.report.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{jobData.address}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
                  <p className="text-gray-700">{jobData.report.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Areas Cleaned</h4>
                    <ul className="space-y-1">
                      {jobData.report.areasCleaned.map((area, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Technicians</h4>
                    <ul className="space-y-1">
                      {jobData.assignedTechs.map((tech, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Materials Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobData.report.materialsUsed.map((material, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-semibold text-green-800">Quality Rating</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < jobData.report.qualityRating ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-green-700">
                      {jobData.report.qualityRating}/5 Excellent
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobData.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Photo Placeholder</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'report' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Report</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <DownloadIcon className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Job Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Job ID:</span>
                          <span className="ml-2 font-medium">#{jobData.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2 font-medium capitalize">{jobData.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(jobData.completedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-medium">{jobData.report.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{jobData.report.summary}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Areas Cleaned</h4>
                      <ul className="list-disc list-inside text-gray-700">
                        {jobData.report.areasCleaned.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Customer Service</p>
              <p className="font-medium">(555) 123-4567</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Email Support</p>
              <p className="font-medium">support@rbcfm.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
