import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useDivision } from '../contexts/DivisionContext'
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
  BuildingIcon,
  HomeIcon,
  BriefcaseIcon,
  HammerIcon,
  WrenchIcon,
} from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  description?: string
  operational_division_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  operational_division?: {
    id: string
    name: string
    color_code: string
  }
}

interface ServiceItem {
  id: string
  service_category_id: string
  name: string
  description?: string
  unit_type: string
  base_price: number
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: {
    id: string
    name: string
    operational_division_id?: string
  }
}

export function ServiceCatalog() {
  const { currentDivision } = useDivision()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [divisions, setDivisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories')

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    operational_division_id: '',
    is_active: true,
  })

  // Service item form state
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null)
  const [itemForm, setItemForm] = useState({
    service_category_id: '',
    name: '',
    description: '',
    unit_type: '',
    base_price: '',
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [currentDivision])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch divisions
      const { data: divisionsData } = await supabase
        .from('operational_divisions')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setDivisions(divisionsData || [])

      // Fetch categories with division info
      let categoriesQuery = supabase
        .from('service_categories')
        .select(
          `
          *,
          operational_division:operational_divisions(id, name, color_code)
        `
        )
        .order('name')

      if (currentDivision) {
        categoriesQuery = categoriesQuery.eq('operational_division_id', currentDivision.id)
      }

      const { data: categoriesData } = await categoriesQuery
      setCategories(categoriesData || [])

      // Fetch service items separately to avoid ambiguous relationship error
      let itemsQuery = supabase.from('service_items').select('*').order('name')

      if (currentDivision) {
        // Filter items by division through their category
        const categoryIds = categoriesData?.map((c) => c.id) || []
        console.log('Current division:', currentDivision.name, 'Category IDs:', categoryIds)
        if (categoryIds.length > 0) {
          itemsQuery = itemsQuery.in('service_category_id', categoryIds)
        } else {
          itemsQuery = itemsQuery.eq('service_category_id', '00000000-0000-0000-0000-000000000000') // Empty result
        }
      }

      const { data: itemsData, error: itemsError } = await itemsQuery

      if (itemsError) {
        console.error('Error fetching service items:', itemsError)
      }

      console.log('Fetched service items:', itemsData)
      console.log('Total items fetched:', itemsData?.length || 0)

      // Manually attach category info to each item
      const itemsWithCategories = (itemsData || []).map((item) => {
        const category = categoriesData?.find((c) => c.id === item.service_category_id)
        return {
          ...item,
          categories: category,
        }
      })

      setServiceItems(itemsWithCategories)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Validate required fields
      if (!categoryForm.name.trim()) {
        alert('Please enter a category name.')
        return
      }
      if (!categoryForm.operational_division_id) {
        alert('Please select a division.')
        return
      }

      const categoryData = {
        name: categoryForm.name,
        description: categoryForm.description || null,
        operational_division_id: categoryForm.operational_division_id,
        is_active: categoryForm.is_active,
        updated_at: new Date().toISOString(),
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('service_categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('service_categories').insert([categoryData])

        if (error) throw error
      }

      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', operational_division_id: '', is_active: true })
      await fetchData()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category. Please try again.')
    }
  }

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!itemForm.service_category_id) {
      alert('Please select a category')
      return
    }
    if (!itemForm.name) {
      alert('Please enter a name')
      return
    }
    if (!itemForm.unit_type) {
      alert('Please select a unit type')
      return
    }
    if (!itemForm.base_price) {
      alert('Please enter a base price')
      return
    }

    try {
      console.log('Submitting service item:', itemForm)

      const itemData = {
        service_category_id: itemForm.service_category_id,
        name: itemForm.name,
        description: itemForm.description || null,
        unit_type: itemForm.unit_type,
        base_price: parseFloat(itemForm.base_price) || 0,
        is_active: itemForm.is_active,
        updated_at: new Date().toISOString(),
      }

      console.log('Item data to save:', itemData)

      let error
      if (editingItem) {
        console.log('Updating service item:', editingItem.id)
        const result = await supabase
          .from('service_items')
          .update(itemData)
          .eq('id', editingItem.id)
        error = result.error
      } else {
        console.log('Inserting new service item')
        const result = await supabase.from('service_items').insert([itemData])
        error = result.error
      }

      if (error) {
        console.error('Supabase error:', error)
        alert(`Error: ${error.message}\nDetails: ${error.details || 'No details'}`)
        throw error
      }

      console.log('Service item saved successfully')

      // Fetch the newly created item to add it to the list
      if (!editingItem) {
        const { data: newItem, error: fetchError } = await supabase
          .from('service_items')
          .select('*')
          .eq('service_category_id', itemForm.service_category_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!fetchError && newItem) {
          console.log('Fetched new item:', newItem)

          // Attach category info manually
          const category = categories.find((c) => c.id === itemForm.service_category_id)
          const itemWithCategory = {
            ...newItem,
            categories: category,
          }

          console.log('Category for new item:', category)

          // If no division filter or category matches division, add to list
          if (
            !currentDivision ||
            (category && category.operational_division_id === currentDivision.id)
          ) {
            console.log('Adding new item to the list')
            setServiceItems((prev) => [itemWithCategory, ...prev])
          } else {
            console.log('Item not added to list due to division filter')
          }
        }
      }

      setShowItemForm(false)
      setEditingItem(null)
      setItemForm({
        service_category_id: '',
        name: '',
        description: '',
        unit_type: '',
        base_price: '',
        is_active: true,
      })

      // Only refetch if we're editing (to update the item in place)
      if (editingItem) {
        await fetchData()
      }

      alert('Service item saved successfully!')
    } catch (error) {
      console.error('Error saving service item:', error)
      alert(
        `Failed to save service item: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      operational_division_id: category.operational_division_id || '',
      is_active: category.is_active,
    })
    setShowCategoryForm(true)
  }

  const handleEditItem = (item: ServiceItem) => {
    setEditingItem(item)
    setItemForm({
      service_category_id: item.service_category_id,
      name: item.name,
      description: item.description || '',
      unit_type: item.unit_type,
      base_price: item.base_price.toString(),
      is_active: item.is_active,
    })
    setShowItemForm(true)
  }

  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${category.name}"? This will also delete all associated service items.`
      )
    ) {
      return
    }

    try {
      const { error } = await supabase.from('service_categories').delete().eq('id', category.id)

      if (error) throw error

      await fetchData()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category. Please try again.')
    }
  }

  const handleDeleteItem = async (item: ServiceItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase.from('service_items').delete().eq('id', item.id)

      if (error) throw error

      await fetchData()
    } catch (error) {
      console.error('Error deleting service item:', error)
      alert('Failed to delete service item. Please try again.')
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Maintenance')) return HammerIcon
    if (categoryName.includes('Office')) return BriefcaseIcon
    if (categoryName.includes('Apartment') || categoryName.includes('Post-Construction'))
      return BuildingIcon
    return WrenchIcon
  }

  const getUnitTypeLabel = (unitType: string) => {
    const labels: { [key: string]: string } = {
      monthly: 'Monthly',
      per_cleaning: 'Per Cleaning',
      per_unit: 'Per Unit',
      per_project: 'Per Project',
      hourly: 'Hourly',
    }
    return labels[unitType] || unitType
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1>
          <p className="mt-1 text-gray-600">
            Manage service categories and items for your business
            {currentDivision && (
              <span
                className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: currentDivision.color_code }}
              >
                {currentDivision.name}
              </span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Service Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Service Items ({serviceItems.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Service Categories</h2>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({
                    name: '',
                    description: '',
                    operational_division_id: '',
                    is_active: true,
                  })
                  setShowCategoryForm(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name)
                return (
                  <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                          {category.operational_division && (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mt-1"
                              style={{ backgroundColor: category.operational_division.color_code }}
                            >
                              {category.operational_division.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="mt-3 text-sm text-gray-600">{category.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {
                          serviceItems.filter((item) => item.service_category_id === category.id)
                            .length
                        }{' '}
                        items
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Service Items Tab */}
        {activeTab === 'items' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Service Items</h2>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setItemForm({
                    service_category_id: '',
                    name: '',
                    description: '',
                    unit_type: '',
                    base_price: '',
                    is_active: true,
                  })
                  setShowItemForm(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Service Item
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {serviceItems.map((item) => (
                  <li key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-900">
                              ${item.base_price.toFixed(2)}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {getUnitTypeLabel(item.unit_type)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                        )}
                        {item.categories && (
                          <p className="mt-1 text-sm text-gray-500">
                            Category: {item.categories.name}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <button
                    onClick={() => setShowCategoryForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Division *</label>
                    <select
                      value={categoryForm.operational_division_id}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          operational_division_id: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Division</option>
                      {divisions.map((division) => (
                        <option key={division.id} value={division.id}>
                          {division.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="category-active"
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, is_active: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="category-active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingCategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Service Item Form Modal */}
        {showItemForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingItem ? 'Edit Service Item' : 'Add Service Item'}
                  </h3>
                  <button
                    onClick={() => setShowItemForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={itemForm.service_category_id}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, service_category_id: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Type *</label>
                    <select
                      value={itemForm.unit_type}
                      onChange={(e) => setItemForm({ ...itemForm, unit_type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Unit Type</option>
                      <option value="monthly">Monthly</option>
                      <option value="per_cleaning">Per Cleaning</option>
                      <option value="per_unit">Per Unit</option>
                      <option value="per_project">Per Project</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.base_price}
                      onChange={(e) => setItemForm({ ...itemForm, base_price: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="item-active"
                      checked={itemForm.is_active}
                      onChange={(e) => setItemForm({ ...itemForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="item-active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
