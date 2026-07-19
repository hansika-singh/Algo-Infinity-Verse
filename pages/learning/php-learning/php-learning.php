<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learn PHP – Beginner Guide | Algo Infinity Verse</title>
    <meta name="description" content="Free beginner-friendly PHP tutorial covering syntax, variables, conditionals, loops, arrays, forms, superglobals, sessions, cookies, and security with interactive exercises." />
    <link rel="stylesheet" href="styles.css" />
    <link rel="stylesheet" href="php-learning.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Poppins:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body>
    <!-- Loading Screen -->
    <div id="loading-screen" class="hidden">
      <div class="loader">
        <div class="infinity-loader">∞</div>
        <h2>Algo Infinity Verse</h2>
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    </div>

    <!-- Scroll to Top Button -->
    <button id="scrollTopBtn" class="scroll-top-btn" aria-label="Scroll to top">
      <i class="fas fa-arrow-up"></i>
    </button>

    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-logo">
        <span class="logo-text">∞</span>
        <span class="logo-title">Algo Infinity Verse</span>
      </div>
      <ul class="nav-links" id="navLinks">
        <li class="nav-item">
          <a href="index.html#home" class="nav-link">Home</a>
        </li>
        <li class="nav-item has-dropdown">
          <button class="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
            <span>Learn</span>
            <i class="fas fa-chevron-down dropdown-icon"></i>
          </button>
          <div class="dropdown-menu" role="menu">
            <a href="index.html#topics" class="dropdown-item" role="menuitem">DSA Topics</a>
            <a href="index.html#practice" class="dropdown-item" role="menuitem">Practice Problems</a>
            <a href="index.html#quiz" class="dropdown-item" role="menuitem">Quizzes</a>
            <a href="index.html#roadmap" class="dropdown-item" role="menuitem">Learning Roadmap</a>
            <a href="python-learning.html" class="dropdown-item" role="menuitem">Learn Python</a>
            <a href="javascript-learning.html" class="dropdown-item" role="menuitem">Learn JavaScript</a>
            <a href="java-learning.html" class="dropdown-item" role="menuitem">Learn Java</a>
            <a href="cplusplus-learning.html" class="dropdown-item" role="menuitem">Learn C++</a>
            <a href="c-learning.html" class="dropdown-item" role="menuitem">Learn C</a>
            <a href="dbms-learning.html" class="dropdown-item" role="menuitem">Learn DBMS</a>
            <a href="powerbi-learning.html" class="dropdown-item" role="menuitem">Learn Power BI</a>
            <a href="php-learning.html" class="dropdown-item active" role="menuitem">Learn PHP</a>
            <a href="oop-learning.html" class="dropdown-item " role="menuitem">Learn OOP</a>
