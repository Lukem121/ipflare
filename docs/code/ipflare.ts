import dedent from "dedent";
import type { CodeSnippet } from "~/components/code/code";

export const initializeCode = (apiKey?: string): CodeSnippet[] => {
  const secret = apiKey ? `<<SECRET:${apiKey}>>` : "YOUR_API_KEY";
  return [
    {
      label: "TypeScript",
      language: "tsx",
      code: dedent`
        // ipflare.ts

        import { IPFlare } from "ipflare";
  
        // Initialize with your API key (required)
        const geolocator = new IPFlare({
          apiKey: '${secret}',
        });
      `,
    },
  ];
};

export const configurationOptionsCode = (apiKey?: string): CodeSnippet[] => {
  const secret = apiKey ? `<<SECRET:${apiKey}>>` : "YOUR_API_KEY";
  return [
    {
      label: "TypeScript",
      language: "tsx",
      code: dedent`
        import { IPFlare } from "ipflare";

        // Basic configuration
        const geolocator = new IPFlare({
          apiKey: '${secret}',
        });

        // Advanced configuration with custom options
        const advancedGeolocator = new IPFlare({
          apiKey: '${secret}',
          baseURL: 'https://api.ipflare.io',  // Custom base URL
          timeout: 15000,                     // Custom timeout (15 seconds)
        });
      `,
    },
  ];
};

export const safeAPILookupCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript",
      language: "tsx",
      code: dedent`
        // No try-catch required!
        const result = await geolocator.safeLookup("178.238.11.6");
        
        if (!result.ok) {
          // Handle different error types
          switch (result.error.type) {
            case 'INVALID_IP_ADDRESS':
              console.log('Invalid IP:', result.error.message);
              break;
            case 'UNAUTHORIZED':
              console.log('API key issue:', result.error.message);
              break;
            case 'QUOTA_EXCEEDED':
              console.log('Quota exceeded:', result.error.message);
              break;
            case 'GEOLOCATION_NOT_FOUND':
              console.log('No geolocation data:', result.error.message);
              break;
            default:
              console.log('Error:', result.error.message);
          }
          return;
        }

        // TypeScript knows result.data is IPGeolocationResponse
        console.log('Location:', result.data.city, result.data.country_name);
        console.log('Coordinates:', result.data.latitude, result.data.longitude);

        // IPv6 lookup (fully supported)
        const ipv6Result = await geolocator.safeLookup("2001:4860:4860::8888");
        if (ipv6Result.ok) {
          console.log('IPv6 location:', ipv6Result.data);
        }
      `,
    },
  ];
};

export const singleIPLookupCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript (Traditional API)",
      language: "tsx",
      code: dedent`
        // Traditional API with try-catch
        try {
          // IPv4 lookup
          const ipv4Result = await geolocator.lookup("178.238.11.6");
          console.log(ipv4Result);

          // IPv6 lookup (fully supported)
          const ipv6Result = await geolocator.lookup("2001:4860:4860::8888");
          console.log(ipv6Result);
        } catch (error) {
          console.error('Lookup failed:', error.message);
        }

        // The library automatically validates IP addresses
        try {
          await geolocator.lookup("invalid-ip");
        } catch (error) {
          console.error(error.message); // "Invalid IP address format: invalid-ip"
        }
      `,
    },
    {
      label: "JavaScript (Traditional API)",
      language: "jsx",
      code: dedent`
        // Traditional API with try-catch
        try {
          // IPv4 lookup
          const ipv4Result = await geolocator.lookup("178.238.11.6");
          console.log(ipv4Result);

          // IPv6 lookup (fully supported)
          const ipv6Result = await geolocator.lookup("2001:4860:4860::8888");
          console.log(ipv6Result);
        } catch (error) {
          console.error('Lookup failed:', error.message);
        }

        // The library automatically validates IP addresses
        try {
          await geolocator.lookup("invalid-ip");
        } catch (error) {
          console.error(error.message); // "Invalid IP address format: invalid-ip"
        }
      `,
    },
  ];
};

