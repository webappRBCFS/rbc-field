# ✅ Google Maps Duplicate Load Fix

## Issue

When multiple `AddressAutocomplete` components were used on the same page (e.g., company address + multiple project addresses), each component tried to load the Google Maps JavaScript API, resulting in the error:

```
You have included the Google Maps JavaScript API multiple times on this page.
This may cause unexpected errors.
```

## Root Cause

Multiple `AddressAutocomplete` components mounting simultaneously would all check if `window.google` exists at the same time. Since the script hadn't loaded yet, each component would create its own `<script>` tag, causing duplicates.

## Solution

Implemented a **singleton pattern** with global state variables to ensure the Google Maps API script is only loaded once:

### Changes Made to `AddressAutocomplete.tsx`

1. **Added Global State Variables:**

   ```typescript
   let googleMapsScriptLoading = false
   let googleMapsScriptLoaded = false
   let googleMapsLoadPromise: Promise<void> | null = null
   ```

2. **Updated `loadGoogleMapsAPI()` Function:**
   - Returns immediately if already loaded
   - Returns existing promise if currently loading
   - Checks for existing script tags in the DOM
   - Uses a shared promise for all components

### How It Works Now

1. **First Component Mounts:**

   - Checks if API is loaded → No
   - Checks if loading in progress → No
   - Sets `googleMapsScriptLoading = true`
   - Creates script tag and promise
   - Stores promise in `googleMapsLoadPromise`

2. **Second Component Mounts (while first is loading):**

   - Checks if API is loaded → No
   - Checks if loading in progress → **Yes**
   - Returns the existing `googleMapsLoadPromise`
   - Waits for the same script to load

3. **Third+ Components Mount:**

   - Same as second component
   - All share the same loading promise

4. **After Script Loads:**
   - Sets `googleMapsScriptLoaded = true`
   - Sets `googleMapsScriptLoading = false`
   - All subsequent components get immediate resolve

## Benefits

- ✅ **No Duplicate Scripts:** Only one script tag is ever added
- ✅ **No Race Conditions:** All components wait for the same promise
- ✅ **Fast Mounting:** Components that mount after loading get instant access
- ✅ **DOM Check:** Detects existing scripts even from external sources
- ✅ **Error Handling:** Properly handles loading failures

## Testing

To verify the fix works:

1. Open the browser DevTools Console
2. Navigate to **Leads** → **Add Lead**
3. Check the Console - should see NO warnings about duplicate API loads
4. Check the Network tab - should see only ONE request to `maps.googleapis.com`
5. Add multiple projects - all address fields should work
6. Check the DOM:
   ```javascript
   // Run in console:
   document.querySelectorAll('script[src*="maps.googleapis.com"]').length
   // Should return: 1
   ```

## Files Modified

- `src/components/AddressAutocomplete.tsx`

## Additional Notes

This pattern is commonly used for loading third-party scripts in React applications where multiple components might need the same external resource. The key principles are:

1. **Shared State:** Use module-level variables (outside component scope)
2. **Promise Caching:** Store the loading promise for reuse
3. **DOM Checking:** Detect if script already exists
4. **Idempotency:** Safe to call multiple times

The error should now be completely resolved! 🎉
