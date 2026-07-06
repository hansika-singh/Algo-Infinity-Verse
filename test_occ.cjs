const http = require('http');

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testConcurrency() {
  console.log('Testing OCC (Optimistic Concurrency Control)...');

  // Fetch the current state
  console.log('1. Fetching initial profile...');
  let res = await request('GET', '/api/team-profile?id=test-team');
  let version = res.data.version;
  console.log(`Current version: ${version}`);

  // Two simultaneous users try to update based on the same initial version
  const payload1 = {
    id: 'test-team',
    version: version,
    name: 'Team Alpha - Updated by User 1',
    description: 'Update 1'
  };

  const payload2 = {
    id: 'test-team',
    version: version,
    name: 'Team Alpha - Updated by User 2',
    description: 'Update 2'
  };

  console.log('2. Sending two concurrent updates with same version...');
  
  // Send them concurrently
  const [res1, res2] = await Promise.all([
    request('POST', '/api/team-profile', payload1),
    request('POST', '/api/team-profile', payload2)
  ]);

  console.log('User 1 Response:', res1.status, res1.data);
  console.log('User 2 Response:', res2.status, res2.data);

  if ((res1.status === 200 && res2.status === 409) || (res1.status === 409 && res2.status === 200)) {
    console.log('✅ OCC Test Passed: One request succeeded and the other got 409 Conflict.');
  } else {
    console.log('❌ OCC Test Failed: Both succeeded or both failed unexpectedly.');
  }
}

testConcurrency().catch(console.error);
