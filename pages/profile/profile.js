// pages/profile/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // We rely on userProgress and practiceProblems being globally available from script.js
    
    // Configuration
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;
    let filteredProblems = [];

    // DOM Elements
    const grid = document.getElementById('solvedGrid');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('profilePagination');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const searchInput = document.getElementById('searchSolved');
    const difficultyFilter = document.getElementById('difficultyFilter');
    
    // Profile Header Elements
    const userNameEl = document.getElementById('userName');
    const userLevelEl = document.getElementById('userLevel');
    const userStreakEl = document.getElementById('userStreak');
    const userXPEl = document.getElementById('userXP');
    const solvedCountEl = document.getElementById('solvedCount');

    // Profile Image Upload Elements
    const avatarUploadOverlay = document.getElementById('avatarUploadOverlay');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const profileAvatarImage = document.getElementById('profileAvatarImage');
    const profileAvatarEmoji = document.getElementById('profileAvatarEmoji');

    // Wait a brief moment to ensure script.js has loaded userProgress from localStorage
    setTimeout(() => {
        initProfile();
    }, 100);

    // Bug 1: Wire up camera button to trigger file input
    if (avatarUploadOverlay && avatarFileInput) {
        avatarUploadOverlay.addEventListener('click', () => {
            avatarFileInput.click();
        });

        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                if (typeof showNotification === 'function') {
                    showNotification('Please select an image file.', 'error');
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                if (profileAvatarImage) {
                    profileAvatarImage.src = dataUrl;
                    profileAvatarImage.style.display = 'block';
                }
                if (profileAvatarEmoji) {
                    profileAvatarEmoji.style.display = 'none';
                }

                // Save to userProgress
                if (typeof userProgress !== 'undefined') {
                    userProgress.avatar = dataUrl;
                    if (typeof saveUserData === 'function') {
                        saveUserData();
                    } else {
                        localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
                    }
                }

                // Sync card avatar
                const cardAvatar = document.getElementById('cardAvatar');
                if (cardAvatar) {
                    cardAvatar.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.alt = 'Avatar';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    cardAvatar.appendChild(img);
                }

                if (typeof showNotification === 'function') {
                    showNotification('Avatar updated!', 'success');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Wire up languages edit button
    const languagesEditBtn = document.getElementById('languagesEditBtn');
    if (languagesEditBtn) {
        languagesEditBtn.addEventListener('click', () => {
            if (typeof window.openProfileModal === 'function') {
                window.openProfileModal();
            }
        });
    }

    // Wire up profile page save/cancel buttons
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    const profileCancelBtn = document.getElementById('profileCancelBtn');
    
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', () => {
            if (typeof window.saveProfileChanges === 'function') {
                window.saveProfileChanges();
            }
        });
    }
    
    if (profileCancelBtn) {
        profileCancelBtn.addEventListener('click', () => {
            if (typeof window.closeProfileModal === 'function') {
                window.closeProfileModal();
            }
        });
    }

    function initProfile() {
        // Check if userProgress is available
        if (typeof userProgress === 'undefined') {
            console.error("userProgress is not defined");
            return;
        }
        
        // Populate Header Data
        userNameEl.textContent = userProgress.name || "Learner";
        userLevelEl.textContent = `Level ${userProgress.level || 1}`;
        userStreakEl.textContent = userProgress.streak || 0;
        userXPEl.textContent = userProgress.xp || 0;

        // Render profile avatar (image upload or initial-based circle)
        if (userProgress.avatar && typeof userProgress.avatar === 'string' && userProgress.avatar.startsWith('data:image')) {
            if (profileAvatarImage) {
                profileAvatarImage.src = userProgress.avatar;
                profileAvatarImage.style.display = 'block';
            }
            if (profileAvatarEmoji) {
                profileAvatarEmoji.style.display = 'none';
            }
        } else if (profileAvatarEmoji && typeof window.renderAvatarElement === 'function') {
            // Hide the <img> tag if no uploaded image
            if (profileAvatarImage) profileAvatarImage.style.display = 'none';
            // Use initial-based colored circle
            const av = userProgress.avatar || (typeof window.getInitialAvatar === 'function' ? window.getInitialAvatar(userProgress.name) : { initial: (userProgress.name || 'L').charAt(0).toUpperCase(), bg: '#7c3aed' });
            profileAvatarEmoji.style.display = '';
            profileAvatarEmoji.innerHTML = '';
            window.renderAvatarElement(profileAvatarEmoji, av, 80);
        }
        
        // Map completed IDs to actual problem objects
        const solvedIds = userProgress.completedProblems || [];
        
        if (typeof practiceProblems !== 'undefined') {
            filteredProblems = solvedIds.map(id => {
                const prob = practiceProblems.find(p => p.id === id);
                if (prob) {
                    return { ...prob, completedAt: "Unknown" };
                }
                return null;
            }).filter(Boolean);
        }
        
        solvedCountEl.textContent = filteredProblems.length;
        
        // Initial render
        applyFilters();

        // Initialize Coding Identity Card
        initIdentityCard();

        // Populate Leaderboard
        populateLeaderboard();

        // Show saved languages
        if (typeof window.renderLanguageChips === 'function') {
            window.renderLanguageChips();
        }
    }

    // Simple save profile changes function for the profile page
    function simpleSaveProfileChanges() {
        if (typeof userProgress === 'undefined') return;
        
        // Clear any existing errors
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) errorMsg.remove();
        
        const nameVal = userNameEl.textContent || "Learner";
        
        // Update userProgress
        userProgress.name = nameVal;
        
        // Save to storage
        if (typeof window.saveUserData === 'function') {
            window.saveUserData();
        } else {
            localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
        }
        
        // Update UI
        if (typeof window.updateProfileViews === 'function') {
            window.updateProfileViews();
        }
        
        // Close modal
        if (typeof window.closeProfileModal === 'function') {
            window.closeProfileModal();
        }
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification("Profile updated successfully!", "success");
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const difficulty = difficultyFilter.value;

        // Reset to full list
        const solvedIds = userProgress.completedProblems || [];
        let allSolved = solvedIds.map(id => practiceProblems.find(p => p.id === id)).filter(Boolean);

        // Apply Search
        if (searchTerm) {
            allSolved = allSolved.filter(p => p.title.toLowerCase().includes(searchTerm) || (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm))));
        }

        // Apply Difficulty Filter
        if (difficulty !== 'all') {
            allSolved = allSolved.filter(p => p.difficulty === difficulty);
        }

        filteredProblems = allSolved;
        currentPage = 1; // Reset to page 1
        
        renderGrid();
    }

    function renderGrid() {
        grid.innerHTML = '';
        
        if (filteredProblems.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }

        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Calculate pagination
        const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentBatch = filteredProblems.slice(startIndex, endIndex);

        // Render cards
        currentBatch.forEach(problem => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            
            // Generate tags HTML
            const tagsHtml = problem.tags ? problem.tags.slice(0, 3).map(tag => `<span class="tag" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.1); border-radius: 10px; margin-right: 0.5rem;">${tag}</span>`).join('') : '';

            card.innerHTML = `
                <div class="problem-header" style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 class="problem-title">${problem.title}</h3>
                        <span class="difficulty-badge ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                    </div>
                    <button class="export-md-btn" title="Export as Markdown" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; transition: color 0.2s;">
                        <i class="fas fa-file-download"></i>
                    </button>
                </div>
                <div class="problem-tags" style="margin-bottom: 1rem; margin-top: 0.5rem;">
                    ${tagsHtml}
                </div>
                <div class="problem-meta">
                    <span class="category"><i class="fas fa-folder"></i> ${problem.category || 'General'}</span>
                    <span class="completion-date"><i class="fas fa-calendar-check"></i> Past</span>
                </div>
            `;
            
            // Add click listener to go to problem
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Ignore clicks on the export button
                if (e.target.closest('.export-md-btn')) {
                    const solution = userProgress.submittedSolutions ? userProgress.submittedSolutions[problem.id] : null;
                    if (typeof exportProblemAsMarkdown === 'function') {
                        exportProblemAsMarkdown(problem, solution);
                    } else {
                        console.error("Export utility not found.");
                    }
                    return;
                }

                if (typeof openQuizEditor === 'function') {
                    // We need to trigger the editor, maybe navigate to main page with a hash
                    window.location.href = `../../pages/practice/problems.html?problem=${problem.id}`;
                }
            });

            grid.appendChild(card);
        });

        // Update Pagination Controls
        if (totalPages > 1) {
            pagination.classList.remove('hidden');
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
        } else {
            pagination.classList.add('hidden');
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', applyFilters);
    difficultyFilter.addEventListener('change', applyFilters);

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderGrid();
            window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderGrid();
            window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
        }
    });

    // ============================================
    // CODING IDENTITY CARD UTILITIES
    // ============================================

    async function initIdentityCard() {
        if (typeof userProgress === 'undefined') return;

        // Populate details
        const cardAvatar = document.getElementById("cardAvatar");
        const cardUserName = document.getElementById("cardUserName");
        const cardUserLevelBadge = document.getElementById("cardUserLevelBadge");
        const cardUserTitle = document.getElementById("cardUserTitle");
        const cardRank = document.getElementById("cardRank");
        const cardXP = document.getElementById("cardXP");
        const cardStreak = document.getElementById("cardStreak");
        const cardSkills = document.getElementById("cardSkills");

        const levelNames = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master", "Grandmaster", "Legend"];
        const levelTitle = levelNames[Math.min(userProgress.level - 1, levelNames.length - 1)] || "Beginner";

        if (cardAvatar) {
            cardAvatar.textContent = '';
            cardAvatar.style.fontSize = '0';
            const rawAv = userProgress.avatar;
            if (rawAv && typeof rawAv === 'string' && rawAv.startsWith('data:image')) {
                const img = document.createElement('img');
                img.src = rawAv;
                img.alt = 'Avatar';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                cardAvatar.appendChild(img);
            } else {
                const av = (rawAv && typeof rawAv === 'object') ? rawAv : { initial: (userProgress.name || 'L').charAt(0).toUpperCase(), bg: '#7c3aed' };
                const initial = av.initial || 'L';
                const bg = av.bg || '#7c3aed';
                const span = document.createElement('span');
                span.textContent = initial;
                span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:${bg};color:#fff;font-size:1.8rem;font-weight:600;font-family:'Poppins',sans-serif;`;
                cardAvatar.style.fontSize = '0';
                cardAvatar.appendChild(span);
            }
        }
        if (cardUserName) cardUserName.textContent = userProgress.name || "Learner";
        if (cardUserLevelBadge) cardUserLevelBadge.textContent = `Level ${userProgress.level || 1}`;
        if (cardUserTitle) cardUserTitle.textContent = levelTitle;
        if (cardXP) {
            const xpVal = userProgress.xp || 0;
            cardXP.textContent = xpVal > 0 ? xpVal.toLocaleString() : "-";
        }
        if (cardStreak) {
            const streakVal = userProgress.streak || 0;
            cardStreak.textContent = streakVal > 0 ? streakVal : "-";
        }

        // Fetch Leaderboard Rank
        if (cardRank) {
            cardRank.textContent = "...";
            getLeaderboardRank().then(rank => {
                cardRank.textContent = rank;
            });
        }

        // Compute Top Skills
        if (cardSkills) {
            const skills = getTopSkills();
            cardSkills.innerHTML = skills.map(skill => `<span class="skill-pill">${skill}</span>`).join("");
        }

        // Generate QR Code
        const cardQrCode = document.getElementById("cardQrCode");
        if (cardQrCode) {
            cardQrCode.innerHTML = "";
            const profileUrl = window.location.origin + window.location.pathname.replace("profile.html", "public-profile.html") + "?uid=" + getCurrentUserId();
            try {
                new QRCode(cardQrCode, {
                    text: profileUrl,
                    width: 120,
                    height: 120,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.M
                });
            } catch (err) {
                console.error("Error generating QR code:", err);
            }
        }
    }

    async function getLeaderboardRank() {
        const hasProgress = (userProgress.xp || 0) > 0 || (userProgress.streak || 0) > 0;
        if (!hasProgress) return "-";

        try {
            let leaders = [];
            let currentUserId = "local-user";
            
            if (typeof loadLeaderboard === 'function') {
                const res = await loadLeaderboard();
                leaders = res.leaders || [];
                currentUserId = res.currentUserId || currentUserId;
            }
            
            const resolvedCurrentUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : currentUserId;
            
            if (typeof buildLeaderboardRows === 'function') {
                const rows = buildLeaderboardRows(leaders, resolvedCurrentUserId);
                const userRow = rows.find(r => r.id === resolvedCurrentUserId || (resolvedCurrentUserId === "local-user" && r.id === "local-user"));
                if (userRow && userRow.rank) {
                    return `#${userRow.rank}`;
                }
            }
        } catch (e) {
            void 0;
        }
        return "-";
    }

    function getTopSkills() {
        const solvedIds = userProgress.completedProblems || [];
        if (solvedIds.length === 0 || typeof practiceProblems === 'undefined') {
            return ["General"];
        }
        
        const categoryCounts = {};
        solvedIds.forEach(id => {
            const problem = practiceProblems.find(p => p.id === id);
            if (problem && problem.category) {
                const cat = problem.category;
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }
        });
        
        const sortedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
            
        if (sortedCategories.length === 0) {
            return ["General"];
        }
        
        const formatCategoryName = (cat) => {
            const mapping = {
                'arrays': 'Arrays',
                'strings': 'Strings',
                'linkedlist': 'Linked List',
                'graphs': 'Graphs',
                'dp': 'Dynamic Programming',
                'trees': 'Trees'
            };
            return mapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
        };
        
        return sortedCategories.slice(0, 3).map(formatCategoryName);
    }

    // ============================================
    // LEADERBOARD
    // ============================================

    function populateLeaderboard() {
        const container = document.getElementById('profileLeaderboardList');
        if (!container) return;

        const mockLeaderboard = [
            { name: 'CodeNinja', xp: 12450, avatar: 'C' },
            { name: 'AlgoMaster', xp: 9800, avatar: 'A' },
            { name: 'ByteWizard', xp: 7200, avatar: 'B' },
            { name: 'DevHero', xp: 5100, avatar: 'D' },
            { name: 'PixelForge', xp: 3600, avatar: 'P' },
            { name: 'QuantumCoder', xp: 2500, avatar: 'Q' },
            { name: 'SyntaxSage', xp: 1800, avatar: 'S' },
            { name: 'DebugDruid', xp: 1200, avatar: 'D' },
            { name: 'LogicLynx', xp: 900, avatar: 'L' },
            { name: 'HashHawk', xp: 650, avatar: 'H' },
            { name: 'StackSage', xp: 400, avatar: 'S' },
            { name: 'RecursionRaven', xp: 200, avatar: 'R' },
        ];

        const userName = (userProgress.name || 'Learner').trim();
        const userXp = userProgress.xp || 0;
        const rawAv = userProgress.avatar;
        const userAvatar = (rawAv && typeof rawAv === 'object') ? rawAv.initial : (rawAv && rawAv.startsWith('data:image') ? 'img' : (userName.charAt(0).toUpperCase()));

        // Insert user into the correct rank position
        let inserted = false;
        const allEntries = [];
        for (const entry of mockLeaderboard) {
            if (!inserted && userXp >= entry.xp) {
                allEntries.push({ name: userName, xp: userXp, avatar: userAvatar, isUser: true });
                inserted = true;
            }
            allEntries.push(entry);
        }
        if (!inserted) {
            allEntries.push({ name: userName, xp: userXp, avatar: userAvatar, isUser: true });
        }

        const ranked = allEntries.slice(0, 9).map((e, i) => ({ ...e, rank: i + 1 }));

        function esc(text) {
            const d = document.createElement('div');
            d.textContent = text;
            return d.innerHTML;
        }

        container.innerHTML = ranked.map(user => {
            const cls = user.isUser ? 'leaderboard-item current-user' : 'leaderboard-item';
            const displayName = user.isUser ? `${user.name} (You)` : user.name;
            return `<div class="${cls}">
                <span class="leader-rank">#${user.rank}</span>
                <span class="leader-avatar" aria-hidden="true">${esc(user.avatar)}</span>
                <span class="leader-name">${esc(displayName)}</span>
                <span class="leader-xp">${user.xp.toLocaleString()} XP</span>
            </div>`;
        }).join('');
    }

    // ============================================
    // CARD INTERACTIVE ACTIONS
    // ============================================

    // Setup Theme Buttons
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            themeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const theme = btn.getAttribute("data-theme");
            const card = document.getElementById("codingIdentityCard");
            if (card) {
                card.className = `coding-card theme-${theme}`;
            }
        });
    });

    // Expose initIdentityCard globally for legacy bundle
    window.initIdentityCard = initIdentityCard;

    // Setup 3D Tilt Effect — replaced with CSS holographic sheen
    // (animation is now pure CSS via ::before pseudo-element)

    // Shared capture helper — clones the card, strips decorative overlays,
    // and renders via html2canvas on the clean clone
    async function captureCardImage() {
        const original = document.getElementById('codingIdentityCard');
        if (!original) return null;

        const clone = original.cloneNode(true);
        clone.removeAttribute('id');
        clone.classList.add('exporting');

        // Copy canvas contents (like QR code) since cloneNode doesn't copy canvas drawings
        const originalCanvases = original.querySelectorAll('canvas');
        const clonedCanvases = clone.querySelectorAll('canvas');
        originalCanvases.forEach((origCanvas, idx) => {
            const destCanvas = clonedCanvases[idx];
            if (destCanvas) {
                const ctx = destCanvas.getContext('2d');
                if (ctx) {
                    destCanvas.width = origCanvas.width;
                    destCanvas.height = origCanvas.height;
                    ctx.drawImage(origCanvas, 0, 0);
                }
            }
        });


        // Remove decorative overlays that html2canvas renders poorly
        const glow = clone.querySelector('.card-glow');
        if (glow) glow.remove();
        const grid = clone.querySelector('.card-grid');
        if (grid) grid.remove();

        // Strip backdrop-filter from all elements using !important inline style
        const allEls = clone.querySelectorAll('*');
        allEls.forEach(el => {
            el.setAttribute('style', (el.getAttribute('style') || '') + ';backdrop-filter: none !important;-webkit-backdrop-filter: none !important;');
        });

        // Make the card background fully opaque so html2canvas doesn't render transparency artifacts
        const cs = getComputedStyle(original);
        const rawBg = cs.backgroundColor;
        const parts = rawBg.replace(/[^\d,.]/g, '').split(',').map(Number);
        clone.style.backgroundColor = parts.length >= 3 ? `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})` : '#0c0c1a';

        // Convert gradient logo-icon to solid color
        const logoIcon = clone.querySelector('.logo-icon');
        if (logoIcon) {
            logoIcon.style.background = 'none';
            logoIcon.style.webkitBackgroundClip = 'unset';
            logoIcon.style.webkitTextFillColor = 'unset';
        }



        // Position off-screen
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.zIndex = '-1';
        clone.style.width = '480px';
        clone.style.height = '380px';

        document.body.appendChild(clone);

        try {
            const canvas = await html2canvas(clone, {
                scale: 3,
                useCORS: true,
                backgroundColor: null,
                logging: false,
            });
            return canvas;
        } finally {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
            }
        }
    }

    // Setup PNG Export
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    if (downloadPngBtn) {
        downloadPngBtn.addEventListener("click", async () => {
            const prevText = downloadPngBtn.innerHTML;
            downloadPngBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
            downloadPngBtn.disabled = true;

            try {
                window.getSelection().removeAllRanges();
                document.activeElement && document.activeElement.blur();

                const canvas = await captureCardImage();
                if (!canvas) return;

                const image = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `${(typeof userProgress !== 'undefined' ? userProgress.name : 'learner')}_coding_card.png`;
                link.href = image;
                link.click();
            } catch (e) {
                console.error("Error generating PNG:", e);
            } finally {
                downloadPngBtn.innerHTML = prevText;
                downloadPngBtn.disabled = false;
            }
        });
    }

    // Setup PDF Export
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener("click", async () => {
            const prevText = downloadPdfBtn.innerHTML;
            downloadPdfBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
            downloadPdfBtn.disabled = true;

            try {
                window.getSelection().removeAllRanges();
                document.activeElement && document.activeElement.blur();

                const canvas = await captureCardImage();
                if (!canvas) return;

                const imgData = canvas.toDataURL("image/png");
                const { jsPDF } = window.jspdf;

                const pdf = new jsPDF("l", "mm", "a4");
                const imgWidth = 200;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
                const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2;

                pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
                pdf.save(`${(typeof userProgress !== 'undefined' ? userProgress.name : 'learner')}_coding_card.pdf`);
            } catch (e) {
                console.error("Error generating PDF:", e);
            } finally {
                downloadPdfBtn.innerHTML = prevText;
                downloadPdfBtn.disabled = false;
            }
        });
    }

});