<a href="computer-architecture.html" class="dropdown-item">Learn Architecture</a>
<a href="tree-traversal.html" class="dropdown-item">Tree Traversal</a>
            <a href="sorting-visualizer.html" class="dropdown-item" role="menuitem">Sorting Visualizer</a>
          </div>
        </li>
        <li class="nav-item has-dropdown">
          <button class="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
            <span>Interview</span>
            <i class="fas fa-chevron-down dropdown-icon"></i>
          </button>
          <div class="dropdown-menu" role="menu">
            <a href="index.html#interview" class="dropdown-item" role="menuitem">Interview Prep</a>
            <a href="cheat-sheets.html" class="dropdown-item" role="menuitem">DSA Cheat Sheets</a>
            <a href="system-design.html" class="dropdown-item" role="menuitem">System Design</a>
            <a href="behavioral-questions.html" class="dropdown-item" role="menuitem">Behavioral Questions</a>
          </div>
        </li>
        <li class="nav-item has-dropdown">
          <button class="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
            <span>Community</span>
            <i class="fas fa-chevron-down dropdown-icon"></i>
          </button>
          <div class="dropdown-menu" role="menu">
            <a href="community.html" class="dropdown-item" role="menuitem">Discussions</a>
            <a href="index.html#dashboard" class="dropdown-item" role="menuitem">Leaderboard</a>
            <a href="support-page/index.html" class="dropdown-item" role="menuitem">Support</a>
            <a href="feedback.html" class="dropdown-item" role="menuitem">Feedback</a>
          </div>
        </li>
        <li class="nav-item has-dropdown nav-profile-dropdown">
          <button class="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
            <span>Profile</span>
            <i class="fas fa-chevron-down dropdown-icon"></i>
          </button>
          <div class="dropdown-menu dropdown-menu-end" role="menu">
            <a href="index.html#dashboard" class="dropdown-item" role="menuitem">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
            <a href="index.html#profile" class="dropdown-item" role="menuitem">
              <i class="fas fa-user"></i>
              My Profile
            </a>
            <a href="/execution-history.html" class="dropdown-item" role="menuitem" data-auth-required>
              <i class="fas fa-history"></i>
              Execution History
            </a>
            <a href="/pages/career/resume/resume.html" class="dropdown-item" role="menuitem">
              <i class="fas fa-file-alt"></i>
              Coding Resume
            </a>
            <div class="dropdown-divider"></div>
            <a href="login.html" class="dropdown-item nav-auth-link" role="menuitem" id="navLoginBtn">
              <i class="fas fa-sign-in-alt"></i>
              Sign In
            </a>
            <a href="signup.html" class="dropdown-item nav-auth-link" role="menuitem" id="navSignupBtn">
              <i class="fas fa-user-plus"></i>
              Sign Up
            </a>
          </div>
        </li>
      </ul>
      <div class="nav-buttons">
        <button id="darkModeToggle" class="dark-mode-btn" aria-label="Toggle dark mode">
          <i class="fas fa-moon"></i>
        </button>
        <button id="menuToggle" class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero">
      <div class="hero-background">
        <div class="stars"></div>
        <div class="stars2"></div>
        <div class="stars3"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-line">Start Your Journey With</span>
          <span class="main-title gradient-text">PHP Programming</span>
          <span class="subtitle">Learn Backend Basics, Form Processing &amp; Session Management</span>
        </h1>
        <div class="typing-container">
          <span class="typing-text_php" id="typingTextPhp"></span>
          <span class="typing-cursor">|</span>
        </div>
        <div class="hero-buttons">
          <a href="#introduction" class="btn btn-primary">
            <i class="fas fa-play"></i> Start Learning
          </a>
          <a href="#exercise-introduction" class="btn btn-secondary">
            <i class="fas fa-pen"></i> Practice Exercises
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat-box">
            <span class="stat-number" data-target="13">0</span>
            <span class="stat-label">Topics</span>
          </div>
          <div class="stat-box">
            <span class="stat-number" data-target="45">0</span>
            <span class="stat-label">Examples</span>
          </div>
          <div class="stat-box">
            <span class="stat-number" data-target="13">0</span>
            <span class="stat-label">Exercises</span>
          </div>
        </div>
      </div>
      <div class="scroll-indicator">
        <i class="fas fa-chevron-down"></i>
      </div>
    </section>

    <!-- PHP Learning Section -->
    <section id="php-learning" class="section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">🐘</span>
          Learn PHP
        </h2>
        <p class="section-subtitle">
          Master server-side web development from simple syntax up to state handling with cookies and sessions.
        </p>

        <!-- Progress Bar -->
        <div class="php-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Learning progress">
          <span class="php-progress-text"><span id="progressCount">0</span> / 13 topics completed</span>
          <div class="php-progress-track">
            <div class="php-progress-fill" id="progressFill"></div>
          </div>
        </div>

        <div class="php-layout">
          <!-- Sidebar Navigation -->
          <aside class="php-sidebar" aria-label="Topic navigation">
            <div class="php-sidebar-title">Topics</div>
            <ul class="php-sidebar-nav" id="topicNav">
              <li><a href="#introduction"><span class="nav-icon">📖</span> Introduction</a></li>
              <li><a href="#setup"><span class="nav-icon">⚙️</span> Setup &amp; Server</a></li>
              <li><a href="#syntax"><span class="nav-icon">📝</span> Syntax Basics</a></li>
              <li><a href="#variables"><span class="nav-icon">📦</span> Variables &amp; Types</a></li>
              <li><a href="#operators"><span class="nav-icon">➕</span> Operators</a></li>
              <li><a href="#io"><span class="nav-icon">🗣️</span> Input &amp; Output</a></li>
              <li><a href="#conditionals"><span class="nav-icon">🔀</span> Conditionals</a></li>
              <li><a href="#loops"><span class="nav-icon">🔄</span> Loops</a></li>
              <li><a href="#functions"><span class="nav-icon">⚡</span> Functions</a></li>
              <li><a href="#arrays"><span class="nav-icon">📊</span> Arrays</a></li>
              <li><a href="#forms"><span class="nav-icon">📥</span> Forms Handling</a></li>
              <li><a href="#superglobals"><span class="nav-icon">🌐</span> Superglobals</a></li>
              <li><a href="#sessions-cookies"><span class="nav-icon">🍪</span> Sessions &amp; Cookies</a></li>
            </ul>
          </aside>

          <!-- Main Content -->
          <main class="php-main-content" id="mainContent">

            <!-- 1. Introduction to PHP -->
            <article class="php-lesson" id="introduction" data-topic="1">
              <div class="php-lesson-header">
                <span class="php-lesson-number">01</span>
                <h3>Introduction to PHP</h3>
              </div>
              <p>
                <strong>PHP (Hypertext Preprocessor)</strong> is an open-source, widely-used server-side scripting language designed specifically for web development. Unlike frontend languages (HTML, CSS, JS) that run inside the client's web browser, PHP executes directly on the web server.
              </p>
              <p>
                When a user requests a page containing PHP, the server processes the PHP code, generates standard HTML dynamically, and sends only the plain HTML back to the browser. This makes it a core engine for backend tasks like data retrieval, session control, and API development.
              </p>

              <div class="php-concept-card">
                <h4>Why Learn PHP?</h4>
                <ul>
                  <li><strong>Easy to Adopt:</strong> Its syntax is very logical and friendly for beginners coming from HTML or C-style languages.</li>
                  <li><strong>Powers Most of the Web:</strong> Over 75% of websites with known backend technologies run on PHP, including platforms like WordPress, Joomla, and Drupal.</li>
                  <li><strong>Database Integration:</strong> Offers native support for relational databases (like MySQL, PostgreSQL, and SQLite).</li>
                  <li><strong>Strong Framework Ecosystem:</strong> Powers modern high-productivity backend frameworks like Laravel and Symfony.</li>
                </ul>
              </div>

              <div class="php-exercise" id="exercise-introduction">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Introduction to PHP
                </div>
                <p>Which statement correctly describes how PHP processes a page request?</p>
                <ul>
                  <li>A) The server sends PHP source code to the browser, which compiles and runs it inside sandbox engines.</li>
                  <li>B) The web server runs the PHP script, generates output (such as HTML), and returns that output to the client's browser.</li>
                  <li>C) PHP compiles CSS and Javascript stylesheets into binary objects on the client machine.</li>
                  <li>D) PHP is a database server that replaces SQL engines.</li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-introduction">Show Solution</button>
                <div class="php-exercise-solution" id="solution-introduction">
                  <p><strong>Correct Answer: B</strong></p>
                  <p>Explanation: PHP is a server-side language. The server runs the script, builds the final HTML text, and returns only that HTML to the client browser, keeping the database logic and secret code hidden.</p>
                </div>
              </div>
            </article>

            <!-- 2. Setup & Local Server -->
            <article class="php-lesson" id="setup" data-topic="2">
              <div class="php-lesson-header">
                <span class="php-lesson-number">02</span>
                <h3>PHP Setup &amp; Local Server Guide</h3>
              </div>
              <p>
                To run PHP locally, you need a server environment. The easiest way is using one-click installation packages containing Apache (web server), PHP, and MySQL.
              </p>
              
              <div class="php-concept-card">
                <h4>Popular Local Server Packages</h4>
                <ul>
                  <li><strong>XAMPP (Windows, macOS, Linux):</strong> The most popular cross-platform local server setup.</li>
                  <li><strong>WAMP (Windows):</strong> A great lightweight option specifically tailored for Windows.</li>
                  <li><strong>Laravel Valet / Herd (macOS/Windows):</strong> Highly optimized developers tools that run ultra-fast background services without Apache.</li>
                </ul>
              </div>

              <h4>PHP Built-in Server</h4>
              <p>
                If you already have PHP installed on your terminal, you can start a development server immediately without installing third-party GUI applications:
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">CLI</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="php -S localhost:8000">Copy</button>
                </div>
                <pre><code>php -S localhost:8000</code></pre>
              </div>

              <div class="php-callout">
                <span class="php-callout-icon">💡</span>
                <p>When using XAMPP, you must place your files in the <code>htdocs</code> folder. On WAMP, place them inside <code>www</code>. You then run them by visiting <code>http://localhost/your-file.php</code> in your web browser.</p>
              </div>

              <div class="php-exercise" id="exercise-setup">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Local Server Setup
                </div>
                <p>When running a local XAMPP Apache server, what folder directory must your PHP project files be saved in to resolve on localhost?</p>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-setup">Show Solution</button>
                <div class="php-exercise-solution" id="solution-setup">
                  <p><strong>Answer: htdocs</strong></p>
                  <p>Explanation: Apache in XAMPP defaults its document root to the `htdocs` directory (located inside the XAMPP installation directory). Files saved there are resolved relative to `http://localhost/`.</p>
                </div>
              </div>
            </article>

            <!-- 3. Syntax Basics -->
            <article class="php-lesson" id="syntax" data-topic="3">
              <div class="php-lesson-header">
                <span class="php-lesson-number">03</span>
                <h3>PHP Syntax Basics</h3>
              </div>
              <p>
                PHP scripts are embedded inside standard HTML pages using specific delimiter tags. A PHP code block starts with <code>&lt;?php</code> and ends with <code>?&gt;</code>.
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// Single-line comment
# Another single-line comment

