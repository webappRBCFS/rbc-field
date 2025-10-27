# Complete Google Maps API Setup Guide

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Sign in** with your Google account
3. **Create a new project**:
   - Click "Select a project" dropdown
   - Click "New Project"
   - Project name: "RBC Field Management"
   - Click "Create"

## Step 2: Enable Required APIs

1. **Go to APIs & Services > Library**
2. **Enable these APIs** (search and enable each one):
   - **Places API** - For address autocomplete
   - **Maps JavaScript API** - For map functionality
   - **Geocoding API** - For address geocoding
   - **Geolocation API** - For location services

## Step 3: Create API Key

1. **Go to APIs & Services > Credentials**
2. **Click "Create Credentials" > "API Key"**
3. **Copy the API key** (it will look like: `AIzaSyB...`)
4. **Click "Restrict Key"** for security

## Step 4: Configure API Key Restrictions

### Application Restrictions:
- **HTTP referrers (web sites)**
- Add your domains:
  - `localhost:3000/*` (for development)
  - `your-domain.com/*` (for production)

### API Restrictions:
- **Restrict key** to these APIs:
  - Places API
  - Maps JavaScript API
  - Geocoding API

## Step 5: Set Usage Limits (Optional but Recommended)

1. **Go to APIs & Services > Quotas**
2. **Set daily limits**:
   - Places API: 1,000 requests/day
   - Maps JavaScript API: 1,000 requests/day
   - Geocoding API: 1,000 requests/day

## Step 6: Test Your API Key

You can test your API key by visiting:
```
https://maps.googleapis.com/maps/api/place/autocomplete/json?input=123 Main Street&key=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your actual key.

## Step 7: Add to Your Application

1. **Create `.env.local` file** in your project root
2. **Add your API key**:
   ```
   REACT_APP_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```
3. **Restart your development server**

## Cost Information

- **Free Tier**: $200 credit per month
- **Places Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Maps Load**: $2 per 1,000 loads

For development and small business use, the free tier should be sufficient.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all API keys
3. **Restrict API keys** to specific domains
4. **Monitor usage** in Google Cloud Console
5. **Set up billing alerts** to avoid unexpected charges

## Troubleshooting

### Common Issues:
- **"This API project is not authorized"**: Enable the required APIs
- **"RefererNotAllowedMapError"**: Add your domain to HTTP referrers
- **"REQUEST_DENIED"**: Check API restrictions and billing

### Testing Commands:
```bash
# Test if API key works
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=123 Main Street&key=YOUR_API_KEY"

# Check API status
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=YOUR_API_KEY"
```
