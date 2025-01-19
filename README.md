<img src="https://www.ipflare.io/logo.svg" alt="IPFlare Logo" width="100" height="53">

# IP Flare

IP Geolocation API, our API enables you to effortlessly obtain precise geolocation data for any IP address through a single endpoint. Benefit from ultra-fast responses—typically between 50-100ms—and enjoy reliable performance with 99.9% uptime.

Visit our website: [www.ipflare.io](https://www.ipflare.io)

## Installation

Install the library using npm:

```bash
npm install ipflare
```

## Getting Started

To use the IPFlare library, you'll need an API key. You can obtain your API key from the [IPFlare Dashboard](https://www.ipflare.io/dashboard/api-keys).

## Usage

### Initialize the Library

```typescript
import { IPFlare } from "ipflare";

// Initialize with your API key (required)
const geolocator = new IPFlare({
  apiKey: "your-api-key",
});
```

### Single IP Lookup

```typescript
// Look up a single IP address
const result = await geolocator.lookup("178.238.11.6");

console.log(result);
```

### Lookup with Additional Fields

```typescript
// Look up with additional fields
const resultWithFields = await geolocator.lookup("178.238.11.6", {
  include: {
    asn: true,
    isp: true,
  },
});

console.log(resultWithFields);
```

### Bulk IP Lookup

```typescript
// Look up multiple IP addresses
const bulkResults = await geolocator.bulkLookup({
  ips: ["178.238.11.6", "1.1.1.1"],
  include: {
    asn: true,
    isp: true,
  },
});

console.log(bulkResults);
```

## Documentation

For more detailed information, please refer to our documentation:

- [Get Geolocation](https://www.ipflare.io/documentation/get-geolocation)
- [Bulk Lookup](https://www.ipflare.io/documentation/bulk-lookup)
- [Next.js Tutorial](https://www.ipflare.io/documentation/tutorial)

## Features

- Single IP lookup
- Bulk IP lookup (up to 500 IPs)
- Optional fields support (ASN, ISP)
- Comprehensive geolocation data
- TypeScript support with full type definitions
- Error handling for invalid inputs