/*
  Multi-line
  comment block
*/

echo &quot;Hello from PHP!&quot;;
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// Single-line comment</span>
<span class="tok-cmt"># Another single-line comment</span>

<span class="tok-cmt">/*
  Multi-line
  comment block
*/</span>

<span class="tok-kw">echo</span> <span class="tok-str">"Hello from PHP!"</span>;
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-concept-card">
                <h4>Core Syntax Rules</h4>
                <ul>
                  <li><strong>Semicolons:</strong> Every PHP statement must end with a semicolon (<code>;</code>). Leaving it out triggers syntax parse errors.</li>
                  <li><strong>Case Sensitivity:</strong> Variable names are fully case-sensitive (e.g. <code>$x</code> and <code>$X</code> are different). However, built-in functions, keywords (like <code>if</code>, <code>else</code>, <code>echo</code>), and classes are case-insensitive.</li>
                </ul>
              </div>

              <div class="php-exercise" id="exercise-syntax">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Syntax Basics
                </div>
                <p>Which of the following will result in a syntax error in PHP?</p>
                <ul>
                  <li>A) <code>echo "Hello";</code></li>
                  <li>B) <code>ECHO "Hello";</code></li>
                  <li>C) <code>$val = "A" $val2 = "B";</code></li>
                  <li>D) <code>// print "Hello";</code></li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-syntax">Show Solution</button>
                <div class="php-exercise-solution" id="solution-syntax">
                  <p><strong>Correct Answer: C</strong></p>
                  <p>Explanation: Semicolons are required to terminate statements. Failing to place a semicolon between the assignment of `$val` and `$val2` causes a parse error.</p>
                </div>
              </div>
            </article>

            <!-- 4. Variables and Data Types -->
            <article class="php-lesson" id="variables" data-topic="4">
              <div class="php-lesson-header">
                <span class="php-lesson-number">04</span>
                <h3>Variables and Data Types</h3>
              </div>
              <p>
                In PHP, variables start with a dollar sign (<code>$</code>) followed by the variable name. PHP is a loosely typed language, meaning you do not need to define its data type upon creation.
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
$name = &quot;John Doe&quot;;     // String
$age = 30;              // Integer
$price = 19.99;         // Float (Double)
$isActive = true;       // Boolean
$fruits = [&quot;Apple&quot;, &quot;Banana&quot;]; // Array
$empty = null;          // NULL

var_dump($name);
var_dump($price);
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-var">$name</span> <span class="tok-op">=</span> <span class="tok-str">"John Doe"</span>;     <span class="tok-cmt">// String</span>
<span class="tok-var">$age</span> <span class="tok-op">=</span> <span class="tok-num">30</span>;              <span class="tok-cmt">// Integer</span>
<span class="tok-var">$price</span> <span class="tok-op">=</span> <span class="tok-num">19.99</span>;         <span class="tok-cmt">// Float (Double)</span>
<span class="tok-var">$isActive</span> <span class="tok-op">=</span> <span class="tok-bool">true</span>;       <span class="tok-cmt">// Boolean</span>
<span class="tok-var">$fruits</span> <span class="tok-op">=</span> [<span class="tok-str">"Apple"</span>, <span class="tok-str">"Banana"</span>]; <span class="tok-cmt">// Array</span>
<span class="tok-var">$empty</span> <span class="tok-op">=</span> <span class="tok-bool">null</span>;          <span class="tok-cmt">// NULL</span>

<span class="tok-fn">var_dump</span>(<span class="tok-var">$name</span>);
<span class="tok-fn">var_dump</span>(<span class="tok-var">$price</span>);
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>string(8) "John Doe"
float(19.99)</pre>
              </div>

              <div class="php-concept-card">
                <h4>Naming Rules for Variables</h4>
                <ul>
                  <li>Must start with a letter or an underscore (<code>_</code>), never a number or special symbol.</li>
                  <li>Can only contain alphanumeric characters and underscores (<code>a-z</code>, <code>A-Z</code>, <code>0-9</code>, and <code>_</code>).</li>
                  <li>Variable names are case-sensitive (<code>$myVar</code> and <code>$myvar</code> are completely separate).</li>
                </ul>
              </div>

              <div class="php-exercise" id="exercise-variables">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Variables &amp; Types
                </div>
                <p>Which of the following is an invalid variable name in PHP?</p>
                <ul>
                  <li>A) <code>$_totalAmount</code></li>
                  <li>B) <code>$user_1</code></li>
                  <li>C) <code>$1stUser</code></li>
                  <li>D) <code>$userAge</code></li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-variables">Show Solution</button>
                <div class="php-exercise-solution" id="solution-variables">
                  <p><strong>Correct Answer: C</strong></p>
                  <p>Explanation: PHP variables cannot start with numbers. Therefore, `$1stUser` is invalid, whereas letters and underscores are permitted starting symbols.</p>
                </div>
              </div>
            </article>

            <!-- 5. Operators -->
            <article class="php-lesson" id="operators" data-topic="5">
              <div class="php-lesson-header">
                <span class="php-lesson-number">05</span>
                <h3>Operators</h3>
              </div>
              <p>
                Operators are symbols that tell the compiler to perform specific mathematical, logical, or string actions.
              </p>

              <div class="php-table-wrap">
                <table class="php-table" aria-label="PHP Operators categories">
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Operators</th>
                      <th scope="col">Examples &amp; Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Arithmetic</strong></td>
                      <td><code>+ - * / % **</code></td>
                      <td><code>$a ** $b</code> (Exponentiation), <code>$a % $b</code> (Modulus)</td>
                    </tr>
                    <tr>
                      <td><strong>Comparison</strong></td>
                      <td><code>== === != !== &gt; &lt;</code></td>
                      <td><code>===</code> strict equality checks both value and type.</td>
                    </tr>
                    <tr>
                      <td><strong>Logical</strong></td>
                      <td><code>&& || ! xor</code></td>
                      <td>Combine conditional checks. <code>xor</code> returns true if only one operand is true.</td>
                    </tr>
                    <tr>
                      <td><strong>String</strong></td>
                      <td><code>. .=</code></td>
                      <td><code>.</code> concatenates strings; <code>.=</code> appends to an existing string.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
