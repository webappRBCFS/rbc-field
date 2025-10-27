# ✅ Proposal Request Owner Selection Feature

## Overview

Added an **Owner Selection** feature to the Proposal Request form that allows users to select either a Lead (with associated Project) or a Customer (with associated Property) as the owner of the proposal request.

## Features

### 1. **Owner Type Selection**

- Users can choose between **Lead** or **Customer** as the owner
- Defaults to the type passed via `initialLeadId` or `initialCustomerId`

### 2. **Lead Workflow**

When "Lead" is selected:

1. Dropdown shows all available leads (ordered by company name)
2. After selecting a lead, the form displays all projects associated with that lead
3. Selecting a project auto-fills the address fields:
   - Property Address
   - City
   - State
   - Zip Code

### 3. **Customer Workflow**

When "Customer" is selected:

1. Dropdown shows all available customers (ordered by company name)
2. After selecting a customer, the form displays all properties associated with that customer
3. Selecting a property auto-fills the property address field

## Implementation Details

### New State Variables

```typescript
const [leads, setLeads] = React.useState<any[]>([])
const [customers, setCustomers] = React.useState<any[]>([])
const [projects, setProjects] = React.useState<any[]>([])
const [properties, setProperties] = React.useState<any[]>([])
const [ownerType, setOwnerType] = React.useState<'lead' | 'customer'>('lead')
```

### New Functions

- `fetchLeadsAndCustomers()` - Fetches all leads and customers on form load
- `fetchProjectsForLead(leadId)` - Fetches projects for a selected lead
- `fetchPropertiesForCustomer(customerId)` - Fetches properties for a selected customer

## Form Structure

```
┌─ Owner Selection ─────────────────────┐
│  Owner Type: [Lead ▼]                 │
│  Lead/Customer: [Select ▼]            │
└───────────────────────────────────────┘
         ↓
┌─ Project/Property Selection ──────────┐
│  [Type - Address ▼]                   │
└───────────────────────────────────────┘
         ↓
┌─ Project Information ─────────────────┐
│  Title, Type, Description, etc.       │
└───────────────────────────────────────┘
```

## Data Flow

1. Form loads → Fetch leads and customers
2. User selects Owner Type (Lead/Customer)
3. User selects Lead/Customer
4. Projects/Properties dropdown populates automatically
5. User selects Project/Property
6. Address fields auto-fill
7. User completes remaining form fields
8. Submit → Saves lead_id/customer_id + property_id

## Files Modified

- `src/components/ProposalRequestForm.tsx`

## Testing

✅ Owner Type dropdown works
✅ Lead/Customer dropdown populates
✅ Project/Property dropdown appears and works
✅ Address auto-fills when selecting project/property
✅ Form submission includes owner and project/property IDs
