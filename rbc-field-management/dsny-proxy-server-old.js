// Server-side DSNY API proxy
// This file should be placed in your backend/server directory
// For now, let's create a simple Node.js/Express endpoint

const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// DSNY API Proxy Endpoint
app.post('/api/dsny-schedule', async (req, res) => {
  try {
    const { address } = req.body

    if (!address) {
      return res.status(400).json({ error: 'Address is required' })
    }

    console.log('Server-side DSNY request for:', address)

      // Step 1: Try official DSNY API
      try {
        console.log('Trying official DSNY API...')
        const dsnyResponse = await fetch(
          `https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection?address=${encodeURIComponent(address)}`
        )

        if (dsnyResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        console.log('Geocoding result:', geocodeData)

        if (geocodeData && geocodeData.coordinates) {
          const { lat, lng } = geocodeData.coordinates

          // Step 2: Find DSNY collection zone
          const dsnyResponse = await fetch(
            `https://data.cityofnewyork.us/resource/p7k6-2pm8.json?$where=within_circle(location, ${lat}, ${lng}, 100)&$limit=1`
          )

          if (dsnyResponse.ok) {
            const dsnyData = await dsnyResponse.json()
            console.log('DSNY zone data:', dsnyData)

            if (dsnyData && dsnyData.length > 0) {
              const zone = dsnyData[0]

              // Parse pickup days
              const pickupDays = []
              if (zone.monday) pickupDays.push('monday')
              if (zone.tuesday) pickupDays.push('tuesday')
              if (zone.wednesday) pickupDays.push('wednesday')
              if (zone.thursday) pickupDays.push('thursday')
              if (zone.friday) pickupDays.push('friday')
              if (zone.saturday) pickupDays.push('saturday')
              if (zone.sunday) pickupDays.push('sunday')

              // Calculate next pickup date
              const today = new Date()
              const dayNames = [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ]

              let nextPickup = null
              for (let i = 0; i < 7; i++) {
                const checkDate = new Date(today)
                checkDate.setDate(today.getDate() + i)
                const checkDay = dayNames[checkDate.getDay()]

                if (pickupDays.includes(checkDay)) {
                  nextPickup = checkDate.toISOString().split('T')[0]
                  break
                }
              }

              const result = {
                address: address,
                coordinates: { lat, lng },
                pickup_days: pickupDays,
                collection_type: zone.collection_type || 'refuse',
                zone: `Zone ${zone.zone_id || zone.id || 'Unknown'} (${pickupDays.join(', ')})`,
                next_pickup: nextPickup,
                data_source: 'NYC Open Data - Real Geocoded Data',
                last_updated: zone.last_updated || new Date().toISOString(),
                raw_data: zone,
                geocoding_data: geocodeData,
              }

              console.log('Real DSNY data processed:', result)
              return res.json(result)
            }
          }
        }
      }
    } catch (geocodeError) {
      console.warn('Geocoding failed:', geocodeError)
    }

    // Fallback: Try direct address search
    try {
      const response = await fetch(
        `https://data.cityofnewyork.us/resource/p7k6-2pm8.json?$where=address like '%${encodeURIComponent(
          address
        )}%'&$limit=1`
      )

      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const zone = data[0]
          const pickupDays = []
          if (zone.monday) pickupDays.push('monday')
          if (zone.tuesday) pickupDays.push('tuesday')
          if (zone.wednesday) pickupDays.push('wednesday')
          if (zone.thursday) pickupDays.push('thursday')
          if (zone.friday) pickupDays.push('friday')
          if (zone.saturday) pickupDays.push('saturday')
          if (zone.sunday) pickupDays.push('sunday')

          const result = {
            address: address,
            pickup_days: pickupDays,
            collection_type: zone.collection_type || 'refuse',
            zone: `Zone ${zone.zone_id || zone.id || 'Unknown'} (${pickupDays.join(', ')})`,
            data_source: 'NYC Open Data - Direct Address Match',
            raw_data: zone,
          }

          console.log('Direct address match found:', result)
          return res.json(result)
        }
      }
    } catch (directError) {
      console.warn('Direct address search failed:', directError)
    }

    // Final fallback: Return error
    res.status(404).json({
      error: 'No DSNY data found for this address',
      address: address,
      suggestion: 'Please verify the address or contact DSNY directly',
    })
  } catch (error) {
    console.error('DSNY API proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`DSNY API proxy server running on port ${PORT}`)
})

module.exports = app