$greeting = &quot;Hello &quot;;
$name = &quot;Alice&quot;;
$fullMessage = $greeting . $name; // Concatenation
echo $fullMessage;

$x = 5;
$y = &quot;5&quot;;
var_dump($x == $y);  // true (values match)
var_dump($x === $y); // false (integer vs string)
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-var">$greeting</span> <span class="tok-op">=</span> <span class="tok-str">"Hello "</span>;
<span class="tok-var">$name</span> <span class="tok-op">=</span> <span class="tok-str">"Alice"</span>;
<span class="tok-var">$fullMessage</span> <span class="tok-op">=</span> <span class="tok-var">$greeting</span> <span class="tok-op">.</span> <span class="tok-var">$name</span>; <span class="tok-cmt">// Concatenation</span>
<span class="tok-kw">echo</span> <span class="tok-var">$fullMessage</span>;

<span class="tok-var">$x</span> <span class="tok-op">=</span> <span class="tok-num">5</span>;
<span class="tok-var">$y</span> <span class="tok-op">=</span> <span class="tok-str">"5"</span>;
<span class="tok-fn">var_dump</span>(<span class="tok-var">$x</span> <span class="tok-op">==</span> <span class="tok-var">$y</span>);  <span class="tok-cmt">// true (values match)</span>
<span class="tok-fn">var_dump</span>(<span class="tok-var">$x</span> <span class="tok-op">===</span> <span class="tok-var">$y</span>); <span class="tok-cmt">// false (integer vs string)</span>
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>Hello Alice
bool(true)
bool(false)</pre>
              </div>

              <div class="php-exercise" id="exercise-operators">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Operators
                </div>
                <p>If <code>$a = 10; $b = "10";</code>, what will be the outputs of <code>var_dump($a === $b);</code> and <code>var_dump($a !== $b);</code>?</p>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-operators">Show Solution</button>
                <div class="php-exercise-solution" id="solution-operators">
                  <p><strong>Answer: false and true</strong></p>
                  <p>Explanation: Strict comparison `===` checks both data types, and since integer 10 doesn't match string "10", `===` evaluates to `false`. Strict inequality `!==` checks if they are not identical, which is `true`.</p>
                </div>
              </div>
            </article>

            <!-- 6. Input and Output -->
            <article class="php-lesson" id="io" data-topic="6">
              <div class="php-lesson-header">
                <span class="php-lesson-number">06</span>
                <h3>Input and Output (echo, print, var_dump)</h3>
              </div>
              <p>
                PHP offers distinct ways to output data. Choosing the right built-in is important for structure and debugging.
              </p>

              <div class="php-concept-card">
                <h4>Differences between echo, print, and var_dump</h4>
                <ul>
                  <li><strong>echo:</strong> A language construct (not a function). It can take multiple arguments, does not return a value, and is marginally faster.</li>
                  <li><strong>print:</strong> Also a language construct, but behaves like a function because it always returns the value <code>1</code>. It only takes one string argument.</li>
                  <li><strong>var_dump():</strong> A debugging function. It prints out a variable's data type, byte length, and its value, making it critical for analyzing arrays and objects.</li>
                </ul>
              </div>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
echo &quot;Hello&quot;, &quot; &quot;, &quot;World!&quot;; // Multiple parameters

$result = print(&quot;Welcome! &quot;);
echo $result; // Will output 1

$arr = [1, &quot;PHP&quot;, false];
var_dump($arr);
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-kw">echo</span> <span class="tok-str">"Hello"</span>, <span class="tok-str">" "</span>, <span class="tok-str">"World!"</span>; <span class="tok-cmt">// Multiple parameters</span>

<span class="tok-var">$result</span> <span class="tok-op">=</span> <span class="tok-fn">print</span>(<span class="tok-str">"Welcome! "</span>);
<span class="tok-kw">echo</span> <span class="tok-var">$result</span>; <span class="tok-cmt">// Will output 1</span>

<span class="tok-var">$arr</span> <span class="tok-op">=</span> [<span class="tok-num">1</span>, <span class="tok-str">"PHP"</span>, <span class="tok-bool">false</span>];
<span class="tok-fn">var_dump</span>(<span class="tok-var">$arr</span>);
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>Hello World!
Welcome! 1
array(3) {
  [0]=> int(1)
  [1]=> string(3) "PHP"
  [2]=> bool(false)
}</pre>
              </div>

              <div class="php-exercise" id="exercise-io">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Input and Output
                </div>
                <p>Which output command is best suited to inspect the underlying structure and item data types of an array?</p>
                <ul>
                  <li>A) echo</li>
                  <li>B) print</li>
                  <li>C) var_dump()</li>
                  <li>D) print_r() without types</li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-io">Show Solution</button>
                <div class="php-exercise-solution" id="solution-io">
                  <p><strong>Correct Answer: C</strong></p>
                  <p>Explanation: `var_dump()` output includes values along with their types (e.g. `int`, `string`, `bool`) and string sizes, which is vital for thorough debugging.</p>
                </div>
              </div>
            </article>

            <!-- 7. Conditional Statements -->
            <article class="php-lesson" id="conditionals" data-topic="7">
              <div class="php-lesson-header">
                <span class="php-lesson-number">07</span>
                <h3>Conditional Statements</h3>
              </div>
              <p>
                Conditional statements are used to perform different actions based on different conditions. PHP supports <code>if</code>, <code>else</code>, <code>elseif</code>, and <code>switch</code>.
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
$score = 82;

