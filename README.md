<p align="center">
  <img src="./images/banner.png" alt="Algo Infinity Verse Banner" width="100%">
</p>
<div align="center">

## Master Data Structures & Algorithms and Crack Technical Interviews

[![GitHub repo size](https://img.shields.io/github/repo-size/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse)
[![GitHub last commit](https://img.shields.io/github/last-commit/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse)

**A modern, interactive web application for learning and practicing DSA concepts with a gamified learning experience.**

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://www.w3.org/TR/CSS/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://www.ecma-international.org/)

[![GitHub issues](https://img.shields.io/github/issues/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse/pulls)
[![Contributors](https://img.shields.io/github/contributors/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse/graphs/contributors)

</div>

---

## Features

### Core Learning Resources

#### DSA Topics
- **6 Comprehensive Topics**: Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming
- Each topic includes:
  - Detailed theory explanations
  - Key concepts and properties
  - Common problem patterns
  - Difficulty ratings (Easy-Medium-Hard)
  - Sample problem lists

#### Practice Problems
- **35+ curated problems** spanning all DSA topics
- Filterable by difficulty (Easy, Medium, Hard)
- Real-time search functionality
- Problem tags for quick identification
- Acceptance rate tracking
- Visual completion badges

#### Favorite Problems & Smart Collections

Users can:
- Mark practice problems as favorites
- Filter favorite problems
- Organize favorites into custom bookmark collections
- Search and filter collections by name, description, and contained problems
- Persist everything using localStorage and the existing user progress store

**How it works:**
- Click the heart icon on any practice problem to add it to favorites
- Use the new collection form on the Practice Problems page to create custom collections
- Choose one or more collections per problem from the collection picker beneath each card
- Use the collection dashboard on the dashboard/profile views to review collection stats

----

#### Smart Revision Calendar (New Feature)

An interactive DSA study scheduling engine driven by spaced repetition algorithms to aid structured review:
- **Automatic Scheduling**: Calculates target review check-points at optimized intervals (Day 1, 3, 7, 14, 30).
- **Personalized Prioritization**: Weights topics based on topic difficulty and historical quiz scores. Low accuracy resets schedule to Day 1, while high scores extend intervals.
- **Revision Dashboard**: Track memory retention estimates, streaks, average quiz improvements, and weekly completion rates.
- **Interactive Calendar**: View past, current, and upcoming task grids. Color-coded markers distinguish completed, due, and overdue tasks.
- **Reschedule & Recall Tools**: Postpone tasks easily or rate concept recall quality to adapt intervals dynamically.
- **Multi-user Sync**: Automatically registers schedules in localStorage for guest sessions and syncs to Firebase Firestore for authenticated accounts.

----

### Quiz System

**60 Topic-Specific Questions** (10 per topic covering key concepts)

- **Arrays**: Time complexity, operations, Two Sum, Kadane's algorithm, rotation techniques
- **Strings**: Pattern matching (KMP), palindrome detection, anagrams, sliding window
- **Linked Lists**: Pointer manipulation, cycle detection, reversal, merging
- **Trees**: Traversals, BST properties, height calculation, LCA, heaps
- **Graphs**: Representations, BFS/DFS, topological sort, Dijkstra, MST algorithms
- **Dynamic Programming**: Memoization, tabulation, classic problems (Fibonacci, Knapsack, LIS, Edit Distance)

**Quiz Features:**
- Interactive modal interface
- Progress bar tracking
- Instant answer feedback (correct/incorrect highlighting)
- Detailed explanations for each question
- Score calculation (percentage)
- **XP rewards**: 10 XP per correct answer
- Best score tracking per topic
- Attempt counter
- Randomized question order

#### Quiz Architecture 

**Flow**
1. User clicks "Start Quiz" on topic card
2. Questions are shuffled randomly
3. Modal displays one question at a time
4. User selects an answer → immediate feedback
5. Correct answer highlighted in green; user's wrong choice in red
6. Auto-advance after 1.2 second delay
7. After 10 questions: score calculation
8. Results modal shows percentage, XP earned, performance message
9. Progress bars and statistics update

**Scoring**
- 10 XP per correct answer
- Best score saved per topic (max percentage)
- Total attempts tracked
- Progress bar fills on first attempt

----

### Profile & Gamification

**Customizable Profile:**
- Edit display name
- Choose from 12 avatar emojis
- View join date
- Track level progression

**Progress Tracking:**
- Total XP accumulation
- Problems solved counter
- Day streak monitoring
- Badge earning system

**Levels:**
- 8 levels from Beginner to Legend
- XP thresholds: 0, 1,000, 2,500, 5,000, 10,000, 20,000, 50,000, 100,000
- Automatic level-up notifications

**Badges:**
- 🌟 First Steps (solve 1 problem)
- 🔥 On Fire (7-day streak)
- 💎 Diamond (5,000 XP)
- 🚀 Rocket (50 problems)
- 👑 Master (100 problems)
- 🎯 Sharpshooter (25 problems + 2,500 XP)

**Badge tooltips:** Hover or tap any badge on the dashboard to see the badge name, description, and unlock criteria.

----

### Dashboard
- Complete statistics overview
- Recent activity feed
- Achievement badges display
- Leaderboard comparison
- Roadmap progress visualization

----

### Authentication
- Secure signup and login pages
- PBKDF2 password hashing with per-user salts and a server-side pepper for enhanced password security
- Signed JWT-style sessions stored in HTTP-only cookies
- Logout endpoint that clears the session cookie
- Protected community and support pages
- Dashboard/profile hash routes redirected to login when unauthenticated

----

### Interactive Code Editor
- Multi-language support (JavaScript, Python, Java, C++)
- Line numbers and syntax highlighting
- Code snippets insertion
- Auto-formatting
- Line comment toggling
- Run and submit simulation
- Test case validation

----

### AI Chatbot Assistant
- Instant DSA concept explanations
- Time/space complexity queries
- Problem-solving strategy hints
- Quick question buttons
- Context-aware responses

----

### User Experience / UX

**Visual Design:**
- Dark/Light theme toggle
- Glassmorphism UI elements
- Gradient accents
- Animated transitions
- Starfield background effect
- Responsive layout (mobile, tablet, desktop)

**Navigation:**
- Sticky navbar with smooth scrolling
- Mobile hamburger menu
- Scroll-to-top button
- Section-based navigation

----

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ modules, Font Awesome, Google Fonts |
| **Backend** | Node.js, Express 5, Socket.io |
| **Database & Auth** | Firebase / Firestore (`firebase-admin`), JWT-style access/refresh tokens, PBKDF2 password hashing with server-side pepper |
| **Job Queue** | BullMQ + Redis (`ioredis`) |
| **Code Execution** | `isolated-vm` sandbox, custom `/api/execute` endpoint |
| **AI & Parsing** | OpenAI API, Puppeteer, `pdf-parse`, `mammoth`, `csv-parse`, `js-yaml` |
| **Email / Uploads** | Nodemailer, Multer |
| **Build & Test** | Jest, Playwright |

- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) **HTML5**: Semantic markup
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) **CSS3**: Custom properties, Flexbox, Grid, animations
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) **JavaScript (ES6+)**: Modular client-side code
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) **Node.js**: Express 5 server, APIs, auth, and real-time features
- ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) **Express 5**: HTTP server and API route wiring
- ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black) **Firebase / Firestore**: Cloud database and Admin SDK auth
- ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white) **Socket.io**: Real-time battles and collaborative rooms
- ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) **Redis**: BullMQ job queue backing

