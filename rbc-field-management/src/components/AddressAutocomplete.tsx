import React, { useState, useEffect, useRef } from 'react'
import { MapPinIcon } from 'lucide-react'

// Google Maps API types
interface GoogleMapsAutocompleteService {
  getPlacePredictions(
    request: {
      input: string
      types?: string[]
      componentRestrictions?: { country: string }
    },
    callback: (
      predictions: Array<{
        description: string
        place_id: string
      }> | null,
      status: any
    ) => void
  ): void
}

interface GoogleMapsPlacesService {
  getDetails(
    request: {
      placeId: string
      fields: string[]
    },
    callback: (
      place: {
        formatted_address?: string
        address_components?: Array<{
          long_name: string
          short_name: string
          types: string[]
        }>
      } | null,
      status: any
    ) => void
  ): void
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => GoogleMapsAutocompleteService
          PlacesService: new (element: HTMLElement) => GoogleMapsPlacesService
          PlacesServiceStatus: {
            OK: string
          }
        }
      }
    }
  }
}

interface AddressSuggestion {
  formatted_address: string
  address_components: {
    long_name: string
    short_name: string
    types: string[]
  }[]
  place_id: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onAddressSelect: (address: { address: string; city: string; state: string; zip: string }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  useRealAPI?: boolean
}

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY

// Global state to prevent multiple script loads
let googleMapsScriptLoading = false
let googleMapsScriptLoaded = false
let googleMapsLoadPromise: Promise<void> | null = null

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter address...',
  className = '',
  disabled = false,
  useRealAPI = true,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<GoogleMapsAutocompleteService | null>(null)
  const placesService = useRef<GoogleMapsPlacesService | null>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  // Load Google Maps API dynamically (singleton pattern)
  const loadGoogleMapsAPI = () => {
    // If already loaded, resolve immediately
    if (googleMapsScriptLoaded && window.google && window.google.maps) {
      return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (googleMapsScriptLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise
    }

    // Start loading
    googleMapsScriptLoading = true
    googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
      // Double-check after acquiring the lock
      if (window.google && window.google.maps) {
        googleMapsScriptLoaded = true
        googleMapsScriptLoading = false
        resolve()
        return
      }

      if (!GOOGLE_PLACES_API_KEY) {
        googleMapsScriptLoading = false
        reject(new Error('Google Places API key not configured'))
        return
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      )
      if (existingScript) {
        // Script exists, wait for it to load
        existingScript.addEventListener('load', () => {
          googleMapsScriptLoaded = true
          googleMapsScriptLoading = false
          setGoogleMapsLoaded(true)
          resolve()
        })
        existingScript.addEventListener('error', () => {
          googleMapsScriptLoading = false
          reject(new Error('Failed to load Google Maps API'))
        })
        return
      }

      // Create new script tag
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`
      script.async = true
      script.defer = true

      script.onload = () => {
        googleMapsScriptLoaded = true
        googleMapsScriptLoading = false
        setGoogleMapsLoaded(true)
        resolve()
      }

      script.onerror = () => {
        googleMapsScriptLoading = false
        reject(new Error('Failed to load Google Maps API'))
      }

      document.head.appendChild(script)
    })

    return googleMapsLoadPromise
  }

  // Initialize Google Places services
  useEffect(() => {
    if (useRealAPI && GOOGLE_PLACES_API_KEY) {
      loadGoogleMapsAPI()
        .then(() => {
          if (window.google && window.google.maps) {
            // Initialize services for this component instance
            autocompleteService.current = new window.google.maps.places.AutocompleteService()

            // Create a dummy div for PlacesService (required by Google API)
            const dummyDiv = document.createElement('div')
            placesService.current = new window.google.maps.places.PlacesService(dummyDiv)

            // Mark as loaded for this instance
            setGoogleMapsLoaded(true)
          }
        })
        .catch((error) => {
          console.error('Failed to load Google Maps API:', error)
          setError('Google Maps API not available - using fallback data')
        })
    }
  }, [useRealAPI])

  // Mock address suggestions for fallback
  const mockSuggestions: AddressSuggestion[] = [
    {
      formatted_address: '149 Skillman Street, Brooklyn, NY 11205, USA',
      address_components: [
        { long_name: '149', short_name: '149', types: ['street_number'] },
        { long_name: 'Skillman Street', short_name: 'Skillman St', types: ['route'] },
        { long_name: 'Brooklyn', short_name: 'Brooklyn', types: ['locality', 'political'] },
        {
          long_name: 'New York',
          short_name: 'NY',
          types: ['administrative_area_level_1', 'political'],
        },
        { long_name: '11205', short_name: '11205', types: ['postal_code'] },
        { long_name: 'United States', short_name: 'US', types: ['country', 'political'] },
      ],
      place_id: 'mock_1',
    },
    {
      formatted_address: '195 Division Avenue, Brooklyn, NY 11211, USA',
      address_components: [
        { long_name: '195', short_name: '195', types: ['street_number'] },
        { long_name: 'Division Avenue', short_name: 'Division Ave', types: ['route'] },
        { long_name: 'Brooklyn', short_name: 'Brooklyn', types: ['locality', 'political'] },
        {
          long_name: 'New York',
          short_name: 'NY',
          types: ['administrative_area_level_1', 'political'],
        },
        { long_name: '11211', short_name: '11211', types: ['postal_code'] },
        { long_name: 'United States', short_name: 'US', types: ['country', 'political'] },
      ],
      place_id: 'mock_2',
    },
    {
      formatted_address: '183 Wallabout Street, Brooklyn, NY 11206, USA',
      address_components: [
        { long_name: '183', short_name: '183', types: ['street_number'] },
        { long_name: 'Wallabout Street', short_name: 'Wallabout St', types: ['route'] },
        { long_name: 'Brooklyn', short_name: 'Brooklyn', types: ['locality', 'political'] },
        {
          long_name: 'New York',
          short_name: 'NY',
          types: ['administrative_area_level_1', 'political'],
        },
        { long_name: '11206', short_name: '11206', types: ['postal_code'] },
        { long_name: 'United States', short_name: 'US', types: ['country', 'political'] },
      ],
      place_id: 'mock_3',
    },
    {
      formatted_address: '670 Myrtle Avenue, Brooklyn, NY 11205, USA',
      address_components: [
        { long_name: '670', short_name: '670', types: ['street_number'] },
        { long_name: 'Myrtle Avenue', short_name: 'Myrtle Ave', types: ['route'] },
        { long_name: 'Brooklyn', short_name: 'Brooklyn', types: ['locality', 'political'] },
        {
          long_name: 'New York',
          short_name: 'NY',
          types: ['administrative_area_level_1', 'political'],
        },
        { long_name: '11205', short_name: '11205', types: ['postal_code'] },
        { long_name: 'United States', short_name: 'US', types: ['country', 'political'] },
      ],
      place_id: 'mock_4',
    },
  ]

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (useRealAPI && GOOGLE_PLACES_API_KEY && googleMapsLoaded && autocompleteService.current) {
        // Use Google Places API
        await fetchGooglePlacesSuggestions(query)
      } else {
        // Use mock data
        await fetchMockSuggestions(query)
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setError('Failed to fetch address suggestions')
      // Fallback to mock data
      await fetchMockSuggestions(query)
    } finally {
      setLoading(false)
    }
  }

  const fetchGooglePlacesSuggestions = (query: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService.current) {
        reject(new Error('Autocomplete service not initialized'))
        return
      }

      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions: AddressSuggestion[] = predictions.map((prediction) => ({
              formatted_address: prediction.description,
              address_components: [], // Will be filled when place details are fetched
              place_id: prediction.place_id,
            }))
            setSuggestions(suggestions)
            setShowSuggestions(true)
            resolve()
          } else {
            reject(new Error(`Places API error: ${status}`))
          }
        }
      )
    })
  }

  const fetchMockSuggestions = async (query: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Filter mock suggestions based on query
    const filteredSuggestions = mockSuggestions.filter(
      (suggestion) =>
        suggestion.formatted_address.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.address_components.some((component) =>
          component.long_name.toLowerCase().includes(query.toLowerCase())
        )
    )

    setSuggestions(filteredSuggestions)
    setShowSuggestions(true)
  }

  const getPlaceDetails = (placeId: string): Promise<AddressSuggestion> => {
    return new Promise((resolve, reject) => {
      if (!placesService.current) {
        reject(new Error('Places service not initialized'))
        return
      }

      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['formatted_address', 'address_components'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const suggestion: AddressSuggestion = {
              formatted_address: place.formatted_address || '',
              address_components: place.address_components || [],
              place_id: placeId,
            }
            resolve(suggestion)
          } else {
            reject(new Error(`Place details error: ${status}`))
          }
        }
      )
    })
  }

  const parseAddressComponents = (suggestion: AddressSuggestion) => {
    const components = suggestion.address_components
    let streetNumber = ''
    let route = ''
    let city = ''
    let state = ''
    let zip = ''

    components.forEach((component) => {
      if (component.types.includes('street_number')) {
        streetNumber = component.long_name
      } else if (component.types.includes('route')) {
        route = component.long_name
      } else if (component.types.includes('locality')) {
        // Primary city field
        city = component.long_name
      } else if (!city && component.types.includes('sublocality')) {
        // Fallback: sublocality (used in some cities)
        city = component.long_name
      } else if (!city && component.types.includes('postal_town')) {
        // Fallback: postal_town (used in some areas)
        city = component.long_name
      } else if (!city && component.types.includes('administrative_area_level_3')) {
        // Fallback: administrative_area_level_3 (used in some regions)
        city = component.long_name
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name
      } else if (component.types.includes('postal_code')) {
        zip = component.long_name
      }
    })

    const address = `${streetNumber} ${route}`.trim()

    // Debug logging to help troubleshoot
    console.log('Parsed Address Components:', {
      address,
      city,
      state,
      zip,
      allComponents: components.map((c) => ({ name: c.long_name, types: c.types })),
    })

    return {
      address,
      city,
      state,
      zip,
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    fetchAddressSuggestions(newValue)
  }

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    try {
      let finalSuggestion = suggestion

      // If using real API and we don't have address components, fetch them
      if (useRealAPI && suggestion.address_components.length === 0) {
        finalSuggestion = await getPlaceDetails(suggestion.place_id)
      }

      const parsedAddress = parseAddressComponents(finalSuggestion)
      onChange(finalSuggestion.formatted_address)
      onAddressSelect(parsedAddress)
      setShowSuggestions(false)
      setSuggestions([])
    } catch (error) {
      console.error('Error getting place details:', error)
      // Still proceed with the basic suggestion
      onChange(suggestion.formatted_address)
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        />
        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {error && <div className="mt-1 text-sm text-red-600">{error} - Using fallback data</div>}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{suggestion.formatted_address}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-sm text-gray-500">No addresses found</div>
        </div>
      )}
    </div>
  )
}
