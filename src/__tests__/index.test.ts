import axios from "axios";
import { IPFlare, IPGeolocationResponse, BulkLookupResponse } from "../index";

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
      expect(() => new IPFlare({} as any)).toThrow("API key is required");
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
  });
});
