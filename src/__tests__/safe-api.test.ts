import { IPFlare, isSuccess, isError } from "../index";

// Mock axios to avoid real API calls in tests
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

describe("IPFlare Safe API", () => {
  let ipflare: IPFlare;
  let mockClient: {
    get: jest.Mock;
    post: jest.Mock;
  };

  beforeEach(() => {
    const axios = require("axios");
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
    };
    axios.create.mockReturnValue(mockClient);

    ipflare = new IPFlare({ apiKey: "test-api-key" });
  });

  describe("Type Guards", () => {
    it("should correctly identify success results", () => {
      const successResult = {
        ok: true as const,
        data: { ip: "8.8.8.8", in_eu: false, land_locked: false },
      };

      expect(isSuccess(successResult)).toBe(true);
      expect(isError(successResult)).toBe(false);
    });

    it("should correctly identify error results", () => {
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

  describe("safeLookup", () => {
    it("should return error for missing IP", async () => {
      const result = await ipflare.safeLookup("");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IP address is required");
      }
    });

    it("should return error for invalid IP", async () => {
      const result = await ipflare.safeLookup("invalid-ip");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toContain("Invalid IP address format");
      }
    });

    it("should return error for non-string IP", async () => {
      const result = await ipflare.safeLookup(123 as unknown as string);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IP address must be a string");
      }
    });

    it("should return success for valid IPv4", async () => {
      const mockResponse = {
        data: {
          ip: "8.8.8.8",
          city: "Mountain View",
          country_name: "United States",
          latitude: 37.4056,
          longitude: -122.0775,
          in_eu: false,
          land_locked: false,
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.ip).toBe("8.8.8.8");
        expect(result.data.city).toBe("Mountain View");
        expect(result.data.country_name).toBe("United States");
      }
    });

    it("should return success for valid IPv6", async () => {
      const mockResponse = {
        data: {
          ip: "2001:4860:4860::8888",
          city: "Mountain View",
          country_name: "United States",
          in_eu: false,
          land_locked: false,
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await ipflare.safeLookup("2001:4860:4860::8888");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.ip).toBe("2001:4860:4860::8888");
      }
    });

    it("should include ASN and ISP fields when requested", async () => {
      const mockResponse = {
        data: {
          ip: "8.8.8.8",
          city: "Mountain View",
          country_name: "United States",
          in_eu: false,
          land_locked: false,
          asn: "AS15169",
          isp: "Google LLC",
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await ipflare.safeLookup("8.8.8.8", {
        include: { asn: true, isp: true },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.asn).toBe("AS15169");
        expect(result.data.isp).toBe("Google LLC");
      }

      expect(mockClient.get).toHaveBeenCalledWith("/8.8.8.8", {
        params: { fields: "asn,isp" },
      });
    });

    it("should handle 401 unauthorized error", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 401,
          data: { error: "Invalid API key" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNAUTHORIZED");
        expect(result.error.message).toBe("Invalid API key");
        expect(result.error.details).toEqual({ error: "Invalid API key" });
      }
    });

    it("should handle 429 quota exceeded error", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 429,
          data: { error: "Quota exceeded" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
        expect(result.error.message).toBe("Quota exceeded");
      }
    });

    it("should handle 500 internal server error", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 500,
          data: { error: "Internal server error" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INTERNAL_SERVER_ERROR");
        expect(result.error.message).toBe("Internal server error");
      }
    });

    it("should map API error for invalid IP", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 400,
          data: { error: "invalid ip address provided" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toBe("invalid ip address provided");
      }
    });

    it("should map API error for reserved IP", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 400,
          data: { error: "reserved ip address" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("192.168.1.1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("RESERVED_IP_ADDRESS");
        expect(result.error.message).toBe("reserved ip address");
      }
    });

    it("should map API error for geolocation not found", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 404,
          data: { error: "geolocation not found for this ip" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("GEOLOCATION_NOT_FOUND");
        expect(result.error.message).toBe("geolocation not found for this ip");
      }
    });

    it("should map API error for no API key", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 400,
          data: { error: "no api key provided" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("NO_API_KEY_PROVIDED");
        expect(result.error.message).toBe("no api key provided");
      }
    });

    it("should map API error for invalid input", async () => {
      const axios = require("axios");
      const mockError = {
        response: {
          status: 400,
          data: { error: "invalid input parameters" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.get.mockRejectedValue(mockError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("invalid input parameters");
      }
    });

    it("should handle unknown errors", async () => {
      const axios = require("axios");
      const unknownError = new Error("Something unexpected happened");

      axios.isAxiosError.mockReturnValue(false);
      mockClient.get.mockRejectedValue(unknownError);

      const result = await ipflare.safeLookup("8.8.8.8");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNKNOWN_ERROR");
        expect(result.error.message).toBe("An unexpected error occurred");
        expect(result.error.details).toBe(unknownError);
      }
    });
  });

  describe("safeBulkLookup", () => {
    it("should return error for non-array IPs", async () => {
      const result = await ipflare.safeBulkLookup({
        ips: "not-an-array" as unknown as string[],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("IPs must be an array");
      }
    });

    it("should return error for empty IPs array", async () => {
      const result = await ipflare.safeBulkLookup({ ips: [] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe(
          "At least one IP address is required"
        );
      }
    });

    it("should return error for too many IPs", async () => {
      const ips = Array(501).fill("8.8.8.8");
      const result = await ipflare.safeBulkLookup({ ips });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_INPUT");
        expect(result.error.message).toBe(
          "Maximum of 500 IPs per request allowed"
        );
      }
    });

    it("should return error for invalid IPs in array", async () => {
      const result = await ipflare.safeBulkLookup({
        ips: ["8.8.8.8", "invalid-ip", "1.1.1.1"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toContain("Invalid IP addresses found");
        expect(result.error.details).toEqual({ invalidIPs: ["invalid-ip"] });
      }
    });

    it("should return error for non-string IPs in array", async () => {
      const result = await ipflare.safeBulkLookup({
        ips: ["8.8.8.8", 123 as unknown as string, "1.1.1.1"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INVALID_IP_ADDRESS");
        expect(result.error.message).toContain("Invalid IP addresses found");
      }
    });

    it("should return success for valid bulk lookup", async () => {
      const mockResponse = {
        data: {
          results: [
            {
              ip: "8.8.8.8",
              status: "success",
              data: {
                ip: "8.8.8.8",
                city: "Mountain View",
                country_name: "United States",
                in_eu: false,
                land_locked: false,
              },
            },
            {
              ip: "1.1.1.1",
              status: "success",
              data: {
                ip: "1.1.1.1",
                city: "San Francisco",
                country_name: "United States",
                in_eu: false,
                land_locked: false,
              },
            },
          ],
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await ipflare.safeBulkLookup({
        ips: ["8.8.8.8", "1.1.1.1"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].status).toBe("success");
        expect(result.data[1].status).toBe("success");
      }
    });

    it("should include fields in bulk lookup", async () => {
      const mockResponse = {
        data: {
          results: [
            {
              ip: "8.8.8.8",
              status: "success",
              data: {
                ip: "8.8.8.8",
                city: "Mountain View",
                country_name: "United States",
                in_eu: false,
                land_locked: false,
                asn: "AS15169",
                isp: "Google LLC",
              },
            },
          ],
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await ipflare.safeBulkLookup({
        ips: ["8.8.8.8"],
        include: { asn: true, isp: true },
      });

      expect(result.ok).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/bulk-lookup",
        { ips: ["8.8.8.8"] },
        { params: { fields: "asn,isp" } }
      );
    });

    it("should handle invalid response format", async () => {
      const mockResponse = {
        data: {
          // Missing results or invalid format
          invalid: "response",
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await ipflare.safeBulkLookup({
        ips: ["8.8.8.8"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INTERNAL_SERVER_ERROR");
        expect(result.error.message).toBe("Invalid response format from API");
      }
    });

    it("should handle all error scenarios in bulk lookup", async () => {
      const axios = require("axios");

      // Test 401 error
      let mockError = {
        response: {
          status: 401,
          data: { error: "Invalid API key" },
        },
      };

      axios.isAxiosError.mockReturnValue(true);
      mockClient.post.mockRejectedValue(mockError);

      let result = await ipflare.safeBulkLookup({ ips: ["8.8.8.8"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNAUTHORIZED");
      }

      // Test 429 error
      mockError = {
        response: {
          status: 429,
          data: { error: "Quota exceeded" },
        },
      };
      mockClient.post.mockRejectedValue(mockError);

      result = await ipflare.safeBulkLookup({ ips: ["8.8.8.8"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("QUOTA_EXCEEDED");
      }

      // Test 500 error
      mockError = {
        response: {
          status: 500,
          data: { error: "Internal server error" },
        },
      };
      mockClient.post.mockRejectedValue(mockError);

      result = await ipflare.safeBulkLookup({ ips: ["8.8.8.8"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("INTERNAL_SERVER_ERROR");
      }

      // Test API error mapping
      mockError = {
        response: {
          status: 400,
          data: { error: "reserved ip address detected" },
        },
      };
      mockClient.post.mockRejectedValue(mockError);

      result = await ipflare.safeBulkLookup({ ips: ["192.168.1.1"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("RESERVED_IP_ADDRESS");
      }

      // Test API error with unknown message (falls back to UNKNOWN_ERROR)
      mockError = {
        response: {
          status: 400,
          data: { error: "some unknown error message" },
        },
      };
      mockClient.post.mockRejectedValue(mockError);

      result = await ipflare.safeBulkLookup({ ips: ["8.8.8.8"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNKNOWN_ERROR");
      }

      // Test unknown error
      const unknownError = new Error("Something unexpected");
      axios.isAxiosError.mockReturnValue(false);
      mockClient.post.mockRejectedValue(unknownError);

      result = await ipflare.safeBulkLookup({ ips: ["8.8.8.8"] });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("UNKNOWN_ERROR");
      }
    });
  });
});