if ($score >= 90) {
    echo &quot;Grade A&quot;;
} elseif ($score >= 80) {
    echo &quot;Grade B&quot;;
} else {
    echo &quot;Grade C&quot;;
}

$favColor = &quot;red&quot;;
switch ($favColor) {
    case &quot;blue&quot;:
        echo &quot;Your color is blue.&quot;;
        break;
    case &quot;red&quot;:
        echo &quot;Your color is red.&quot;;
        break;
    default:
        echo &quot;Unknown color.&quot;;
}
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-var">$score</span> <span class="tok-op">=</span> <span class="tok-num">82</span>;

<span class="tok-kw">if</span> (<span class="tok-var">$score</span> <span class="tok-op">&gt;=</span> <span class="tok-num">90</span>) {
    <span class="tok-kw">echo</span> <span class="tok-str">"Grade A"</span>;
} <span class="tok-kw">elseif</span> (<span class="tok-var">$score</span> <span class="tok-op">&gt;=</span> <span class="tok-num">80</span>) {
    <span class="tok-kw">echo</span> <span class="tok-str">"Grade B"</span>;
} <span class="tok-kw">else</span> {
    <span class="tok-kw">echo</span> <span class="tok-str">"Grade C"</span>;
}

<span class="tok-var">$favColor</span> <span class="tok-op">=</span> <span class="tok-str">"red"</span>;
<span class="tok-kw">switch</span> (<span class="tok-var">$favColor</span>) {
    <span class="tok-kw">case</span> <span class="tok-str">"blue"</span>:
        <span class="tok-kw">echo</span> <span class="tok-str">"Your color is blue."</span>;
        <span class="tok-kw">break</span>;
    <span class="tok-kw">case</span> <span class="tok-str">"red"</span>:
        <span class="tok-kw">echo</span> <span class="tok-str">"Your color is red."</span>;
        <span class="tok-kw">break</span>;
    <span class="tok-kw">default</span>:
        <span class="tok-kw">echo</span> <span class="tok-str">"Unknown color."</span>;
}
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>Grade BYour color is red.</pre>
              </div>

              <div class="php-concept-card">
                <h4>Null Coalescing Operator (??)</h4>
                <p>Introduced in PHP 7, this operator checks if a variable exists and is not null; otherwise, it returns a default value. It is highly useful when reading parameters.</p>
                <code>$username = $_GET['user'] ?? 'Guest';</code>
              </div>

              <div class="php-exercise" id="exercise-conditionals">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Conditional Statements
                </div>
                <p>What will happen in a <code>switch</code> statement block if a case matches, but there is no <code>break;</code> statement at the end of that case?</p>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-conditionals">Show Solution</button>
                <div class="php-exercise-solution" id="solution-conditionals">
                  <p><strong>Answer: Fall-through behavior</strong></p>
                  <p>Explanation: If you omit a `break;` statement, execution will continue (fall through) into the next case statement, executing its code regardless of whether the case criteria matches, until it hits a `break;` or the end of the switch block.</p>
                </div>
              </div>
            </article>

            <!-- 8. Loops -->
            <article class="php-lesson" id="loops" data-topic="8">
              <div class="php-lesson-header">
                <span class="php-lesson-number">08</span>
                <h3>Loops</h3>
              </div>
              <p>
                Loops allow you to execute a block of code repeatedly as long as a specified condition is met. PHP supports <code>for</code>, <code>while</code>, <code>do-while</code>, and <code>foreach</code>.
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// For Loop
for ($i = 1; $i &lt;= 3; $i++) {
    echo &quot;For count: $i &quot;;
}

// While Loop
$w = 1;
while ($w &lt;= 3) {
    echo &quot;While count: $w &quot;;
    $w++;
}

// Foreach Loop (traversing arrays)
$colors = [&quot;red&quot;, &quot;green&quot;, &quot;blue&quot;];
foreach ($colors as $color) {
    echo &quot;Color: $color &quot;;
}
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// For Loop</span>
<span class="tok-kw">for</span> (<span class="tok-var">$i</span> <span class="tok-op">=</span> <span class="tok-num">1</span>; <span class="tok-var">$i</span> <span class="tok-op">&lt;=</span> <span class="tok-num">3</span>; <span class="tok-var">$i</span><span class="tok-op">++</span>) {
    <span class="tok-kw">echo</span> <span class="tok-str">"For count: </span><span class="tok-var">$i</span><span class="tok-str"> "</span>;
}

<span class="tok-cmt">// While Loop</span>
<span class="tok-var">$w</span> <span class="tok-op">=</span> <span class="tok-num">1</span>;
<span class="tok-kw">while</span> (<span class="tok-var">$w</span> <span class="tok-op">&lt;=</span> <span class="tok-num">3</span>) {
    <span class="tok-kw">echo</span> <span class="tok-str">"While count: </span><span class="tok-var">$w</span><span class="tok-str"> "</span>;
    <span class="tok-var">$w</span><span class="tok-op">++</span>;
}

<span class="tok-cmt">// Foreach Loop (traversing arrays)</span>
<span class="tok-var">$colors</span> <span class="tok-op">=</span> [<span class="tok-str">"red"</span>, <span class="tok-str">"green"</span>, <span class="tok-str">"blue"</span>];
<span class="tok-kw">foreach</span> (<span class="tok-var">$colors</span> <span class="tok-kw">as</span> <span class="tok-var">$color</span>) {
    <span class="tok-kw">echo</span> <span class="tok-str">"Color: </span><span class="tok-var">$color</span><span class="tok-str"> "</span>;
}
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>For count: 1 For count: 2 For count: 3 While count: 1 While count: 2 While count: 3 Color: red Color: green Color: blue </pre>
              </div>

              <div class="php-exercise" id="exercise-loops">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Loops
                </div>
                <p>Which loop construct is specifically designed and optimized to iterate through the elements of an array without needing counter variables?</p>
                <ul>
                  <li>A) for loop</li>
                  <li>B) while loop</li>
                  <li>C) do-while loop</li>
                  <li>D) foreach loop</li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-loops">Show Solution</button>
                <div class="php-exercise-solution" id="solution-loops">
                  <p><strong>Correct Answer: D</strong></p>
                  <p>Explanation: The `foreach` loop is specifically designed to iterate over arrays and objects in PHP. It automatically moves the internal array pointer forwards with each iteration.</p>
                </div>
              </div>
            </article>

            <!-- 9. Functions -->
            <article class="php-lesson" id="functions" data-topic="9">
              <div class="php-lesson-header">
                <span class="php-lesson-number">09</span>
                <h3>Functions</h3>
              </div>
              <p>
                A function is a block of statements that can be used repeatedly in a program. It will not execute automatically when a page loads; instead, it runs when called.
              </p>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// Default value parameter
