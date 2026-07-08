// ===== STATE MANAGEMENT =====
const COMMUNITY_STORAGE_KEY = 'algoInfinityVerse_communityPosts';

// Sample initial data if storage is empty
const initialPosts = [
    {
        id: 1,
        title: "How to approach dynamic programming?",
        content: "I always struggle with finding the state and base cases for DP problems. What's a good mental model for this?",
        tags: ["dp", "help", "strategy"],
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        votes: 12,
        userVote: 0,
        comments: [
            { text: "Try to solve it recursively first, then memoize it. If you can write the recursive relation, you have your state!", timestamp: new Date(Date.now() - 80000000).toISOString() }
        ]
    },
    {
        id: 2,
        title: "Great resource for Graph Algorithms",
        content: "Just found this amazing visualization tool for Dijkstra and A*. It really helped me understand how the priority queue works under the hood.",
        tags: ["graphs", "resources"],
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        votes: 24,
        userVote: 1,
        comments: []
    }
];

function getPosts() {
    const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (stored) {
        let posts = JSON.parse(stored);
        let migrated = false;
        posts = posts.map(p => {
            if (p.likes !== undefined) {
                p.votes = p.likes;
                p.userVote = p.isLiked ? 1 : 0;
                delete p.likes;
                delete p.isLiked;
                migrated = true;
            }
            return p;
        });
        if (migrated) savePosts(posts);
        return reconcilePosts(validatePosts(posts));
    }
    // Set initial data if none exists
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(initialPosts));
    return initialPosts;
}

function savePosts(posts) {
    const validatedPosts = validatePosts(posts);
    const reconciledPosts = reconcilePosts(validatedPosts);

    localStorage.setItem(
        COMMUNITY_STORAGE_KEY,
        JSON.stringify(reconciledPosts)
    );
}

function validatePosts(posts) {
    return posts.filter(post =>
        post &&
        typeof post.id !== "undefined" &&
        typeof post.title === "string" &&
        typeof post.content === "string"
    );
}

function reconcilePosts(posts) {
    const uniquePosts = new Map();

    posts.forEach(post => {
        const existing = uniquePosts.get(post.id);

        if (!existing) {
            uniquePosts.set(post.id, post);
            return;
        }

        const existingTime = new Date(existing.timestamp).getTime();
        const currentTime = new Date(post.timestamp).getTime();

        if (currentTime > existingTime) {
            uniquePosts.set(post.id, post);
        }
    });

    return Array.from(uniquePosts.values());
}

function sortCommentsByTimestamp(comments = []) {
    return comments.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
}

function generateUniquePostId(posts) {
    let id = Date.now();

    while (posts.some(post => post.id === id)) {
        id++;
    }

    return id;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Set flag so if user navigates to index.html, it skips the intro animation
    sessionStorage.setItem('algoInfinityVerse_appLoaded', 'true');
    initNavbar();
    initCommunityFeed();
});

// ===== NAVBAR & UI (Reused logic) =====
function initNavbar() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    let overlay = document.querySelector('.nav-overlay');
    if (!overlay && menuToggle && navLinks) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }

    const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen);
        if (overlay) overlay.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !isOpen);
            icon.classList.toggle('fa-times', isOpen);
        }
    };

    const closeMenu = () => {
        if (!navLinks.classList.contains('active')) return;
        toggleMenu(false);
    };

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) overlay.addEventListener('click', closeMenu);

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Dropdown functionality
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;

    dropdownToggles.forEach(toggle => {
        const parent = toggle.closest('.has-dropdown');
        const menu = parent?.querySelector('.dropdown-menu');
        if (!parent || !menu) return;

        let hoverTimeout;

        const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
        const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }, 250); };

        parent.addEventListener('mouseenter', () => { if (!isMobile()) showMenu(); });
        parent.addEventListener('mouseleave', () => { if (!isMobile()) hideMenu(); });
        toggle.addEventListener('focus', () => { if (!isMobile()) showMenu(); });
        menu.addEventListener('focusin', () => { if (!isMobile()) showMenu(); });
        parent.addEventListener('focusout', () => { if (!isMobile()) hideMenu(); });

        toggle.addEventListener('click', (e) => {
            if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle('open'); toggle.setAttribute('aria-expanded', isOpen); }
        });

        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                if (isMobile()) { parent.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
            });
        });
    });

    window.addEventListener('resize', () => {
        if (!isMobile()) {
            document.querySelectorAll('.has-dropdown.open').forEach(el => el.classList.remove('open'));
            dropdownToggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
        }
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(10, 10, 26, 0.95)';
            } else {
                navbar.style.background = 'rgba(10, 10, 26, 0.95)';
            }
        }
    });
}