----

## How to Run

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Eshajha19/Algo-Infinity-Verse.git
   cd Algo-Infinity-Verse
   ```

2. **Start the authenticated app**
   Create your local environment file:
   ```bash
   cp .env.example .env
   ```

   Generate secure secrets for your environment:

    ```bash
    node -e "
      console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'));
      console.log('PASSWORD_PEPPER=' + require('crypto').randomBytes(32).toString('hex'));
      console.log('CSRF_SALT=' + require('crypto').randomBytes(32).toString('hex'));
    "
    ```

    Copy the generated values into your `.env` file:

    ```env
    SESSION_SECRET=your_generated_session_secret
    PASSWORD_PEPPER=your_generated_password_pepper
    CSRF_SALT=your_generated_csrf_salt
    ```

    ### Required Environment Variables

    | Variable | Description |
    |----------|-------------|
    | `SESSION_SECRET` | HMAC key for signing session JWTs |
    | `PASSWORD_PEPPER` | Extra secret mixed into password hashes |
    | `CSRF_SALT` | Salt for CSRF token HMAC signatures |

    ### Firebase (for authentication & persistence)

    Set these if you want Google sign-in and Firestore-backed user data:

    | Variable | Description |
    |----------|-------------|
    | `FIREBASE_API_KEY` | Web SDK API key (public) |
    | `FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `your-project.firebaseapp.com`) |
    | `FIREBASE_PROJECT_ID` | Firebase project ID |
    | `FIREBASE_STORAGE_BUCKET` | Storage bucket |
    | `FIREBASE_MESSAGING_SENDER_ID` | Sender ID for FCM |
    | `FIREBASE_APP_ID` | Firebase app ID |
    | `FIREBASE_CLIENT_EMAIL` | Admin SDK service account email |
    | `FIREBASE_PRIVATE_KEY` | Admin SDK service account private key |

    > **Note:** Without Firebase credentials, user data is stored locally in `data/users.json`. With Firebase, it uses Firestore and the local file is not used.

   Start the server:
   ```bash
   npm start
   ```
   Then visit `http://127.0.0.1:3000`

   You can still open `index.html` directly for static browsing, but signup, login, protected routes, and HTTP-only sessions require the Node server.

