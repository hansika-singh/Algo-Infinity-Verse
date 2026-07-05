import { spawn } from "child_process";
import http from "http";

const PORT = 3013;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(path, method, body) {
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
  console.log("Starting server for API tests...");
  const serverProc = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: PORT.toString(), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  
  await wait(5000); // Give server time to start

  let failed = false;

  try {
    console.log("Test 1: POST /api/analyze-repository without repoUrl");
    let res = await request("/api/analyze-repository", "POST", {});
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log("✓ Test 1 passed");

    console.log("Test 2: POST /api/analyze-repository with invalid github URL");
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://gitlab.com/user/repo" });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    console.log("✓ Test 2 passed");

    console.log("Test 3: POST /api/analyze-repository with repo without workflows");
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://github.com/octocat/Hello-World" });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.score !== 0) throw new Error(`Expected score 0, got ${res.data.score}`);
    console.log("✓ Test 3 passed");

    console.log("Test 4: POST /api/analyze-repository with valid repository with workflows");
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://github.com/expressjs/express" });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.score !== 100) throw new Error(`Expected score 100, got ${res.data.score}`);
    console.log("✓ Test 4 passed");

  } catch (err) {
    console.error("Test failed:", err.message);
    failed = true;
  } finally {
    console.log("Shutting down server...");
    serverProc.kill();
    if (failed) {
      process.exit(1);
    } else {
      console.log("All edge case tests passed successfully!");
      process.exit(0);
    }
  }
}

runTests();
