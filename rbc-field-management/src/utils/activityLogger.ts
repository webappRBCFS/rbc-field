import { supabase } from '../lib/supabase'

export interface ActivityLog {
  id: string
  activity_type: string
  entity_type: string
  entity_id: string
  description: string
  metadata?: any
  created_by?: string
  created_at: string
}

/**
 * Log an activity for an entity
 */
export async function logActivity(data: {
  activity_type: string
  entity_type: 'lead' | 'customer' | 'property' | 'job' | 'contract' | 'proposal'
  entity_id: string
  description: string
  metadata?: any
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: activity, error } = await supabase.from('activity_logs').insert([
      {
        activity_type: data.activity_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        description: data.description,
        metadata: data.metadata,
        created_by: user?.id || null,
      },
    ])

    if (error) {
      console.error('Error logging activity:', error)
      return null
    }

    return activity
  } catch (error) {
    console.error('Error logging activity:', error)
    return null
  }
}

/**
 * Fetch activities for an entity
 */
export async function getEntityActivities(entityType: string, entityId: string): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

/**
 * Common activity types
 */
export const ActivityTypes = {
  // Property activities
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',

  // Job activities
  JOB_CREATED: 'job_created',
  JOB_UPDATED: 'job_updated',
  JOB_COMPLETED: 'job_completed',

  // Customer activities
  CUSTOMER_CREATED: 'customer_created',
  CUSTOMER_UPDATED: 'customer_updated',

  // Lead activities
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_CONVERTED: 'lead_converted',

  // Contract activities
  CONTRACT_CREATED: 'contract_created',
  CONTRACT_UPDATED: 'contract_updated',
  CONTRACT_SIGNED: 'contract_signed',

  // Proposal activities
  PROPOSAL_CREATED: 'proposal_created',
  PROPOSAL_UPDATED: 'proposal_updated',
  PROPOSAL_SENT: 'proposal_sent',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_REJECTED: 'proposal_rejected',

  // Payment activities
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_PROCESSED: 'payment_processed',
} as const

