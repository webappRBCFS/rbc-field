// Test script for NYC Open Data DSNY API integration
// Run this in browser console to test the API

async function testDSNYAPI() {
  const testAddresses = [
    '149 Skillman Street, Brooklyn NY 11205',
    '195 Division Avenue, Brooklyn NY 11211',
    '183 Wallabout Street, Brooklyn NY 11206',
    '670 Myrtle Avenue, Brooklyn NY 11205',
  ]

  console.log('Testing NYC Open Data DSNY API...')

  for (const address of testAddresses) {
    try {
      console.log(`\nTesting address: ${address}`)

      // Test the NYC Open Data API
      const response = await fetch(
        `https://data.cityofnewyork.us/resource/p7k6-2pm8.json?$where=address like '%${encodeURIComponent(
          address
        )}%'&$limit=1`
      )

      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)

        if (data && data.length > 0) {
          const schedule = data[0]
          console.log('✅ Real DSNY data found!')
          console.log('Schedule:', schedule)

          // Parse pickup days
          const pickupDays = []
          if (schedule.monday) pickupDays.push('Monday')
          if (schedule.tuesday) pickupDays.push('Tuesday')
          if (schedule.wednesday) pickupDays.push('Wednesday')
          if (schedule.thursday) pickupDays.push('Thursday')
          if (schedule.friday) pickupDays.push('Friday')
          if (schedule.saturday) pickupDays.push('Saturday')
          if (schedule.sunday) pickupDays.push('Sunday')

          console.log('Pickup Days:', pickupDays.join(', '))
          console.log('Collection Type:', schedule.collection_type)
          console.log('Zone:', schedule.zone)
        } else {
          console.log('❌ No data found for this address')
        }
      } else {
        console.log('❌ API request failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.log('❌ Error:', error.message)
    }
  }
}

// Run the test
testDSNYAPI()
