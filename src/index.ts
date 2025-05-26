import axios, { type AxiosInstance, AxiosError } from "axios";

export interface IPGeolocationResponse {
  ip: string;
  version?: string;
  city?: string;
  region?: string;
  region_code?: string;
  country_code?: string;
  country_code_iso3?: string;
  country_fifa_code?: string;
  country_fips_code?: string;
  country_name?: string;
  country_capital?: string;
  country_tld?: string;
  country_emoji?: string;
  continent_code?: string;
  in_eu: boolean;
  land_locked: boolean;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  currency_name?: string;
  languages?: string;
  country_area?: number;
  asn?: string;
  isp?: string;
}

export interface IPGeolocationError {
  error_message: string;
  ip: string;
  status: "error";
}

export interface IPGeolocationSuccess {
  ip: string;
  status: "success";
  data: IPGeolocationResponse;
}

export type BulkLookupResponse = (IPGeolocationSuccess | IPGeolocationError)[];

// New Result Types for improved error handling
export type ErrorType =
  | "INVALID_IP_ADDRESS"
  | "RESERVED_IP_ADDRESS"
  | "GEOLOCATION_NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "QUOTA_EXCEEDED"
  | "NO_API_KEY_PROVIDED"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export interface ResultError {
  type: ErrorType;
  message: string;
  details?: unknown;
}

export interface SuccessResult<T> {
  ok: true;
  data: T;
}

export interface ErrorResult {
  ok: false;
  error: ResultError;
}

export type Result<T> = SuccessResult<T> | ErrorResult;

// Type guards for new result types
export function isSuccess<T>(result: Result<T>): result is SuccessResult<T> {
  return result.ok === true;
}

export function isError<T>(result: Result<T>): result is ErrorResult {
  return result.ok === false;
}

export interface IPGeolocationOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface LookupOptions {
  /**
   * Include additional fields in the response
   */
  include?: {
    asn?: boolean;
    isp?: boolean;
  };
}

export interface BulkLookupOptions extends LookupOptions {
  /**
   * Array of IP addresses to lookup (max 500)
   */
  ips: string[];
}

// Type guard for error responses
export function isIPGeolocationError(
  response: IPGeolocationSuccess | IPGeolocationError
): response is IPGeolocationError {
  return response.status === "error";
}

// Type guard for success responses
export function isIPGeolocationSuccess(
  response: IPGeolocationSuccess | IPGeolocationError
): response is IPGeolocationSuccess {
  return response.status === "success";
}