// ===== COMMUNITY LOGIC =====
let currentSearchQuery = '';
let currentTagFilter = '';

function initCommunityFeed() {
    renderPosts();
    renderTrendingTags();

    const form = document.getElementById('createPostForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            createNewPost();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderPosts();
        });
    }
}

function setTagFilter(tag) {
    currentTagFilter = tag.toLowerCase();
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = 'inline-block';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    renderPosts();
}

function clearTagFilter() {
    currentTagFilter = '';
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = 'none';
    renderPosts();
}

function renderTrendingTags() {
    const container = document.getElementById('trendingTagsContainer');
    if (!container) return;
    
    const posts = getPosts();
    const tagCounts = {};
    
    posts.forEach(p => {
        if (p.tags) {
            p.tags.forEach(tag => {
                const t = tag.toLowerCase().trim();
                if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        }
    });
    
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    container.innerHTML = '';
    if (sortedTags.length > 0) {
        sortedTags.forEach(([tag]) => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.style.cursor = 'pointer';
            span.textContent = `#${tag}`;
            span.addEventListener('click', () => setTagFilter(tag));
            container.appendChild(span);
        });
    } else {
        const p = document.createElement('p');
        p.className = 'text-secondary';
        p.style.fontSize = '0.9rem';
        p.textContent = 'No tags yet';
        container.appendChild(p);
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    let posts = getPosts();
    
    // Apply Filters
    if (currentTagFilter) {
        posts = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase().trim() === currentTagFilter));
    }
    if (currentSearchQuery) {
        posts = posts.filter(p => 
            p.title.toLowerCase().includes(currentSearchQuery) || 
            p.content.toLowerCase().includes(currentSearchQuery) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(currentSearchQuery)))
        );
    }
    
    container.innerHTML = '';

    if (posts.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-secondary text-center';
        p.textContent = 'No posts found.';
        container.appendChild(p);
        return;
    }

    // Sort by newest first
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card glass-card animate-in';
        
        // Post Header
        const postHeader = document.createElement('div');
        postHeader.className = 'post-header';
        
        const postTitle = document.createElement('h4');
        postTitle.className = 'post-title';
        postTitle.textContent = post.title;
        
        const postMeta = document.createElement('span');
        postMeta.className = 'post-meta';
        postMeta.textContent = formatDate(post.timestamp);
        
        postHeader.appendChild(postTitle);
        postHeader.appendChild(postMeta);
        card.appendChild(postHeader);
        
        // Post Content
        const postContent = document.createElement('div');
        postContent.className = 'post-content markdown-body';
        
        let safePostHtml = '';
        if (typeof MarkdownParser !== 'undefined') {
            const parsedHtml = MarkdownParser.parse(post.content);
            if (typeof window !== 'undefined' && window.DOMSanitizer) {
                safePostHtml = window.DOMSanitizer.sanitizeHTML(parsedHtml);
            } else if (typeof DOMPurify !== 'undefined') {
                safePostHtml = DOMPurify.sanitize(parsedHtml, {
                    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                });
            } else {
                safePostHtml = escapeHtml(post.content);
            }
        } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            safePostHtml = DOMPurify.sanitize(marked.parse(post.content, { breaks: true }), {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                ALLOWED_ATTR: ['href', 'target', 'rel']
            });
        } else {
            safePostHtml = escapeHtml(post.content);
        }
        postContent.innerHTML = safePostHtml;
        card.appendChild(postContent);
        
        // Post Tags
        if (post.tags && post.tags.length > 0) {
            const postTags = document.createElement('div');
            postTags.className = 'post-tags';
            post.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'post-tag';
                tagSpan.style.cursor = 'pointer';
                tagSpan.textContent = `#${tag.trim()}`;
                tagSpan.addEventListener('click', () => setTagFilter(tag));
                postTags.appendChild(tagSpan);
            });
            card.appendChild(postTags);
        }

        // Post Actions
        const postActions = document.createElement('div');
        postActions.className = 'post-actions';
        postActions.style.display = 'flex';
        postActions.style.gap = '15px';
        
        const voteActions = document.createElement('div');
        voteActions.className = 'vote-actions';
        voteActions.style.display = 'flex';
        voteActions.style.alignItems = 'center';
        voteActions.style.gap = '8px';
        voteActions.style.background = 'rgba(255,255,255,0.05)';
        voteActions.style.padding = '4px 10px';
        voteActions.style.borderRadius = '20px';
        
        const upvoteBtn = document.createElement('button');
        upvoteBtn.className = `post-action-btn ${post.userVote === 1 ? 'liked' : ''}`;
        upvoteBtn.style.padding = '0';
        upvoteBtn.style.minWidth = 'auto';
        upvoteBtn.style.border = 'none';
        upvoteBtn.style.background = 'transparent';
        upvoteBtn.style.transform = 'scale(1.1)';
        upvoteBtn.style.color = post.userVote === 1 ? '#22c55e' : 'inherit';
        upvoteBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        upvoteBtn.addEventListener('click', () => handleVote(post.id, 1));
        
        const voteCount = document.createElement('span');
        voteCount.style.fontWeight = '500';
        voteCount.style.color = post.userVote === 1 ? '#22c55e' : post.userVote === -1 ? '#ef4444' : 'inherit';
        voteCount.textContent = post.votes !== undefined ? post.votes : 0;
        
        const downvoteBtn = document.createElement('button');
        downvoteBtn.className = `post-action-btn ${post.userVote === -1 ? 'liked' : ''}`;
        downvoteBtn.style.padding = '0';
        downvoteBtn.style.minWidth = 'auto';
        downvoteBtn.style.border = 'none';
        downvoteBtn.style.background = 'transparent';
        downvoteBtn.style.transform = 'scale(1.1)';
        downvoteBtn.style.color = post.userVote === -1 ? '#ef4444' : 'inherit';
        downvoteBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        downvoteBtn.addEventListener('click', () => handleVote(post.id, -1));
        
        voteActions.appendChild(upvoteBtn);
        voteActions.appendChild(voteCount);
        voteActions.appendChild(downvoteBtn);
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'post-action-btn';
        commentBtn.style.background = 'rgba(255,255,255,0.05)';
        commentBtn.style.padding = '4px 15px';
        commentBtn.style.borderRadius = '20px';
        commentBtn.innerHTML = '<i class="far fa-comment"></i> ';
        
        const commentCount = document.createElement('span');
        commentCount.textContent = post.comments ? post.comments.length : 0;
        commentBtn.appendChild(commentCount);
        commentBtn.addEventListener('click', () => toggleComments(post.id));
        
        postActions.appendChild(voteActions);
        postActions.appendChild(commentBtn);
        card.appendChild(postActions);

        // Comments Section
        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section';
        commentsSection.id = `comments-${post.id}`;
        
        const commentsList = document.createElement('div');
        commentsList.className = 'comments-list';
        
        if (post.comments) {
            post.comments = sortCommentsByTimestamp(post.comments);
            post.comments.forEach(c => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                
                const commentMeta = document.createElement('div');
                commentMeta.className = 'comment-meta';
                commentMeta.textContent = formatDate(c.timestamp);
                
                const commentText = document.createElement('div');
                commentText.className = 'comment-text markdown-body';
                
                let safeCommentHtml = '';
                if (typeof MarkdownParser !== 'undefined') {
                    const parsedHtml = MarkdownParser.parse(c.text);
                    if (typeof window !== 'undefined' && window.DOMSanitizer) {
                        safeCommentHtml = window.DOMSanitizer.sanitizeHTML(parsedHtml);
                    } else if (typeof DOMPurify !== 'undefined') {
                        safeCommentHtml = DOMPurify.sanitize(parsedHtml, {
                            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                            ALLOWED_ATTR: ['href', 'target', 'rel']
                        });
                    } else {
                        safeCommentHtml = escapeHtml(c.text);
                    }
                } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                    safeCommentHtml = DOMPurify.sanitize(marked.parse(c.text, { breaks: true }), {
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'],
                        ALLOWED_ATTR: ['href', 'target', 'rel']
                    });
                } else {
                    safeCommentHtml = escapeHtml(c.text);
                }
                commentText.innerHTML = safeCommentHtml;
                
                commentDiv.appendChild(commentMeta);
                commentDiv.appendChild(commentText);
                commentsList.appendChild(commentDiv);
            });
        }
        commentsSection.appendChild(commentsList);

        // Add Comment Form
        const addCommentForm = document.createElement('form');
        addCommentForm.className = 'add-comment-form';
        addCommentForm.addEventListener('submit', (e) => addComment(e, post.id));
        
        const commentInput = document.createElement('textarea');
        commentInput.placeholder = 'Write a comment... (Markdown supported)';
        commentInput.required = true;
        commentInput.style.fontFamily = 'inherit';
        commentInput.rows = 2;
        commentInput.style.resize = 'vertical';
        commentInput.style.flex = '1';
        
        const commentSubmitBtn = document.createElement('button');
        commentSubmitBtn.type = 'submit';
        commentSubmitBtn.className = 'btn btn-primary btn-sm';
        commentSubmitBtn.innerHTML = '<i class="fas fa-reply"></i>';
        
        addCommentForm.appendChild(commentInput);
        addCommentForm.appendChild(commentSubmitBtn);
        commentsSection.appendChild(addCommentForm);
        
        card.appendChild(commentsSection);
        container.appendChild(card);
    });
}

