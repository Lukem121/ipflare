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

### Result-Based API - No Try-Catch Required

The API methods return a `Result` object with an `ok` property, eliminating the need for try-catch blocks:

#### Single IP Lookup

```typescript
// Result-based lookup - no try-catch needed
const result = await geolocator.lookup("178.238.11.6");

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

#### Bulk IP Lookup

```typescript
// Result-based bulk lookup
const bulkResult = await geolocator.bulkLookup({
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

The Result-based API provides structured error types that match the actual API responses:

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

### Additional Examples

#### Lookup with Additional Fields

```typescript
const resultWithFields = await geolocator.lookup("178.238.11.6", {
  include: {
    asn: true,
    isp: true,
  },
});

if (resultWithFields.ok) {
  console.log('ASN:', resultWithFields.data.asn);
  console.log('ISP:', resultWithFields.data.isp);
} else {
  console.error('Lookup failed:', resultWithFields.error.message);
}
```

#### Using Type Guards

```typescript
import { isSuccess, isError } from 'ipflare';

const result = await geolocator.lookup("8.8.8.8");

if (isSuccess(result)) {
  // TypeScript knows this is a success result
  console.log(`IP ${result.data.ip} is in ${result.data.country_name}`);
} else if (isError(result)) {
  // TypeScript knows this is an error result
  console.log(`Error: ${result.error.message}`);
}
```

## Documentation

For more detailed information, please refer to our documentation:

- [Get Geolocation](https://www.ipflare.io/documentation/get-geolocation)
- [Bulk Lookup](https://www.ipflare.io/documentation/bulk-lookup)
- [Next.js Tutorial](https://www.ipflare.io/documentation/tutorial)

## Features

- **Result-based API**: No try-catch required, all methods return Result types
- **Structured Error Handling**: Comprehensive error types with detailed information
- **Single IP Lookup**: Fast geolocation lookup for individual IP addresses
- **Bulk IP Lookup**: Process up to 500 IPs in a single request
- **IPv4 & IPv6 Support**: Full support for both IPv4 and IPv6 addresses
- **Optional Fields**: ASN, ISP, and other additional data fields
- **TypeScript Support**: Full type definitions with type guards
- **Input Validation**: Client-side validation prevents invalid API calls
- **Production Ready**: Comprehensive testing and enterprise-grade reliability
