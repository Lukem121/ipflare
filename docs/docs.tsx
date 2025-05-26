import { TriangleAlert } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { FaGithub, FaNpm } from "react-icons/fa";
import { urls } from "~/utils/urls";
import { Code } from "../code/code";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { buttonVariants } from "../ui/button";
import {
	initializeCode,
	lookupWithAdditionalFieldsCode,
	typeGuardsCode,
	errorHandlingCode,
	safeAPILookupCode,
	safeBulkLookupCode,
} from "./code/ipflare";
import { Feedback } from "./feedback";

export default function DocsIPFlareNPM({
	API_KEY,
	session,
}: {
	API_KEY: string | undefined;
	session: Session | null;
}) {
	return (
		<div className="text-balance">
			<h1 className="scroll-m-8 text-balance">TypeScript Library</h1>
			<p>
				The <strong className="font-mono">ipflare</strong> npm package offers a
				simple and efficient way to retrieve geolocation information for IP
				addresses using the IP Flare API. The library provides comprehensive
				TypeScript support, robust error handling, and advanced features for
				production applications.
			</p>

			<div className="flex gap-2">
				<Link
					href="https://github.com/Lukem121/ipflare"
					className={buttonVariants({ variant: "ghost", size: "sm" })}
				>
					<FaGithub className="h-4 w-4" />
					GitHub
				</Link>
				<Link
					href="https://www.npmjs.com/package/ipflare"
					className={buttonVariants({ variant: "ghost", size: "sm" })}
				>
					<FaNpm className="h-4 w-4" />
					NPM
				</Link>
			</div>

			{!API_KEY && (
				<Alert className="mt-4">
					<TriangleAlert className="h-4 w-4" />
					<AlertTitle>Notice!</AlertTitle>
					<AlertDescription>
						An API key is required to use this library. Obtain your API key from
						the{" "}
						<Link
							href={
								session?.user.id
									? urls.keys.url
									: urls.signIn.getUrl(urls.keys.url)
							}
							target="_blank"
						>
							API Keys page
						</Link>{" "}
						and include it in the <code>X-API-Key</code> header of your
						requests.
					</AlertDescription>
				</Alert>
			)}

			<h2>Features</h2>
			<ul className="list-disc pl-6 space-y-2">
				<li>
					<strong>Result-based Error Handling</strong>: No try-catch required!
					Structured error types with explicit success/failure states
				</li>
				<li>
					<strong>IPv4 & IPv6 Support</strong>: Comprehensive validation for
					both IPv4 and IPv6 addresses
				</li>
				<li>
					<strong>Type Safety</strong>: Full TypeScript support with type guards
					and discriminated unions
				</li>
				<li>
					<strong>Input Validation</strong>: Client-side validation prevents
					invalid requests and provides immediate feedback
				</li>
				<li>
					<strong>Error Handling</strong>: Specific error messages for different
					scenarios with structured error types
				</li>
				<li>
					<strong>Bulk Operations</strong>: Process up to 500 IP addresses in a
					single request
				</li>
				<li>
					<strong>Configurable</strong>: Custom timeout, base URL, and other
					configuration options
				</li>
				<li>
					<strong>Production Ready</strong>: Comprehensive testing (96%+
					coverage) and enterprise-grade reliability
				</li>
				<li>
					<strong>Backward Compatible</strong>: Traditional API methods still
					available
				</li>
			</ul>

			<h2>Installation</h2>
			<Code
				codeSnippets={[
					{
						label: "npm",
						language: "jsx",
						code: "npm install ipflare",
					},
					{
						label: "yarn",
						language: "jsx",
						code: "yarn add ipflare",
					},
					{
						label: "pnpm",
						language: "jsx",
						code: "pnpm add ipflare",
					},
				]}
				className="w-full"
			/>

			<h2>Quick Start</h2>
			<p>
				After installing the package, you can use it in your JavaScript or
				TypeScript projects to fetch geolocation data with comprehensive error
				handling and type safety.
			</p>

			<h3>Initialize the Client</h3>
			<Code codeSnippets={initializeCode(API_KEY)} className="w-full" />

			<h3>Examples</h3>
			<p>
				The library eliminates try-catch blocks with result-based error handling
				and structured error types.
			</p>

			<h3>Single IP Lookup</h3>
			<p>
				The following example demonstrates IP lookups with automatic validation
				for both IPv4 and IPv6 addresses and structured error information.
			</p>
			<Code codeSnippets={safeAPILookupCode()} className="w-full" />

			<h3>Bulk IP Lookup</h3>
			<p>
				Bulk lookup for multiple IP addresses (up to 500 per request) with
				structured error handling:
			</p>
			<Code codeSnippets={safeBulkLookupCode()} className="w-full" />

			<h3>Lookup with Additional Fields</h3>
			<p>
				To retrieve additional fields like ASN and ISP information, pass the
				include options. Visit the{" "}
				<Link href="/documentation/get-geolocation">Geolocation</Link> page for
				more information about available fields.
			</p>
			<Code
				codeSnippets={lookupWithAdditionalFieldsCode()}
				className="w-full"
			/>

			<h3>Error Handling</h3>
			<p>
				The library provides comprehensive error handling with specific error
				messages for different scenarios. Here's how to handle various error
				conditions:
			</p>
			<Code codeSnippets={errorHandlingCode()} className="w-full" />

			<h3>Type Guards</h3>
			<p>
				The library provides type guard functions to safely work with results
				and discriminate between successful and error responses:
			</p>
			<Code codeSnippets={typeGuardsCode()} className="w-full" />

			<h3>TypeScript Types</h3>
			<p>
				The <strong className="font-mono">ipflare</strong> library provides
				comprehensive TypeScript types for all operations:
			</p>
			<Code
				codeSnippets={[
					{
						label: "TypeScript",
						language: "tsx",
						code: `import {
  IPFlare,
  type BulkLookupOptions,
  type BulkLookupResponse,
  type IPGeolocationError,
  type IPGeolocationOptions,
  type IPGeolocationResponse,
  type IPGeolocationSuccess,
  type LookupOptions,
  // Type guard functions
  isIPGeolocationError,
  isIPGeolocationSuccess,
} from "ipflare";`,
					},
				]}
				className="w-full"
			/>

			<h2>Advanced Features</h2>

			<h3>IPv6 Support</h3>
			<p>
				The library fully supports IPv6 addresses with comprehensive validation:
			</p>
			<Code
				codeSnippets={[
					{
						label: "TypeScript",
						language: "tsx",
						code: `// IPv6 addresses are fully supported
const ipv6Result = await geolocator.lookup("2001:4860:4860::8888");

// Bulk lookup with mixed IPv4 and IPv6
const mixedResults = await geolocator.bulkLookup({
  ips: [
    "8.8.8.8",                           // IPv4
    "2001:4860:4860::8888",              // IPv6
    "::1",                               // IPv6 localhost
    "192.168.1.1"                        // IPv4 private
  ]
});`,
					},
				]}
				className="w-full"
			/>

			<h3>Input Validation</h3>
			<p>
				The library performs comprehensive client-side validation to prevent
				invalid requests and provide immediate feedback:
			</p>
			<Code
				codeSnippets={[
					{
						label: "TypeScript",
						language: "tsx",
						code: `// These will throw validation errors immediately
try {
  await geolocator.lookup("invalid-ip");
} catch (error) {
  console.error(error.message); // "Invalid IP address format: invalid-ip"
}

try {
  await geolocator.bulkLookup({ ips: [] });
} catch (error) {
  console.error(error.message); // "At least one IP address is required"
}

try {
  await geolocator.bulkLookup({ 
    ips: new Array(501).fill("1.1.1.1") 
  });
} catch (error) {
  console.error(error.message); // "Maximum of 500 IPs per request allowed"
}`,
					},
				]}
				className="w-full"
			/>

			<h2>Error Reference</h2>

			<h3>Error Types</h3>
			<p>
				The library provides structured error types that match the actual API
				responses:
			</p>
			<ul className="list-disc pl-6 space-y-1">
				<li>
					<code>INVALID_IP_ADDRESS</code> - Invalid IP address format
				</li>
				<li>
					<code>RESERVED_IP_ADDRESS</code> - IP address is reserved
					(private/local)
				</li>
				<li>
					<code>GEOLOCATION_NOT_FOUND</code> - Geolocation data not available
					for this IP
				</li>
				<li>
					<code>INTERNAL_SERVER_ERROR</code> - Server-side error occurred
				</li>
				<li>
					<code>INVALID_INPUT</code> - Invalid input parameters
				</li>
				<li>
					<code>UNAUTHORIZED</code> - Invalid or missing API key
				</li>
				<li>
					<code>QUOTA_EXCEEDED</code> - API quota exceeded
				</li>
				<li>
					<code>NO_API_KEY_PROVIDED</code> - No API key was provided
				</li>
				<li>
					<code>NETWORK_ERROR</code> - Network connectivity issues
				</li>
				<li>
					<code>VALIDATION_ERROR</code> - Client-side input validation errors
				</li>
				<li>
					<code>UNKNOWN_ERROR</code> - Unexpected errors
				</li>
			</ul>

			<h3>Additional Error Information</h3>
			<p>
				The library also provides specific error messages for different
				scenarios when using the underlying methods:
			</p>
			<ul className="list-disc pl-6 space-y-1">
				<li>
					<code>"API key is required"</code> - No API key provided
				</li>
				<li>
					<code>"API key must be a string"</code> - Invalid API key type
				</li>
				<li>
					<code>"API key cannot be empty"</code> - Empty API key
				</li>
				<li>
					<code>"IP address is required"</code> - No IP address provided
				</li>
				<li>
					<code>"IP address must be a string"</code> - Invalid IP type
				</li>
				<li>
					<code>"Invalid IP address format: [ip]"</code> - Invalid IP format
				</li>
				<li>
					<code>"IPs must be an array"</code> - Invalid bulk IPs type
				</li>
				<li>
					<code>"At least one IP address is required"</code> - Empty IP array
				</li>
				<li>
					<code>"Maximum of 500 IPs per request allowed"</code> - Too many IPs
				</li>
				<li>
					<code>"Invalid IP addresses found: [ips]"</code> - Invalid IPs in bulk
					request
				</li>
				<li>
					<code>"Invalid API key"</code> - HTTP 401 response
				</li>
				<li>
					<code>"Quota exceeded"</code> - HTTP 429 response (usage quota
					exceeded)
				</li>
			</ul>

			<br />
			<Feedback />
		</div>
	);
}