export const safeBulkLookupCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript",
      language: "tsx",
      code: dedent`
        // Bulk lookup - No try-catch required!
        const bulkResult = await geolocator.safeBulkLookup({
          ips: ["178.238.11.6", "1.1.1.1", "2001:4860:4860::8888"],
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
            console.log(\`\${item.data.ip}: \${item.data.city}, \${item.data.country_name}\`);
            if (item.data.asn) console.log(\`ASN: \${item.data.asn}\`);
            if (item.data.isp) console.log(\`ISP: \${item.data.isp}\`);
          } else {
            console.log(\`\${item.ip}: Error - \${item.error_message}\`);
          }
        }
      `,
    },
  ];
};

export const lookupWithAdditionalFieldsCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript",
      language: "tsx",
      code: dedent`
        // Lookup with additional fields
        const result = await geolocator.safeLookup("178.238.11.6", {
          include: {
            asn: true,
            isp: true,
          },
        });

        if (!result.ok) {
          console.log('Lookup failed:', result.error.message);
          return;
        }

        console.log('IP:', result.data.ip);
        console.log('Location:', result.data.city, result.data.country_name);
        console.log('ASN:', result.data.asn);
        console.log('ISP:', result.data.isp);
      `,
    },
  ];
};

export const bulkIPLookupCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript (Traditional API)",
      language: "tsx",
      code: dedent`
      // Traditional bulk lookup with try-catch
      try {
        const bulkResults = await geolocator.bulkLookup({
          ips: ["178.238.11.6", "1.1.1.1", "2001:4860:4860::8888"],
          include: {
            asn: true,
            isp: true,
          },
        });

        console.log(bulkResults);
      } catch (error) {
        console.error('Bulk lookup failed:', error.message);
      }
      
      // The library validates all IPs before making the request
      try {
        await geolocator.bulkLookup({
          ips: ["178.238.11.6", "invalid-ip", "1.1.1.1"]
        });
      } catch (error) {
        console.error(error.message); // "Invalid IP addresses found: invalid-ip"
      }
      `,
    },
    {
      label: "JavaScript (Traditional API)",
      language: "jsx",
      code: dedent`
      // Traditional bulk lookup with try-catch
      try {
        const bulkResults = await geolocator.bulkLookup({
          ips: ["178.238.11.6", "1.1.1.1", "2001:4860:4860::8888"],
          include: {
            asn: true,
            isp: true,
          },
        });
        
        console.log(bulkResults);
      } catch (error) {
        console.error('Bulk lookup failed:', error.message);
      }
      
      // The library validates all IPs before making the request
      try {
        await geolocator.bulkLookup({
          ips: ["178.238.11.6", "invalid-ip", "1.1.1.1"]
        });
      } catch (error) {
        console.error(error.message); // "Invalid IP addresses found: invalid-ip"
      }
      `,
    },
  ];
};

