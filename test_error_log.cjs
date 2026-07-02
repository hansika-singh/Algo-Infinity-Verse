const http = require('http');

const payload = JSON.stringify({
  message: "Test Uncaught ReferenceError: x is not defined",
  stack: "ReferenceError: x is not defined at window.onload (http://localhost:3000/:10:1)",
  url: "http://localhost:3000/",
  timestamp: new Date().toISOString()
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/log-error',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
