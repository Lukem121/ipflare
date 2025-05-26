import { IPFlare } from "./src/index";

async function example() {
  const geolocator = new IPFlare({ apiKey: "your-api-key" });

  // Example 1: Single IP lookup with new safe API
  const result = await geolocator.safeLookup("8.8.8.8");

  if (!result.ok) {
    // Handle different error types
    switch (result.error.type) {
      case "INVALID_IP_ADDRESS":
        console.log("Invalid IP address:", result.error.message);
        break;
      case "RESERVED_IP_ADDRESS":
        console.log("Reserved IP address:", result.error.message);
        break;
      case "UNAUTHORIZED":
        console.log("API key issue:", result.error.message);
        break;
      case "NO_API_KEY_PROVIDED":
        console.log("No API key provided:", result.error.message);
        break;
      case "QUOTA_EXCEEDED":
        console.log("Quota exceeded:", result.error.message);
        break;
      case "GEOLOCATION_NOT_FOUND":
        console.log("Geolocation not found:", result.error.message);
        break;
      case "INTERNAL_SERVER_ERROR":
        console.log("Server error:", result.error.message);
        break;
      case "NETWORK_ERROR":
        console.log("Network error:", result.error.message);
        break;
      default:
        console.log("Error:", result.error.message);
    }
    return;
  }

  // Success case - TypeScript knows result.data is IPGeolocationResponse
  console.log("Location data:", {
    ip: result.data.ip,
    city: result.data.city,
    country: result.data.country_name,
    latitude: result.data.latitude,
    longitude: result.data.longitude,
  });

  // Example 2: Bulk lookup with new safe API
  const bulkResult = await geolocator.safeBulkLookup({
    ips: ["8.8.8.8", "1.1.1.1", "208.67.222.222"],
    include: { asn: true, isp: true },
  });

  if (!bulkResult.ok) {
    console.log("Bulk lookup failed:", bulkResult.error.message);
    return;
  }

  // Process bulk results
  for (const item of bulkResult.data) {
    if (item.status === "success") {
      console.log(
        `${item.data.ip}: ${item.data.city}, ${item.data.country_name}`
      );
    } else {
      console.log(`${item.ip}: Error - ${item.error_message}`);
    }
  }
}

// Example of the old API (still works for backward compatibility)
async function oldApiExample() {
  const geolocator = new IPFlare({ apiKey: "your-api-key" });

  try {
    const data = await geolocator.lookup("8.8.8.8");
    console.log("Old API result:", data);
  } catch (error) {
    console.error("Old API error:", error);
  }
}

example().catch(console.error);