3. **Start learning!**
   - Create your profile
   - Browse DSA topics
   - Take quizzes
   - Practice problems
   - Track your progress

----

## Project Structure

```
Algo-Infinity-Verse/
├── index.html                  # Main landing page / dashboard
├── code-playground.html        # Interactive multi-language code editor
├── server.js                   # Express HTTP server + API route wiring
├── auth.js                     # Client-side auth UI and route guards
├── auth-gate.js                # Authentication gate helpers
├── styles.css                  # Global styles, themes, and responsive design
├── script.js                   # Core app logic, data, and interactivity
├── firebase.js                 # Firebase Admin / Firestore setup
├── firebase-config.js          # Firebase web SDK configuration
├── seed-problems.js            # Problem database seeding utility
├── sdlcAdvisor.js              # SDLC recommendation engine
├── interceptors.js             # Request/response interceptors
├── package.json
├── .env.example                # Environment configuration template
│
├── api/                        # Server API route handlers
│   ├── auth/google.js
│   ├── execute.js              # Sandboxed code execution
│   ├── login.js / signup.js / logout.js / session.js
│   ├── quiz-results.js / progress.js / leaderboard.js
│   ├── battles.js / contests.js
│   └── csrf-token.js
│
├── backend/                    # Server-side business logic
│   ├── services/
│   │   ├── auth.service.js     # PBKDF2 hashing, access/refresh tokens
│   │   ├── email.service.js    # Nodemailer verification emails
│   │   ├── memory.service.js   # Spaced-repetition engine
│   │   └── readinessEngine.js  # Hiring readiness scoring
│   ├── jobs/
│   │   ├── queue.js            # BullMQ job queue
│   │   ├── worker.js           # Background job worker
│   │   └── updateReadinessScores.js
│   ├── jsSandboxRunner.js      # isolated-vm JS sandbox runner
│   ├── resume-analyzer/        # Resume parsing + ATS scoring
│   ├── repository-analyzer/    # Repo / CI-CD analysis
│   ├── knowledge-base/         # LLM client + vector store helpers
│   ├── vcs/                    # Version-control provider factory
│   └── utils/                  # Shared backend helpers
│
├── modules/                    # Shared client-side ES modules
│   ├── quiz.js
│   ├── theme.js / navbar.js
│   ├── code-executor.js
│   ├── cacheEngine.js
│   ├── firebase-client.js
│   ├── offline-learning.js
│   └── ...
│
├── pages/                      # Feature pages
│   ├── auth/
│   │   ├── login.html / signup.html
│   │   ├── forgot-password.html / verify-email.html
│   │   └── setting.html
│   ├── profile/
│   │   ├── profile.html / profile.js
│   │   └── public-profile.html
│   ├── interview/
│   │   ├── mock-interview-simulator/
│   │   ├── company-interview/
│   │   ├── behavioral-questions/
│   │   └── ...
│   ├── learning/               # Topic learning pages
│   ├── visualizers/            # Algorithm visualizers
│   ├── ai-features/            # AI-powered experiments
│   ├── tools/                  # Productivity tools (calculators, trainers, etc.)
│   ├── career/                 # Resume & job preparation
│   ├── community/              # Community, peer rooms, support
│   ├── editors/                # Per-language code editors
│   ├── Dsa-Battle/             # Competitive coding battles
│   ├── repo-analyzer/
│   ├── resources/
│   └── admin/
│
├── data/                       # Local JSON data stores
├── public/                     # Static assets
├── partials/                   # Reusable HTML partials
├── scripts/                    # Build / audit / utility scripts
├── tests/                      # Jest + Playwright tests
├── docs/                       # Contributor docs
└── contributors/               # Contributor pages
```

> The project now contains **200+ files** spread across feature pages, backend services, API routes, and shared modules.

