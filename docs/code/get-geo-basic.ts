import dedent from "dedent";
import type { CodeSnippet } from "~/components/code/code";
import {
  IPGeolocationErrorTypeString,
  IPGeolocationTypeString,
} from "~/server/api/ip-api/types/geolocation.type";

export const docsCodeBasic = (apiKey?: string): Array<CodeSnippet> => {
  const secret = apiKey ? `<<SECRET:${apiKey}>>` : "YOUR_API_KEY";
  return [
    {
      label: "JavaScript",
      language: "jsx",
      code: dedent`// IPv4 lookup
      const res = await fetch('https://api.ipflare.io/84.17.50.173', {
        method: 'GET',
        headers: {
          'X-API-Key': '${secret}'
        }
      });
      
      const geoData = await res.json();
      
      // IPv6 lookup (fully supported)
      const ipv6Res = await fetch('https://api.ipflare.io/2001:4860:4860::8888', {
        method: 'GET',
        headers: {
          'X-API-Key': '${secret}'
        }
      });
      
      const ipv6GeoData = await ipv6Res.json();
      `,
    },
    {
      label: "TypeScript",
      language: "tsx",
      code:
        dedent`// IPv4 lookup
        const res = await fetch('https://api.ipflare.io/84.17.50.173', {
        method: 'GET',
        headers: {
          'X-API-Key': '${secret}'
        }
      });
      
      const geoData = await res.json() as IPGeolocation | IPGeolocationError;
      
      // IPv6 lookup (fully supported)
      const ipv6Res = await fetch('https://api.ipflare.io/2001:4860:4860::8888', {
        method: 'GET',
        headers: {
          'X-API-Key': '${secret}'
        }
      });
      
      const ipv6GeoData = await ipv6Res.json() as IPGeolocation | IPGeolocationError;` +
        `\n\n ${IPGeolocationTypeString} \n\n ${IPGeolocationErrorTypeString}`,
    },
    {
      label: "Curl",
      language: "rust",
      code: dedent`# IPv4 lookup
      curl -H "X-API-Key: ${secret}" https://api.ipflare.io/84.17.50.173
      
      # IPv6 lookup (fully supported)
      curl -H "X-API-Key: ${secret}" https://api.ipflare.io/2001:4860:4860::8888`,
    },
    {
      label: "Python",
      language: "reason",
      code: dedent`import requests

# IPv4 lookup
response = requests.get(
    'https://api.ipflare.io/84.17.50.173',
    headers={'X-API-Key': '${secret}'}
)

geo_data = response.json()
print("IPv4 result:", geo_data)

# IPv6 lookup (fully supported)
ipv6_response = requests.get(
    'https://api.ipflare.io/2001:4860:4860::8888',
    headers={'X-API-Key': '${secret}'}
)

ipv6_geo_data = ipv6_response.json()
print("IPv6 result:", ipv6_geo_data)
`,
    },
    {
      label: "Ruby",
      language: "reason",
      code: dedent`require 'net/http'
require 'json'

# IPv4 lookup
uri = URI('https://api.ipflare.io/84.17.50.173')
request = Net::HTTP::Get.new(uri)
request['X-API-Key'] = '${secret}'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

geo_data = JSON.parse(response.body)
puts "IPv4 result: #{geo_data}"

# IPv6 lookup (fully supported)
ipv6_uri = URI('https://api.ipflare.io/2001:4860:4860::8888')
ipv6_request = Net::HTTP::Get.new(ipv6_uri)
ipv6_request['X-API-Key'] = '${secret}'

ipv6_response = Net::HTTP.start(ipv6_uri.hostname, ipv6_uri.port, use_ssl: true) do |http|
  http.request(ipv6_request)
end

ipv6_geo_data = JSON.parse(ipv6_response.body)
puts "IPv6 result: #{ipv6_geo_data}"
`,
    },
    {
      label: "Java",
      language: "jsx",
      code: dedent`import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class IPFlareExample {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        // IPv4 lookup
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.ipflare.io/84.17.50.173"))
            .header("X-API-Key", "${secret}")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        String geoData = response.body();
        System.out.println("IPv4 result: " + geoData);
        
        // IPv6 lookup (fully supported)
        HttpRequest ipv6Request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.ipflare.io/2001:4860:4860::8888"))
            .header("X-API-Key", "${secret}")
            .GET()
            .build();

        HttpResponse<String> ipv6Response = client.send(ipv6Request, HttpResponse.BodyHandlers.ofString());
        String ipv6GeoData = ipv6Response.body();
        System.out.println("IPv6 result: " + ipv6GeoData);
    }
}
`,
    },
    {
      label: "Go",
      language: "go",
      code: dedent`package main

import (
    "net/http"
    "io/ioutil"
    "log"
    "fmt"
)

func main() {
    client := &http.Client{}
    
    // IPv4 lookup
    req, err := http.NewRequest("GET", "https://api.ipflare.io/84.17.50.173", nil)
    if err != nil {
        log.Fatal(err)
    }
    req.Header.Add("X-API-Key", "${secret}")

    resp, err := client.Do(req)
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("IPv4 result:", string(body))
    
    // IPv6 lookup (fully supported)
    ipv6Req, err := http.NewRequest("GET", "https://api.ipflare.io/2001:4860:4860::8888", nil)
    if err != nil {
        log.Fatal(err)
    }
    ipv6Req.Header.Add("X-API-Key", "${secret}")

    ipv6Resp, err := client.Do(ipv6Req)
    if err != nil {
        log.Fatal(err)
    }
    defer ipv6Resp.Body.Close()

    ipv6Body, err := ioutil.ReadAll(ipv6Resp.Body)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("IPv6 result:", string(ipv6Body))
}
`,
    },
    {
      label: "PHP",
      language: "jsx",
      code: dedent`<?php
$apiKey = '${secret}';

// IPv4 lookup
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://api.ipflare.io/84.17.50.173");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: $apiKey"
]);

$response = curl_exec($ch);
curl_close($ch);

$geoData = json_decode($response, true);
echo "IPv4 result: " . json_encode($geoData) . "\\n";

// IPv6 lookup (fully supported)
$ipv6Ch = curl_init();

curl_setopt($ipv6Ch, CURLOPT_URL, "https://api.ipflare.io/2001:4860:4860::8888");
curl_setopt($ipv6Ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ipv6Ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: $apiKey"
]);

$ipv6Response = curl_exec($ipv6Ch);
curl_close($ipv6Ch);

$ipv6GeoData = json_decode($ipv6Response, true);
echo "IPv6 result: " . json_encode($ipv6GeoData) . "\\n";
?>
`,
    },
    {
      label: "C#",
      language: "jsx",
      code: dedent`using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("X-API-Key", "${secret}");

        // IPv4 lookup
        var response = await client.GetAsync("https://api.ipflare.io/84.17.50.173");
        var geoData = await response.Content.ReadAsStringAsync();
        Console.WriteLine("IPv4 result: " + geoData);
        
        // IPv6 lookup (fully supported)
        var ipv6Response = await client.GetAsync("https://api.ipflare.io/2001:4860:4860::8888");
        var ipv6GeoData = await ipv6Response.Content.ReadAsStringAsync();
        Console.WriteLine("IPv6 result: " + ipv6GeoData);
    }
}
`,
    },
  ];
};