function greet($name = &quot;Guest&quot;) {
    return &quot;Hello, $name!&quot;;
}

echo greet(&quot;Bob&quot;);
echo &quot;\n&quot;;
echo greet(); // Uses default

// Strict type declaration (optional)
function addNumbers(int $a, int $b): int {
    return $a + $b;
}
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// Default value parameter</span>
<span class="tok-kw">function</span> <span class="tok-fn">greet</span>(<span class="tok-var">$name</span> <span class="tok-op">=</span> <span class="tok-str">"Guest"</span>) {
    <span class="tok-kw">return</span> <span class="tok-str">"Hello, </span><span class="tok-var">$name</span><span class="tok-str">!"</span>;
}

<span class="tok-kw">echo</span> <span class="tok-fn">greet</span>(<span class="tok-str">"Bob"</span>);
<span class="tok-kw">echo</span> <span class="tok-str">"\n"</span>;
<span class="tok-kw">echo</span> <span class="tok-fn">greet</span>(); <span class="tok-cmt">// Uses default</span>

<span class="tok-cmt">// Strict type declaration (optional)</span>
<span class="tok-kw">function</span> <span class="tok-fn">addNumbers</span>(<span class="tok-bi">int</span> <span class="tok-var">$a</span>, <span class="tok-bi">int</span> <span class="tok-var">$b</span>): <span class="tok-bi">int</span> {
    <span class="tok-kw">return</span> <span class="tok-var">$a</span> <span class="tok-op">+</span> <span class="tok-var">$b</span>;
}
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-output">
                <div class="php-output-label">Output</div>
                <pre>Hello, Bob!
Hello, Guest!</pre>
              </div>

              <div class="php-exercise" id="exercise-functions">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Functions
                </div>
                <p>Given the function: <code>function calc($val = 5) { return $val * 2; }</code>, what is the output of <code>echo calc();</code>?</p>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-functions">Show Solution</button>
                <div class="php-exercise-solution" id="solution-functions">
                  <p><strong>Answer: 10</strong></p>
                  <p>Explanation: Because no argument is passed during the function call `calc()`, PHP defaults `$val` to `5`. It then returns `5 * 2 = 10`.</p>
                </div>
              </div>
            </article>

            <!-- 10. Arrays -->
            <article class="php-lesson" id="arrays" data-topic="10">
              <div class="php-lesson-header">
                <span class="php-lesson-number">10</span>
                <h3>Arrays</h3>
              </div>
              <p>
                An array stores multiple values in one single variable. PHP supports three types of arrays.
              </p>

              <div class="php-concept-card">
                <h4>Types of Arrays</h4>
                <ul>
                  <li><strong>Indexed Arrays:</strong> Arrays with numeric keys. (e.g. <code>$arr = ["a", "b"];</code> where key 0 is "a" and key 1 is "b").</li>
                  <li><strong>Associative Arrays:</strong> Arrays with named keys that you assign. (e.g. <code>$age = ["Peter" => 35];</code>).</li>
                  <li><strong>Multidimensional Arrays:</strong> Arrays containing one or more nested arrays.</li>
                </ul>
              </div>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// Associative Array
$person = [
    &quot;name&quot; =&gt; &quot;Alice&quot;,
    &quot;age&quot; =&gt; 25,
    &quot;skills&quot; =&gt; [&quot;PHP&quot;, &quot;MySQL&quot;] // Nested Array
];

echo $person[&quot;name&quot;]; // Alice
echo $person[&quot;skills&quot;][0]; // PHP
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// Associative Array</span>
<span class="tok-var">$person</span> <span class="tok-op">=</span> [
    <span class="tok-str">"name"</span> <span class="tok-op">=&gt;</span> <span class="tok-str">"Alice"</span>,
    <span class="tok-str">"age"</span> <span class="tok-op">=&gt;</span> <span class="tok-num">25</span>,
    <span class="tok-str">"skills"</span> <span class="tok-op">=&gt;</span> [<span class="tok-str">"PHP"</span>, <span class="tok-str">"MySQL"</span>] <span class="tok-cmt">// Nested Array</span>
];

<span class="tok-kw">echo</span> <span class="tok-var">$person</span>[<span class="tok-str">"name"</span>]; <span class="tok-cmt">// Alice</span>
<span class="tok-kw">echo</span> <span class="tok-var">$person</span>[<span class="tok-str">"skills"</span>][<span class="tok-num">0</span>]; <span class="tok-cmt">// PHP</span>
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-exercise" id="exercise-arrays">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Arrays
                </div>
                <p>How do you fetch the value <code>"Green"</code> from the array: <code>$palette = ["primary" => "Red", "secondary" => "Green"];</code>?</p>
                <ul>
                  <li>A) <code>$palette[1]</code></li>
                  <li>B) <code>$palette["secondary"]</code></li>
                  <li>C) <code>$palette->secondary</code></li>
                  <li>D) <code>$palette.secondary</code></li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-arrays">Show Solution</button>
                <div class="php-exercise-solution" id="solution-arrays">
                  <p><strong>Correct Answer: B</strong></p>
                  <p>Explanation: For associative arrays, you access elements using square brackets containing the string key, hence `$palette["secondary"]` is the correct notation.</p>
                </div>
              </div>
            </article>

            <!-- 11. Forms Handling -->
            <article class="php-lesson" id="forms" data-topic="11">
              <div class="php-lesson-header">
                <span class="php-lesson-number">11</span>
                <h3>Forms Handling (GET and POST)</h3>
              </div>
              <p>
                The PHP superglobals <code>$_GET</code> and <code>$_POST</code> are used to collect form data after submitting an HTML form.
              </p>

              <div class="php-table-wrap">
                <table class="php-table" aria-label="GET vs POST comparison">
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      <th scope="col">GET Method</th>
                      <th scope="col">POST Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Visibility</strong></td>
                      <td>Data is visible in the URL query string (e.g. <code>?name=Alice</code>)</td>
                      <td>Data is embedded inside the HTTP request body (invisible in URL)</td>
                    </tr>
                    <tr>
                      <td><strong>Size Limits</strong></td>
                      <td>Limited (typically around 2000 characters)</td>
                      <td>Large / Unlimited (allows file uploads)</td>
                    </tr>
                    <tr>
                      <td><strong>Security</strong></td>
                      <td>Poor (never use for passwords or confidential variables)</td>
                      <td>Better (data is not cached in browser histories)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="php-concept-card">
                <h4>Preventing Cross-Site Scripting (XSS)</h4>
                <p>
                  When outputting raw user input, attackers can inject malicious Javascript code. Always wrap output in <code>htmlspecialchars()</code> to convert special HTML symbols into benign text entities.
                </p>
                <code>echo htmlspecialchars($_POST["username"]);</code>
              </div>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP Form Processing Example</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;!-- form.html --&gt;
