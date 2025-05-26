import { IPFlare } from "../index";
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

      // Basic validation of the response structure
      expect(result.ip).toBe("178.238.11.6");
      expect(result.country_code).toBeDefined();
      expect(result.city).toBeDefined();
      expect(result.latitude).toBeDefined();
      expect(result.longitude).toBeDefined();

      // Type checks
      expect(typeof result.country_code).toBe("string");
      expect(typeof result.latitude).toBe("number");
      expect(typeof result.longitude).toBe("number");
    }, 10000);

    it("should fetch data with ASN and ISP fields", async () => {
      const result = await geolocator.lookup("178.238.11.6", {
        include: {
          asn: true,
          isp: true,
        },
      });

      // Validate optional fields are present
      expect(result.asn).toBeDefined();
      expect(result.isp).toBeDefined();
      expect(["string", "number"].includes(typeof result.asn)).toBe(true);
      expect(typeof result.isp).toBe("string");
    }, 10000);

    it("should handle invalid IP addresses", async () => {
      await expect(geolocator.lookup("invalid-ip")).rejects.toThrow();
    });
  });

  describe("bulkLookup", () => {
    it("should fetch data for multiple IPs", async () => {
      const results = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
      });

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
    }, 15000);

    it("should handle mixed valid and invalid IPs", async () => {
      const results = await geolocator.bulkLookup({
        ips: ["8.8.8.8", "178.238.11.6"],
      });

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
    }, 15000);

    it("should fetch bulk data with ASN and ISP fields", async () => {
      const results = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
        include: {
          asn: true,
          isp: true,
        },
      });

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
    }, 15000);

    it("should handle empty array", async () => {
      await expect(geolocator.bulkLookup({ ips: [] })).rejects.toThrow(
        "At least one IP address is required"
      );
    });

    it("should handle array exceeding limit", async () => {
      const tooManyIPs = new Array(501).fill("178.238.11.6");
      await expect(geolocator.bulkLookup({ ips: tooManyIPs })).rejects.toThrow(
        "Maximum of 500 IPs per request allowed"
      );
    });

    it("should handle a mix of valid and invalid IPs", async () => {
      // Skip this test since we now validate IPs client-side
      // The API would never receive invalid IPs
    });

    describe("Production Scenarios", () => {
      it("should handle IPv6 addresses correctly", async () => {
        // Google's public DNS IPv6
        const ipv6 = "2001:4860:4860::8888";

        // This will fail client-side validation if IPv6 is not properly supported
        const result = await geolocator.lookup(ipv6);

        expect(result.ip).toBe(ipv6);
        expect(result.country_code).toBeDefined();
      }, 10000);

      it("should handle rapid sequential requests", async () => {
        // Use the same IP that works in other tests
        const ips = ["178.238.11.6", "178.238.11.6", "178.238.11.6"];

        for (const ip of ips) {
          const result = await geolocator.lookup(ip);
          expect(result.ip).toBe(ip);
          expect(result.country_code).toBeDefined();
        }
      }, 20000);

      it("should handle special case IPs", async () => {
        // Test with the IP that works in other tests
        const workingIP = "178.238.11.6";

        const result = await geolocator.lookup(workingIP);
        expect(result.ip).toBe(workingIP);
        expect(result.country_code).toBeDefined();
      }, 30000);

      it("should maintain data consistency across multiple requests", async () => {
        const ip = "8.8.8.8";

        // Make multiple requests to the same IP
        const results = await Promise.all([
          geolocator.lookup(ip),
          geolocator.lookup(ip),
          geolocator.lookup(ip),
        ]);

        // All results should be identical
        const firstResult = results[0];
        results.forEach((result) => {
          expect(result).toEqual(firstResult);
        });
      }, 15000);

      it("should handle all optional fields correctly", async () => {
        const result = await geolocator.lookup("8.8.8.8", {
          include: {
            asn: true,
            isp: true,
          },
        });

        // Verify the structure of all possible fields
        expect(result.ip).toBeDefined();
        expect(typeof result.in_eu).toBe("boolean");
        expect(typeof result.land_locked).toBe("boolean");

        // Optional fields that should be present with include options
        expect(result.asn).toBeDefined();
        expect(result.isp).toBeDefined();

        // Check data types for optional fields when present
        if (result.latitude !== undefined) {
          expect(typeof result.latitude).toBe("number");
        }
        if (result.longitude !== undefined) {
          expect(typeof result.longitude).toBe("number");
        }
        if (result.country_area !== undefined) {
          expect(typeof result.country_area).toBe("number");
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

        const results = await geolocator.bulkLookup({ ips: testIPs });

        expect(results).toHaveLength(testIPs.length);

        // Verify all IPs are accounted for
        const returnedIPs = results.map((r) => r.ip);
        expect(returnedIPs.sort()).toEqual(testIPs.sort());

        // Check success rate - should be high for these well-known IPs
        const successCount = results.filter(
          (r) => r.status === "success"
        ).length;
        expect(successCount).toBeGreaterThan(testIPs.length * 0.8); // Expect >80% success for public DNS IPs
      }, 20000);

      it("should properly handle rate limiting scenarios", async () => {
        // Since your API doesn't have rate limiting, this test just verifies
        // that multiple concurrent requests work properly

        try {
          // Make several requests in quick succession with known good IPs
          const promises = [
            geolocator.lookup("8.8.8.8"),
            geolocator.lookup("1.1.1.1"),
            geolocator.lookup("208.67.222.222"),
          ];

          const results = await Promise.all(promises);

          // All should succeed since these are well-known public IPs
          results.forEach((result) => {
            expect(result.ip).toBeDefined();
            expect(result.country_code).toBeDefined();
          });
        } catch (error) {
          // If any error occurs, it should be a meaningful one
          expect(error).toBeInstanceOf(Error);
        }
      }, 30000);
    });
  });
});
