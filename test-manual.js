// Manual test script for IPFlare library
// This tests the compiled JavaScript version to ensure it works for users

const {
  IPFlare,
  isIPGeolocationError,
  isIPGeolocationSuccess,
} = require("./dist/index.js");

// Test with a dummy API key (will fail auth but tests the flow)
const client = new IPFlare({ apiKey: "test-api-key" });

async function runTests() {
  console.log("🧪 Running manual tests for IPFlare library...\n");

  // Test 1: Valid IPv4
  console.log("Test 1: Valid IPv4 lookup");
  try {
    await client.lookup("8.8.8.8");
    console.log("❌ Should have failed with invalid API key");
  } catch (error) {
    if (error.message === "Invalid API key") {
      console.log("✅ Correctly caught invalid API key error");
    } else {
      console.log("✅ Caught error:", error.message);
    }
  }

  // Test 2: Invalid IP
  console.log("\nTest 2: Invalid IP address");
  try {
    await client.lookup("not-an-ip");
    console.log("❌ Should have rejected invalid IP");
  } catch (error) {
    if (error.message.includes("Invalid IP address format")) {
      console.log("✅ Correctly rejected invalid IP");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 3: IPv6 validation
  console.log("\nTest 3: IPv6 address validation");
  try {
    await client.lookup("2001:4860:4860::8888");
    console.log("❌ Should have failed with invalid API key");
  } catch (error) {
    if (error.message === "Invalid API key") {
      console.log("✅ IPv6 passed validation and reached API");
    } else {
      console.log("✅ Caught error:", error.message);
    }
  }

  // Test 4: Type guards
  console.log("\nTest 4: Type guards");
  const errorResponse = {
    ip: "test",
    status: "error",
    error_message: "Test error",
  };
  const successResponse = {
    ip: "test",
    status: "success",
    data: { ip: "test", in_eu: false, land_locked: false },
  };

  console.log(
    "isIPGeolocationError(errorResponse):",
    isIPGeolocationError(errorResponse)
  );
  console.log(
    "isIPGeolocationSuccess(successResponse):",
    isIPGeolocationSuccess(successResponse)
  );

  if (
    isIPGeolocationError(errorResponse) &&
    isIPGeolocationSuccess(successResponse)
  ) {
    console.log("✅ Type guards working correctly");
  } else {
    console.log("❌ Type guards not working correctly");
  }

  // Test 5: Bulk validation
  console.log("\nTest 5: Bulk IP validation");
  try {
    await client.bulkLookup({ ips: ["8.8.8.8", "invalid-ip", "1.1.1.1"] });
    console.log("❌ Should have rejected invalid IP in bulk");
  } catch (error) {
    if (error.message.includes("Invalid IP addresses found")) {
      console.log("✅ Correctly rejected bulk request with invalid IP");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 6: Empty array
  console.log("\nTest 6: Empty array validation");
  try {
    await client.bulkLookup({ ips: [] });
    console.log("❌ Should have rejected empty array");
  } catch (error) {
    if (error.message === "At least one IP address is required") {
      console.log("✅ Correctly rejected empty array");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  // Test 7: Too many IPs
  console.log("\nTest 7: Too many IPs validation");
  try {
    const tooManyIPs = new Array(501).fill("1.1.1.1");
    await client.bulkLookup({ ips: tooManyIPs });
    console.log("❌ Should have rejected >500 IPs");
  } catch (error) {
    if (error.message === "Maximum of 500 IPs per request allowed") {
      console.log("✅ Correctly rejected >500 IPs");
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }

  console.log("\n✨ Manual tests completed!");
}

runTests().catch(console.error);