&lt;form method=&quot;POST&quot; action=&quot;welcome.php&quot;&gt;
    Name: &lt;input type=&quot;text&quot; name=&quot;fname&quot;&gt;
    &lt;input type=&quot;submit&quot;&gt;
&lt;/form&gt;

&lt;?php
// welcome.php
if ($_SERVER[&quot;REQUEST_METHOD&quot;] == &quot;POST&quot;) {
    // Sanitizing user input for safety
    $name = htmlspecialchars($_POST['fname']);
    echo &quot;Welcome, &quot; . $name;
}
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-cmt">&lt;!-- form.html --&gt;</span>
<span class="tok-op">&lt;</span><span class="tok-kw">form</span> <span class="tok-var">method</span><span class="tok-op">=</span><span class="tok-str">"POST"</span> <span class="tok-var">action</span><span class="tok-op">=</span><span class="tok-str">"welcome.php"</span><span class="tok-op">&gt;</span>
    Name: <span class="tok-op">&lt;</span><span class="tok-kw">input</span> <span class="tok-var">type</span><span class="tok-op">=</span><span class="tok-str">"text"</span> <span class="tok-var">name</span><span class="tok-op">=</span><span class="tok-str">"fname"</span><span class="tok-op">&gt;</span>
    <span class="tok-op">&lt;</span><span class="tok-kw">input</span> <span class="tok-var">type</span><span class="tok-op">=</span><span class="tok-str">"submit"</span><span class="tok-op">&gt;</span>
<span class="tok-op">&lt;/</span><span class="tok-kw">form</span><span class="tok-op">&gt;</span>

<span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// welcome.php</span>
<span class="tok-kw">if</span> (<span class="tok-var">$_SERVER</span>[<span class="tok-str">"REQUEST_METHOD"</span>] <span class="tok-op">==</span> <span class="tok-str">"POST"</span>) {
    <span class="tok-cmt">// Sanitizing user input for safety</span>
    <span class="tok-var">$name</span> <span class="tok-op">=</span> <span class="tok-fn">htmlspecialchars</span>(<span class="tok-var">$_POST</span>[<span class="tok-str">'fname'</span>]);
    <span class="tok-kw">echo</span> <span class="tok-str">"Welcome, "</span> <span class="tok-op">.</span> <span class="tok-var">$name</span>;
}
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-exercise" id="exercise-forms">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Forms Handling
                </div>
                <p>Which function should you wrap around $_POST/$_GET output inside HTML tags to block Cross-Site Scripting (XSS) injections?</p>
                <ul>
                  <li>A) <code>var_dump()</code></li>
                  <li>B) <code>htmlspecialchars()</code></li>
                  <li>C) <code>session_start()</code></li>
                  <li>D) <code>urlencode()</code></li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-forms">Show Solution</button>
                <div class="php-exercise-solution" id="solution-forms">
                  <p><strong>Correct Answer: B</strong></p>
                  <p>Explanation: `htmlspecialchars()` converts special characters (like `<` and `>`) into HTML entities (like `&lt;` and `&gt;`), rendering them as static text instead of executable scripts in the browser.</p>
                </div>
              </div>
            </article>

            <!-- 12. Basic Superglobals -->
            <article class="php-lesson" id="superglobals" data-topic="12">
              <div class="php-lesson-header">
                <span class="php-lesson-number">12</span>
                <h3>Basic Superglobals</h3>
              </div>
              <p>
                Superglobals are built-in global variables that are always accessible, regardless of scope - meaning you can access them from any class, function, or file without needing to declare <code>global $var;</code>.
              </p>

              <div class="php-concept-card">
                <h4>Core PHP Superglobals</h4>
                <ul>
                  <li><strong>$_SERVER:</strong> Contains paths, script locations, and server/header variables.</li>
                  <li><strong>$_GET:</strong> Holds an associative array of URL query parameters.</li>
                  <li><strong>$_POST:</strong> Holds an associative array of variables passed via HTTP POST.</li>
                  <li><strong>$_COOKIE:</strong> Associative array of client cookies sent to the server.</li>
                  <li><strong>$_SESSION:</strong> Associative array containing session variables active for the current visitor.</li>
                </ul>
              </div>

              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// Display server name and visitor User Agent headers
