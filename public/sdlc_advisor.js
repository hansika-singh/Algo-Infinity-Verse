// public/sdlc_advisor.js

/**
 * Handles form submission for SDLC Advisor.
 * Sends project description to the backend and renders the result.
 */
async function submitSdlcForm(event) {
  event.preventDefault();
  const desc = document.getElementById('projectDesc').value.trim();
  if (!desc) return console.warn("Alert:", 'Please enter a project description.');

  const response = await fetch('/api/sdlc-advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: desc })
  });
  if (!response.ok) {
    return console.warn("Alert:", 'Error fetching SDLC advice.');
  }
  const data = await response.json();
  renderResult(data);
}

function renderResult(data) {
  const container = document.getElementById('result');
  container.style.display = 'block';
  container.innerHTML = `
    <h3>Recommended Model: ${data.model}</h3>
    ${data.sprintLength ? `<p><strong>Sprint Length:</strong> ${data.sprintLength}</p>` : ''}
    <p><strong>Estimated Timeline:</strong> ${data.timeline}</p>
    <p><strong>Major Risks:</strong> ${data.risks.join(', ')}</p>
    <p><strong>Key Deliverables:</strong> ${data.deliverables.join(', ')}</p>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('generateBtn');
  if (form) form.addEventListener('click', submitSdlcForm);
});
