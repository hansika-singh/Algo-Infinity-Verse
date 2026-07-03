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

    // Wait a brief moment to ensure script.js has loaded userProgress from localStorage
    setTimeout(() => {
        initProfile();
    }, 100);

    function initProfile() {
        // Populate Header Data
        if (typeof userProgress !== 'undefined') {
            userNameEl.textContent = userProgress.name || "Learner";
            userLevelEl.textContent = `Level ${userProgress.level || 1}`;
            userStreakEl.textContent = userProgress.streak || 0;
            userXPEl.textContent = userProgress.xp || 0;
            
            // Map completed IDs to actual problem objects
            const solvedIds = userProgress.completedProblems || [];
            
            if (typeof practiceProblems !== 'undefined') {
                filteredProblems = solvedIds.map(id => {
                    const prob = practiceProblems.find(p => p.id === id);
                    if (prob) {
                        return { ...prob, completedAt: "Unknown" }; // Add mock completion date for now
                    }
                    return null;
                }).filter(Boolean); // remove nulls
            }
            
            solvedCountEl.textContent = filteredProblems.length;
            
            // Initial render
            applyFilters();

            // Initialize Coding Identity Card
            initIdentityCard();
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
                    window.location.href = `../../index.html?problem=${problem.id}#practice`;
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

        if (cardAvatar) cardAvatar.textContent = userProgress.avatar || "🚀";
        if (cardUserName) cardUserName.textContent = userProgress.name || "Learner";
        if (cardUserLevelBadge) cardUserLevelBadge.textContent = `Level ${userProgress.level || 1}`;
        if (cardUserTitle) cardUserTitle.textContent = levelTitle;
        if (cardXP) cardXP.textContent = (userProgress.xp || 0).toLocaleString();
        if (cardStreak) cardStreak.textContent = userProgress.streak || 0;

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
            console.warn("Failed to get rank from leaderboard:", e);
        }
        return "#1";
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

    // Setup 3D Tilt Effect
    const card = document.getElementById("codingIdentityCard");
    if (card) {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (centerY - y) / 15;
            const rotateY = (x - centerX) / 15;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            const glow = card.querySelector(".card-glow");
            if (glow) {
                const glowX = (x / rect.width) * 100;
                const glowY = (y / rect.height) * 100;
                glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, var(--card-glow-color) 0%, transparent 70%)`;
            }
        });
        
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
            const glow = card.querySelector(".card-glow");
            if (glow) {
                glow.style.background = `radial-gradient(circle at center, var(--card-glow-color) 0%, transparent 70%)`;
            }
        });
    }

    // Setup PNG Export
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    if (downloadPngBtn) {
        downloadPngBtn.addEventListener("click", async () => {
            const idCard = document.getElementById("codingIdentityCard");
            if (!idCard) return;
            
            const prevText = downloadPngBtn.innerHTML;
            downloadPngBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
            downloadPngBtn.disabled = true;
            
            try {
                // Temporarily disable tilt transform
                const prevTransform = idCard.style.transform;
                idCard.style.transform = "none";
                
                const canvas = await html2canvas(idCard, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });
                
                // Restore transform
                idCard.style.transform = prevTransform;
                
                const image = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `${(typeof userProgress !== 'undefined' ? userProgress.name : 'learner')}_coding_card.png`;
                link.href = image;
                link.click();
            } catch (e) {
                console.error("Error generating PNG:", e);
                alert("Failed to export PNG. Please try again.");
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
            const idCard = document.getElementById("codingIdentityCard");
            if (!idCard) return;
            
            const prevText = downloadPdfBtn.innerHTML;
            downloadPdfBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
            downloadPdfBtn.disabled = true;
            
            try {
                const prevTransform = idCard.style.transform;
                idCard.style.transform = "none";
                
                const canvas = await html2canvas(idCard, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });
                
                idCard.style.transform = prevTransform;
                
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
                alert("Failed to export PDF. Please try again.");
            } finally {
                downloadPdfBtn.innerHTML = prevText;
                downloadPdfBtn.disabled = false;
            }
        });
    }

});