---

## Modular Architecture

### Front-end Modules 
The monolithic `script.js` has been split into focused ES modules:

- **`quiz.js`** — Shuffle logic, scoring, progress tracking, and results rendering
- **`code-executor.js`** — Client-side editor helpers and execution helpers
- **`firebase-client.js`** — Firebase web SDK integration
- **`offline-learning.js`** — Offline-capable study resources
- **`cacheEngine.js`** — In-memory and localStorage caching helpers
- **`navbar.js`** — Responsive navigation and mobile hamburger menu
- **`theme.js`** — Dark / light theme switching and persistence
- **`toast.js` / `loader.js`** — Notifications and loading states
- **`error-boundary.js` / `domSanitizer.js`** — Runtime safety helpers

### API Layer 
Route handlers mounted in `server.js`:
- **`execute.js`** — Sandboxed code execution endpoint
- **`login.js` / `signup.js` / `logout.js` / `session.js`** — Auth flows
- **`auth/google.js`** — Google sign-in integration
- **`quiz-results.js` / `progress.js`** — Progress persistence
- **`leaderboard.js` / `battles.js` / `contests.js`** — Competitive features
- **`csrf-token.js`** — CSRF protection token issuance

### Backend Services
- **`services/auth.service.js`** — PBKDF2 password hashing, signed access/refresh tokens, rate limiting
- **`services/email.service.js`** — Verification and notification emails via Nodemailer
- **`services/memory.service.js`** — SM-2 spaced repetition scheduling
- **`services/readinessEngine.js`** — Hiring readiness scoring engine
- **`jobs/`** — BullMQ queue, worker, and background score updates
- **`jsSandboxRunner.js`** — `isolated-vm` based JavaScript sandbox
- **`resume-analyzer/`** — Resume parsing, ATS scoring, and skill gap analysis
- **`repository-analyzer/`** — Repository and CI/CD pipeline analysis
- **`knowledge-base/`** — OpenAI client, vector store, and topic generation helpers

### State Management
Client-side state (profile, XP, streaks, badges, quiz scores, favorites) is still persisted to **`localStorage`** under the key `algoInfinityVerse`. Multi-user data and long-term progress are stored in **Firebase/Firestore** through the server API.

----

## Extending the Project

### Adding New Quiz Questions

Edit `script.js` and add to `quizQuestions` object:

```javascript
const quizQuestions = {
    arrays: [
        {
            id: "arrays-11", // unique ID
            question: "Your question here?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0, // 0-indexed correct answer
            explanation: "Detailed explanation of why the answer is correct"
        },
        // ... more questions
    ],
    // ... other topics
};
```

### Adding New Topics

1. Add to `dsaTopics` array with icon, description, theory
2. Add corresponding `quizQuestions[topicKey]` array with 10 questions
3. The UI auto-generates topic cards and quiz cards

### Customization

**Colors**: Edit CSS variables in `:root`:
```css
:root {
    --primary: #7c3aed;      /* Main purple */
    --secondary: #3b82f6;    /* Blue accent */
    --accent: #06b6d4;       /* Cyan highlight */
    /* ... */
}
```

**Fonts**: Update Google Fonts links in `index.html` and CSS `font-family` declarations.

**XP Values**: Modify `getXPForDifficulty()` function for practice problems or quiz XP calculation.

----

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses modern ES6+ features and CSS Grid/Flexbox.

----

## Future Enhancements

Features already delivered:
- Database backend for multi-user support (Firebase / Firestore)
- Real code execution sandbox (`/api/execute` + `isolated-vm`)
- Interview simulation mode and company-specific question banks

Potential features for expansion:
- Social features (friends, groups, competitions)
- Advanced analytics and learning insights
- Video tutorials and explanations
- Mobile app (React Native)
- Real-time collaborative coding rooms
- AI-powered personalized learning paths

---

## Contributing & Community

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code of Conduct

Be respectful and constructive. See our [Code of Conduct](CODE_OF_CONDUCT.md) for guidelines.

---

## Support

- 📧 Email: opensource@algo-infinity-verse.org
- 💬 Discord: [Join our server](https://discord.gg/algo-infinity)
- 🐛 Report bugs via [GitHub Issues](https://github.com/Algo-Infinity-Verse/Algo-Infinity-Verse/issues)

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- Inspired by LeetCode, HackerRank, and freeCodeCamp
- Built with ❤️ for the DSA learning community
- Icons by Font Awesome
- Fonts by Google Fonts

---

**Start your DSA journey today and level up your coding skills!!** 
