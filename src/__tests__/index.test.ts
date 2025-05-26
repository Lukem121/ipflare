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

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `/${encodeURIComponent(ipv6)}`,
        {
          params: {},
        }
      );
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
});