export const errorHandlingCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript (Safe API - Recommended)",
      language: "tsx",
      code: dedent`
        import { IPFlare } from "ipflare";

        const geolocator = new IPFlare({ apiKey: 'your-api-key' });

        // Safe API - No try-catch required!
        const result = await geolocator.safeLookup("8.8.8.8");
        
        if (!result.ok) {
          // Handle specific error types
          switch (result.error.type) {
            case 'INVALID_IP_ADDRESS':
              console.error('Please provide a valid IP address');
              break;
            case 'RESERVED_IP_ADDRESS':
              console.error('IP address is reserved (private/local)');
              break;
            case 'UNAUTHORIZED':
              console.error('Please check your API key');
              break;
            case 'QUOTA_EXCEEDED':
              console.error('Usage quota exceeded, please upgrade your plan');
              break;
            case 'GEOLOCATION_NOT_FOUND':
              console.error('No geolocation data available for this IP');
              break;
            case 'INTERNAL_SERVER_ERROR':
              console.error('Server error occurred, please try again');
              break;
            default:
              console.error('Unexpected error:', result.error.message);
          }
          return;
        }

        // Success - TypeScript knows the exact type
        console.log('Success:', result.data);

        // Safe bulk lookup error handling
        const bulkResult = await geolocator.safeBulkLookup({
          ips: ["8.8.8.8", "1.1.1.1"]
        });

        if (!bulkResult.ok) {
          console.error('Bulk lookup failed:', bulkResult.error.message);
          return;
        }

        console.log('Bulk results:', bulkResult.data);
      `,
    },
    {
      label: "TypeScript (Traditional API)",
      language: "tsx",
      code: dedent`
        import { IPFlare } from "ipflare";

        const geolocator = new IPFlare({ apiKey: 'your-api-key' });

        // Traditional API with try-catch
        try {
          const result = await geolocator.lookup("8.8.8.8");
          console.log(result);
        } catch (error) {
          if (error instanceof Error) {
            switch (error.message) {
              case "Invalid API key":
                console.error("Please check your API key");
                break;
              case "Quota exceeded":
                console.error("Usage quota exceeded, please upgrade your plan or wait for quota reset");
                break;
              default:
                if (error.message.startsWith("Invalid IP address format:")) {
                  console.error("Please provide a valid IP address");
                } else {
                  console.error("Unexpected error:", error.message);
                }
            }
          }
        }

        // Bulk lookup error handling
        try {
          const results = await geolocator.bulkLookup({
            ips: ["8.8.8.8", "1.1.1.1"]
          });
          console.log(results);
        } catch (error) {
          if (error instanceof Error) {
            console.error("Bulk lookup failed:", error.message);
          }
        }
      `,
    },
  ];
};

export const typeGuardsCode = (): CodeSnippet[] => {
  return [
    {
      label: "TypeScript (Safe API)",
      language: "tsx",
      code: dedent`
        import { 
          IPFlare, 
          isSuccess,
          isError
        } from "ipflare";

        const geolocator = new IPFlare({ apiKey: 'your-api-key' });

        // Safe API with type guards
        const result = await geolocator.safeLookup("8.8.8.8");

        if (isSuccess(result)) {
          // TypeScript knows this is a success response
          console.log('Success:', result.data);
          console.log('Country:', result.data.country_name);
          console.log('City:', result.data.city);
        } else if (isError(result)) {
          // TypeScript knows this is an error response
          console.error('Error type:', result.error.type);
          console.error('Error message:', result.error.message);
        }

        // Safe bulk lookup with type guards
        const bulkResult = await geolocator.safeBulkLookup({
          ips: ["8.8.8.8", "1.1.1.1"]
        });

        if (isSuccess(bulkResult)) {
          // Process each result in the bulk response
          for (const item of bulkResult.data) {
            if (item.status === "success") {
              console.log(\`Success for \${item.ip}:\`, item.data);
            } else {
              console.error(\`Error for \${item.ip}: \${item.error_message}\`);
            }
          }
        }
      `,
    },
    {
      label: "TypeScript (Traditional API)",
      language: "tsx",
      code: dedent`
        import { 
          IPFlare, 
          isIPGeolocationError, 
          isIPGeolocationSuccess 
        } from "ipflare";

        const geolocator = new IPFlare({ apiKey: 'your-api-key' });

        try {
          const results = await geolocator.bulkLookup({
            ips: ["8.8.8.8", "1.1.1.1", "invalid-ip"]
          });

          // Process results with type safety
          for (const result of results) {
            if (isIPGeolocationSuccess(result)) {
              // TypeScript knows this is a success response
              console.log(\`Success for \${result.ip}:\`, result.data);
              console.log(\`Country: \${result.data.country_name}\`);
              console.log(\`City: \${result.data.city}\`);
            } else if (isIPGeolocationError(result)) {
              // TypeScript knows this is an error response
              console.error(\`Error for \${result.ip}: \${result.error_message}\`);
            }
          }

          // Alternative approach using status property
          results.forEach(result => {
            switch (result.status) {
              case "success":
                console.log("Success:", result.data);
                break;
              case "error":
                console.error("Error:", result.error_message);
                break;
            }
          });
        } catch (error) {
          console.error('Bulk lookup failed:', error);
        }
      `,
    },
  ];
};
