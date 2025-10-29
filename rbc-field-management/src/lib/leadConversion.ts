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

    // 4. Create properties from lead projects and track address to property ID mapping
    const projectAddressToPropertyId: { [address: string]: string } = {}
    if (lead.projects && lead.projects.length > 0) {
      for (const project of lead.projects) {
        if (project.address) {
          // Build full address: street address + city + state + zip
          const streetAddressParts = [project.address]
          if (project.address_line_2) {
            streetAddressParts.push(project.address_line_2)
          }
          const streetAddress = streetAddressParts.join(', ')

          // Combine all address components into full address
          const fullAddressParts = [streetAddress]
          if (project.city) fullAddressParts.push(project.city)
          if (project.state) fullAddressParts.push(project.state)
          if (project.zip) fullAddressParts.push(project.zip)
          const fullAddress = fullAddressParts.join(', ')

          const { data: property, error: propError } = await supabase
            .from('properties')
            .insert({
              customer_id: customer.id,
              name: project.address || 'Property',
              address: fullAddress, // Store full address: street, apt/suite, city, state, zip
              city: project.city || null,
              state: project.state || null,
              zip_code: project.zip || null,
              address_line_2: project.address_line_2 || null,
              property_type: project.type || null,
              unit_count: project.unit_count ? parseInt(project.unit_count) : null,
              notes: project.notes || null,
              is_active: true,
            })
            .select('id')
            .single()

          if (!propError && property) {
            // Map project address to property ID for proposal updates
            // Use the street address for matching (since proposals store project_address as just the street address)
            projectAddressToPropertyId[project.address] = property.id
          }
        }
      }
    }

    // 5. Update all proposals linked to this lead
    // Find proposals with this lead_id
    const { data: proposals, error: proposalsError } = await supabase
      .from('proposals')
      .select('id, project_address, property_id')
      .eq('lead_id', leadId)

    if (!proposalsError && proposals && proposals.length > 0) {
      for (const proposal of proposals) {
        const updateData: any = {
          customer_id: customer.id,
          lead_id: null, // Remove lead_id since it's now a customer
        }

        // Try multiple methods to match project to property:

        // Method 1: If proposal has project_address column and value, find matching property
        if (proposal.project_address && projectAddressToPropertyId[proposal.project_address]) {
          updateData.property_id = projectAddressToPropertyId[proposal.project_address]
        }

        // Method 2: If property_id contains project-${index}, try to match by project index
        if (
          !updateData.property_id &&
          typeof proposal.property_id === 'string' &&
          proposal.property_id.includes('project-')
        ) {
          const projectIndex = parseInt(proposal.property_id.replace('project-', ''))
          if (projectIndex >= 0 && lead.projects && lead.projects[projectIndex]?.address) {
            const projectAddress = lead.projects[projectIndex].address
            if (projectAddressToPropertyId[projectAddress]) {
              updateData.property_id = projectAddressToPropertyId[projectAddress]
            }
          }
        }

        // Method 3: If property_id looks like a project ID (but not a UUID), try to find by matching project
        if (
          !updateData.property_id &&
          proposal.property_id &&
          typeof proposal.property_id === 'string' &&
          !proposal.property_id.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          // Not a UUID, might be a project ID or index
          const matchingProject = lead.projects?.find(
            (p: any, idx: number) =>
              p.id === proposal.property_id || proposal.property_id === `project-${idx}`
          )
          if (matchingProject?.address && projectAddressToPropertyId[matchingProject.address]) {
            updateData.property_id = projectAddressToPropertyId[matchingProject.address]
          }
        }

        // Only update if we have something to change
        if (updateData.property_id || updateData.customer_id) {
          await supabase.from('proposals').update(updateData).eq('id', proposal.id)
        }
      }
    }

    // 6. Update lead status to 'won' and link to customer
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
