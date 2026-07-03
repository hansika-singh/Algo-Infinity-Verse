document.addEventListener('DOMContentLoaded', () => {

  const STORAGE_KEY = 'api-design-learning-progress';
  let completedTopics = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    completedTopics = raw.filter(id => !isNaN(id) && id !== null && id !== undefined);
    if (raw.length !== completedTopics.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
    }
  } catch {
    completedTopics = [];
  }

  const topicsData = [
    {
      id: "1",
      title: "Introduction & API Paradigms",
      icon: "📖",
      content: `<p>Modern software relies on robust communication mechanisms. Before designing an API, you must choose the appropriate paradigm based on your architecture's constraints.</p>
                <div class="api-concept-card">
                  <h4>API Paradigms Comparison</h4>
                  <ul>
                    <li><strong>REST (HTTP/JSON)</strong> — Resource-oriented, highly cacheable, standardized. Best for public integration interfaces.</li>
                    <li><strong>GraphQL</strong> — Client-specified queries. Prevents over-fetching and under-fetching. Ideal for front-ends with highly dynamic UI requirements.</li>
                    <li><strong>gRPC (HTTP/2 / Protobuf)</strong> — Binary contract-based, multiplexed streaming, high performance. Ideal for low-latency internal microservices communication.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p><strong>Design-First vs Code-First:</strong> Enterprise API design champions "design-first", where the API schema (OpenAPI Spec/Swagger) is authored and approved by stakeholders <em>before</em> any backend implementation starts. This ensures consistent developer experience (DX) and parallel front-end development.</p>
                </div>`,
      challenge: {
        title: "REST Query Builder",
        instruction: "Construct a GET request to fetch page 2 of comments for post ID <code>42</code>, sorted by <code>newest</code>. Fill in the parameters to build the URL.",
        html: `
          <div class="api-terminal">
            <div class="api-terminal-header">
              <span class="api-terminal-dot red"></span>
              <span class="api-terminal-dot yellow"></span>
              <span class="api-terminal-dot green"></span>
              <span style="margin-left: 10px; font-size: 0.8rem; color: var(--text-secondary);">Request Preview</span>
            </div>
            <div class="api-terminal-content" id="requestPreview1">GET https://api.blog.com/...</div>
          </div>
          <div class="challenge-grid">
            <div>
              <label class="api-label">HTTP Method</label>
              <select id="methodInput1" class="api-select">
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div>
              <label class="api-label">Endpoint Path</label>
              <input type="text" id="pathInput1" class="api-input" placeholder="/posts/42/comments">
            </div>
            <div>
              <label class="api-label">Query Param 1 (Key = Value)</label>
              <div style="display: flex; gap: 10px;">
                <input type="text" id="paramKey1_1" class="api-input" placeholder="page" style="flex:1;">
                <input type="text" id="paramVal1_1" class="api-input" placeholder="2" style="flex:1;">
              </div>
            </div>
            <div>
              <label class="api-label">Query Param 2 (Key = Value)</label>
              <div style="display: flex; gap: 10px;">
                <input type="text" id="paramKey1_2" class="api-input" placeholder="sort" style="flex:1;">
                <input type="text" id="paramVal1_2" class="api-input" placeholder="newest" style="flex:1;">
              </div>
            </div>
          </div>
        `
      }
    },
    {
      id: "2",
      title: "REST Constraints & Statelessness",
      icon: "🌐",
      content: `<p>REST (Representational State Transfer) is not a protocol, but an architectural style defined by 6 core constraints. Adhering to these constraints guarantees that the system is scalable, modular, and portable.</p>
                <div class="api-concept-card">
                  <h4>Core REST Constraints</h4>
                  <ul>
                    <li><strong>Statelessness:</strong> The server must not store any session state about the client. Each incoming request must contain all the context and credentials necessary to validate and execute it.</li>
                    <li><strong>Uniform Interface:</strong> Simplifies and decouples the architecture. Resources must be uniquely identified (via URIs) and manipulated through representations (JSON/XML).</li>
                    <li><strong>Cacheability:</strong> Data within responses must be labeled as cacheable or non-cacheable to enable web proxies to serve cached data directly.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">⚠️</span>
                  <p><strong>Statelessness Trade-off:</strong> While statelessness makes horizontal scaling trivial (any server can handle any request), it increases network overhead since authentication tokens (like JWTs) must be transmitted in every HTTP request header.</p>
                </div>`,
      challenge: {
        title: "Stateless Authorization Configurator",
        instruction: "The client is getting a <code>401 Unauthorized</code> trying to fetch the protected endpoint <code>/billing-details</code>. The server logs state: <i>'Session cookies rejected. Use stateless auth headers.'</i> Configure the request to use Bearer authentication token <code>mock_token_9832abc</code>.",
        html: `
          <div class="api-terminal">
            <div class="api-terminal-header">
              <span class="api-terminal-dot red"></span>
              <span class="api-terminal-dot yellow"></span>
              <span class="api-terminal-dot green"></span>
              <span style="margin-left: 10px; font-size: 0.8rem; color: var(--text-secondary);">Request Headers View</span>
            </div>
            <div class="api-terminal-content" id="headersPreview2">GET /billing-details HTTP/1.1
Host: api.billing.com
...</div>
          </div>
          <div class="challenge-grid">
            <div>
              <label class="api-label">Auth Mechanism Type</label>
              <select id="authType2" class="api-select">
                <option value="cookie">Session Cookie</option>
                <option value="bearer">Authorization Bearer Token</option>
                <option value="basic">Basic Auth Header</option>
              </select>
            </div>
            <div>
              <label class="api-label">Header Name</label>
              <input type="text" id="headerKey2" class="api-input" placeholder="e.g. Authorization">
            </div>
            <div style="grid-column: span 2;">
              <label class="api-label">Header Value</label>
              <input type="text" id="headerVal2" class="api-input" placeholder="e.g. Bearer mock_token_9832abc">
            </div>
          </div>
        `
      }
    },
    {
      id: "3",
      title: "HTTP Methods & Idempotency",
      icon: "⚡",
      content: `<p>HTTP methods define the semantic action of your request. To build a standard API, you must align methods with their safety and idempotency rules.</p>
                <div class="api-table-wrap">
                  <table class="api-table">
                    <thead>
                      <tr>
                        <th scope="col">Method</th>
                        <th scope="col">Action</th>
                        <th scope="col">Safe?</th>
                        <th scope="col">Idempotent?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>GET</strong></td><td>Retrieve resource representation.</td><td>✅ Yes</td><td>✅ Yes</td></tr>
                      <tr><td><strong>POST</strong></td><td>Create resource or trigger controller action.</td><td>❌ No</td><td>❌ No</td></tr>
                      <tr><td><strong>PUT</strong></td><td>Replace entire resource with request payload.</td><td>❌ No</td><td>✅ Yes</td></tr>
                      <tr><td><strong>PATCH</strong></td><td>Apply partial update to a resource.</td><td>❌ No</td><td>❌ No (Usually)</td></tr>
                      <tr><td><strong>DELETE</strong></td><td>Remove resource representation.</td><td>❌ No</td><td>✅ Yes</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">💡</span>
                  <p><strong>Safety vs Idempotency:</strong> A method is <strong>safe</strong> if it does not modify resource state. A method is <strong>idempotent</strong> if making N identical requests results in the exact same resource state as making 1 request.</p>
                </div>`,
      challenge: {
        title: "Mock CRUD API Console",
        instruction: "Modify user ID <code>101</code> to update ONLY their phone number to <code>+999999</code> without wiping out other user attributes. Input the method, path, and payload body.",
        html: `
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
            <div style="flex: 1; min-width: 250px;">
              <label class="api-label">Server Database State (User ID 101)</label>
              <pre style="background:#0d1117; padding:15px; border-radius:8px; font-family:monospace; font-size:0.8rem; color:#e6edf3;" id="dbState3">{
  "id": 101,
  "username": "coder_infinity",
  "email": "coder@infinity.com",
  "phone": "+123456"
}</pre>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <label class="api-label">Configure Console Request</label>
              <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <select id="method3" class="api-select" style="width: 100px; margin-bottom: 0;">
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
                <input type="text" id="path3" class="api-input" placeholder="/users/101" style="margin-bottom: 0;">
              </div>
              <label class="api-label">Payload Body (JSON)</label>
              <textarea id="body3" class="api-textarea" rows="4" style="font-family:monospace; font-size:0.8rem;">{
  "phone": "+999999"
}</textarea>
            </div>
          </div>
        `
      }
    },
    {
      id: "4",
      title: "Resource Naming & Path Hierarchies",
      icon: "🏷️",
      content: `<p>URIs (Uniform Resource Identifiers) identify resources. RESTful paths should represent hierarchical structures using nouns instead of actions (verbs).</p>
                <div class="api-concept-card">
                  <h4>Resource Naming Rules</h4>
                  <ul>
                    <li><strong>Use Plural Nouns:</strong> Prefer <code>/users</code> over <code>/user</code>, and <code>/products</code> over <code>/product</code>.</li>
                    <li><strong>Avoid Verbs in URIs:</strong> Do not include operations like <code>/getUsers</code> or <code>/deleteProduct</code>. The HTTP method acts as the verb.</li>
                    <li><strong>Hierarchical Relationships:</strong> Represent child resources via paths: <code>/users/{id}/orders</code> gets orders belonging to a specific user.</li>
                    <li><strong>Query Params for Filtering:</strong> Use query parameters to filter collections (e.g. <code>/users?status=active</code>) instead of paths like <code>/users/active</code>.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "API Endpoint Linter",
        instruction: "Lint and correct these three legacy, poorly-structured endpoints to follow standard RESTful URI conventions. Use nouns, plural naming, and standard paths.",
        html: `
          <div class="challenge-grid">
            <div style="grid-column: span 2;">
              <label class="api-label">1. Legacy Path: <code>GET /getUserActiveOrders?userId=88</code></label>
              <input type="text" id="linterInput1" class="api-input" placeholder="e.g. GET /users/88/orders?status=active">
              <span class="api-linter-hint" style="font-size:0.75rem; color:var(--text-secondary);">Hint: Nest orders under user ID 88, and filter by status using query parameters.</span>
            </div>
            <div style="grid-column: span 2; margin-top: 10px;">
              <label class="api-label">2. Legacy Path: <code>POST /deleteUser/88</code></label>
              <input type="text" id="linterInput2" class="api-input" placeholder="e.g. DELETE /users/88">
              <span class="api-linter-hint" style="font-size:0.75rem; color:var(--text-secondary);">Hint: Use the appropriate idempotent HTTP delete method and resource path.</span>
            </div>
            <div style="grid-column: span 2; margin-top: 10px;">
              <label class="api-label">3. Legacy Path: <code>POST /products/45/updatePrice</code></label>
              <input type="text" id="linterInput3" class="api-input" placeholder="e.g. PATCH /products/45">
              <span class="api-linter-hint" style="font-size:0.75rem; color:var(--text-secondary);">Hint: Replaces verb controllers with standard resource update endpoints.</span>
            </div>
          </div>
        `
      }
    },
    {
      id: "5",
      title: "HTTP Status Codes Decisions",
      icon: "🚦",
      content: `<p>Status codes communicate results clearly to client applications. Choosing the correct status code ensures proper error handling and client logic execution.</p>
                <div class="api-concept-card">
                  <h4>Standard Status Guidelines</h4>
                  <ul>
                    <li><strong>201 Created:</strong> Use when a resource has been successfully created. The response should include a <code>Location</code> header pointing to the new resource.</li>
                    <li><strong>202 Accepted:</strong> Used for asynchronous, long-running processes (e.g. generating a large report). Tells the client the request was validated but not yet complete.</li>
                    <li><strong>400 Bad Request:</strong> Used for validation or parsing failures where the client payload has syntax errors.</li>
                    <li><strong>401 Unauthorized vs 403 Forbidden:</strong> 401 means "missing or invalid auth credentials". 403 means "credentials validated, but you do not have permissions to access this specific resource".</li>
                    <li><strong>422 Unprocessable Entity:</strong> Best for semantic errors (e.g. request body contains valid JSON, but the email field is already registered in the DB).</li>
                  </ul>
                </div>`,
      challenge: {
        title: "HTTP Response Simulator",
        instruction: "Select the most accurate and precise HTTP Status Code for the following backend application scenarios.",
        html: `
          <div class="challenge-grid">
            <div>
              <label class="api-label">1. Request payload is verified, and a new database profile is instantly written.</label>
              <select id="statusCode1" class="api-select">
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="202">202 Accepted</option>
              </select>
            </div>
            <div>
              <label class="api-label">2. User is authenticated, but attempts to delete system config files reserved for SuperAdmins.</label>
              <select id="statusCode2" class="api-select">
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
              </select>
            </div>
            <div>
              <label class="api-label">3. The email input parameter contains text missing the '@' sign, causing input validation failure.</label>
              <select id="statusCode3" class="api-select">
                <option value="400">400 Bad Request</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>
            </div>
            <div>
              <label class="api-label">4. The client has sent 150 search requests in under a minute, exceeding the API rate limit.</label>
              <select id="statusCode4" class="api-select">
                <option value="403">403 Forbidden</option>
                <option value="429">429 Too Many Requests</option>
                <option value="503">503 Service Unavailable</option>
              </select>
            </div>
          </div>
        `
      }
    },
    {
      id: "6",
      title: "API Versioning Strategies",
      icon: "🔄",
      content: `<p>APIs change over time. Versioning prevents breaking legacy integrations when introducing backwards-incompatible schema changes.</p>
                <div class="api-concept-card">
                  <h4>Common Versioning Styles</h4>
                  <ul>
                    <li><strong>URI Versioning:</strong> <code>https://api.site.com/v2/users</code>. Simple to configure, highly cacheable by CDNs, but leaks route concerns into application mapping.</li>
                    <li><strong>Query Parameter:</strong> <code>https://api.site.com/users?version=2</code>. Keeps paths consistent but conflicts with search filters.</li>
                    <li><strong>Custom Header Versioning:</strong> <code>Accept-Version: 2</code> or <code>X-API-Version: 2</code>. Keeps clean URIs, but requires proxy servers to cache versions independently.</li>
                    <li><strong>Accept Header (Media Type):</strong> <code>Accept: application/vnd.company.v2+json</code>. The most academically RESTful approach (content negotiation), but harder for client libraries to manage.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Version Headers Negotiator",
        instruction: "The <code>/reports</code> endpoint has retired Version 1. To request Version 2 payload data, configure the custom version header <code>X-API-Version</code> to <code>2</code>.",
        html: `
          <div class="api-terminal">
            <div class="api-terminal-header">
              <span class="api-terminal-dot red"></span>
              <span class="api-terminal-dot yellow"></span>
              <span class="api-terminal-dot green"></span>
              <span style="margin-left: 10px; font-size: 0.8rem; color: var(--text-secondary);">Request Headers Console</span>
            </div>
            <div class="api-terminal-content" id="versionPreview6">GET /reports HTTP/1.1
Host: api.metrics.com
...</div>
          </div>
          <div class="challenge-grid">
            <div>
              <label class="api-label">Header Key</label>
              <input type="text" id="versionHeaderKey" class="api-input" placeholder="e.g. X-API-Version">
            </div>
            <div>
              <label class="api-label">Header Value</label>
              <input type="text" id="versionHeaderVal" class="api-input" placeholder="e.g. 2">
            </div>
          </div>
        `
      }
    },
    {
      id: "7",
      title: "Deep Pagination & Data Drift",
      icon: "📄",
      content: `<p>Returning massive datasets can degrade database and network performance. APIs use pagination to return data in chunks.</p>
                <div class="api-concept-card">
                  <h4>Offset vs Cursor Pagination</h4>
                  <ul>
                    <li><strong>Offset Pagination (limit & offset):</strong> Simple to execute: <code>SELECT * FROM users LIMIT 10 OFFSET 100</code>. O(N) database complexity; database must parse and discard all preceding offset rows.
                    <br><strong>Data Drift:</strong> If a record is deleted or added while a client reads pages, they will skip or receive duplicate records.</li>
                    <li><strong>Cursor Pagination (limit & starting_after):</strong> Uses a unique, indexed sequential attribute (e.g. ID or timestamp) as a marker: <code>SELECT * FROM users WHERE id > last_seen_id LIMIT 10</code>. O(1) indexed lookup. Fully immune to data drift and duplicates.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Pagination Simulator",
        instruction: "Inspect the visual data logs. Test the Offset vs Cursor paginators under a concurrent write event. Then identify the query parameter needed for cursor pagination.",
        html: `
          <div class="api-terminal" style="margin-bottom: 15px;">
            <div class="api-terminal-header">
              <span class="api-terminal-dot red"></span>
              <span class="api-terminal-dot yellow"></span>
              <span class="api-terminal-dot green"></span>
              <span style="margin-left: 10px; font-size: 0.8rem; color: var(--text-secondary);">Pagination Drift Simulator</span>
            </div>
            <div class="api-terminal-content" id="pagConsole7" style="max-height: 200px; overflow-y:auto; font-size:0.75rem;">Select paginator below to run simulation...</div>
          </div>
          <div style="display:flex; gap:10px; margin-bottom: 15px;">
            <button id="btnOffset7" class="btn btn-secondary" style="flex:1; font-size:0.8rem;">Run Offset Paging (Drift)</button>
            <button id="btnCursor7" class="btn btn-secondary" style="flex:1; font-size:0.8rem;">Run Cursor Paging (Consistent)</button>
          </div>
          <div class="challenge-grid">
            <div style="grid-column: span 2;">
              <label class="api-label">Which parameter acts as the pointer to the last retrieved record in a Cursor system?</label>
              <select id="pagSelect7" class="api-select">
                <option value="offset">offset</option>
                <option value="limit">limit</option>
                <option value="cursor">cursor (or starting_after)</option>
                <option value="page">page</option>
              </select>
            </div>
          </div>
        `
      }
    },
    {
      id: "8",
      title: "Authentication & JWT Structure",
      icon: "🔐",
      content: `<p>Authentication validates the identity of the incoming agent. Standard stateless architectures utilize JWTs (JSON Web Tokens) encoded in base64.</p>
                <div class="api-concept-card">
                  <h4>Anatomy of a JWT</h4>
                  <ul>
                    <li><strong>Header (Red):</strong> Metadata specifying the algorithm (e.g. HS256) and type of token.</li>
                    <li><strong>Payload (Purple):</strong> Claims about the user, permissions, and expiration (e.g. <code>exp</code> timestamp, <code>sub</code> subject).</li>
                    <li><strong>Signature (Blue):</strong> Validates integrity. Created by hashing the Header and Payload combined with a secret server-side key.</li>
                  </ul>
                </div>
                <div class="api-callout">
                  <span class="api-callout-icon">🔒</span>
                  <p><strong>Token Security:</strong> Because JWT payload text is base64-encoded, it is completely visible to the client. You must <strong>never</strong> put sensitive secrets (like database passwords or personal data) inside the payload.</p>
                </div>`,
      challenge: {
        title: "JWT Token Tamper Inspector",
        instruction: "Tamper with this token payload by changing the user role from <code>member</code> to <code>admin</code> in the JSON payload, then witness how signature verification fails.",
        html: `
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
            <div style="flex: 1.2; min-width: 250px;">
              <label class="api-label">Raw Encoded JWT (Base64)</label>
              <div class="jwt-box">
                <div class="jwt-part jwt-header" id="jwtHeader8">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</div>
                <div class="jwt-part jwt-payload" id="jwtPayload8">eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiRGV2ZWxvcGVyIiwicm9sZSI6Im1lbWJlciJ9</div>
                <div class="jwt-part jwt-signature" id="jwtSign8">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</div>
              </div>
            </div>
            <div style="flex: 1; min-width: 250px;">
              <label class="api-label">Decoded Payload JSON (Editable)</label>
              <textarea id="jwtJson8" class="api-textarea" rows="5" style="font-family:monospace; font-size:0.8rem;">{
  "sub": "123456",
  "name": "Developer",
  "role": "member"
}</textarea>
              <div id="jwtStatus8" style="padding:8px 12px; border-radius:6px; font-weight:bold; text-align:center; font-size:0.8rem; background:rgba(76,175,80,0.1); border:1px solid #4CAF50; color:#4CAF50;">✓ Signature Valid</div>
            </div>
          </div>
          <div class="challenge-grid">
            <div style="grid-column: span 2;">
              <label class="api-label">Why did the signature turn invalid when the payload role changed?</label>
              <select id="jwtSelect8" class="api-select">
                <option value="1">The token expired automatically</option>
                <option value="2">Altering the payload mismatches the original signature payload hash; signing requires the server secret key</option>
                <option value="3">JWT payload base64 is encrypted</option>
              </select>
            </div>
          </div>
        `
      }
    },
    {
      id: "9",
      title: "Rate Limiting Algorithms",
      icon: "⏳",
      content: `<p>Rate limiting protects APIs from DDoS attacks, brute-force requests, and resource exhaustion. Standard APIs return a <code>429 Too Many Requests</code> status code.</p>
                <div class="api-concept-card">
                  <h4>Rate Limiting Algorithms</h4>
                  <ul>
                    <li><strong>Token Bucket:</strong> A bucket holds tokens. Each request consumes a token. Refilled at a steady rate. Allows bursts up to bucket capacity.</li>
                    <li><strong>Leaky Bucket:</strong> Requests enter a queue and exit at a strict, uniform constant rate. Smooths traffic congestion, but delays requests.</li>
                    <li><strong>Sliding Window Counter:</strong> Computes request frequency over a moving timeframe dynamically. High precision with small memory footprint.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Token Bucket Simulator",
        instruction: "Configure the rate limiter capacity and refill rates to sustain a burst of <code>12 requests</code>, then click 'Run Simulation' to execute verification tests.",
        html: `
          <div class="bucket-sim-container">
            <div style="display:flex; justify-content: space-around; flex-wrap:wrap; gap:10px;">
              <div>
                <label class="api-label">Max Bucket Capacity (Tokens)</label>
                <input type="range" id="bucketCap9" min="2" max="20" value="5" style="width:120px;">
                <span id="lblCap9" style="display:block; font-weight:bold;">5</span>
              </div>
              <div>
                <label class="api-label">Refill Rate (Tokens/Sec)</label>
                <input type="range" id="bucketRefill9" min="1" max="5" value="1" style="width:120px;">
                <span id="lblRefill9" style="display:block; font-weight:bold;">1</span>
              </div>
            </div>
            
            <div class="bucket-visual-wrapper">
              <div class="bucket-visual">
                <div class="bucket-water" id="bucketFill9"></div>
                <div class="bucket-token-count" id="bucketCount9">5 Tokens</div>
              </div>
            </div>
            
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button id="btnTrigger9" class="btn btn-secondary" style="flex:1; padding:8px; font-size:0.75rem;">Send 1 Request</button>
              <button id="btnRunSim9" class="btn btn-primary" style="flex:1.2; padding:8px; font-size:0.75rem;">Run Simulation Test</button>
            </div>
            <div class="api-terminal" style="text-align:left; margin-top:15px; padding:10px;">
              <div class="api-terminal-content" id="simOutput9" style="font-size:0.75rem;">Ready...</div>
            </div>
          </div>
        `
      }
    },
    {
      id: "10",
      title: "ETags & HTTP Caching",
      icon: "🚀",
      content: `<p>HTTP Caching reduces latency and database load. Standard headers control client cache strategies.</p>
                <div class="api-concept-card">
                  <h4>ETag Validation</h4>
                  <ul>
                    <li><strong>ETag (Entity Tag):</strong> A unique hash representing a specific version of a resource payload.</li>
                    <li><strong>Conditional Requests:</strong> The client stores the ETag. On subsequent requests, it passes the hash in the <code>If-None-Match</code> header.</li>
                    <li><strong>304 Not Modified:</strong> If the data is unchanged on the server, it responds with a 304 code and empty body, saving significant bandwidth.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Conditional Request Tester",
        instruction: "The server returned a response with <code>ETag: 'etag_x192'</code>. Build a conditional header request to check if the data changed without downloading it again.",
        html: `
          <div class="api-terminal">
            <div class="api-terminal-header">
              <span class="api-terminal-dot red"></span>
              <span class="api-terminal-dot yellow"></span>
              <span class="api-terminal-dot green"></span>
              <span style="margin-left: 10px; font-size: 0.8rem; color: var(--text-secondary);">Simulated Request Headers</span>
            </div>
            <div class="api-terminal-content" id="requestPreview10">GET /dashboard-data HTTP/1.1
Host: api.analytics.com
...</div>
          </div>
          <div class="challenge-grid">
            <div>
              <label class="api-label">Header Key</label>
              <input type="text" id="etagKey10" class="api-input" placeholder="e.g. If-None-Match">
            </div>
            <div>
              <label class="api-label">Header Value</label>
              <input type="text" id="etagVal10" class="api-input" placeholder='e.g. "etag_x192"'>
            </div>
          </div>
        `
      }
    },
    {
      id: "11",
      title: "Standardized RFC 7807 Errors",
      icon: "❌",
      content: `<p>Error handling is critical to developer experience. APIs must return clean JSON payloads containing diagnostic details rather than cryptic raw stack traces.</p>
                <div class="api-concept-card">
                  <h4>RFC 7807 (Problem Details) Specification</h4>
                  <p>Specifies a standard error format JSON consisting of:</p>
                  <ul>
                    <li><code>type</code>: URI reference identifying the error type (e.g. validation guide).</li>
                    <li><code>title</code>: Short summary of the error type.</li>
                    <li><code>status</code>: Exact HTTP response status code.</li>
                    <li><code>detail</code>: Human-readable explanation.</li>
                    <li><code>invalid_params</code>: Array details on which specific inputs failed validation.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Problem Details JSON Builder",
        instruction: "Complete the missing status code (an integer) and validation failure details inside the RFC 7807 JSON schema representation below.",
        html: `
          <div style="margin-bottom: 15px;">
            <label class="api-label">RFC 7807 Error Builder (Editable JSON)</label>
            <textarea id="jsonError11" class="api-textarea" rows="12" style="font-family:monospace; font-size:0.8rem; line-height:1.4;">{
  "type": "https://api.myapp.com/errors/validation-failed",
  "title": "Input Validation Failed",
  "status": null,
  "detail": "The email address matches a pre-existing profile.",
  "invalid_params": [
    {
      "name": "email",
      "reason": ""
    }
  ]
}</textarea>
          </div>
        `
      }
    },
    {
      id: "12",
      title: "System Design: API Contract",
      icon: "⭐",
      content: `<p>A major test in system design interviews is creating the API interface contract. Designing endpoints, headers, and codes prevents architectural drift.</p>
                <div class="api-concept-card">
                  <h4>Designing a Production Spec</h4>
                  <ul>
                    <li><strong>Write the Endpoint Route:</strong> Use path variables for hierarchies and parameters for filters.</li>
                    <li><strong>Choose Status Semantics:</strong> Decide between 200 vs 201 vs 202.</li>
                    <li><strong>Verify Payload Contract:</strong> Request and response JSON schema agreements.</li>
                    <li><strong>Add Idempotency Keys:</strong> Essential for safe transaction retries.</li>
                  </ul>
                </div>`,
      challenge: {
        title: "Slack-style Messaging API Contract",
        instruction: "Design the endpoint to publish a new chat message into channel <code>general</code> (ID: <code>general_1</code>). Specify the HTTP method, the hierarchical route, success status code, and payload fields.",
        html: `
          <div class="challenge-grid">
            <div>
              <label class="api-label">HTTP Method</label>
              <select id="specMethod12" class="api-select">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div>
              <label class="api-label">Endpoint Route Path</label>
              <input type="text" id="specPath12" class="api-input" placeholder="/channels/general_1/messages">
            </div>
            <div>
              <label class="api-label">Expected Success Status Code</label>
              <input type="number" id="specStatus12" class="api-input" placeholder="e.g. 201">
            </div>
            <div>
              <label class="api-label">Select Required Payload Body Attributes</label>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" id="specField12_1" checked> <code>text_content</code> (Message text string)
                </label>
                <label style="font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" id="specField12_2"> <code>timestamp</code> (Server generated epoch)
                </label>
                <label style="font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" id="specField12_3"> <code>sender_ip</code> (Network request client address)
                </label>
              </div>
            </div>
          </div>
        `
      }
    }
  ];

  const mainContent = document.getElementById('mainContent');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressCount = document.getElementById('progressCount');
  const navLinks = document.querySelectorAll('.api-nav-link');

  function updateGlobalProgress() {
    const total = topicsData.length;
    const completed = completedTopics.length;
    const percentage = Math.round((completed / total) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressCount) progressCount.textContent = completed;
  }

  function renderHub() {
    let html = `<div class="api-lesson-header">
                  <h3>API Design Hub</h3>
                </div>
                <p>Select a topic below to begin learning. You must complete the complex coding challenge in each section to mark it as complete!</p>
                <div class="api-hub-grid">`;
    
    topicsData.forEach(topic => {
      const isCompleted = completedTopics.includes(topic.id);
      html += `
        <div class="api-hub-card ${isCompleted ? 'completed' : ''}" data-id="${topic.id}">
          <div class="api-hub-card-icon">${topic.icon}</div>
          <div class="api-hub-card-title">${topic.title}</div>
        </div>
      `;
    });
    html += `</div>`;
    
    mainContent.innerHTML = html;

    document.querySelectorAll('.api-hub-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        renderTopic(id);
      });
    });

    updateActiveNav('hub');
  }

  function renderTopic(id) {
    const topic = topicsData.find(t => t.id === id);
    if (!topic) return;

    const isCompleted = completedTopics.includes(id);

    let html = `
      <article class="api-lesson">
        <div class="api-lesson-header">
          <span class="api-lesson-number">${id.padStart(2, '0')}</span>
          <h3>${topic.title}</h3>
        </div>
        ${topic.content}

        <div class="quiz-container">
          <h4 style="margin-bottom:5px; color:var(--primary-light);">Interactive Workspace</h4>
          <p style="font-size:0.9rem; margin-bottom:15px; color:var(--text-primary); font-weight:500;">
            ${topic.challenge.instruction}
          </p>
          <div id="challengeWorkspace">
            ${topic.challenge.html}
          </div>
          
          <div id="feedbackContainer" style="margin-top: 15px; display:none; padding:12px; border-radius:6px; font-size:0.85rem; line-height:1.5;"></div>

          <div style="display:flex; gap:10px; margin-top:20px;">
            <button id="checkBtn" class="btn btn-secondary" style="flex:1;">Run Checks</button>
            <button id="completeBtn" class="btn btn-primary complete-topic-btn" disabled style="flex:1.2; margin-top:0;">Mark as Completed</button>
          </div>
        </div>
      </article>
    `;

    mainContent.innerHTML = html;

    // Smooth Scroll Fix to #api-design-learning container
    const section = document.getElementById('api-design-learning');
    if (section) {
      const yOffset = -85;
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    updateActiveNav(id);

    const completeBtn = document.getElementById('completeBtn');
    const checkBtn = document.getElementById('checkBtn');
    const feedback = document.getElementById('feedbackContainer');

    if (isCompleted) {
      completeBtn.textContent = "Topic Completed - Back to Hub";
      completeBtn.disabled = false;
      completeBtn.classList.replace('btn-primary', 'btn-secondary');
      checkBtn.style.display = 'none';
      
      // Auto pre-populate solved state visuals if desired, or just prompt back to hub
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(76,175,80,0.1)';
      feedback.style.border = '1px solid #4CAF50';
      feedback.style.color = '#4CAF50';
      feedback.style.fontWeight = '500';
      feedback.innerHTML = "✓ You have successfully completed this interactive workspace challenge!";
    } else {
      setupChallengeListeners(id, checkBtn, completeBtn, feedback);
    }

    completeBtn.addEventListener('click', () => {
      if (!isCompleted) {
        completedTopics.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTopics));
        updateGlobalProgress();
      }
      renderHub();
    });
  }

  function setupChallengeListeners(topicId, checkBtn, completeBtn, feedback) {
    // Listeners and variables for each dynamic challenge
    if (topicId === "1") {
      const method = document.getElementById('methodInput1');
      const path = document.getElementById('pathInput1');
      const pk1 = document.getElementById('paramKey1_1');
      const pv1 = document.getElementById('paramVal1_1');
      const pk2 = document.getElementById('paramKey1_2');
      const pv2 = document.getElementById('paramVal1_2');
      const preview = document.getElementById('requestPreview1');

      function updatePreview() {
        const query1 = pk1.value || pv1.value ? `?${pk1.value || 'key'}=${pv1.value || 'value'}` : '';
        const query2 = pk2.value || pv2.value ? `&${pk2.value || 'key'}=${pv2.value || 'value'}` : '';
        preview.textContent = `${method.value} https://api.blog.com${path.value || '/...'}${query1}${query2}`;
      }

      [method, path, pk1, pv1, pk2, pv2].forEach(el => el.addEventListener('input', updatePreview));
      updatePreview();

      checkBtn.addEventListener('click', () => {
        const rawPath = path.value.trim().toLowerCase();
        const p1k = pk1.value.trim().toLowerCase();
        const p1v = pv1.value.trim().toLowerCase();
        const p2k = pk2.value.trim().toLowerCase();
        const p2v = pv2.value.trim().toLowerCase();

        const pathOk = rawPath === '/posts/42/comments' || rawPath === '/posts/42/comments/';
        const methodOk = method.value === 'GET';
        
        // Find if page=2 and sort=newest are present in either position
        const paramsMatch = (
          ((p1k === 'page' && p1v === '2') && (p2k === 'sort' && p2v === 'newest')) ||
          ((p2k === 'page' && p2v === '2') && (p1k === 'sort' && p1v === 'newest'))
        );

        if (methodOk && pathOk && paramsMatch) {
          showSuccess(feedback, completeBtn, "Success! The requested resource was retrieved correctly with HTTP GET, proper nesting, and paginated query parameters.");
        } else {
          let msg = "Validation failed: ";
          if (!methodOk) msg += "Method must be GET (reading comments should be a safe read operation). ";
          if (!pathOk) msg += "Incorrect URL path nesting. Remember, comments belong to post 42: '/posts/42/comments'. ";
          if (!paramsMatch) msg += "Ensure both query parameters are correct: 'page=2' and 'sort=newest'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "2") {
      const authType = document.getElementById('authType2');
      const hKey = document.getElementById('headerKey2');
      const hVal = document.getElementById('headerVal2');
      const preview = document.getElementById('headersPreview2');

      function updatePreview() {
        preview.textContent = `GET /billing-details HTTP/1.1
Host: api.billing.com
${hKey.value || '[HeaderKey]'}: ${hVal.value || '[HeaderValue]'}`;
      }
      [authType, hKey, hVal].forEach(el => el.addEventListener('input', updatePreview));
      
      authType.addEventListener('change', () => {
        if (authType.value === 'bearer') {
          hKey.value = 'Authorization';
          hVal.value = 'Bearer mock_token_9832abc';
        } else if (authType.value === 'cookie') {
          hKey.value = 'Cookie';
          hVal.value = 'session_id=9832';
        } else {
          hKey.value = 'Authorization';
          hVal.value = 'Basic YWRtaW46cGFzczEyMw==';
        }
        updatePreview();
      });

      checkBtn.addEventListener('click', () => {
        const key = hKey.value.trim().toLowerCase();
        const val = hVal.value.trim();
        const typeOk = authType.value === 'bearer';
        const keyOk = key === 'authorization';
        const valOk = val === 'Bearer mock_token_9832abc';

        if (typeOk && keyOk && valOk) {
          showSuccess(feedback, completeBtn, "Pass! The request is now stateless and authenticated using the Authorization Bearer Token header.");
        } else {
          let msg = "Validation failed: ";
          if (!typeOk) msg += "Auth Type must be 'Authorization Bearer Token'. Cookies are rejectable state vectors here. ";
          if (!keyOk) msg += "Header name must be exactly 'Authorization'. ";
          if (!valOk) msg += "Header value must be exactly 'Bearer mock_token_9832abc'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "3") {
      const method = document.getElementById('method3');
      const path = document.getElementById('path3');
      const body = document.getElementById('body3');
      const dbState = document.getElementById('dbState3');

      checkBtn.addEventListener('click', () => {
        const rawPath = path.value.trim().toLowerCase();
        const methodVal = method.value;
        const pathOk = rawPath === '/users/101' || rawPath === '/users/101/';
        
        let jsonParsed = null;
        try {
          jsonParsed = JSON.parse(body.value);
        } catch {}

        const bodyOk = jsonParsed && jsonParsed.phone === "+999999" && Object.keys(jsonParsed).length === 1;

        if (methodVal === 'PATCH' && pathOk && bodyOk) {
          dbState.innerHTML = `{
  "id": 101,
  "username": "coder_infinity",
  "email": "coder@infinity.com",
  "phone": "+999999"
}`;
          showSuccess(feedback, completeBtn, "Excellent choice! PATCH was used to apply a partial update. The database has updated phone while preserving email and username.");
        } else {
          let msg = "Validation failed: ";
          if (methodVal === 'PUT') {
            dbState.innerHTML = `{
  "phone": "+999999"
}`;
            msg += "Error: PUT replaces the entire resource. Check the database preview — 'username' and 'email' were wiped out! Use PATCH. ";
          } else if (methodVal === 'POST') {
            msg += "POST is typically used for creation. To update a specific ID, use PATCH. ";
          }
          if (!pathOk) msg += "Incorrect route path. The user's resource URL is '/users/101'. ";
          if (jsonParsed && Object.keys(jsonParsed).length > 1) msg += "Do not send other fields (like email or username) in PATCH payloads if they didn't change. ";
          if (!jsonParsed) msg += "Verify that payload body is valid JSON syntax. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "4") {
      const in1 = document.getElementById('linterInput1');
      const in2 = document.getElementById('linterInput2');
      const in3 = document.getElementById('linterInput3');

      checkBtn.addEventListener('click', () => {
        const v1 = in1.value.trim().replace(/\s+/g, ' ');
        const v2 = in2.value.trim().replace(/\s+/g, ' ');
        const v3 = in3.value.trim().replace(/\s+/g, ' ');

        const ok1 = /^GET\s+\/users\/88\/orders\?status=active$/i.test(v1) || 
                    /^GET\s+\/users\/88\/orders\?active=true$/i.test(v1);
        const ok2 = /^DELETE\s+\/users\/88$/i.test(v2);
        const ok3 = /^PATCH\s+\/products\/45$/i.test(v3) || /^PUT\s+\/products\/45$/i.test(v3);

        if (ok1 && ok2 && ok3) {
          showSuccess(feedback, completeBtn, "Correct! All three API endpoints have been successfully linted according to RESTful hierarchical noun conventions.");
        } else {
          let msg = "Verification failed: ";
          if (!ok1) msg += "Endpoint 1: Use GET and nest orders under users: 'GET /users/88/orders?status=active'. ";
          if (!ok2) msg += "Endpoint 2: Use DELETE with resource identifier: 'DELETE /users/88'. ";
          if (!ok3) msg += "Endpoint 3: Use PATCH/PUT with the product identifier directly: 'PATCH /products/45'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "5") {
      const sc1 = document.getElementById('statusCode1');
      const sc2 = document.getElementById('statusCode2');
      const sc3 = document.getElementById('statusCode3');
      const sc4 = document.getElementById('statusCode4');

      checkBtn.addEventListener('click', () => {
        const ok1 = sc1.value === "201";
        const ok2 = sc2.value === "403";
        const ok3 = sc3.value === "400";
        const ok4 = sc4.value === "429";

        if (ok1 && ok2 && ok3 && ok4) {
          showSuccess(feedback, completeBtn, "Success! You correctly identified all the standard response status codes.");
        } else {
          let msg = "Validation failed: ";
          if (!ok1) msg += "1: Creating a profile immediately should return 201 Created. ";
          if (!ok2) msg += "2: Authenticated but restricted from resource operations is a 403 Forbidden. ";
          if (!ok3) msg += "3: Malformed parameters causing failure is a 400 Bad Request. ";
          if (!ok4) msg += "4: Exceeding rates limits must return 429 Too Many Requests. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "6") {
      const key = document.getElementById('versionHeaderKey');
      const val = document.getElementById('versionHeaderVal');
      const preview = document.getElementById('versionPreview6');

      function updatePreview() {
        preview.textContent = `GET /reports HTTP/1.1
Host: api.metrics.com
${key.value || '[HeaderKey]'}: ${val.value || '[HeaderValue]'}`;
      }
      [key, val].forEach(el => el.addEventListener('input', updatePreview));

      checkBtn.addEventListener('click', () => {
        const k = key.value.trim().toLowerCase();
        const v = val.value.trim();
        const kOk = k === 'x-api-version';
        const vOk = v === '2';

        if (kOk && vOk) {
          showSuccess(feedback, completeBtn, "Pass! Header custom negotiations successfully mapped to return the version 2 reports.");
        } else {
          let msg = "Validation failed: ";
          if (!kOk) msg += "Header Key must be exactly 'X-API-Version'. ";
          if (!vOk) msg += "Header Value must be exactly '2'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "7") {
      const consoleEl = document.getElementById('pagConsole7');
      const btnOffset = document.getElementById('btnOffset7');
      const btnCursor = document.getElementById('btnCursor7');
      const pagSelect = document.getElementById('pagSelect7');

      btnOffset.addEventListener('click', () => {
        consoleEl.innerHTML = `[Request] GET /messages?limit=5&offset=5
[Database] Concurrent Write: User inserted new message at top (ID: 6).
[Response] Payload loaded:
- Message ID 5 (Wait, we read this on page 1!)
- Message ID 4
- Message ID 3
- Message ID 2
- Message ID 1
<strong>Warning: Message ID 5 duplicated due to offset shift drift!</strong>`;
      });

      btnCursor.addEventListener('click', () => {
        consoleEl.innerHTML = `[Request] GET /messages?limit=5&starting_after=5
[Database] Concurrent Write: User inserted new message at top (ID: 6).
[Response] Payload loaded:
- Message ID 4
- Message ID 3
- Message ID 2
- Message ID 1
- Message ID 0 (Page fits 5 items perfectly)
<strong>Success: No duplicates or drift items returned!</strong>`;
      });

      checkBtn.addEventListener('click', () => {
        if (pagSelect.value === 'cursor') {
          showSuccess(feedback, completeBtn, "Pass! Cursor represents the pointer value that avoids offset calculation drift under database mutations.");
        } else {
          showError(feedback, "Incorrect. Choose 'cursor (or starting_after)' parameter.");
        }
      });
    }

    else if (topicId === "8") {
      const payloadArea = document.getElementById('jwtJson8');
      const encodedPayload = document.getElementById('jwtPayload8');
      const signatureText = document.getElementById('jwtSign8');
      const jwtStatus = document.getElementById('jwtStatus8');
      const jwtSelect = document.getElementById('jwtSelect8');

      payloadArea.addEventListener('input', () => {
        try {
          const parsed = JSON.parse(payloadArea.value);
          const base64 = btoa(JSON.stringify(parsed)).replace(/=/g, '');
          encodedPayload.textContent = base64;
          
          if (parsed.role === 'admin') {
            jwtStatus.textContent = "✗ Signature Mismatch";
            jwtStatus.style.background = 'rgba(244,67,54,0.1)';
            jwtStatus.style.border = '1px solid #f44336';
            jwtStatus.style.color = '#f44336';
            signatureText.textContent = "INVALID_TAMPERED_SIGNATURE_HASH_RESTRICTED";
          } else {
            jwtStatus.textContent = "✓ Signature Valid";
            jwtStatus.style.background = 'rgba(76,175,80,0.1)';
            jwtStatus.style.border = '1px solid #4CAF50';
            jwtStatus.style.color = '#4CAF50';
            signatureText.textContent = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
          }
        } catch {
          jwtStatus.textContent = "✗ JSON Syntax Error";
        }
      });

      checkBtn.addEventListener('click', () => {
        try {
          const parsed = JSON.parse(payloadArea.value);
          const selectionOk = jwtSelect.value === "2";
          if (parsed.role === 'admin' && selectionOk) {
            showSuccess(feedback, completeBtn, "Pass! You changed the role to admin, causing the signature check to fail because only the server secret key can generate a valid matching signature hash!");
          } else {
            let msg = "Validation failed: ";
            if (parsed.role !== 'admin') msg += "Please edit the JSON payload textarea to change 'role': 'member' to 'role': 'admin'. ";
            if (!selectionOk) msg += "Select the correct answer to the question regarding why verification fails. ";
            showError(feedback, msg);
          }
        } catch {
          showError(feedback, "Ensure the JSON payload area is syntactically valid.");
        }
      });
    }

    else if (topicId === "9") {
      const capInput = document.getElementById('bucketCap9');
      const refillInput = document.getElementById('bucketRefill9');
      const lblCap = document.getElementById('lblCap9');
      const lblRefill = document.getElementById('lblRefill9');
      const bucketFill = document.getElementById('bucketFill9');
      const bucketCount = document.getElementById('bucketCount9');
      const btnTrigger = document.getElementById('btnTrigger9');
      const btnRunSim = document.getElementById('btnRunSim9');
      const simOutput = document.getElementById('simOutput9');

      let tokens = parseInt(capInput.value);
      let capacity = tokens;
      let refill = parseInt(refillInput.value);

      function updateBucketVisual() {
        const pct = Math.min((tokens / capacity) * 100, 100);
        bucketFill.style.height = `${pct}%`;
        bucketCount.textContent = `${Math.floor(tokens)} / ${capacity} Tokens`;
      }

      capInput.addEventListener('input', () => {
        capacity = parseInt(capInput.value);
        tokens = capacity;
        lblCap.textContent = capacity;
        updateBucketVisual();
      });

      refillInput.addEventListener('input', () => {
        refill = parseInt(refillInput.value);
        lblRefill.textContent = refill;
      });

      // Continuous refill loop
      let lastRefillTime = Date.now();
      const refillInterval = setInterval(() => {
        if (tokens < capacity) {
          const now = Date.now();
          const elapsed = (now - lastRefillTime) / 1000;
          tokens = Math.min(capacity, tokens + (refill * elapsed));
          updateBucketVisual();
        }
        lastRefillTime = Date.now();
      }, 200);

      // Clean up interval on navigation
      const mainContentObserver = new MutationObserver((mutations, obs) => {
        if (!document.getElementById('bucketCap9')) {
          clearInterval(refillInterval);
          obs.disconnect();
        }
      });
      mainContentObserver.observe(mainContent, { childList: true, subtree: true });

      btnTrigger.addEventListener('click', () => {
        if (tokens >= 1) {
          tokens--;
          updateBucketVisual();
          simOutput.innerHTML = `<span style="color:#4CAF50;">[200 OK] Request processed. Drained 1 token.</span>`;
        } else {
          simOutput.innerHTML = `<span style="color:#f44336;">[429 Too Many Requests] Rate limit exceeded! Bucket is empty.</span>`;
        }
      });

      btnRunSim.addEventListener('click', () => {
        simOutput.innerHTML = `Running burst simulation... Sending 12 rapid requests...`;
        tokens = capacity;
        let successful = 0;
        let failed = 0;

        for (let i = 0; i < 12; i++) {
          if (tokens >= 1) {
            tokens--;
            successful++;
          } else {
            failed++;
          }
        }
        updateBucketVisual();

        if (capacity >= 12 && refill >= 3) {
          showSuccess(feedback, completeBtn, `Pass! Limiter handles a burst of ${successful} requests. Refill rate (${refill} tokens/s) meets the minimum continuous request threshold.`);
          simOutput.innerHTML = `<strong>Simulation Passed!</strong><br>Burst Handled: ${successful}/12<br>Rate Refill Level: ${refill}/sec.`;
        } else {
          simOutput.innerHTML = `<strong>Simulation Failed!</strong><br>Burst Handled: ${successful}/12 requests.<br>Rate limits exceeded: ${failed} requests rejected (HTTP 429).<br><i>Hint: Capacity must be at least 12 and refill rate at least 3!</i>`;
        }
      });

      checkBtn.addEventListener('click', () => {
        if (capacity >= 12 && refill >= 3) {
          showSuccess(feedback, completeBtn, "Limiter configured correctly to allow 12 bursts and 3 continuous requests.");
        } else {
          showError(feedback, "Limiter details incorrect. Adjust sliders so Capacity >= 12 and Refill Rate >= 3, then run the simulation.");
        }
      });
    }

    else if (topicId === "10") {
      const key = document.getElementById('etagKey10');
      const val = document.getElementById('etagVal10');
      const preview = document.getElementById('requestPreview10');

      function updatePreview() {
        preview.textContent = `GET /dashboard-data HTTP/1.1
Host: api.analytics.com
${key.value || '[HeaderKey]'}: ${val.value || '[HeaderValue]'}`;
      }
      [key, val].forEach(el => el.addEventListener('input', updatePreview));

      checkBtn.addEventListener('click', () => {
        const k = key.value.trim().toLowerCase();
        const v = val.value.trim().replace(/['"]/g, ''); // strip quotes for validation flexibility
        const kOk = k === 'if-none-match';
        const vOk = v === 'etag_x192';

        if (kOk && vOk) {
          preview.textContent += `

HTTP/1.1 304 Not Modified
Cache-Control: private, max-age=3600
[Cache Status: HIT - 0 Bytes Transferred]`;
          showSuccess(feedback, completeBtn, "Success! The conditional request was configured correctly. The server returned a 304 Not Modified status, preventing duplicate data transfers.");
        } else {
          let msg = "Validation failed: ";
          if (!kOk) msg += "Header Key must be exactly 'If-None-Match'. ";
          if (!vOk) msg += "Header Value must match the server ETag value 'etag_x192'. ";
          showError(feedback, msg);
        }
      });
    }

    else if (topicId === "11") {
      const jsonArea = document.getElementById('jsonError11');

      checkBtn.addEventListener('click', () => {
        try {
          const err = JSON.parse(jsonArea.value);
          const statusOk = parseInt(err.status) === 400 || parseInt(err.status) === 422;
          const param = err.invalid_params && err.invalid_params[0];
          const reasonOk = param && param.name === "email" && param.reason.trim().length > 3;

          if (statusOk && reasonOk) {
            showSuccess(feedback, completeBtn, `Validation passed! RFC 7807 problem payload contains proper status (${err.status}) and detailed parameters diagnostic reasons.`);
          } else {
            let msg = "Validation failed: ";
            if (!statusOk) msg += "The HTTP status should represent a client payload error (typically 400 Bad Request or 422 Unprocessable Entity). ";
            if (!reasonOk) msg += "Provide a descriptive validation reason inside invalid_params 'reason' field for email attribute. ";
            showError(feedback, msg);
          }
        } catch {
          showError(feedback, "JSON validation error: Ensure your payload syntax is correct (valid brackets, double quotes for all keys and strings).");
        }
      });
    }

    else if (topicId === "12") {
      const method = document.getElementById('specMethod12');
      const path = document.getElementById('specPath12');
      const statusInput = document.getElementById('specStatus12');
      const field1 = document.getElementById('specField12_1');
      const field2 = document.getElementById('specField12_2');
      const field3 = document.getElementById('specField12_3');

      checkBtn.addEventListener('click', () => {
        const rawPath = path.value.trim().toLowerCase();
        const mOk = method.value === 'POST';
        
        // Match /channels/general_1/messages or /channels/{id}/messages
        const pathOk = rawPath === '/channels/general_1/messages' || 
                       rawPath === '/channels/general_1/messages/' ||
                       rawPath === '/channels/{channelid}/messages' ||
                       rawPath === '/messages';

        const codeOk = parseInt(statusInput.value) === 201;
        const attrOk = field1.checked && !field2.checked && !field3.checked;

        if (mOk && pathOk && codeOk && attrOk) {
          showSuccess(feedback, completeBtn, "Contract Validated! POST is correct for resource creation, returning a status 201 Created. Request body attributes correctly filter to client-contributed content (excluding server fields like timestamp/IP).");
        } else {
          let msg = "API contract validation errors: ";
          if (!mOk) msg += "Publishing/creating a message resource requires a POST method. ";
          if (!pathOk) msg += "Incorrect URI routing hierarchy. Target endpoint should route to 'channels' or 'messages'. ";
          if (!codeOk) msg += "Success status code should be 201 (Created) for resource instantiation. ";
          if (!attrOk) {
            if (!field1.checked) msg += "Request body requires the 'text_content' parameter. ";
            if (field2.checked) msg += "Error: 'timestamp' is server-generated, including it in request payloads causes input spoofing. ";
            if (field3.checked) msg += "Error: 'sender_ip' is inferred from socket connection, do not request in body payload. ";
          }
          showError(feedback, msg);
        }
      });
    }
  }

  function showSuccess(feedbackEl, completeBtn, message) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(76,175,80,0.1)';
    feedbackEl.style.border = '1px solid #4CAF50';
    feedbackEl.style.color = '#4CAF50';
    feedbackEl.innerHTML = `<strong>Success!</strong> ${message}`;
    completeBtn.disabled = false;
  }

  function showError(feedbackEl, message) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(244,67,54,0.1)';
    feedbackEl.style.border = '1px solid #f44336';
    feedbackEl.style.color = '#f44336';
    feedbackEl.innerHTML = `<strong>Error:</strong> ${message}`;
  }

  function updateActiveNav(id) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-topic-id') === id) {
        link.classList.add('active');
      }
    });
  }

  // Bind Sidebar Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-topic-id');
      if (id === 'hub') renderHub();
      else renderTopic(id);
    });
  });

  /* 1. HERO TYPING ANIMATION */
  const words = ['API Basics', 'REST Principles', 'Authentication', 'Rate Limiting', 'Caching', 'System Design', 'Status Codes', 'Interview Prep'];
  const typingElement = document.getElementById('typingTextApi');
  if (typingElement) {
    let wordIndex = 0; let charIndex = 0; let deleting = false; let timeoutId = null;
    function typeEffect() {
      const currentWord = words[wordIndex];
      if (deleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }
      let speed = deleting ? 50 : 100;
      if (!deleting && charIndex === currentWord.length) { speed = 1800; deleting = true; }
      if (deleting && charIndex === 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; speed = 400; }
      timeoutId = setTimeout(typeEffect, speed);
    }
    typeEffect();
    window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
  }

  /* 2. STATS COUNTER ANIMATION */
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      if (counter.dataset.counted) return;
      counter.dataset.counted = 'true';
      const target = parseInt(counter.dataset.target, 10);
      let current = 0;
      const increment = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(timer); }
        counter.textContent = current;
      }, 30);
      counterObserver.unobserve(counter);
    });
  }, { threshold: 0.5 });
  counters.forEach(counter => counterObserver.observe(counter));

  // Bind Hero Stats Click Navigation
  const statBoxTopics = document.getElementById('statBoxTopics');
  const statBoxExamples = document.getElementById('statBoxExamples');
  const statBoxInterviews = document.getElementById('statBoxInterviews');

  if (statBoxTopics) {
    statBoxTopics.addEventListener('click', () => {
      renderHub();
      const section = document.getElementById('api-design-learning');
      if (section) {
        const yOffset = -85;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  }

  if (statBoxExamples) {
    statBoxExamples.addEventListener('click', () => {
      renderTopic("3"); // Render HTTP Methods (Postman Console CRUD example)
    });
  }

  if (statBoxInterviews) {
    statBoxInterviews.addEventListener('click', () => {
      renderTopic("12"); // Render API Spec Contract Spec design challenge
    });
  }

  // Initialize
  updateGlobalProgress();
  renderHub();

});
