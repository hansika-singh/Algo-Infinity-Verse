document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const csvInput = document.getElementById('csvInput');
  const progressSection = document.getElementById('progressSection');
  
  const totalCount = document.getElementById('totalCount');
  const completedCount = document.getElementById('completedCount');
  const failedCount = document.getElementById('failedCount');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  const resultsTable = document.getElementById('resultsTable');
  const resultsBody = resultsTable.querySelector('tbody');

  let pollInterval;

  // Drag and Drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      csvInput.files = e.dataTransfer.files;
      handleUpload();
    }
  });

  csvInput.addEventListener('change', handleUpload);

  async function handleUpload() {
    if (!csvInput.files || csvInput.files.length === 0) return;
    const file = csvInput.files[0];
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("csv", file);

    try {
      dropZone.style.display = 'none';
      progressSection.style.display = 'block';

      const response = await fetch('/api/audit/bulk', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Start polling
      totalCount.textContent = data.totalJobs;
      pollProgress(data.batchId);

    } catch (err) {
      alert(err.message);
      dropZone.style.display = 'block';
      progressSection.style.display = 'none';
    }
  }

  function pollProgress(batchId) {
    pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/audit/bulk/${batchId}`);
        const data = await response.json();
        
        if (response.ok) {
          updateDashboard(data);
          
          if (data.status === 'completed') {
            clearInterval(pollInterval);
            renderResults(data.results);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000); // Poll every second
  }

  function updateDashboard(data) {
    completedCount.textContent = data.completed;
    failedCount.textContent = data.failed;
    
    progressBar.style.width = `${data.progress}%`;
    progressText.textContent = `${data.progress}%`;
  }

  function renderResults(results) {
    resultsTable.style.display = 'table';
    resultsBody.innerHTML = '';

    results.forEach(res => {
      const tr = document.createElement('tr');
      
      const scoreClass = res.score >= 80 ? 'score-high' : res.score >= 50 ? 'score-med' : 'score-low';
      
      tr.innerHTML = `
        <td><a href="${res.repoUrl}" target="_blank" style="color: white;">${res.repoUrl.split('/').slice(-2).join('/')}</a></td>
        <td><span class="score-badge ${scoreClass}">${res.score}/100</span></td>
        <td>${res.error ? `<span style="color:#e74c3c">Failed: ${res.error}</span>` : '<span style="color:#2ecc71">Success</span>'}</td>
      `;
      resultsBody.appendChild(tr);
    });
  }
});
