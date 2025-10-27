# Address Autocomplete Setup

## Google Places API Configuration

To enable real address autocomplete (instead of mock data), you need to set up a Google Places API key:

### 1. Get a Google Places API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API**
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Create a `.env.local` file in the `rbc-field-management` directory:

```bash
# Google Places API Key
REACT_APP_GOOGLE_PLACES_API_KEY=your_actual_api_key_here

# Supabase Configuration (if not already set)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Restart the Development Server

After adding the environment variables, restart your development server:

```bash
npm start
```

### 4. Test the Address Autocomplete

1. Navigate to **Proposals** → **Proposal Requests** → **Submit Request**
2. Start typing in the **Property Address** field
3. You should see real address suggestions from Google Places API

## Fallback Behavior

If the Google Places API key is not configured or there's an error:

- The system automatically falls back to mock data
- You'll see an error message: "Google Maps API not available - using fallback data"
- The address autocomplete will still work with the predefined NYC addresses

## API Costs

Google Places API has usage limits and costs:

- **Free tier**: $200 credit per month (covers most small business usage)
- **Autocomplete requests**: $2.83 per 1,000 requests
- **Place details requests**: $17 per 1,000 requests

For development/testing, the free tier should be sufficient.

## Security Notes

- Never commit your API key to version control
- Use environment variables for all API keys
- Restrict your API key to specific domains/IPs in Google Cloud Console
- Monitor your API usage in the Google Cloud Console
