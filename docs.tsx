import { TriangleAlert } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { FaGithub, FaNpm } from "react-icons/fa";
import { urls } from "~/utils/urls";
import { Code } from "../code/code";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { buttonVariants } from "../ui/button";
import {
	bulkIPLookupCode,
	initializeCode,
	lookupWithAdditionalFieldsCode,
	singleIPLookupCode,
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
				addresses using the IP Flare API.
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

			<h2>Installation</h2>
			<Code
				codeSnippets={[
					{
						label: "Bash",
						language: "jsx",
						code: "npm install ipflare",
					},
				]}
				className="w-full"
			/>

			<h2>Usage</h2>
			<p>
				After installing the package, you can use it in your JavaScript or
				TypeScript projects to fetch geolocation data.
			</p>

			<h3>Initialize the Client</h3>
			<Code codeSnippets={initializeCode(API_KEY)} className="w-full" />

			<h3>Examples</h3>
			<p>
				Once the client is initialized, you can use it to fetch geolocation data
				within your application. Below are some examples of how to use the
				client to retrieve geolocation information.
			</p>
			<h3>Single IP Lookup</h3>
			<p>
				The following example demonstrates how to use the client to fetch
				geolocation data for a single IP address.
			</p>
			<Code codeSnippets={singleIPLookupCode()} className="w-full" />

			<h3>Lookup with Additional Fields</h3>
			<p>
				To retrieve additional fields, pass an array of desired fields. Visit
				the <Link href="/documentation/get-geolocation">Geolocation</Link> page
				for more information.
			</p>
			<Code
				codeSnippets={lookupWithAdditionalFieldsCode()}
				className="w-full"
			/>

			<h3>Bulk IP Lookup</h3>
			<p>
				The following example demonstrates how to use the client to fetch
				geolocation data for multiple IP addresses. Note the results may not
				correspond in order to the input list.
			</p>
			<Code codeSnippets={bulkIPLookupCode()} className="w-full" />

			<h3>TypeScript Types</h3>
			<p>
				The <strong className="font-mono">ipflare</strong> library provides the
				following types to ensure correct data handling:
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
} from "ipflare";`,
					},
				]}
				className="w-full"
			/>
			<br />
			<Feedback />
		</div>
	);
}
