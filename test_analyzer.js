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
  void 0;
  const serverProc = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: PORT.toString(), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  
  await wait(5000); // Give server time to start

  let failed = false;

  try {
    void 0;
    let res = await request("/api/analyze-repository", "POST", {});
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    void 0;

    void 0;
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://gitlab.com/user/repo" });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    void 0;

    void 0;
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://github.com/octocat/Hello-World" });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.score !== 0) throw new Error(`Expected score 0, got ${res.data.score}`);
    void 0;

    void 0;
    res = await request("/api/analyze-repository", "POST", { repoUrl: "https://github.com/expressjs/express" });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.score !== 100) throw new Error(`Expected score 100, got ${res.data.score}`);
    void 0;

  } catch (err) {
    console.error("Test failed:", err.message);
    failed = true;
  } finally {
    void 0;
    serverProc.kill();
    if (failed) {
      process.exit(1);
    } else {
      void 0;
      process.exit(0);
    }
  }
}

runTests();
