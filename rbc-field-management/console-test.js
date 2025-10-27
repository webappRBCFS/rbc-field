// Simple console test for DSNY geocoding integration
// Copy and paste this entire code block into your browser console

async function testDSNYGeocoding() {
  const testAddresses = [
    '149 Skillman Street, Brooklyn NY 11205',
    '195 Division Avenue, Brooklyn NY 11211',
    '183 Wallabout Street, Brooklyn NY 11206',
    '670 Myrtle Avenue, Brooklyn NY 11205',
  ]

  console.log('🗽 Testing NYC DSNY Geocoding Integration...')
  console.log('='.repeat(50))

  for (const address of testAddresses) {
    try {
      console.log(`\n📍 Testing: ${address}`)
      console.log('Step 1: Geocoding address...')

      // Step 1: Geocode
      const geocodeResponse = await fetch(
        `https://api.cityofnewyork.us/geocoding/v1/geocode?address=${encodeURIComponent(address)}`
      )

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        console.log('✅ Geocoding result:', geocodeData)

        if (geocodeData && geocodeData.coordinates) {
          const { lat, lng } = geocodeData.coordinates
          console.log(`📍 Coordinates: ${lat}, ${lng}`)

          // Step 2: Find DSNY zone
          console.log('Step 2: Finding DSNY collection zone...')
          const dsnyResponse = await fetch(
            `https://data.cityofnewyork.us/resource/p7k6-2pm8.json?$where=within_circle(location, ${lat}, ${lng}, 100)&$limit=1`
          )

          if (dsnyResponse.ok) {
            const dsnyData = await dsnyResponse.json()
            console.log('🗑️ DSNY zone data:', dsnyData)

            if (dsnyData && dsnyData.length > 0) {
              const zone = dsnyData[0]
              const pickupDays = []
              if (zone.monday) pickupDays.push('Monday')
              if (zone.tuesday) pickupDays.push('Tuesday')
              if (zone.wednesday) pickupDays.push('Wednesday')
              if (zone.thursday) pickupDays.push('Thursday')
              if (zone.friday) pickupDays.push('Friday')
              if (zone.saturday) pickupDays.push('Saturday')
              if (zone.sunday) pickupDays.push('Sunday')

              console.log('🎉 SUCCESS!')
              console.log(`   Zone: ${zone.zone_name || zone.zone || 'Unknown'}`)
              console.log(`   Pickup Days: ${pickupDays.join(', ')}`)
              console.log(`   Collection Type: ${zone.collection_type || 'refuse'}`)
            } else {
              console.log('❌ No DSNY zone found for these coordinates')
            }
          } else {
            console.log(`❌ DSNY API Error: ${dsnyResponse.status} ${dsnyResponse.statusText}`)
          }
        } else {
          console.log('❌ No coordinates returned from geocoding')
        }
      } else {
        console.log(`❌ Geocoding Error: ${geocodeResponse.status} ${geocodeResponse.statusText}`)
      }
    } catch (error) {
      console.log(`❌ Error testing ${address}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 Test completed!')
}

// Run the test
testDSNYGeocoding()
