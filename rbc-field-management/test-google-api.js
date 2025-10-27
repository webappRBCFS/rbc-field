// Google Places API Key Tester
// Run this in your browser console to test your API key

function testGooglePlacesAPI(apiKey) {
  console.log('Testing Google Places API...')

  // Test 1: Places Autocomplete
  const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=123 Main Street&key=${apiKey}`

  fetch(testUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'OK') {
        console.log('✅ Places API working!')
        console.log('Sample results:', data.predictions.slice(0, 3))
      } else {
        console.log('❌ Places API error:', data.status, data.error_message)
      }
    })
    .catch((error) => {
      console.log('❌ Network error:', error)
    })
}

// Usage:
// testGooglePlacesAPI('YOUR_API_KEY_HERE');

// Example with a real test:
// testGooglePlacesAPI('AIzaSyB...');

console.log('Google Places API Tester loaded. Use: testGooglePlacesAPI("your-api-key")')
