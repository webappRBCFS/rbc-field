// Server-side DSNY API proxy using Official DSNY API
// This file should be placed in your backend/server directory

const express = require('express')
const fetch = require('node-fetch')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

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
        `https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection?address=${encodeURIComponent(
          address
        )}`
      )

      if (dsnyResponse.ok) {
        const dsnyData = await dsnyResponse.json()
        console.log('Official DSNY API result:', dsnyData)

        if (dsnyData && dsnyData.RegularCollectionSchedule) {
          // Parse the collection schedule
          const scheduleString = dsnyData.RegularCollectionSchedule
          const pickupDays = []

          if (scheduleString.includes('Monday')) pickupDays.push('monday')
          if (scheduleString.includes('Tuesday')) pickupDays.push('tuesday')
          if (scheduleString.includes('Wednesday')) pickupDays.push('wednesday')
          if (scheduleString.includes('Thursday')) pickupDays.push('thursday')
          if (scheduleString.includes('Friday')) pickupDays.push('friday')
          if (scheduleString.includes('Saturday')) pickupDays.push('saturday')
          if (scheduleString.includes('Sunday')) pickupDays.push('sunday')

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
            pickup_days: pickupDays,
            collection_type: 'refuse',
            zone: `DSNY Zone (${pickupDays.join(', ')})`,
            next_pickup: nextPickup,
            data_source: 'Official DSNY API - Real Collection Schedule',
            last_updated: new Date().toISOString(),
            raw_data: dsnyData,
            regular_schedule: dsnyData.RegularCollectionSchedule,
            bulk_schedule: dsnyData.BulkPickupCollectionSchedule,
            recycling_schedule: dsnyData.RecyclingCollectionSchedule,
            organics_schedule: dsnyData.OrganicsCollectionSchedule,
            formatted_address: dsnyData.FormattedAddress,
          }
          console.log('Official DSNY data processed:', result)
          return res.json(result)
        }
      }
    } catch (dsnyError) {
      console.warn('Official DSNY API failed:', dsnyError)
    }

    // Fallback: Return error if no data found
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
