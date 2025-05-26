import axios from "axios";
import {
  IPFlare,
  type IPGeolocationResponse,
  type BulkLookupResponse,
  type IPGeolocationOptions,
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

    it("should create instance with custom baseURL", () => {
      const customBaseURL = "https://custom.api.com";
      new IPFlare({ apiKey: mockApiKey, baseURL: customBaseURL });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: customBaseURL,
        timeout: 10000,
        headers: {
          "X-API-Key": mockApiKey,
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

    it("should fetch geolocation data for valid IP", async () => {
      const result = await geolocator.lookup("178.238.11.6");

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

    it("should handle API errors", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).response = {
        data: { error: "Invalid IP address" },
        status: 400,
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(geolocator.lookup("invalid-ip")).rejects.toThrow(
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

    it("should handle API errors in bulk request", async () => {
      const errorResponse = new Error("API Error");
      (errorResponse as any).response = {
        data: { error: "Quota exceeded" },
        status: 429,
      };
      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(
        geolocator.bulkLookup({ ips: ["178.238.11.6"] })
      ).rejects.toThrow("Failed to fetch bulk geolocation data");
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

      const result = await geolocator.bulkLookup({
        ips: [
          "104.174.125.138",
          "not_a_valid_IP",
          "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
        ],
      });

      const result1 = result.find((r) => r.ip === "178.238.11.6");
      const result2 = result.find((r) => r.ip === "invalid-ip");

      // Check the first IP (valid)
      if (result1 && result1.status === "success") {
        expect(result1.data).toBeDefined();
      }

      // Check the second IP (invalid)
      if (result2 && result2.status === "error") {
        expect(result2.error_message).toBeDefined();
      } else if (result2) {
        // Handle unexpected success status
        console.warn(`Unexpected success status for IP: ${result2.ip}`);
      }

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        {
          ips: [
            "104.174.125.138",
            "not_a_valid_IP",
            "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
          ],
        },
        { params: {} }
      );
    });
  });
});