function createNewPost() {
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    const tagsInput = document.getElementById('postTags');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) return;

    let tags = [];
    if (tagsInput.value.trim()) {
        tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    }

    let posts = getPosts();
    posts = reconcilePosts(posts);
    const newPost = {
        id: generateUniquePostId(posts), // simple unique id
        title,
        content,
        tags,
        timestamp: new Date().toISOString(),
        votes: 0,
        userVote: 0,
        comments: []
    };

    posts.push(newPost);
    savePosts(posts);

    // Reset form
    titleInput.value = '';
    contentInput.value = '';
    tagsInput.value = '';

    // Re-render
    renderPosts();
    renderTrendingTags();
}

function handleVote(postId, voteValue) {
    let posts = getPosts();
    posts = reconcilePosts(posts);
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.userVote === voteValue) {
            // Un-vote
            post.votes -= voteValue;
            post.userVote = 0;
        } else {
            // Change vote or new vote
            post.votes += (voteValue - post.userVote);
            post.userVote = voteValue;
        }
        savePosts(posts);
        renderPosts();
    }
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
        section.classList.toggle('active');
    }
}

function addComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const input = form.querySelector('textarea') || form.querySelector('input');
    const text = input.value.trim();

    if (!text) return;

    let posts = getPosts();
    posts = reconcilePosts(posts);
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push({
            text,
            timestamp: new Date().toISOString()
        });
        savePosts(posts);
        
        // Re-render and keep comments open
        renderPosts();
        setTimeout(() => {
            const section = document.getElementById(`comments-${postId}`);
            if (section) section.classList.add('active');
        }, 50);
    }
}

// Utility to prevent XSS in user input (delegating to centralized DOMSanitizer if available)
function escapeHtml(unsafe) {
    if (typeof window !== 'undefined' && window.DOMSanitizer) {
        return window.DOMSanitizer.escapeHtml(unsafe);
    }
    return String(unsafe || '')
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
