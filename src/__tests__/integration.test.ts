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
        ips: ["invalid-ip", "178.238.11.6"],
      });

      expect(results).toHaveLength(2);

      const invalidIPResult = results.find((r) => r.ip === "invalid-ip");
      if (invalidIPResult) {
        if (invalidIPResult.status === "error") {
          expect(invalidIPResult.error_message).toBeDefined();
        } else {
          // Handle unexpected success status
          console.warn(
            `Unexpected success status for IP: ${invalidIPResult.ip}`
          );
        }
      } else {
        throw new Error("Result for 'invalid-ip' not found");
      }

      const validIPResult = results.find((r) => r.ip === "178.238.11.6");
      if (validIPResult) {
        expect(validIPResult.status).toBe("success");
        expect(validIPResult.ip).toBe("178.238.11.6");
      } else {
        throw new Error("Result for '178.238.11.6' not found");
      }
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
      const result = await geolocator.bulkLookup({
        ips: [
          "104.174.125.138",
          "not_a_valid_IP",
          "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
        ],
      });

      // Validate the response structure
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);

      // Find results by IP address
      const result1 = result.find((r) => r.ip === "104.174.125.138");
      const result2 = result.find((r) => r.ip === "not_a_valid_IP");
      const result3 = result.find(
        (r) => r.ip === "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9"
      );

      // Check the first IP (valid)
      if (result1 && result1.status === "success") {
        expect(result1.data).toBeDefined();
      } else if (result1) {
        throw new Error(`Expected success status for IP: ${result1.ip}`);
      } else {
        throw new Error("Result for '104.174.125.138' not found");
      }

      // Check the second IP (invalid)
      if (result2 && result2.status === "error") {
        expect(result2.error_message).toBeDefined();
      } else if (result2) {
        // Handle unexpected success status
        console.warn(`Unexpected success status for IP: ${result2.ip}`);
      } else {
        throw new Error("Result for 'not_a_valid_IP' not found");
      }

      // Check the third IP (valid)
      if (result3 && result3.status === "success") {
        expect(result3.data).toBeDefined();
      } else if (result3) {
        throw new Error(`Expected success status for IP: ${result3.ip}`);
      } else {
        throw new Error(
          "Result for '2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9' not found"
        );
      }
    }, 15000);
  });
});
