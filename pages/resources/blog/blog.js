(() => {
/**
 * blog.js
 * Handles routing, rendering, search, and filtering for the Blog page.
 */

// Mock Database of Blog Posts
const blogPosts = [
    {
        id: 1,
        title: "Mastering Dynamic Programming: A Beginner's Guide",
        excerpt: "Dynamic Programming doesn't have to be scary. Learn how to identify overlapping subproblems and build optimal substructures step by step.",
        content: `
            <p>Dynamic Programming (DP) is often considered the most intimidating topic for coding interviews. However, at its core, it's just recursion with caching.</p>
            <h2>The Two Properties of DP</h2>
            <ul>
                <li><strong>Overlapping Subproblems:</strong> You are calculating the same function calls multiple times.</li>
                <li><strong>Optimal Substructure:</strong> The optimal solution to a problem can be constructed from optimal solutions of its subproblems.</li>
            </ul>
            <blockquote>"Those who cannot remember the past are condemned to repeat it." - George Santayana (and every recursive function without memoization).</blockquote>
            <h3>Top-Down vs Bottom-Up</h3>
            <p><strong>Top-Down (Memoization):</strong> You write a recursive function and save the results in a hash map. If you see the same inputs again, you return the saved result.</p>
            <pre><code>def fib(n, memo={}):
    if n in memo: return memo[n]
    if n <= 2: return 1
    memo[n] = fib(n-1) + fib(n-2)
    return memo[n]</code></pre>
            <p><strong>Bottom-Up (Tabulation):</strong> You build an array from size 0 up to N, iteratively filling in the values. This avoids recursion stack overflow issues.</p>
            <p>Ready to practice? Check out our <a href="dp-learning.html">dedicated DP module</a>.</p>
        `,
        date: "Jun 10, 2026",
        readTime: "6 min read",
        tags: ["Algorithms", "DP", "Guides"],
        bgClass: "bg-1",
        icon: "fa-brain"
    },
    {
        id: 2,
        title: "Graph Algorithms: BFS vs DFS Explained",
        excerpt: "When should you use Breadth-First Search over Depth-First Search? We break down the complexities, use-cases, and implementations of both.",
        content: `
            <p>Graphs are everywhere: social networks, maps, internet routing. Traversing them efficiently is a fundamental skill for any software engineer.</p>
            <h2>Breadth-First Search (BFS)</h2>
            <p>BFS explores the graph layer by layer, moving outward from the starting node like a ripple in water. It uses a <code>Queue</code>.</p>
            <ul>
                <li><strong>Best for:</strong> Finding the shortest path on an unweighted graph.</li>
                <li><strong>Complexity:</strong> O(V + E) Time, O(V) Space.</li>
            </ul>
            <h2>Depth-First Search (DFS)</h2>
            <p>DFS goes as deep as possible down one path before backing up and trying another. It uses a <code>Stack</code> (or the recursion call stack).</p>
            <ul>
                <li><strong>Best for:</strong> Cycle detection, topological sorting, solving mazes/puzzles.</li>
                <li><strong>Complexity:</strong> O(V + E) Time, O(V) Space.</li>
            </ul>
            <blockquote>Always remember to keep a <code>visited</code> set to avoid infinite loops in cyclic graphs!</blockquote>
        `,
        date: "May 28, 2026",
        readTime: "5 min read",
        tags: ["Algorithms", "Graphs", "Guides"],
        bgClass: "bg-2",
        icon: "fa-project-diagram"
    },
    {
        id: 3,
        title: "Top 10 Patterns for Coding Interviews in 2026",
        excerpt: "Stop blindly solving hundreds of LeetCode problems. Learn these 10 patterns and you'll be able to solve thousands of variations.",
        content: `
            <p>Preparing for interviews at FAANG (or whatever the acronym is this year) can be exhausting. The trick is not to memorize questions, but to memorize <strong>patterns</strong>.</p>
            <h2>1. Sliding Window</h2>
            <p>Used for finding subarrays or substrings that satisfy certain conditions. Instead of nested loops, use two pointers to define a "window" and slide it across the array.</p>
            <h2>2. Two Pointers</h2>
            <p>Perfect for sorted arrays or linked lists. Move pointers towards each other or in the same direction to find pairs or duplicates.</p>
            <h2>3. Fast & Slow Pointers (Tortoise & Hare)</h2>
            <p>Used primarily in Linked Lists to detect cycles, find the middle node, or find the Kth node from the end.</p>
            <h2>4. Merge Intervals</h2>
            <p>Whenever a problem involves overlapping times, meetings, or ranges, sort the intervals by start time and merge them linearly.</p>
            <p><em>Read the full list in our upcoming Part 2!</em></p>
        `,
        date: "May 15, 2026",
        readTime: "8 min read",
        tags: ["Interviews", "Guides"],
        bgClass: "bg-3",
        icon: "fa-laptop-code"
    },
    {
        id: 4,
        title: "Introduction to System Design: Load Balancers",
        excerpt: "Scaling from 100 users to 1,000,000 users? You're going to need a Load Balancer. Here is how they work under the hood.",
        content: `
            <p>As traffic to your application grows, a single server will eventually fail. The solution is horizontal scaling (adding more servers). But how do users know which server to talk to? Enter the <strong>Load Balancer</strong>.</p>
            <h2>What is a Load Balancer?</h2>
            <p>A load balancer sits between your clients and your servers. It receives incoming network traffic and distributes it across multiple backend servers.</p>
            <h3>Routing Algorithms</h3>
            <ul>
                <li><strong>Round Robin:</strong> Requests are distributed across the group of servers sequentially.</li>
                <li><strong>Least Connections:</strong> A new request is sent to the server with the fewest current connections to clients.</li>
                <li><strong>IP Hash:</strong> The IP address of the client is used to determine which server receives the request. Great for sticky sessions.</li>
            </ul>
            <p>In modern cloud environments, services like AWS ELB or NGINX handle this complexity for you.</p>
        `,
        date: "Apr 02, 2026",
        readTime: "7 min read",
        tags: ["System Design", "Architecture"],
        bgClass: "bg-1",
        icon: "fa-server"
    }
];

// DOM Elements
const els = {
    listingView: document.getElementById('blog-listing-view'),
    detailView: document.getElementById('blog-detail-view'),
    blogGrid: document.getElementById('blogGrid'),
    searchInput: document.getElementById('searchInput'),
    filterTags: document.getElementById('filterTags'),
    noResults: document.getElementById('no-results'),
    
    // Detail Elements
    btnBack: document.getElementById('btnBack'),
    detailTitle: document.getElementById('detailTitle'),
    detailDate: document.getElementById('detailDate'),
    detailReadTime: document.getElementById('detailReadTime'),
    detailTags: document.getElementById('detailTags'),
    detailContent: document.getElementById('detailContent'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext')
};

// Current State
let currentFilter = 'all';
let searchQuery = '';
let currentPostId = null;

document.addEventListener("DOMContentLoaded", () => {
    initBlog();
    window.addEventListener('hashchange', handleRoute);
});

function initBlog() {
    renderBlogList();
    setupEventListeners();
    handleRoute(); // Check initial URL
}

function setupEventListeners() {
    // Search
    els.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderBlogList();
    });

    // Tag Filters
    els.filterTags.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-btn')) {
            // Update active state
            document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-tag');
            renderBlogList();
        }
    });

    // Back Button
    els.btnBack.addEventListener('click', () => {
        window.location.hash = ''; // Remove hash to go back to list
    });
}

function handleRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#post-')) {
        const id = parseInt(hash.replace('#post-', ''));
        showPostDetail(id);
    } else {
        showBlogList();
    }
    // Scroll to top on route change
    window.scrollTo(0, 0);
}

function renderBlogList() {
    els.blogGrid.innerHTML = '';
    
    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery) || post.excerpt.toLowerCase().includes(searchQuery);
        const matchesTag = currentFilter === 'all' || post.tags.includes(currentFilter);
        return matchesSearch && matchesTag;
    });

    if (filteredPosts.length === 0) {
        els.noResults.style.display = 'block';
    } else {
        els.noResults.style.display = 'none';
        filteredPosts.forEach(post => {
            const card = document.createElement('a');
            card.href = `#post-${post.id}`;
            card.className = 'blog-card';
            
            const tagsHtml = post.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('');
            
            card.innerHTML = `
                <div class="card-image ${post.bgClass}">
                    <i class="fas ${post.icon}"></i>
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span>${post.date}</span>
                        <span>${post.readTime}</span>
                    </div>
                    <h3 class="card-title">${post.title}</h3>
                    <p class="card-excerpt">${post.excerpt}</p>
                    <div class="card-tags">
                        ${tagsHtml}
                    </div>
                </div>
            `;
            els.blogGrid.appendChild(card);
        });
    }
}

function showBlogList() {
    els.detailView.className = 'view-hidden';
    els.listingView.className = 'view-active';
    document.title = "Blog | Algo Infinity Verse";
}

function showPostDetail(id) {
    const post = blogPosts.find(p => p.id === id);
    if (!post) {
        window.location.hash = ''; // Fallback if invalid ID
        return;
    }

    currentPostId = id;

    // Populate Data
    els.detailTitle.textContent = post.title;
    els.detailDate.innerHTML = `<i class="far fa-calendar-alt"></i> ${post.date}`;
    els.detailReadTime.innerHTML = `<i class="far fa-clock"></i> ${post.readTime}`;
    els.detailContent.innerHTML = post.content;
    
    els.detailTags.innerHTML = post.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('');

    // Handle Pagination Buttons
    const currentIndex = blogPosts.findIndex(p => p.id === id);
    
    if (currentIndex > 0) {
        els.btnPrev.disabled = false;
        els.btnPrev.onclick = () => window.location.hash = `#post-${blogPosts[currentIndex - 1].id}`;
    } else {
        els.btnPrev.disabled = true;
        els.btnPrev.onclick = null;
    }

    if (currentIndex < blogPosts.length - 1) {
        els.btnNext.disabled = false;
        els.btnNext.onclick = () => window.location.hash = `#post-${blogPosts[currentIndex + 1].id}`;
    } else {
        els.btnNext.disabled = true;
        els.btnNext.onclick = null;
    }

    // Toggle Views
    els.listingView.className = 'view-hidden';
    els.detailView.className = 'view-active';
    document.title = `${post.title} | Algo Infinity Verse`;
}
})();
