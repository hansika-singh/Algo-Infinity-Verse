import { spawn } from "child_process";
import http from "http";

const PORT = 3012;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(path, method, body, cookie) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };
    if (cookie) {
      opts.headers["Cookie"] = cookie;
    }
    
    const req = http.request(opts, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    
    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("Starting server...");
  const serverProc = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: PORT.toString(), HOST: "127.0.0.1" },
    stdio: 'inherit'
  });
  
  await wait(2000); // Give server time to start

  let failed = false;
  let sessionCookie = null;

  try {
    console.log("Test 1: POST /api/audit/history without auth");
    let res = await request("/api/audit/history", "POST", { repoUrl: "test", overallScore: 50 });
    if (res.status !== 401) { throw new Error(`Expected 401, got ${res.status}`); }
    console.log("✓ Test 1 passed");

    console.log("Test 2: Create account");
    const email = `testuser_${Date.now()}@test.com`;
    res = await request("/api/signup", "POST", {
      name: "Test User",
      email: email,
      password: "Password123!",
      confirmPassword: "Password123!"
    });
    if (res.status !== 201) { throw new Error(`Expected 201, got ${res.status}`); }
    const setCookie = res.headers["set-cookie"];
    sessionCookie = setCookie ? setCookie[0].split(";")[0] : null;
    if (!sessionCookie) throw new Error("No session cookie received");
    console.log("✓ Test 2 passed");

    console.log("Test 3: POST /api/audit/history with auth");
    res = await request("/api/audit/history", "POST", {
      repoUrl: "repo1",
      overallScore: 60,
      issuesCount: 5,
      categoryScores: ["skill1"],
      recommendations: ["fix this"]
    }, sessionCookie);
    if (res.status !== 201) { throw new Error(`Expected 201, got ${res.status}`); }
    console.log("✓ Test 3 passed");

    await wait(500); // Small delay to ensure timestamp difference

    console.log("Test 4: POST /api/audit/history with auth again");
    res = await request("/api/audit/history", "POST", {
      repoUrl: "repo1",
      overallScore: 75,
      issuesCount: 2
    }, sessionCookie);
    if (res.status !== 201) { throw new Error(`Expected 201, got ${res.status}`); }
    console.log("✓ Test 4 passed");

    console.log("Test 5: GET /api/audit/history");
    res = await request("/api/audit/history", "GET", null, sessionCookie);
    if (res.status !== 200) { throw new Error(`Expected 200, got ${res.status}`); }
    if (!Array.isArray(res.data) || res.data.length < 2) { throw new Error("Expected at least 2 records"); }
    // Check sorting (descending by time)
    if (new Date(res.data[0].timestamp) < new Date(res.data[1].timestamp)) {
      throw new Error("Expected descending sort by timestamp");
    }
    console.log("✓ Test 5 passed");

    console.log("Test 6: GET /api/audit/trends");
    res = await request("/api/audit/trends", "GET", null, sessionCookie);
    if (res.status !== 200) { throw new Error(`Expected 200, got ${res.status}`); }
    if (!Array.isArray(res.data) || res.data.length < 2) { throw new Error("Expected at least 2 records"); }
    // Check sorting (ascending by time)
    if (new Date(res.data[0].timestamp) > new Date(res.data[1].timestamp)) {
      throw new Error("Expected ascending sort by timestamp");
    }
    // Only contains trends data
    if (res.data[0].repoUrl !== undefined) {
      throw new Error("Expected only trend data (timestamp, overallScore)");
    }
    console.log("✓ Test 6 passed");

    console.log("Test 7: GET /api/audit/history?limit=1");
    res = await request("/api/audit/history?limit=1", "GET", null, sessionCookie);
    if (res.status !== 200) { throw new Error(`Expected 200, got ${res.status}`); }
    if (res.data.length !== 1) { throw new Error(`Expected length 1, got ${res.data.length}`); }
    console.log("✓ Test 7 passed");

  } catch (err) {
    console.error("Test failed:", err.message);
    failed = true;
  } finally {
    console.log("Shutting down server...");
    serverProc.kill();
    if (failed) {
      process.exit(1);
    } else {
      console.log("All tests passed!");
      process.exit(0);
    }
  }
}

runTests();
