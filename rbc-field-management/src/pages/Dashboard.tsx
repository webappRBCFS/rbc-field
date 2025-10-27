import React, { useState, useEffect } from 'react'
import { StatsCard } from '../components/StatsCard'
import { QuickActionCard } from '../components/QuickActionCard'
import { ActivityItem } from '../components/ActivityItem'
import { DivisionStats, useDivision } from '../contexts/DivisionContext'
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  ClockIcon,
  DollarSignIcon,
  UsersIcon,
  HomeIcon,
  CalendarIcon,
  TimerIcon,
  MessageSquareIcon,
  FileTextIcon,
  CheckCircleIcon,
  UserPlusIcon,
  MapPinIcon,
  BellIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Dashboard() {
  const { currentDivision } = useDivision()
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedToday: 0,
    pendingReview: 0,
    todayRevenue: 0,
    activeLeads: 0,
    pendingProposals: 0,
  })
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardStats()
    fetchUpcomingActivities()
  }, [currentDivision])

  const fetchUpcomingActivities = async () => {
    try {
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const { data, error } = await supabase
        .from('leads')
        .select('id, company_name, contact_first_name, contact_last_name, next_activity_date')
        .gte('next_activity_date', today.toISOString().split('T')[0])
        .lte('next_activity_date', nextWeek.toISOString().split('T')[0])
        .order('next_activity_date', { ascending: true })
        .limit(5)

      if (error) throw error
      setUpcomingActivities(data || [])
    } catch (error) {
      console.error('Error fetching upcoming activities:', error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Build queries based on current division filter
      const baseQuery = currentDivision
        ? supabase.from('jobs').select('*').eq('operational_division_id', currentDivision.id)
        : supabase.from('jobs').select('*')

      // Get active jobs
      const { data: activeJobs } = await baseQuery
        .in('status', ['scheduled', 'in_progress'])
        .select('id')

      // Get completed today
      const today = new Date().toISOString().split('T')[0]
      const { data: completedToday } = await baseQuery
        .eq('status', 'completed')
        .gte('completed_at', today)
        .select('id')

      // Get pending review
      const { data: pendingReview } = await baseQuery.eq('status', 'pending_review').select('id')

      // Get today's revenue (from completed jobs)
      const { data: revenueData } = await baseQuery
        .eq('status', 'completed')
        .gte('completed_at', today)
        .select('total_amount')

      // Get active leads
      const leadsQuery = currentDivision
        ? supabase.from('leads').select('*').eq('preferred_division_id', currentDivision.id)
        : supabase.from('leads').select('*')

      const { data: activeLeads } = await leadsQuery
        .in('stage', ['new', 'contacted', 'qualified', 'proposal_sent'])
        .select('id')

      // Get pending proposals
      const proposalsQuery = currentDivision
        ? supabase.from('proposals').select('*').eq('operational_division_id', currentDivision.id)
        : supabase.from('proposals').select('*')

      const { data: pendingProposals } = await proposalsQuery.eq('status', 'sent').select('id')

      setStats({
        activeJobs: activeJobs?.length || 0,
        completedToday: completedToday?.length || 0,
        pendingReview: pendingReview?.length || 0,
        todayRevenue: revenueData?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0,
        activeLeads: activeLeads?.length || 0,
        pendingProposals: pendingProposals?.length || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }
  const dashboardStats = [
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: BriefcaseIcon,
      color: 'blue' as const,
      trend: {
        value: '+12% from last week',
        isPositive: true,
      },
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle2Icon,
      color: 'green' as const,
      trend: {
        value: '+8% from yesterday',
        isPositive: true,
      },
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: ClockIcon,
      color: 'yellow' as const,
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSignIcon,
      color: 'purple' as const,
      trend: {
        value: '+15% from average',
        isPositive: true,
      },
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads,
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: 'Pending Proposals',
      value: stats.pendingProposals,
      icon: FileTextIcon,
      color: 'purple' as const,
    },
  ]

  const quickActions = [
    {
      title: 'Customers',
      description: 'Manage customer information',
      icon: UsersIcon,
      href: '/customers',
      color: 'blue' as const,
    },
    {
      title: 'Properties',
      description: 'Track property locations',
      icon: HomeIcon,
      href: '/properties',
      color: 'green' as const,
    },
    {
      title: 'Jobs',
      description: 'Manage field operations',
      icon: CalendarIcon,
      href: '/jobs',
      color: 'purple' as const,
    },
    {
      title: 'Time Clock',
      description: 'Track employee hours',
      icon: TimerIcon,
      href: '/time/clock',
      color: 'orange' as const,
    },
    {
      title: 'Communications',
      description: 'Unified messaging',
      icon: MessageSquareIcon,
      href: '/inbox',
      color: 'pink' as const,
    },
    {
      title: 'Billing',
      description: 'Generate invoices',
      icon: FileTextIcon,
      href: '/billing',
      color: 'indigo' as const,
    },
  ]

  const recentActivity = [
    {
      icon: CheckCircleIcon,
      title: 'Job #1234 completed by John Smith',
      time: '2 min ago',
      color: 'green' as const,
    },
    {
      icon: UserPlusIcon,
      title: 'New customer "ABC Corp" added',
      time: '15 min ago',
      color: 'blue' as const,
    },
    {
      icon: MapPinIcon,
      title: 'QC visit scheduled for Property #567',
      time: '1 hour ago',
      color: 'purple' as const,
    },
    {
      icon: BriefcaseIcon,
      title: 'Job #1235 assigned to Sarah Johnson',
      time: '2 hours ago',
      color: 'blue' as const,
    },
    {
      icon: CheckCircleIcon,
      title: 'Invoice #890 marked as paid',
      time: '3 hours ago',
      color: 'green' as const,
    },
  ]

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-600">Here is what is happening with your operations today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {dashboardStats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Division-specific stats */}
        {currentDivision && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentDivision.name} Overview
            </h2>
            <DivisionStats />
          </div>
        )}

        {/* Upcoming Activity Reminders */}
        {upcomingActivities.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BellIcon className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Lead Activities</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                You have {upcomingActivities.length} lead{upcomingActivities.length > 1 ? 's' : ''}{' '}
                with scheduled activities in the next 7 days
              </p>
              <div className="space-y-3">
                {upcomingActivities.map((lead) => {
                  const isToday =
                    new Date(lead.next_activity_date).toDateString() === new Date().toDateString()
                  const daysUntil = Math.ceil(
                    (new Date(lead.next_activity_date).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )

                  return (
                    <div
                      key={lead.id}
                      className={`flex items-center justify-between bg-white rounded-lg p-4 border ${
                        isToday ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircleIcon
                          className={`w-5 h-5 ${isToday ? 'text-red-500' : 'text-yellow-500'}`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.company_name ||
                              `${lead.contact_first_name} ${lead.contact_last_name}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Activity scheduled for{' '}
                            {new Date(lead.next_activity_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isToday && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                          Due Today
                        </span>
                      )}
                      {!isToday && daysUntil <= 3 && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                          {daysUntil === 1 ? '1 day' : `${daysUntil} days`} away
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} {...action} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
