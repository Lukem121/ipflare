import dedent from "dedent";
import type { CodeSnippet } from "~/components/code/code";
import {
  IPGeolocationsErrorTypeString,
  IPGeolocationsSuccessTypeString,
  IPGeolocationsTypeString,
} from "~/server/api/ip-api/types/bulk-lookup.type";
import {
  IPGeolocationErrorTypeString,
  IPGeolocationTypeString,
} from "~/server/api/ip-api/types/geolocation.type";

export const docsCodeBulkLookup = (apiKey?: string): Array<CodeSnippet> => {
  const secret = apiKey ? `<<SECRET:${apiKey}>>` : "YOUR_API_KEY";

  return [
    {
      label: "JavaScript",
      language: "jsx",
      code: `const res = await fetch("https://api.ipflare.io/bulk-lookup", {
  method: "POST",
  headers: {
    "X-API-Key": '${secret}',
    "Content-Type": "application/json",
  },
  // Max 500 IP's per request - supports both IPv4 and IPv6
  body: JSON.stringify({
    ips: [
      "104.174.125.138",                    // IPv4
      "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", // IPv6
      "8.8.8.8",                           // IPv4 public DNS
      "::1",                               // IPv6 localhost
      ],
    }),
  });

const geoData = await res.json();`,
    },
    {
      label: "TypeScript",
      language: "tsx",
      code:
        `const res = await fetch("https://api.ipflare.io/bulk-lookup", {
  method: "POST",
  headers: {
    "X-API-Key": '${secret}',
    "Content-Type": "application/json",
  },
  // Max 500 IP's per request - supports both IPv4 and IPv6
  body: JSON.stringify({
    ips: [
      "104.174.125.138",                    // IPv4
      "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", // IPv6
      "8.8.8.8",                           // IPv4 public DNS
      "::1",                               // IPv6 localhost
      ],
    }),
  });

  const geoData = await res.json() as IPGeolocations | IPGeolocationError;
  
  if("error" in geoData){
    throw new Error(geoData.error)
  }

  // Process results with proper error handling
  geoData.results.forEach(result => {
    if(result.status === "success"){
      console.log(\`Success for \${result.ip}:\`, result.data);
    } else {
      console.error(\`Error for \${result.ip}: \${result.error_message}\`);
    }
  })
  ` +
        `\n\n ${IPGeolocationsTypeString} \n\n ${IPGeolocationErrorTypeString} \n\n ${IPGeolocationsErrorTypeString} \n\n ${IPGeolocationsSuccessTypeString} \n\n ${IPGeolocationTypeString}`,
    },
    {
      label: "Curl",
      language: "rust",
      code: dedent`curl -X POST "https://api.ipflare.io/bulk-lookup" \\
  -H "X-API-Key: ${secret}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ips": [
      "104.174.125.138",
      "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9",
      "8.8.8.8",
      "::1"
    ]
  }'`,
    },
    {
      label: "Python",
      language: "reason",
      code: dedent`import requests

headers = {
    "X-API-Key": "${secret}",
    "Content-Type": "application/json"
}

# Mix of IPv4 and IPv6 addresses (up to 500 per request)
data = {
    "ips": [
        "104.174.125.138",                    # IPv4
        "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", # IPv6
        "8.8.8.8",                           # IPv4 public DNS
        "::1"                                # IPv6 localhost
    ]
}

response = requests.post(
    'https://api.ipflare.io/bulk-lookup',
    headers=headers,
    json=data
)

geo_data = response.json()

# Process results
for result in geo_data['results']:
    if result['status'] == 'success':
        print(f"Success for {result['ip']}: {result['data']}")
    else:
        print(f"Error for {result['ip']}: {result['error_message']}")
`,
    },
    {
      label: "Ruby",
      language: "reason",
      code: dedent`require 'net/http'
require 'json'
require 'uri'

uri = URI('https://api.ipflare.io/bulk-lookup')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri.path, {
  'X-API-Key' => '${secret}',
  'Content-Type' => 'application/json'
})

# Mix of IPv4 and IPv6 addresses
request.body = {
  ips: [
    '104.174.125.138',                    # IPv4
    '2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9', # IPv6
    '8.8.8.8',                           # IPv4 public DNS
    '::1'                                # IPv6 localhost
  ]
}.to_json

response = http.request(request)
geo_data = JSON.parse(response.body)

# Process results
geo_data['results'].each do |result|
  if result['status'] == 'success'
    puts "Success for #{result['ip']}: #{result['data']}"
  else
    puts "Error for #{result['ip']}: #{result['error_message']}"
  end
end
`,
    },
    {
      label: "Java",
      language: "jsx",
      code: dedent`import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class IPFlareBulkLookup {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        // Mix of IPv4 and IPv6 addresses
        String json = "{ \"ips\": [ " +
            "\"104.174.125.138\", " +
            "\"2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9\", " +
            "\"8.8.8.8\", " +
            "\"::1\" " +
        "] }";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.ipflare.io/bulk-lookup"))
            .header("X-API-Key", "${secret}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String geoData = response.body();
        
        // Process the JSON response to handle success/error results
        System.out.println(geoData);
    }
}
`,
    },
    {
      label: "Go",
      language: "go",
      code: dedent`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

func main() {
    client := &http.Client{}

    // Mix of IPv4 and IPv6 addresses
    data := map[string]interface{}{
        "ips": []string{
            "104.174.125.138",                    // IPv4
            "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", // IPv6
            "8.8.8.8",                           // IPv4 public DNS
            "::1",                               // IPv6 localhost
        },
    }

    jsonData, _ := json.Marshal(data)

    req, _ := http.NewRequest("POST", "https://api.ipflare.io/bulk-lookup", bytes.NewBuffer(jsonData))
    req.Header.Set("X-API-Key", "${secret}")
    req.Header.Set("Content-Type", "application/json")

    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    
    // Parse and process results
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    
    if results, ok := result["results"].([]interface{}); ok {
        for _, item := range results {
            if resultMap, ok := item.(map[string]interface{}); ok {
                ip := resultMap["ip"].(string)
                status := resultMap["status"].(string)
                
                if status == "success" {
                    fmt.Printf("Success for %s\\n", ip)
                } else {
                    errorMsg := resultMap["error_message"].(string)
                    fmt.Printf("Error for %s: %s\\n", ip, errorMsg)
                }
            }
        }
    }
}
`,
    },
    {
      label: "PHP",
      language: "jsx",
      code: dedent`<?php
$apiKey = '${secret}';

// Mix of IPv4 and IPv6 addresses
$data = [
    "ips" => [
        "104.174.125.138",                    // IPv4
        "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", // IPv6
        "8.8.8.8",                           // IPv4 public DNS
        "::1",                               // IPv6 localhost
    ],
];

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://api.ipflare.io/bulk-lookup");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: $apiKey",
    "Content-Type: application/json",
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
curl_close($ch);

$geoData = json_decode($response, true);

// Process results
foreach ($geoData['results'] as $result) {
    if ($result['status'] === 'success') {
        echo "Success for {$result['ip']}: " . json_encode($result['data']) . "\\n";
    } else {
        echo "Error for {$result['ip']}: {$result['error_message']}\\n";
    }
}
?>
`,
    },
    {
      label: "C#",
      language: "jsx",
      code: dedent`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("X-API-Key", "${secret}");

        // Mix of IPv4 and IPv6 addresses
        var data = new
        {
            ips = new string[]
            {
                "104.174.125.138",                    // IPv4
                "2001:fb1:c0:2dfd:8965:bc32:5b49:7ea9", // IPv6
                "8.8.8.8",                           // IPv4 public DNS
                "::1"                                // IPv6 localhost
            }
        };
        var json = JsonSerializer.Serialize(data);

        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api.ipflare.io/bulk-lookup", content);
        var geoData = await response.Content.ReadAsStringAsync();
        
        // Parse and process results
        using (JsonDocument document = JsonDocument.Parse(geoData))
        {
            var results = document.RootElement.GetProperty("results");
            foreach (var result in results.EnumerateArray())
            {
                var ip = result.GetProperty("ip").GetString();
                var status = result.GetProperty("status").GetString();
                
                if (status == "success")
                {
                    Console.WriteLine($"Success for {ip}");
                }
                else
                {
                    var errorMessage = result.GetProperty("error_message").GetString();
                    Console.WriteLine($"Error for {ip}: {errorMessage}");
                }
            }
        }
    }
}
`,
    },
  ];
};
