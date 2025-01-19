import axios, { AxiosInstance, AxiosError } from "axios";

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

export class IPFlare {
  private client: AxiosInstance;
  private readonly apiKey: string;

  constructor(options: IPGeolocationOptions) {
    if (!options.apiKey) {
      throw new Error("API key is required");
    }

    this.apiKey = options.apiKey;
    this.client = axios.create({
      baseURL: options.baseURL || "https://api.ipflare.io",
      timeout: 10000,
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
  }

  /**
   * Get geolocation data for a single IP address
   * @param ip - IP address to lookup
   * @param options - Additional options for the lookup
   * @returns Promise with geolocation data
   * @throws Error if IP address is not provided or if the API request fails
   */
  async lookup(
    ip: string,
    options: LookupOptions = {}
  ): Promise<IPGeolocationResponse> {
    if (!ip) {
      throw new Error("IP address is required");
    }

    try {
      const params: Record<string, string> = {};
      const fields: string[] = [];

      if (options.include?.asn) fields.push("asn");
      if (options.include?.isp) fields.push("isp");

      if (fields.length > 0) {
        params.fields = fields.join(",");
      }

      const response = await this.client.get(`/${ip}`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw new Error(
          error.response.data.error || "Failed to fetch geolocation data"
        );
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

    if (!ips.length) {
      throw new Error("At least one IP address is required");
    }
    if (ips.length > 500) {
      throw new Error("Maximum of 500 IPs per request allowed");
    }

    try {
      const params: Record<string, string> = {};
      const fields: string[] = [];

      if (include?.asn) fields.push("asn");
      if (include?.isp) fields.push("isp");

      if (fields.length > 0) {
        params.fields = fields.join(",");
      }

      const response = await this.client.post(
        "/bulk-lookup",
        { ips },
        { params }
      );
      return response.data.results;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw new Error(
          error.response.data.error || "Failed to fetch bulk geolocation data"
        );
      }
      throw new Error("Failed to fetch bulk geolocation data");
    }
  }
}
