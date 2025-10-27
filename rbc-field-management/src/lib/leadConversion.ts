import { supabase } from './supabase'

/**
 * Convert a lead to a customer when a contract is created or proposal is accepted
 */
export async function convertLeadToCustomer(leadId: string) {
  try {
    // 1. Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // 2. Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('company_name', lead.company_name || '')
      .single()

    if (existingCustomer) {
      // Customer already exists, just update the lead status
      await supabase.from('leads').update({ stage: 'won' }).eq('id', leadId)
      return existingCustomer.id
    }

    // 3. Create customer from lead data
    const primaryContact = lead.contacts && lead.contacts[0] ? lead.contacts[0] : null

    const customerData: any = {
      company_name: lead.company_name || null,
      contact_first_name: primaryContact?.name || lead.contact_first_name || '',
      contact_last_name: lead.contact_last_name || '',
      email: primaryContact?.email || lead.email || null,
      phone: primaryContact?.phone || lead.phone || null,
      billing_address: lead.company_address || lead.address || null,
      billing_city: lead.city || null,
      billing_state: lead.state || null,
      billing_zip_code: lead.zip_code || null,
      converted_from_lead_id: leadId,
      is_active: true,
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()

    if (customerError) throw customerError

    // 4. Create properties from lead projects
    if (lead.projects && lead.projects.length > 0) {
      for (const project of lead.projects) {
        if (project.address) {
          await supabase.from('properties').insert({
            customer_id: customer.id,
            name: project.type || 'Property',
            address: project.address,
            property_type: project.type || null,
            unit_count: project.unit_count ? parseInt(project.unit_count) : null,
            notes: project.notes || null,
            is_active: true,
          })
        }
      }
    }

    // 5. Update lead status to 'won' and link to customer
    await supabase
      .from('leads')
      .update({
        stage: 'won',
        converted_to_customer_id: customer.id,
      })
      .eq('id', leadId)

    return customer.id
  } catch (error) {
    console.error('Error converting lead to customer:', error)
    throw error
  }
}

/**
 * Convert a lead to a customer and link it to a proposal
 */
export async function convertLeadForProposal(leadId: string, proposalId: string) {
  const customerId = await convertLeadToCustomer(leadId)

  // Update the proposal with the customer ID
  await supabase.from('proposals').update({ customer_id: customerId }).eq('id', proposalId)

  return customerId
}
