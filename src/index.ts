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
   * @returns Promise with geolocation data
   * @throws Error if IP address is not provided or invalid, or if the API request fails
   */
  async lookup(
    ip: string,
    options: LookupOptions = {}
  ): Promise<IPGeolocationResponse> {
    if (!ip) {
      throw new Error("IP address is required");
    }

    if (typeof ip !== "string") {
      throw new TypeError("IP address must be a string");
    }

    const trimmedIP = ip.trim();
    if (!this.isValidIP(trimmedIP)) {
      throw new Error(`Invalid IP address format: ${ip}`);
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
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API key");
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded");
        }
      }
      throw new Error("Failed to fetch geolocation data");
    }
  }

  /**
   * Get geolocation data for multiple IP addresses
   * @param options - Options for bulk lookup including IPs array and additional fields
   * @returns Promise with array of geolocation data or errors
   * @throws Error if IPs array is empty or exceeds 500 items, or if the API request fails
   */
  async bulkLookup(options: BulkLookupOptions): Promise<BulkLookupResponse> {
    const { ips, include } = options;

    if (!Array.isArray(ips)) {
      throw new TypeError("IPs must be an array");
    }

    if (!ips.length) {
      throw new Error("At least one IP address is required");
    }

    if (ips.length > 500) {
      throw new Error("Maximum of 500 IPs per request allowed");
    }

    // Validate all IPs
    const invalidIPs = ips.filter((ip) => {
      if (typeof ip !== "string") return true;
      return !this.isValidIP(ip.trim());
    });

    if (invalidIPs.length > 0) {
      throw new Error(`Invalid IP addresses found: ${invalidIPs.join(", ")}`);
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
        throw new Error("Invalid response format from API");
      }

      return response.data.results;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid API key");
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded");
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch bulk geolocation data");
    }
  }
}
