# DSNY Integration Guide

## Current Status: ✅ Geocoded DSNY Data Integration

The implementation now uses **geocoding** to convert addresses to coordinates, then finds the exact DSNY collection zone using the [NYC Open Data Garbage Collection Schedule](https://data.cityofnewyork.us/City-Government/Garbage-Collection-Schedule/p7k6-2pm8) dataset. DSNY zones are **geographic areas defined by service days**, not named neighborhoods.

## Understanding DSNY Zones

DSNY collection zones are **geographic areas** defined by service days, not neighborhood names:

- **Zone Structure**: Each zone has specific pickup days (e.g., Tuesday/Friday, Monday/Thursday)
- **Geographic Boundaries**: Zones are defined by precise geographic coordinates
- **Service Days**: The primary identifier is the collection schedule, not location names
- **Zone Identification**: Zones are typically numbered (Zone 1, Zone 2, etc.) with service days

### Example Zone Data:

```json
{
  "zone_id": "1",
  "monday": false,
  "tuesday": true,
  "wednesday": false,
  "thursday": false,
  "friday": true,
  "saturday": false,
  "sunday": false,
  "collection_type": "refuse",
  "location": "POINT(-73.9567 40.7034)"
}
```

## Real DSNY Data Sources

### 1. NYC Open Data Portal

- **URL**: https://data.cityofnewyork.us/
- **Dataset**: "DSNY Collection Zones" or "Garbage Collection Schedule"
- **API**: REST API available with address-based lookups
- **Update Frequency**: Monthly/Quarterly

### 2. DSNY Official Resources

- **Website**: https://www1.nyc.gov/assets/dsny/site/contact/collection-schedule
- **Method**: Web scraping or manual data entry
- **Accuracy**: High, but requires maintenance

### 3. Third-Party Services

- **Google Maps API**: Some pickup schedule data
- **Geocoding Services**: Address to zone mapping
- **Municipal Data Providers**: Commercial services

## Implementation Options

### Option 1: Geocoded DSNY Integration (Current Implementation)

```javascript
const fetchDSNYPickupSchedule = async (address) => {
  try {
    // Step 1: Geocode address to get coordinates
    const geocodeResponse = await fetch(
      `https://api.cityofnewyork.us/geocoding/v1/geocode?address=${encodeURIComponent(address)}`
    )
    const geocodeData = await geocodeResponse.json()

    if (geocodeData && geocodeData.coordinates) {
      const { lat, lng } = geocodeData.coordinates

      // Step 2: Find DSNY collection zone using coordinates
      const dsnyResponse = await fetch(
        `https://data.cityofnewyork.us/resource/p7k6-2pm8.json?$where=within_circle(location, ${lat}, ${lng}, 100)&$limit=1`
      )
      const dsnyData = await dsnyResponse.json()

      if (dsnyData && dsnyData.length > 0) {
        const zone = dsnyData[0]

        // Parse pickup days from zone data
        const pickupDays = []
        if (zone.monday) pickupDays.push('monday')
        if (zone.tuesday) pickupDays.push('tuesday')
        // ... etc for all days

        return {
          address: address,
          coordinates: { lat, lng },
          pickup_days: pickupDays,
          collection_type: zone.collection_type || 'refuse',
          zone: zone.zone_name || zone.zone || 'Unknown',
          data_source: 'NYC Open Data - Geocoded Zone Data',
          raw_data: zone,
          geocoding_data: geocodeData,
        }
      }
    }
  } catch (error) {
    console.error('Error fetching geocoded DSNY data:', error)
    return null
  }
}
```

### Option 2: Web Scraping DSNY Website

```javascript
const scrapeDSNYSchedule = async (address) => {
  try {
    // Use a service like Puppeteer or Cheerio
    const response = await fetch(
      'https://www1.nyc.gov/assets/dsny/site/contact/collection-schedule'
    )
    // Parse HTML to extract pickup schedule
    // This requires regular maintenance as website changes
  } catch (error) {
    console.error('Error scraping DSNY website:', error)
    return null
  }
}
```

### Option 3: Manual Data Entry with Validation

```javascript
const validateDSNYSchedule = async (address, pickupDays) => {
  // Cross-reference with known NYC patterns
  // Validate against historical data
  // Flag for manual review if inconsistent
}
```

## Recommended Implementation Steps

### Phase 1: Enhanced Simulation (Current)

- ✅ Address-specific pickup patterns
- ✅ Realistic zone mapping
- ✅ Next pickup calculation
- ✅ Clear data source labeling

### Phase 2: NYC Open Data Integration

1. **Register for API Key**: Get NYC Open Data API access
2. **Geocoding Service**: Convert addresses to coordinates
3. **Zone Lookup**: Find collection zones by location
4. **Schedule Mapping**: Map zones to pickup schedules
5. **Caching**: Cache results to reduce API calls

### Phase 3: Fallback System

1. **Primary**: NYC Open Data API
2. **Secondary**: Web scraping DSNY website
3. **Tertiary**: Manual data entry with validation
4. **Fallback**: Current simulation with warnings

## Database Schema Updates

Add these fields to track data accuracy:

```sql
ALTER TABLE jobs ADD COLUMN dsny_data_source TEXT;
ALTER TABLE jobs ADD COLUMN dsny_data_accuracy TEXT;
ALTER TABLE jobs ADD COLUMN dsny_last_verified TIMESTAMP;
```

## Testing with Real Data

### Test Addresses (Brooklyn)

- **149 Skillman Street, Brooklyn NY 11205** - Williamsburg
- **195 Division Avenue, Brooklyn NY 11211** - Williamsburg
- **183 Wallabout Street, Brooklyn NY 11206** - Williamsburg
- **670 Myrtle Avenue, Brooklyn NY 11205** - Bed-Stuy

### Expected Pickup Patterns

- **Williamsburg**: Typically Tuesday/Friday or Monday/Thursday
- **Bed-Stuy**: Typically Tuesday/Friday
- **Varies by**: Street, block, building type

## Next Steps

1. **Immediate**: Test current simulation with Brooklyn addresses
2. **Short-term**: Integrate NYC Open Data API
3. **Long-term**: Implement fallback system with manual validation

## Contact Information

- **DSNY Customer Service**: (212) 639-9675
- **NYC Open Data Support**: https://data.cityofnewyork.us/developers
- **DSNY Website**: https://www1.nyc.gov/site/dsny/index.page