echo $_SERVER['SERVER_NAME'];
echo &quot;\n&quot;;
echo $_SERVER['HTTP_USER_AGENT'];
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// Display server name and visitor User Agent headers</span>
<span class="tok-kw">echo</span> <span class="tok-var">$_SERVER</span>[<span class="tok-str">'SERVER_NAME'</span>];
<span class="tok-kw">echo</span> <span class="tok-str">"\n"</span>;
<span class="tok-kw">echo</span> <span class="tok-var">$_SERVER</span>[<span class="tok-str">'HTTP_USER_AGENT'</span>];
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-exercise" id="exercise-superglobals">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Superglobals
                </div>
                <p>Which superglobal would you read to verify the client browser's HTTP User Agent or request header methods (e.g. GET vs POST)?</p>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-superglobals">Show Solution</button>
                <div class="php-exercise-solution" id="solution-superglobals">
                  <p><strong>Answer: $_SERVER</strong></p>
                  <p>Explanation: `$_SERVER` houses all headers, client connection parameters, script execution settings, and local hosting values (such as `$_SERVER['HTTP_USER_AGENT']` and `$_SERVER['REQUEST_METHOD']`).</p>
                </div>
              </div>
            </article>

            <!-- 13. Intro to Sessions & Cookies -->
            <article class="php-lesson" id="sessions-cookies" data-topic="13">
              <div class="php-lesson-header">
                <span class="php-lesson-number">13</span>
                <h3>Intro to Sessions &amp; Cookies</h3>
              </div>
              <p>
                HTTP is stateless, meaning the server forgets who you are between requests. Cookies and Sessions allow you to preserve states and variables across pages.
              </p>

              <div class="php-concept-card">
                <h4>Cookies vs Sessions</h4>
                <ul>
                  <li><strong>Cookies:</strong> Stored directly on the client's browser. They can persist for a long time but are easily inspected or edited by the user, making them unsafe for sensitive data.</li>
                  <li><strong>Sessions:</strong> Stored securely on the server. The client's browser only stores a temporary Session ID Cookie (PHPSESSID) to identify themselves.</li>
                </ul>
              </div>

              <h4>Starting a Session:</h4>
              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP - Sessions</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// Must be called at the very top before any HTML output
session_start();

// Setting a session variable
$_SESSION[&quot;userid&quot;] = 101;
$_SESSION[&quot;role&quot;] = &quot;admin&quot;;

// Accessing it on another page
echo &quot;User: &quot; . $_SESSION[&quot;userid&quot;];
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// Must be called at the very top before any HTML output</span>
<span class="tok-fn">session_start</span>();

<span class="tok-cmt">// Setting a session variable</span>
<span class="tok-var">$_SESSION</span>[<span class="tok-str">"userid"</span>] <span class="tok-op">=</span> <span class="tok-num">101</span>;
<span class="tok-var">$_SESSION</span>[<span class="tok-str">"role"</span>] <span class="tok-op">=</span> <span class="tok-str">"admin"</span>;

<span class="tok-cmt">// Accessing it on another page</span>
<span class="tok-kw">echo</span> <span class="tok-str">"User: "</span> <span class="tok-op">.</span> <span class="tok-var">$_SESSION</span>[<span class="tok-str">"userid"</span>];
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <h4>Setting a Cookie:</h4>
              <div class="php-code-block">
                <div class="php-code-header">
                  <span class="php-code-lang">PHP - Cookies</span>
                  <button class="php-code-copy" aria-label="Copy code" data-code="&lt;?php
// setcookie(name, value, expire_time, path)
// Expire in 1 hour (3600 seconds)
setcookie(&quot;user&quot;, &quot;Alex&quot;, time() + 3600, &quot;/&quot;);

// Retrieving cookies on subsequent requests
echo $_COOKIE[&quot;user&quot;] ?? &quot;Not logged in&quot;;
?&gt;">Copy</button>
                </div>
                <pre><code><span class="tok-kw">&lt;?php</span>
<span class="tok-cmt">// setcookie(name, value, expire_time, path)</span>
<span class="tok-cmt">// Expire in 1 hour (3600 seconds)</span>
<span class="tok-fn">setcookie</span>(<span class="tok-str">"user"</span>, <span class="tok-str">"Alex"</span>, <span class="tok-fn">time</span>() <span class="tok-op">+</span> <span class="tok-num">3600</span>, <span class="tok-str">"/"</span>);

<span class="tok-cmt">// Retrieving cookies on subsequent requests</span>
<span class="tok-kw">echo</span> <span class="tok-var">$_COOKIE</span>[<span class="tok-str">"user"</span>] <span class="tok-op">??</span> <span class="tok-str">"Not logged in"</span>;
<span class="tok-kw">?&gt;</span></code></pre>
              </div>

              <div class="php-exercise" id="exercise-sessions-cookies">
                <div class="php-exercise-title">
                  <i class="fas fa-dumbbell"></i> Practice: Sessions &amp; Cookies
                </div>
                <p>Which function MUST be executed at the absolute top of a PHP script (before any HTML/output is sent) to access or modify the <code>$_SESSION</code> array?</p>
                <ul>
                  <li>A) <code>session_create()</code></li>
                  <li>B) <code>session_start()</code></li>
                  <li>C) <code>setcookie()</code></li>
                  <li>D) <code>session_register()</code></li>
                </ul>
                <button class="php-exercise-toggle" aria-expanded="false" aria-controls="solution-sessions-cookies">Show Solution</button>
                <div class="php-exercise-solution" id="solution-sessions-cookies">
                  <p><strong>Correct Answer: B</strong></p>
                  <p>Explanation: `session_start()` initiates/resumes a session. It sends header cookies behind the scenes, so it must be executed before printing any characters or tags, otherwise PHP throws a "Headers already sent" warning.</p>
                </div>
              </div>
            </article>

          </main>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>∞ Algo Infinity Verse</h3>
            <p>Your ultimate destination for mastering Data Structures & Algorithms and acing technical interviews.</p>
          </div>
          <div class="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="community.html">Community</a></li>
              <li><a href="cheat-sheets.html">DSA Cheat Sheets</a></li>
              <li><a href="python-learning.html">Learn Python</a></li>
              <li><a href="javascript-learning.html">Learn JavaScript</a></li>
              <li><a href="java-learning.html">Learn Java</a></li>
              <li><a href="cplusplus-learning.html">Learn C++</a></li>
              <li><a href="c-learning.html">Learn C</a></li>
              <li><a href="dbms-learning.html">Learn DBMS</a></li>
              <li><a href="powerbi-learning.html">Learn Power BI</a></li>
<li><a href="oop-learning.html">Learn OOP</a></li>
<li><a href="php-learning.html">Learn PHP</a></li>
<li><a href="computer-architecture.html">Learn Architecture</a></li>
<li><a href="tree-traversal.html">Tree Traversal</a></li>
              <li><a href="/pages/career/resume/resume.html">Coding Resume</a></li>
              <li><a href="support-page/index.html">Support</a></li>
              <li><a href="about-us.html">About us</a></li>
              <li><a href="privacy-policy.html">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Algo Infinity Verse. Crafted with 💜 for learners worldwide.</p>
        </div>
      </div>
    </footer>

    <!-- Scripts -->
    <script src="auth.js"></script>
    <script src="script.js"></script>
    <script src="php-learning.js"></script>
  </body>
</html>
