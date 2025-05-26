<img src="https://www.ipflare.io/logo.svg" alt="IP Flare Logo" width="100" height="53">

# IP Flare

IP Geolocation API, our API enables you to effortlessly obtain precise geolocation data for any IP address through a single endpoint. Benefit from ultra-fast responses—typically between 50-200ms—and enjoy reliable performance with 99.9% uptime.

Visit our website: [www.ipflare.io](https://www.ipflare.io)

## Installation

Install the library using npm:

```bash
npm install ipflare
```

## Getting Started

To use the library, you'll need an API key. You can obtain your API key from the [IP Flare Dashboard](https://www.ipflare.io/dashboard/api-keys).

## Usage

### Initialize the Library

```typescript
import { IPFlare } from "ipflare";

// Initialize with your API key (required)
const geolocator = new IPFlare({
  apiKey: "your-api-key",
});
```

### Safe API (Recommended) - No Try-Catch Required

The safe API methods return a `Result` object with an `ok` property, eliminating the need for try-catch blocks:

#### Single IP Lookup (Safe)

```typescript
// Safe lookup - no try-catch needed
const result = await geolocator.safeLookup("178.238.11.6");

if (!result.ok) {
  // Handle different error types
  switch (result.error.type) {
    case 'INVALID_IP_ADDRESS':
      console.log('Invalid IP:', result.error.message);
      break;
    case 'RESERVED_IP_ADDRESS':
      console.log('Reserved IP:', result.error.message);
      break;
    case 'UNAUTHORIZED':
      console.log('API key issue:', result.error.message);
      break;
    case 'NO_API_KEY_PROVIDED':
      console.log('No API key provided:', result.error.message);
      break;
    case 'QUOTA_EXCEEDED':
      console.log('Quota exceeded:', result.error.message);
      break;
    case 'GEOLOCATION_NOT_FOUND':
      console.log('Geolocation not found:', result.error.message);
      break;
    case 'INTERNAL_SERVER_ERROR':
      console.log('Server error:', result.error.message);
      break;
    default:
      console.log('Error:', result.error.message);
  }
  return;
}

// TypeScript knows result.data is IPGeolocationResponse
console.log('Location:', result.data.city, result.data.country_name);
```

#### Bulk IP Lookup (Safe)

```typescript
// Safe bulk lookup
const bulkResult = await geolocator.safeBulkLookup({
  ips: ["178.238.11.6", "1.1.1.1"],
  include: {
    asn: true,
    isp: true,
  },
});

if (!bulkResult.ok) {
  console.log('Bulk lookup failed:', bulkResult.error.message);
  return;
}

// Process results
for (const item of bulkResult.data) {
  if (item.status === 'success') {
    console.log(`${item.data.ip}: ${item.data.city}, ${item.data.country_name}`);
  } else {
    console.log(`${item.ip}: Error - ${item.error_message}`);
  }
}
```

#### Error Types

The safe API provides structured error types that match the actual API responses:

- `INVALID_IP_ADDRESS` - Invalid IP address format
- `RESERVED_IP_ADDRESS` - IP address is reserved (private/local)
- `GEOLOCATION_NOT_FOUND` - Geolocation data not available for this IP
- `INTERNAL_SERVER_ERROR` - Server-side error occurred
- `INVALID_INPUT` - Invalid input parameters
- `UNAUTHORIZED` - Invalid or missing API key
- `QUOTA_EXCEEDED` - API quota exceeded
- `NO_API_KEY_PROVIDED` - No API key was provided
- `NETWORK_ERROR` - Network connectivity issues
- `VALIDATION_ERROR` - Client-side input validation errors
- `UNKNOWN_ERROR` - Unexpected errors

### Traditional API (Backward Compatible)

The original API methods are still available for backward compatibility:

#### Single IP Lookup

```typescript
try {
  const result = await geolocator.lookup("178.238.11.6");
  console.log(result);
} catch (error) {
  console.error('Lookup failed:', error);
}
```

#### Lookup with Additional Fields

```typescript
try {
  const resultWithFields = await geolocator.lookup("178.238.11.6", {
    include: {
      asn: true,
      isp: true,
    },
  });
  console.log(resultWithFields);
} catch (error) {
  console.error('Lookup failed:', error);
}
```

#### Bulk IP Lookup

```typescript
try {
  const bulkResults = await geolocator.bulkLookup({
    ips: ["178.238.11.6", "1.1.1.1"],
    include: {
      asn: true,
      isp: true,
    },
  });
  console.log(bulkResults);
} catch (error) {
  console.error('Bulk lookup failed:', error);
}
```

## Documentation

For more detailed information, please refer to our documentation:

- [Get Geolocation](https://www.ipflare.io/documentation/get-geolocation)
- [Bulk Lookup](https://www.ipflare.io/documentation/bulk-lookup)
- [Next.js Tutorial](https://www.ipflare.io/documentation/tutorial)

## Features

- **Safe API**: No try-catch required, structured error handling
- **Traditional API**: Backward compatible exception-based API
- Single IP lookup
- Bulk IP lookup (up to 500 IPs)
- Optional fields support (ASN, ISP)
- Comprehensive geolocation data
- TypeScript support with full type definitions
- Structured error types for better error handling
