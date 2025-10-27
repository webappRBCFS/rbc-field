import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MapPinIcon, PhoneIcon, MailIcon, BuildingIcon, CheckCircleIcon } from 'lucide-react'

export function PublicLeadForm() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_first_name: '',
    contact_last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: '',
    property_sqft: '',
    service_needs: '',
    estimated_budget: '',
    lead_source_other: 'Website Form',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // First, get the "Website" lead source ID
      const { data: leadSource, error: sourceError } = await supabase
        .from('lead_sources')
        .select('id')
        .eq('name', 'Website')
        .single()

      if (sourceError) throw sourceError

      const leadData = {
        ...formData,
        property_sqft: formData.property_sqft ? parseInt(formData.property_sqft) : null,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        lead_source_id: leadSource?.id || null,
        stage: 'new' as const,
        priority: 'medium' as const,
        custom_fields: {},
      }

      const { error } = await supabase.from('leads').insert([leadData])

      if (error) throw error

      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting lead:', error)
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your information has been submitted successfully. We'll contact you within 24 hours to
              discuss your cleaning needs.
            </p>
            <button
              onClick={() => {
                setSubmitted(false)
                setFormData({
                  company_name: '',
                  contact_first_name: '',
                  contact_last_name: '',
                  email: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  property_type: '',
                  property_sqft: '',
                  service_needs: '',
                  estimated_budget: '',
                  lead_source_other: 'Website Form',
                })
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            RBC
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Quote</h1>
          <p className="text-lg text-gray-600">
            Get a free estimate for your commercial cleaning needs
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BuildingIcon className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact First Name *
                  </label>
                  <input
                    type="text"
                    name="contact_first_name"
                    required
                    value={formData.contact_first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Last Name *
                  </label>
                  <input
                    type="text"
                    name="contact_last_name"
                    required
                    value={formData.contact_last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Property Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Property Type</option>
                    <optgroup label="Residential Multi-Unit">
                      <option value="Apartment Complex">Apartment Complex</option>
                      <option value="Condominium Complex">Condominium Complex</option>
                      <option value="Townhouse Community">Townhouse Community</option>
                      <option value="Student Housing">Student Housing</option>
                      <option value="Senior Living Community">Senior Living Community</option>
                    </optgroup>
                    <optgroup label="Office Buildings">
                      <option value="Small Office (1-10 employees)">
                        Small Office (1-10 employees)
                      </option>
                      <option value="Medium Office (11-50 employees)">
                        Medium Office (11-50 employees)
                      </option>
                      <option value="Large Office (50+ employees)">
                        Large Office (50+ employees)
                      </option>
                      <option value="Corporate Headquarters">Corporate Headquarters</option>
                      <option value="Medical Office">Medical Office</option>
                      <option value="Law Firm">Law Firm</option>
                      <option value="Accounting Firm">Accounting Firm</option>
                    </optgroup>
                    <optgroup label="Commercial Properties">
                      <option value="Retail Store">Retail Store</option>
                      <option value="Shopping Center">Shopping Center</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Manufacturing Facility">Manufacturing Facility</option>
                      <option value="Distribution Center">Distribution Center</option>
                    </optgroup>
                    <optgroup label="Specialized Properties">
                      <option value="Post-Construction Cleanup">Post-Construction Cleanup</option>
                      <option value="Apartment Turnover">Apartment Turnover</option>
                      <option value="New Construction">New Construction</option>
                      <option value="Renovation Project">Renovation Project</option>
                    </optgroup>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    name="property_sqft"
                    value={formData.property_sqft}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Service Needs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe Your Cleaning Needs *
                  </label>
                  <textarea
                    name="service_needs"
                    required
                    rows={4}
                    value={formData.service_needs}
                    onChange={handleChange}
                    placeholder="Please describe the cleaning services you need, frequency, special requirements, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Budget (Optional)
                  </label>
                  <input
                    type="number"
                    name="estimated_budget"
                    step="0.01"
                    value={formData.estimated_budget}
                    onChange={handleChange}
                    placeholder="Monthly budget range"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Request Quote'}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              By submitting this form, you agree to be contacted by RBC Field Services regarding
              your cleaning needs.
            </p>
          </form>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us Directly</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <PhoneIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">(555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MailIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">info@rbcfielservices.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
