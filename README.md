<div align="center">

# 🧮 Algo Infinity Verse 🌌

### ⚙️ Master Data Structures & Algorithms and Crack Technical Interviews

[![GitHub repo size](https://img.shields.io/github/repo-size/Eshajha19/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse)
[![GitHub last commit](https://img.shields.io/github/last-commit/Algo-Infinity-Verse/Algo-Infinity-Verse)](https://github.com/Eshajha19/Algo-Infinity-Verse)

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

## 🎯 Features

### Core Learning Resources

#### 🧮 DSA Topics
- **6 Comprehensive Topics**: Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming
- Each topic includes:
  - Detailed theory explanations
  - Key concepts and properties
  - Common problem patterns
  - Difficulty ratings (Easy-Medium-Hard)
  - Sample problem lists

#### ✍ Practice Problems
- **15+ curated problems** spanning all DSA topics
- Filterable by difficulty (Easy, Medium, Hard)
- Real-time search functionality
- Problem tags for quick identification
- Acceptance rate tracking
- Visual completion badges

#### ❤️ Favorite Problems (New Feature)

Users can now:
- Mark practice problems as favorites
- Filter favorite problems
- Persist favorites using localStorage

**How it works:**
- Click the heart icon on any practice problem
- Use the "Favorites" filter to view saved problems

----

### 🏆 Quiz System

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

#### 🖧 Quiz Architecture 

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

### 👤 Profile & Gamification

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

### 📊 Dashboard
- Complete statistics overview
- Recent activity feed
- Achievement badges display
- Leaderboard comparison
- Roadmap progress visualization

----

### 🛡️ Authentication
- Secure signup and login pages
- PBKDF2 password hashing with per-user salts
- Signed JWT-style sessions stored in HTTP-only cookies
- Logout endpoint that clears the session cookie
- Protected community and support pages
- Dashboard/profile hash routes redirected to login when unauthenticated

----

### </> Interactive Code Editor
- Multi-language support (JavaScript, Python, Java, C++)
- Line numbers and syntax highlighting
- Code snippets insertion
- Auto-formatting
- Line comment toggling
- Run and submit simulation
- Test case validation

----

### 🤖 AI Chatbot Assistant
- Instant DSA concept explanations
- Time/space complexity queries
- Problem-solving strategy hints
- Quick question buttons
- Context-aware responses

----

### 🎨 User Experience / UX

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

## 🛠️ Technology Stack

- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) **HTML5**: Semantic markup
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) **CSS3**: Custom properties, Flexbox, Grid, animations
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) **JavaScript (ES6+)**: Vanilla JS, no frameworks
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) **Node.js**: Local HTTP server and authentication APIs
- ![Node Crypto](https://img.shields.io/badge/Node_Crypto-339933?style=flat-square&logo=nodedotjs&logoColor=white) **Node Crypto**: Password hashing and signed session tokens
- ![LocalStorage](https://img.shields.io/badge/LocalStorage-4B32C3?style=flat-square&logo=webauthn&logoColor=white) **LocalStorage**: Persistent user data
- ![Font Awesome](https://img.shields.io/badge/Font_Awesome-528DD7?style=flat-square&logo=font-awesome&logoColor=white) **Font Awesome**: Icon library
- ![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=flat-square&logo=googlefonts&logoColor=white) **Google Fonts**: Orbitron, Poppins, Fira Code

----

## 🚀 How to Run

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Algo-Infinity-Verse.git
   cd Algo-Infinity-Verse
   ```

2. **Start the authenticated app**
   Create your local environment file:
   ```bash
   cp .env.example .env
   ```

   Generate a session secret and paste it into `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

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

## 📂 Project Structure

```
Algo-Infinity-Verse/
├── index.html          # Main HTML structure
├── login.html          # Login page
├── signup.html         # Registration page
├── server.js           # Static server and authentication API
├── auth.js             # Client-side auth UI and route guards
├── styles.css          # All CSS styles and responsive design
├── script.js           # JavaScript logic, data, and interactivity
└── README.md           # Project documentation
```

---

## ✅ Key Scripts

### 🧬 Data Structures

**`dsaTopics`** - Topic information including:
- ID, name, icon, description
- Difficulty level
- Theory explanation
- Related problems

**`quizQuestions`** - Quiz database:
- 60 questions across 6 topics
- Multiple-choice format (4 options)
- Correct answer indices
- Detailed explanations

**`practiceProblems`** - Problem catalog:
- Title, difficulty, tags
- Acceptance rates
- Category associations

**`chatbotResponses`** - Knowledge base:
- DSA concept explanations
- Complexity definitions
- Algorithm overviews

### 🟢 State Management

`userProgress` object tracks:
- User name and avatar
- Completed problem IDs
- Total XP and current level
- Day streak count
- Earned badges
- Quiz scores per topic
- Last active date

Persisted to `localStorage` under key `algoInfinityVerse`.

----

## ✚ Extending the Project

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

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses modern ES6+ features and CSS Grid/Flexbox.

----

## 🔮 Future Enhancements

Potential features for expansion:
- Database backend for multi-user support
- Real code execution sandbox
- Social features (friends, groups, competitions)
- Advanced analytics and learning insights
- Video tutorials and explanations
- Mobile app (React Native)
- Interview simulation mode
- Company-specific question banks

---

## 🤝 Contributing & Community

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### ❓ How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### ❤️ Code of Conduct

Be respectful and constructive. See our [Code of Conduct](CODE_OF_CONDUCT.md) for guidelines.

---

## 📞 Support

- 📧 Email: opensource@algo-infinity-verse.org
- 💬 Discord: [Join our server](https://discord.gg/algo-infinity)
- 🐛 Report bugs via [GitHub Issues](https://github.com/Algo-Infinity-Verse/Algo-Infinity-Verse/issues)

---

## ⚖️ License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📜 Acknowledgments

- Inspired by LeetCode, HackerRank, and freeCodeCamp
- Built with ❤️ for the DSA learning community
- Icons by Font Awesome
- Fonts by Google Fonts

---

**Start your DSA journey today and level up your coding skills!** 🚀
