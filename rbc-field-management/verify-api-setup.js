// Quick Google Places API Verification
// Run this in your browser console after setting up your API key

function verifyGooglePlacesSetup() {
  console.log('🔍 Verifying Google Places API Setup...')

  // Check if environment variable is set (in development)
  const apiKey = process?.env?.REACT_APP_GOOGLE_PLACES_API_KEY || 'your_api_key_here'

  if (apiKey === 'your_api_key_here') {
    console.log('❌ API key not configured')
    console.log('📝 Please update .env.local with your actual API key')
    return false
  }

  console.log('✅ API key found:', apiKey.substring(0, 10) + '...')

  // Test the API
  const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=123 Main Street&key=${apiKey}`

  fetch(testUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        console.log('✅ Google Places API is working!')
        console.log('📊 Found', data.predictions.length, 'suggestions')
        console.log('🎯 Sample result:', data.predictions[0]?.description)
        return true
      } else {
        console.log('❌ API Error:', data.status, data.error_message)
        return false
      }
    })
    .catch((error) => {
      console.log('❌ Network Error:', error.message)
      return false
    })
}

// Auto-run verification
verifyGooglePlacesSetup()
