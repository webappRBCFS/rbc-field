import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface OperationalDivision {
  id: string
  name: string
  code: string
  description?: string
  color_code: string
  is_active: boolean
}

interface DivisionContextType {
  divisions: OperationalDivision[]
  currentDivision: OperationalDivision | null
  setCurrentDivision: (division: OperationalDivision | null) => void
  isLoading: boolean
  error: string | null
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined)

export const useDivision = () => {
  const context = useContext(DivisionContext)
  if (context === undefined) {
    throw new Error('useDivision must be used within a DivisionProvider')
  }
  return context
}

interface DivisionProviderProps {
  children: React.ReactNode
}

export const DivisionProvider: React.FC<DivisionProviderProps> = ({ children }) => {
  const [divisions, setDivisions] = useState<OperationalDivision[]>([])
  const [currentDivision, setCurrentDivision] = useState<OperationalDivision | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('operational_divisions')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setDivisions(data || [])

      // Set default division to "All" (null) or first division
      if (data && data.length > 0) {
        // You can set a default division here if needed
        // setCurrentDivision(data[0])
      }
    } catch (error) {
      console.error('Error fetching divisions:', error)
      setError('Failed to load operational divisions')
    } finally {
      setIsLoading(false)
    }
  }

  const value: DivisionContextType = {
    divisions,
    currentDivision,
    setCurrentDivision,
    isLoading,
    error,
  }

  return <DivisionContext.Provider value={value}>{children}</DivisionContext.Provider>
}

// Division Filter Component
interface DivisionFilterProps {
  className?: string
  showAllOption?: boolean
  onDivisionChange?: (division: OperationalDivision | null) => void
}

export const DivisionFilter: React.FC<DivisionFilterProps> = ({
  className = '',
  showAllOption = true,
  onDivisionChange,
}) => {
  const { divisions, currentDivision, setCurrentDivision, isLoading } = useDivision()

  const handleDivisionChange = (divisionId: string) => {
    const division =
      divisionId === 'all' ? null : divisions.find((d) => d.id === divisionId) || null
    setCurrentDivision(division)
    onDivisionChange?.(division)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Division:</label>
      <select
        value={currentDivision?.id || 'all'}
        onChange={(e) => handleDivisionChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {showAllOption && <option value="all">All Divisions</option>}
        {divisions.map((division) => (
          <option key={division.id} value={division.id}>
            {division.name}
          </option>
        ))}
      </select>
      {currentDivision && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: currentDivision.color_code }}
          title={currentDivision.name}
        />
      )}
    </div>
  )
}

// Division Badge Component
interface DivisionBadgeProps {
  division: OperationalDivision
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: division.color_code }}
    >
      {division.name}
    </span>
  )
}

// Division Stats Component
interface DivisionStatsProps {
  className?: string
}

export const DivisionStats: React.FC<DivisionStatsProps> = ({ className = '' }) => {
  const { divisions, currentDivision } = useDivision()
  const [stats, setStats] = useState<any[]>([])

  useEffect(() => {
    fetchDivisionStats()
  }, [currentDivision])

  const fetchDivisionStats = async () => {
    try {
      let query = supabase.from('division_summary').select('*')

      if (currentDivision) {
        query = query.eq('division_id', currentDivision.id)
      }

      const { data, error } = await query

      if (error) throw error
      setStats(data || [])
    } catch (error) {
      console.error('Error fetching division stats:', error)
    }
  }

  if (stats.length === 0) return null

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {stats.map((stat) => (
        <div key={stat.division_id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{stat.division_name}</h3>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color_code }} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Proposals:</span>
              <span className="ml-1 font-medium">{stat.total_proposals}</span>
            </div>
            <div>
              <span className="text-gray-500">Jobs:</span>
              <span className="ml-1 font-medium">{stat.total_jobs}</span>
            </div>
            <div>
              <span className="text-gray-500">Employees:</span>
              <span className="ml-1 font-medium">{stat.total_employees}</span>
            </div>
            <div>
              <span className="text-gray-500">Value:</span>
              <span className="ml-1 font-medium">
                ${stat.total_proposal_value?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
