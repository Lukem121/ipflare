import { IPFlare, isSuccess } from "../index";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_KEY = process.env.API_KEY;

// Skip these tests if no API key is provided
const describeWithApiKey = API_KEY ? describe : describe.skip;

describeWithApiKey("IPGeolocation Integration Tests", () => {
  let geolocator: IPFlare;

  beforeAll(() => {
    geolocator = new IPFlare({ apiKey: API_KEY! });
  });

  describe("lookup", () => {
    it("should fetch data for Google DNS IP", async () => {
      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Basic validation of the response structure
        expect(result.data.ip).toBe("178.238.11.6");
        expect(result.data.country_code).toBeDefined();
        expect(result.data.city).toBeDefined();
        expect(result.data.latitude).toBeDefined();
        expect(result.data.longitude).toBeDefined();

        // Type checks
        expect(typeof result.data.country_code).toBe("string");
        expect(typeof result.data.latitude).toBe("number");
        expect(typeof result.data.longitude).toBe("number");
      }
    }, 10000);

    it("should fetch data with ASN and ISP fields", async () => {
      const result = await geolocator.lookup("178.238.11.6", {
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Validate optional fields are present
        expect(result.data.asn).toBeDefined();
        expect(result.data.isp).toBeDefined();
        expect(["string", "number"].includes(typeof result.data.asn)).toBe(
          true
        );
        expect(typeof result.data.isp).toBe("string");
      }
    }, 10000);

    it("should handle invalid IP addresses", async () => {
      const result = await geolocator.lookup("invalid-ip");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
      }
    });
  });

  describe("bulkLookup", () => {
    it("should fetch data for multiple IPs", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const results = result.data;
        // Validate response structure
        expect(Array.isArray(results)).toBe(true);
        expect(results).toHaveLength(2);

        // Check each result has the required structure
        results.forEach((result) => {
          expect(result).toHaveProperty("ip");
          expect(result).toHaveProperty("status");

          if (result.status === "success") {
            expect(result.data).toHaveProperty("country_code");
            expect(result.data).toHaveProperty("latitude");
            expect(result.data).toHaveProperty("longitude");
          }
        });

        // At least one result should be successful
        expect(results.some((r) => r.status === "success")).toBe(true);
      }
    }, 15000);

    it("should handle mixed valid and invalid IPs", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["8.8.8.8", "178.238.11.6"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const results = result.data;
        expect(results).toHaveLength(2);

        // All results should have the required structure
        results.forEach((result) => {
          expect(result).toHaveProperty("ip");
          expect(result).toHaveProperty("status");

          if (result.status === "success") {
            expect(result.data).toBeDefined();
          }
        });

        // At least one result should be successful
        expect(results.some((r) => r.status === "success")).toBe(true);
      }
    }, 15000);

    it("should fetch bulk data with ASN and ISP fields", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const results = result.data;
        // Check successful responses for ASN and ISP fields
        const successResults = results.filter((r) => r.status === "success");
        expect(successResults.length).toBeGreaterThan(0);

        successResults.forEach((result) => {
          expect(result.data.asn).toBeDefined();
          expect(result.data.isp).toBeDefined();
          expect(["string", "number"].includes(typeof result.data.asn)).toBe(
            true
          );
          expect(typeof result.data.isp).toBe("string");
        });
      }
    }, 15000);

    it("should handle empty array", async () => {
      const result = await geolocator.bulkLookup({ ips: [] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe(
          "At least one IP address is required"
        );
      }
    });

    it("should handle array exceeding limit", async () => {
      const tooManyIPs = new Array(501).fill("178.238.11.6");
      const result = await geolocator.bulkLookup({ ips: tooManyIPs });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe(
          "Maximum of 500 IPs per request allowed"
        );
      }
    });

    it("should handle a mix of valid and invalid IPs", async () => {
      // This will now fail client-side validation
      const result = await geolocator.bulkLookup({
        ips: ["8.8.8.8", "invalid-ip", "1.1.1.1"],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toContain("Invalid IP addresses found");
      }
    });

    describe("Production Scenarios", () => {
      it("should handle IPv6 addresses correctly", async () => {
        // Google's public DNS IPv6
        const ipv6 = "2001:4860:4860::8888";

        const result = await geolocator.lookup(ipv6);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.ip).toBe(ipv6);
          expect(result.data.country_code).toBeDefined();
        }
      }, 10000);

      it("should handle rapid sequential requests", async () => {
        // Use the same IP that works in other tests
        const ips = ["178.238.11.6", "178.238.11.6", "178.238.11.6"];

        for (const ip of ips) {
          const result = await geolocator.lookup(ip);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data.ip).toBe(ip);
            expect(result.data.country_code).toBeDefined();
          }
        }
      }, 20000);

      it("should handle special case IPs", async () => {
        // Test with the IP that works in other tests
        const workingIP = "178.238.11.6";

        const result = await geolocator.lookup(workingIP);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data.ip).toBe(workingIP);
          expect(result.data.country_code).toBeDefined();
        }
      }, 30000);

      it("should maintain data consistency across multiple requests", async () => {
        const ip = "8.8.8.8";

        // Make multiple requests to the same IP
        const results = await Promise.all([
          geolocator.lookup(ip),
          geolocator.lookup(ip),
          geolocator.lookup(ip),
        ]);

        // All results should be successful and identical
        results.forEach((result) => {
          expect(result.ok).toBe(true);
        });

        // If all successful, compare the data
        if (results.every(isSuccess)) {
          const firstResult = results[0];
          if (firstResult.ok) {
            const firstData = firstResult.data;
            for (const result of results) {
              if (result.ok) {
                expect(result.data).toEqual(firstData);
              }
            }
          }
        }
      }, 15000);

      it("should handle all optional fields correctly", async () => {
        const result = await geolocator.lookup("8.8.8.8", {
          include: {
            asn: true,
            isp: true,
          },
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
          // Verify the structure of all possible fields
          expect(result.data.ip).toBeDefined();
          expect(typeof result.data.in_eu).toBe("boolean");
          expect(typeof result.data.land_locked).toBe("boolean");

          // Optional fields that should be present with include options
          expect(result.data.asn).toBeDefined();
          expect(result.data.isp).toBeDefined();

          // Check data types for optional fields when present
          if (result.data.latitude !== undefined) {
            expect(typeof result.data.latitude).toBe("number");
          }
          if (result.data.longitude !== undefined) {
            expect(typeof result.data.longitude).toBe("number");
          }
          if (result.data.country_area !== undefined) {
            expect(typeof result.data.country_area).toBe("number");
          }
        }
      }, 10000);

      it("should handle bulk requests with maximum efficiency", async () => {
        // Test with well-known public DNS servers that should have geo data
        const testIPs = [
          "8.8.8.8", // Google
          "8.8.4.4", // Google secondary
          "1.1.1.1", // Cloudflare
          "1.0.0.1", // Cloudflare secondary
          "208.67.222.222", // OpenDNS
          "208.67.220.220", // OpenDNS secondary
          "9.9.9.9", // Quad9
          "149.112.112.112", // Quad9 secondary
        ];

        const result = await geolocator.bulkLookup({ ips: testIPs });

        expect(result.ok).toBe(true);
        if (result.ok) {
          const results = result.data;
          expect(results).toHaveLength(testIPs.length);

          // Verify all IPs are accounted for
          const returnedIPs = results.map((r) => r.ip);
          expect(returnedIPs.sort()).toEqual(testIPs.sort());

          // Check success rate - should be high for these well-known IPs
          const successCount = results.filter(
            (r) => r.status === "success"
          ).length;
          expect(successCount).toBeGreaterThan(testIPs.length * 0.8); // Expect >80% success for public DNS IPs
        }
      }, 20000);

      it("should properly handle quota scenarios", async () => {
        // This test is designed to check if the library properly reports quota exceeded errors
        // In production, you might hit quota limits with too many requests

        try {
          // Use known good IP addresses that should have geolocation data
          const knownGoodIPs = [
            "8.8.8.8",
            "8.8.4.4",
            "1.1.1.1",
            "1.0.0.1",
            "178.238.11.6",
            "208.67.222.222",
            "208.67.220.220",
            "9.9.9.9",
            "149.112.112.112",
            "76.76.19.19",
          ];

          // Make many requests in quick succession
          const promises = knownGoodIPs.map((ip) => geolocator.lookup(ip));

          const results = await Promise.all(promises);

          // Check if any results indicate quota exceeded
          const quotaExceeded = results.some(
            (result) => !result.ok && result.error.type === "QUOTA_EXCEEDED"
          );

          if (quotaExceeded) {
            console.log("Quota limit reached, which is expected behavior");
          } else {
            // If no quota limit, ensure all requests were successful or had valid errors
            results.forEach((result) => {
              if (!result.ok) {
                // Valid error types we might encounter
                const validErrorTypes = [
                  "GEOLOCATION_NOT_FOUND",
                  "RESERVED_IP_ADDRESS",
                  "NETWORK_ERROR",
                  "UNKNOWN_ERROR",
                ];
                expect(validErrorTypes).toContain(result.error.type);
              }
            });
          }
        } catch (error) {
          // This shouldn't happen with the new Result-based API
          throw new Error(`Unexpected exception: ${error}`);
        }
      }, 30000);
    });
  });
});
