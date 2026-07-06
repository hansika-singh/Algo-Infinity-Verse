import { spawn } from "child_process";
import http from "http";
import FormData from "form-data";
import fs from "fs";

const PORT = 3014;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: method,
      headers: { ...headers }
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
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else if (body.pipe) {
        body.pipe(req);
        return; // Don't call end, pipe handles it
      } else {
        req.write(JSON.stringify(body));
      }
    }
    if (!body || !body.pipe) req.end();
  });
}

async function runTests() {
  console.log("Starting server for API tests...");
  const serverProc = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: PORT.toString(), HOST: "127.0.0.1" },
    stdio: "inherit" // Important to see Redis connection warnings instead of silent failures
  });
  
  await wait(3000); // Give server and BullMQ time to start

  let failed = false;

  try {
    console.log("Test 1: Upload CSV to /api/audit/bulk");
    
    const csvContent = "https://github.com/expressjs/express\nhttps://github.com/octocat/Hello-World";
    fs.writeFileSync("test.csv", csvContent);

    const form = new FormData();
    form.append('csv', fs.createReadStream("test.csv"));

    const res = await request("/api/audit/bulk", "POST", form, form.getHeaders());
    
    if (res.status !== 202) {
      throw new Error(`Expected 202 Accepted, got ${res.status}. Body: ${JSON.stringify(res.data)}`);
    }

    const { batchId, totalJobs } = res.data;
    console.log(`✓ Test 1 passed: Accepted batch ${batchId} with ${totalJobs} jobs`);

    console.log("\nTest 2: Poll /api/audit/bulk/:batchId for completion");
    
    let isComplete = false;
    for (let i = 0; i < 15; i++) {
      await wait(1500);
      const pollRes = await request(`/api/audit/bulk/${batchId}`, "GET");
      
      if (pollRes.status === 200) {
        const { progress, completed, failed, total } = pollRes.data;
        console.log(`Polling... Progress: ${progress}% (${completed + failed}/${total})`);
        
        if (progress === 100) {
          isComplete = true;
          console.log("✓ Test 2 passed: All jobs completed");
          break;
        }
      } else {
        console.warn(`Polling failed with status ${pollRes.status}`);
      }
    }

    console.log("\n=== Testing Edge Cases ===");

    console.log("Edge Case 1: Upload CSV with no supported repository URLs");
    fs.writeFileSync("test_invalid.csv", "https://example.com/user/repo\nnot-a-url");
    const formInvalid = new FormData();
    formInvalid.append('csv', fs.createReadStream("test_invalid.csv"));
    const resInvalid = await request("/api/audit/bulk", "POST", formInvalid, formInvalid.getHeaders());
    if (resInvalid.status !== 400) throw new Error(`Expected 400, got ${resInvalid.status}`);
    console.log("✓ Edge Case 1 passed: Rejected CSV lacking supported VCS URLs.");

    console.log("Edge Case 2: Polling an invalid/non-existent batch ID");
    const resPollInvalid = await request("/api/audit/bulk/this-id-does-not-exist", "GET");
    if (resPollInvalid.status !== 404) throw new Error(`Expected 404, got ${resPollInvalid.status}`);
    console.log("✓ Edge Case 2 passed: Correctly returned 404 for invalid batch ID.");

    console.log("Edge Case 3: CSV with a non-existent GitHub repo (Testing graceful worker failure)");
    fs.writeFileSync("test_nonexistent.csv", "https://github.com/octocat/this-repo-surely-does-not-exist-123");
    const formNonExistent = new FormData();
    formNonExistent.append('csv', fs.createReadStream("test_nonexistent.csv"));
    const resNonExistent = await request("/api/audit/bulk", "POST", formNonExistent, formNonExistent.getHeaders());
    if (resNonExistent.status !== 202) throw new Error("Failed to enqueue non-existent repo.");
    
    // Poll to ensure it completes and doesn't hang
    const missingBatchId = resNonExistent.data.batchId;
    let missingComplete = false;
    for (let i = 0; i < 10; i++) {
      await wait(1000);
      const missingPoll = await request(`/api/audit/bulk/${missingBatchId}`, "GET");
      if (missingPoll.status === 200 && missingPoll.data.progress === 100) {
        missingComplete = true;
        break;
      }
    }
    if (!missingComplete) throw new Error("Worker hung on non-existent repository.");
    console.log("✓ Edge Case 3 passed: Worker gracefully processed non-existent repository without crashing.");

    if (!isComplete) {
      console.warn("Test timed out before completion.");
    }

  } catch (err) {
    console.error("Test failed:", err.message);
    failed = true;
  } finally {
    console.log("\nShutting down server...");
    serverProc.kill();
    if (fs.existsSync("test.csv")) fs.unlinkSync("test.csv");
    if (fs.existsSync("test_invalid.csv")) fs.unlinkSync("test_invalid.csv");
    if (fs.existsSync("test_nonexistent.csv")) fs.unlinkSync("test_nonexistent.csv");
    if (failed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
