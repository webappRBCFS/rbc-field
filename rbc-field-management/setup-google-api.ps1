# Google Places API Setup Script
# This script helps you set up the Google Places API key

Write-Host "=== Google Places API Setup ===" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow

    # Create .env.local file
    @"
# Google Places API Key
REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here

# Supabase Configuration (if not already set)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
"@ | Out-File -FilePath $envFile -Encoding UTF8

    Write-Host "✅ Created .env.local file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your API key from: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Enable these APIs:" -ForegroundColor White
Write-Host "   - Places API" -ForegroundColor Gray
Write-Host "   - Maps JavaScript API" -ForegroundColor Gray
Write-Host "   - Geocoding API" -ForegroundColor Gray
Write-Host "3. Replace 'your_api_key_here' in .env.local with your actual API key" -ForegroundColor White
Write-Host "4. Restart your development server: npm start" -ForegroundColor White
Write-Host ""

# Ask if user wants to open the test page
$openTest = Read-Host "Would you like to open the API test page? (y/n)"
if ($openTest -eq "y" -or $openTest -eq "Y") {
    $testPage = "test-google-api.html"
    if (Test-Path $testPage) {
        Start-Process $testPage
        Write-Host "✅ Opened test page in your browser" -ForegroundColor Green
    } else {
        Write-Host "❌ Test page not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "For detailed setup instructions, see: GOOGLE_MAPS_COMPLETE_SETUP.md" -ForegroundColor Cyan
