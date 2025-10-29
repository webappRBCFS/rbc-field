import { supabase } from '../lib/supabase'

export interface ServiceItem {
  id: string
  service_category_id: string
  name: string
  description?: string
  unit_type: string
  base_price: number
  is_active: boolean
  category?: {
    id: string
    name: string
  }
}

export interface ServiceItemGrouped {
  category: {
    id: string
    name: string
  }
  items: ServiceItem[]
}

/**
 * Fetch all active service items grouped by category
 * @returns Array of service items grouped by category, sorted by category name, then item name
 */
export async function fetchServiceItemsGrouped(): Promise<ServiceItemGrouped[]> {
  try {
    const { data, error } = await supabase
      .from('service_items')
      .select(
        `
        id,
        service_category_id,
        name,
        description,
        unit_type,
        base_price,
        is_active,
        categories:service_categories (
          id,
          name
        )
      `
      )
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching service items:', error)
      throw error
    }

    if (!data) {
      console.warn('No service items data returned from query')
      return []
    }

    console.log('Raw service items data:', data)
    console.log('Number of items:', data.length)

    // Group by category
    const categoryMap = new Map<string, ServiceItemGrouped>()

    data.forEach((item: any) => {
      // Handle categories - might be array or object depending on join
      let categoryInfo: { id: string; name: string } | null = null
      if (item.categories) {
        if (Array.isArray(item.categories) && item.categories.length > 0) {
          categoryInfo = {
            id: item.categories[0].id,
            name: item.categories[0].name,
          }
        } else if (typeof item.categories === 'object' && item.categories.id) {
          categoryInfo = {
            id: item.categories.id,
            name: item.categories.name,
          }
        }
      }

      const categoryId = item.service_category_id || categoryInfo?.id || 'uncategorized'
      const categoryName = categoryInfo?.name || 'Uncategorized'

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: {
            id: categoryId,
            name: categoryName,
          },
          items: [],
        })
      }

      categoryMap.get(categoryId)!.items.push({
        id: item.id,
        service_category_id: item.service_category_id,
        name: item.name,
        description: item.description,
        unit_type: item.unit_type,
        base_price: parseFloat(item.base_price) || 0,
        is_active: item.is_active,
        category: categoryInfo || undefined,
      })
    })

    // Convert map to array and sort
    const grouped = Array.from(categoryMap.values())
    grouped.sort((a, b) => a.category.name.localeCompare(b.category.name))

    // Sort items within each category
    grouped.forEach((group) => {
      group.items.sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  } catch (error) {
    console.error('Error fetching service items:', error)
    return []
  }
}

/**
 * Fetch a single service item by ID
 */
export async function fetchServiceItemById(id: string): Promise<ServiceItem | null> {
  try {
    const { data, error } = await supabase
      .from('service_items')
      .select(
        `
        id,
        service_category_id,
        name,
        description,
        unit_type,
        base_price,
        is_active,
        categories:service_categories (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) throw error
    if (!data) return null

    // Handle categories - might be array or object depending on join
    let categoryInfo: { id: string; name: string } | undefined
    if (data.categories) {
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        const cat = data.categories[0] as any
        categoryInfo = {
          id: cat.id,
          name: cat.name,
        }
      } else {
        const cat = data.categories as any
        categoryInfo = {
          id: cat.id,
          name: cat.name,
        }
      }
    }

    return {
      id: data.id,
      service_category_id: data.service_category_id,
      name: data.name,
      description: data.description,
      unit_type: data.unit_type,
      base_price: parseFloat(data.base_price) || 0,
      is_active: data.is_active,
      category: categoryInfo,
    }
  } catch (error) {
    console.error('Error fetching service item:', error)
    return null
  }
}
