# DSNY Real Data Integration Setup

## Problem

The current implementation uses **simulated data** because:

- NYC Geocoding API blocks browser requests (CORS)
- DSNY API blocks browser requests (CORS)
- This results in **fake pickup schedules** that don't match real DSNY data

## Solution

Create a **server-side proxy** that can make the API calls without CORS restrictions.

## Setup Instructions

### 1. Install Dependencies

```bash
cd rbc-field-management
npm install express cors node-fetch
npm install --save-dev nodemon
```

### 2. Start the Proxy Server

```bash
# Terminal 1: Start the DSNY proxy server
node dsny-proxy-server.js

# Terminal 2: Start your React app
npm start
```

### 3. Test Real DSNY Data

1. Go to `/jobs/create`
2. Select XYZ Industries and Brooklyn property
3. Enable DSNY Integration
4. Click "Fetch DSNY Schedule"
5. Check console for **real data** instead of simulated data

## Expected Results

### Before (Simulated):

```
Fallback DSNY data generated: {
  address: '149 Skillman Street',
  pickup_days: ['tuesday', 'friday'],
  zone: 'Zone 1 (Tuesday, Friday)',
  data_source: 'Simulated Fallback'
}
```

### After (Real Data):

```
Real DSNY data received from server: {
  address: '149 Skillman Street',
  pickup_days: ['monday', 'thursday'], // Real DSNY schedule
  zone: 'Zone 15 (Monday, Thursday)',   // Actual zone
  data_source: 'NYC Open Data - Real Geocoded Data'
}
```

## Architecture

```
React App → /api/dsny-schedule → Server Proxy → NYC APIs → Real Data
```

## Benefits

- ✅ **Real DSNY pickup schedules**
- ✅ **Accurate geographic zones**
- ✅ **No more simulated data**
- ✅ **Production-ready integration**

## Troubleshooting

### If proxy server fails:

1. Check if port 3001 is available
2. Verify internet connection
3. Check console for API errors
4. Fallback to simulation will still work

### If no data found:

- Address might not be in DSNY dataset
- Try different address format
- Check DSNY website for manual verification
