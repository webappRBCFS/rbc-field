import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/Layout'

// Import all pages
import { Dashboard } from '../pages/Dashboard'
import { Leads } from '../pages/Leads'
import LeadCreate from '../pages/LeadCreate'
import LeadEdit from '../pages/LeadEdit'
import { Customers } from '../pages/Customers'
import CustomerCreate from '../pages/CustomerCreate'
import CustomerEdit from '../pages/CustomerEdit'
import CustomerView from '../pages/CustomerView'
import { Properties } from '../pages/Properties'
import PropertyCreate from '../pages/PropertyCreate'
import PropertyEdit from '../pages/PropertyEdit'
import PropertyView from '../pages/PropertyView'
import { Proposals } from '../pages/Proposals'
import ProposalCreate from '../pages/ProposalCreate'
import ProposalEdit from '../pages/ProposalEdit'
import ProposalView from '../pages/ProposalView'
import { Contracts } from '../pages/Contracts'
import { ContractCreate } from '../pages/ContractCreate'
import { ContractDetails } from '../pages/ContractDetails'
import { ContractEdit } from '../pages/ContractEdit'
import { Jobs } from '../pages/Jobs'
import { JobCreate } from '../pages/JobCreate'
import { JobDetails } from '../pages/JobDetails'
import { JobEdit } from '../pages/JobEdit'
import { DailyDispatch } from '../pages/DailyDispatch'
import { TimeClock } from '../pages/TimeClock'
import { Review } from '../pages/Review'
import { QCSchedule } from '../pages/QCSchedule'
import { QCVisits } from '../pages/QCVisits'
import { Billing } from '../pages/Billing'
import { InvoiceGeneration } from '../pages/InvoiceGeneration'
import { ClientPortal } from '../pages/ClientPortal'
import { Reports } from '../pages/Reports'
import { PnLDashboard } from '../pages/PnLDashboard'
import { Directory } from '../pages/Directory'
import { Inbox } from '../pages/Inbox'
import { EndOfDay } from '../pages/EndOfDay'
import { TimeReview } from '../pages/TimeReview'
import { MessageDetails } from '../pages/MessageDetails'
import { ReviewDetails } from '../pages/ReviewDetails'
import { PublicLeadForm } from '../pages/PublicLeadForm'
import { ServiceCatalog } from '../pages/ServiceCatalog'

// Login component
function Login() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('Attempting to sign in with:', email)
      const { data, error } = await signIn(email, password)
      console.log('Sign in result:', { data, error })

      if (error) {
        console.error('Sign in error:', error)
        // If sign in fails, try to create the user first
        if (error.message.includes('Invalid login credentials')) {
          setError(
            'User not found in authentication system. Please create the user in Supabase Dashboard (Authentication > Users > Add user) or try the Create Test Account button.'
          )
        } else {
          setError(error.message)
        }
      } else {
        console.log('Sign in successful!')
        setMessage('✅ Successfully signed in! Redirecting...')

        // Force a small delay to ensure session state updates, then redirect
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (err: any) {
      console.error('Sign in exception:', err)
      setError(`Sign in error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestAccount = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { supabase } = await import('../lib/supabase')

      // Try to sign up first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@rbcfield.com',
        password: 'admin123',
      })

      if (authError) {
        // If user already exists, try to sign in
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('User already registered')
        ) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@rbcfield.com',
            password: 'admin123',
          })

          if (signInError) {
            setError(
              `Sign in failed: ${signInError.message}. Please create the user manually in Supabase Dashboard.`
            )
            setEmail('admin@rbcfield.com')
            setPassword('admin123')
            return
          }

          setMessage('✅ Successfully signed in! Redirecting...')
          setEmail('admin@rbcfield.com')
          setPassword('admin123')
          return
        }

        // For other errors, show helpful message
        setError(
          `Signup failed: ${authError.message}. Please create the user manually in Supabase Dashboard (Authentication > Users > Add user).`
        )
        setEmail('admin@rbcfield.com')
        setPassword('admin123')
        return
      }

      // If signup successful, try to sign in immediately
      if (authData.user) {
        setMessage('✅ Account created successfully! Signing you in...')

        // Try to sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@rbcfield.com',
          password: 'admin123',
        })

        if (signInError) {
          setError(
            `Account created but sign in failed: ${signInError.message}. Please try signing in manually.`
          )
        } else {
          setMessage('✅ Account created and signed in successfully! Redirecting...')
        }

        setEmail('admin@rbcfield.com')
        setPassword('admin123')
      }
    } catch (error: any) {
      setError(
        `Unexpected error: ${error.message}. Please create the user manually in Supabase Dashboard.`
      )
      setEmail('admin@rbcfield.com')
      setPassword('admin123')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to RBC Field Management
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {message && <div className="text-green-600 text-sm text-center">{message}</div>}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={createTestAccount}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Account'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Or use these test credentials:</p>
              <div className="bg-gray-100 p-3 rounded-lg text-sm">
                <p>
                  <strong>Email:</strong> admin@rbcfield.com
                </p>
                <p>
                  <strong>Password:</strong> admin123
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/quote" element={<PublicLeadForm />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/create" element={<LeadCreate />} />
                <Route path="/leads/edit/:id" element={<LeadEdit />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/create" element={<CustomerCreate />} />
                <Route path="/customers/edit/:id" element={<CustomerEdit />} />
                <Route path="/customers/view/:id" element={<CustomerView />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/create" element={<PropertyCreate />} />
                <Route path="/properties/edit/:id" element={<PropertyEdit />} />
                <Route path="/properties/view/:id" element={<PropertyView />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/proposals/create" element={<ProposalCreate />} />
                <Route path="/proposals/edit/:id" element={<ProposalEdit />} />
                <Route path="/proposals/view/:id" element={<ProposalView />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/contracts/create" element={<ContractCreate />} />
                <Route path="/contracts/details/:id" element={<ContractDetails />} />
                <Route path="/contracts/edit/:id" element={<ContractEdit />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/create" element={<JobCreate />} />
                <Route path="/jobs/details/:id" element={<JobDetails />} />
                <Route path="/jobs/edit/:id" element={<JobEdit />} />
                <Route path="/daily-dispatch" element={<DailyDispatch />} />
                <Route path="/time-clock" element={<TimeClock />} />
                <Route path="/review" element={<Review />} />
                <Route path="/review/:id" element={<ReviewDetails />} />
                <Route path="/qc-schedule" element={<QCSchedule />} />
                <Route path="/qc-visits" element={<QCVisits />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/invoice-generation" element={<InvoiceGeneration />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/pnl-dashboard" element={<PnLDashboard />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/inbox/:id" element={<MessageDetails />} />
                <Route path="/end-of-day" element={<EndOfDay />} />
                <Route path="/time-review" element={<TimeReview />} />
                <Route path="/service-catalog" element={<ServiceCatalog />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
