// scripts/report-issue.js

(function() {
    function initReportIssueFeature() {
        if (document.getElementById('reportIssueBtn')) return; // Already initialized

        // 1. Create Floating Button
        const btn = document.createElement('button');
        btn.id = 'reportIssueBtn';
        btn.className = 'report-issue-btn';
        btn.innerHTML = '<i class="fas fa-bug"></i><span>Report Issue</span>';
        btn.title = "Report an Issue with this page";
        document.body.appendChild(btn);

        // 2. Create Modal
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'reportIssueModal';
        modalOverlay.className = 'report-modal-overlay hidden';
        modalOverlay.innerHTML = `
            <div class="report-modal">
                <div class="report-modal-header">
                    <h3>Report an Issue</h3>
                    <button id="closeReportModalBtn" class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="report-modal-body">
                    <p class="report-context-info"><strong>Page:</strong> <span id="reportPageTitle"></span></p>
                    <form id="reportIssueForm">
                        <div class="form-group">
                            <label for="issueCategory">Issue Category *</label>
                            <select id="issueCategory" required>
                                <option value="" disabled selected>Select a category...</option>
                                <option value="Typographical error">Typographical error</option>
                                <option value="Incorrect explanation">Incorrect explanation</option>
                                <option value="Broken code snippet">Broken code snippet</option>
                                <option value="Outdated information">Outdated information</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="issueDescription">Description *</label>
                            <textarea id="issueDescription" rows="4" placeholder="Please provide details about the issue..." required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="submitReportBtn">Submit Report</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // 3. Event Listeners
        const closeBtn = document.getElementById('closeReportModalBtn');
        const form = document.getElementById('reportIssueForm');
        const submitBtn = document.getElementById('submitReportBtn');

        btn.addEventListener('click', () => {
            document.getElementById('reportPageTitle').textContent = document.title || "Algorithm Page";
            modalOverlay.classList.remove('hidden');
        });

        closeBtn.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const payload = {
                category: document.getElementById('issueCategory').value,
                description: document.getElementById('issueDescription').value,
                title: document.title,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };

            // Mock API request
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            void 0;

            if (typeof window.showNotification === 'function') {
                window.showNotification("Issue reported successfully! Thank you for your feedback.", "success");
            } else {
                void 0;
            }

            form.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Report';
            modalOverlay.classList.add('hidden');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReportIssueFeature);
    } else {
        initReportIssueFeature();
    }
})();