// IP validation regex patterns
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export class IPFlare {
  private client: AxiosInstance;
  private readonly apiKey: string;

  constructor(options: IPGeolocationOptions) {
    if (!options.apiKey) {
      throw new Error("API key is required");
    }

    if (typeof options.apiKey !== "string") {
      throw new TypeError("API key must be a string");
    }

    if (options.apiKey.trim().length === 0) {
      throw new Error("API key cannot be empty");
    }

    this.apiKey = options.apiKey;
    this.client = axios.create({
      baseURL: options.baseURL || "https://api.ipflare.io",
      timeout: options.timeout || 10000,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Validates if a string is a valid IP address (IPv4 or IPv6)
   * @param ip - IP address to validate
   * @returns true if valid IP address
   */
  private isValidIP(ip: string): boolean {
    return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
  }

  /**
   * Get geolocation data for a single IP address
   * @param ip - IP address to lookup
   * @param options - Additional options for the lookup
   * @returns Promise with Result containing geolocation data or error
   */
  async lookup(
    ip: string,
    options: LookupOptions = {}
  ): Promise<Result<IPGeolocationResponse>> {
    // Validation checks
    if (!ip) {
      return {
        ok: false,
        error: {
          type: "INVALID_INPUT",
          message: "IP address is required",
        },
      };
    }

    if (typeof ip !== "string") {
      return {
        ok: false,
        error: {
          type: "INVALID_INPUT",
          message: "IP address must be a string",
        },
      };
    }

    const trimmedIP = ip.trim();

    // Check if the IP contains control characters or non-space whitespace
    if (
      ip.includes("\n") ||
      ip.includes("\r") ||
      ip.includes("\t") ||
      ip.includes("\0")
    ) {
      return {
        ok: false,
        error: {
          type: "INVALID_IP_ADDRESS",
          message: `Invalid IP address format: ${ip}`,
        },
      };
    }

    if (!this.isValidIP(trimmedIP)) {
      return {
        ok: false,
        error: {
          type: "INVALID_IP_ADDRESS",
          message: `Invalid IP address format: ${ip}`,
        },
      };
    }

    try {
      const params: Record<string, string> = {};
      const fields: string[] = [];

      if (options.include?.asn) fields.push("asn");
      if (options.include?.isp) fields.push("isp");

      if (fields.length > 0) {
        params.fields = fields.join(",");
      }

      const response = await this.client.get<IPGeolocationResponse>(
        `/${trimmedIP}`,
        { params }
      );

      return {
        ok: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            ok: false,
            error: {
              type: "UNAUTHORIZED",
              message: "Invalid API key",
              details: error.response.data,
            },
          };
        }
        if (error.response?.status === 429) {
          return {
            ok: false,
            error: {
              type: "QUOTA_EXCEEDED",
              message: "Quota exceeded",
              details: error.response.data,
            },
          };
        }
        if (error.response?.status === 500) {
          return {
            ok: false,
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Internal server error",
              details: error.response.data,
            },
          };
        }
        if (error.response?.data?.error) {
          // Map API error messages to appropriate error types
          const apiError = error.response.data.error;
          let errorType: ErrorType = "UNKNOWN_ERROR";

          if (apiError.includes("invalid") && apiError.includes("ip")) {
            errorType = "INVALID_IP_ADDRESS";
          } else if (apiError.includes("reserved")) {
            errorType = "RESERVED_IP_ADDRESS";
          } else if (
            apiError.includes("geolocation") ||
            apiError.includes("not found")
          ) {
            errorType = "GEOLOCATION_NOT_FOUND";
          } else if (apiError.includes("api key")) {
            errorType = "NO_API_KEY_PROVIDED";
          } else if (apiError.includes("input")) {
            errorType = "INVALID_INPUT";
          }

          return {
            ok: false,
            error: {
              type: errorType,
              message: apiError,
              details: error.response.data,
            },
          };
        }
        return {
          ok: false,
          error: {
            type: "NETWORK_ERROR",
            message: "Network error occurred",
            details: {
              status: error.response?.status,
              statusText: error.response?.statusText,
            },
          },
        };
      }
      return {
        ok: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "An unexpected error occurred",
          details: error,
        },
      };
    }
  }

  /**
   * Get geolocation data for multiple IP addresses
   * @param options - Options for bulk lookup including IPs array and additional fields
   * @returns Promise with Result containing array of geolocation data or error
   */
  async bulkLookup(
    options: BulkLookupOptions
  ): Promise<Result<BulkLookupResponse>> {
    const { ips, include } = options;

    // Validation checks
    if (!Array.isArray(ips)) {
      return {
        ok: false,
        error: {
          type: "INVALID_INPUT",
          message: "IPs must be an array",
        },
      };
    }

    if (!ips.length) {
      return {
        ok: false,
        error: {
          type: "INVALID_INPUT",
          message: "At least one IP address is required",
        },
      };
    }

    if (ips.length > 500) {
      return {
        ok: false,
        error: {
          type: "INVALID_INPUT",
          message: "Maximum of 500 IPs per request allowed",
        },
      };
    }

    // Validate all IPs
    const invalidIPs = ips.filter((ip) => {
      if (typeof ip !== "string") return true;
      const trimmedIP = ip.trim();
      // Check if IP contains control characters or is invalid format
      const hasControlChars =
        ip.includes("\n") ||
        ip.includes("\r") ||
        ip.includes("\t") ||
        ip.includes("\0");
      return hasControlChars || !this.isValidIP(trimmedIP);
    });

    if (invalidIPs.length > 0) {
      return {
        ok: false,
        error: {
          type: "INVALID_IP_ADDRESS",
          message: `Invalid IP addresses found: ${invalidIPs.join(", ")}`,
          details: { invalidIPs },
        },
      };
    }

    try {
      const params: Record<string, string> = {};
      const fields: string[] = [];

      if (include?.asn) fields.push("asn");
      if (include?.isp) fields.push("isp");

      if (fields.length > 0) {
        params.fields = fields.join(",");
      }

      const trimmedIPs = ips.map((ip) => ip.trim());
      const response = await this.client.post<{ results: BulkLookupResponse }>(
        "/bulk-lookup",
        { ips: trimmedIPs },
        { params }
      );

      if (!response.data.results || !Array.isArray(response.data.results)) {
        return {
          ok: false,
          error: {
            type: "INTERNAL_SERVER_ERROR",
            message: "Invalid response format from API",
            details: response.data,
          },
        };
      }

      return {
        ok: true,
        data: response.data.results,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            ok: false,
            error: {
              type: "UNAUTHORIZED",
              message: "Invalid API key",
              details: error.response.data,
            },
          };
        }
        if (error.response?.status === 429) {
          return {
            ok: false,
            error: {
              type: "QUOTA_EXCEEDED",
              message: "Quota exceeded",
              details: error.response.data,
            },
          };
        }
        if (error.response?.status === 500) {
          return {
            ok: false,
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Internal server error",
              details: error.response.data,
            },
          };
        }
        if (error.response?.data?.error) {
          // Map API error messages to appropriate error types
          const apiError = error.response.data.error;
          let errorType: ErrorType = "UNKNOWN_ERROR";

          if (apiError.includes("invalid") && apiError.includes("ip")) {
            errorType = "INVALID_IP_ADDRESS";
          } else if (apiError.includes("reserved")) {
            errorType = "RESERVED_IP_ADDRESS";
          } else if (
            apiError.includes("geolocation") ||
            apiError.includes("not found")
          ) {
            errorType = "GEOLOCATION_NOT_FOUND";
          } else if (apiError.includes("api key")) {
            errorType = "NO_API_KEY_PROVIDED";
          } else if (apiError.includes("input")) {
            errorType = "INVALID_INPUT";
          }

          return {
            ok: false,
            error: {
              type: errorType,
              message: apiError,
              details: error.response.data,
            },
          };
        }
        return {
          ok: false,
          error: {
            type: "NETWORK_ERROR",
            message: "Network error occurred",
            details: {
              status: error.response?.status,
              statusText: error.response?.statusText,
            },
          },
        };
      }
      return {
        ok: false,
        error: {
          type: "UNKNOWN_ERROR",
          message: "An unexpected error occurred",
          details: error,
        },
      };
    }
  }
}
