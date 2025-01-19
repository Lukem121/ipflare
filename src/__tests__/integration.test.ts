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

      // Check if the first result is an error or success
      if (results[0].status === "error") {
        expect(results[0].ip).toBe("invalid-ip");
      } else {
        expect(results[0].status).toBe("success");
      }

      // Valid IP should return success
      expect(results[1].status).toBe("success");
      expect(results[1].ip).toBe("178.238.11.6");
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
  });
});
