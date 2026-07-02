document.addEventListener('DOMContentLoaded', () => {
  const DRAFT_KEY = 'algo_verse_problem_draft';
  const totalSteps = 5;
  let currentStep = 1;

  // DOM Elements
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const examplesContainer = document.getElementById('examplesContainer');
  const testCasesList = document.getElementById('testCasesList');
  const form = document.getElementById('wizardForm');
  const draftToast = document.getElementById('draftToast');

  // State
  let examples = [];
  let testCases = [];
  let dragStartIndex = null;

  // --- Initialization ---
  function init() {
    renderStepIndicators();
    updateStepVisibility();
    checkDraft();
    
    // Default setup if no draft restores them
    if (examples.length === 0) addExample();
    if (testCases.length === 0) addTestCase();

    // Event Listeners
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));
    submitBtn.addEventListener('click', handleSubmit);
    document.getElementById('addExampleBtn').addEventListener('click', addExample);
    document.getElementById('addTestCaseBtn').addEventListener('click', addTestCase);
    
    // Auto-save listener
    form.addEventListener('input', saveDraft);
  }

  // --- Navigation & UI ---
  function renderStepIndicators() {
    progressContainer.innerHTML = '<div class="progress-bar" id="progressBar" style="width: 0%;"></div>';
    const labels = ["Info", "Details", "Examples", "Tests", "Review"];
    
    for (let i = 1; i <= totalSteps; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'step-wrapper';
      wrapper.id = `indicator-${i}`;
      
      const circle = document.createElement('div');
      circle.className = 'step-indicator';
      circle.textContent = i;
      
      const label = document.createElement('div');
      label.className = 'step-label';
      label.textContent = labels[i-1];

      wrapper.appendChild(circle);
      wrapper.appendChild(label);
      progressContainer.appendChild(wrapper);
    }
  }

  function updateStepVisibility() {
    // Update contents
    document.querySelectorAll('.step-content').forEach((step, idx) => {
      step.classList.toggle('active', idx + 1 === currentStep);
    });

    // Update indicators
    for (let i = 1; i <= totalSteps; i++) {
      const indicator = document.getElementById(`indicator-${i}`);
      if (!indicator) continue;
      
      if (i < currentStep) {
        indicator.className = 'step-wrapper completed';
        indicator.querySelector('.step-indicator').innerHTML = '<i class="fas fa-check"></i>';
      } else if (i === currentStep) {
        indicator.className = 'step-wrapper active';
        indicator.querySelector('.step-indicator').textContent = i;
      } else {
        indicator.className = 'step-wrapper';
        indicator.querySelector('.step-indicator').textContent = i;
      }
    }

    // Progress bar width
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;

    // Buttons
    prevBtn.disabled = currentStep === 1;
    if (currentStep === totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'flex';
      generateReview();
    } else {
      nextBtn.style.display = 'flex';
      submitBtn.style.display = 'none';
    }
  }

  function navigate(direction) {
    if (direction === 1 && !validateCurrentStep()) return;
    
    currentStep += direction;
    updateStepVisibility();
    saveDraft();
  }

  // --- Validation ---
  function validateCurrentStep() {
    const stepEl = document.getElementById(`step${currentStep}`);
    const requiredInputs = stepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      const group = input.closest('.form-group');
      if (!input.value.trim()) {
        group.classList.add('has-error');
        isValid = false;
      } else {
        group.classList.remove('has-error');
      }
    });

    // Custom validations for dynamic lists
    if (currentStep === 3) {
      const exampleInputs = examplesContainer.querySelectorAll('input[required], textarea[required]');
      exampleInputs.forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--error)';
          isValid = false;
        } else {
          input.style.borderColor = '';
        }
      });
    }

    if (currentStep === 4) {
      const testInputs = testCasesList.querySelectorAll('input[required]');
      testInputs.forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--error)';
          isValid = false;
        } else {
          input.style.borderColor = '';
        }
      });
    }

    // Clear error on input
    requiredInputs.forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.trim()) input.closest('.form-group')?.classList.remove('has-error');
      }, { once: true });
    });

    return isValid;
  }

  // --- Dynamic Examples ---
  function addExample(data = { input: '', output: '', explanation: '' }) {
    const id = Date.now() + Math.random();
    examples.push({ id, ...data });
    renderExamples();
  }

  function removeExample(id) {
    examples = examples.filter(ex => ex.id !== id);
    renderExamples();
    saveDraft();
  }

  function renderExamples() {
    examplesContainer.innerHTML = '';
    examples.forEach((ex, index) => {
      const el = document.createElement('div');
      el.className = 'test-case-item';
      el.innerHTML = `
        <div style="font-weight: 600; color: var(--text-muted); width: 20px;">${index + 1}.</div>
        <div class="test-case-content">
          <input type="text" placeholder="Input (e.g. nums = [2,7,11,15], target = 9)" value="${ex.input}" onchange="updateExample(${ex.id}, 'input', this.value)" required style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">
          <input type="text" placeholder="Output (e.g. [0,1])" value="${ex.output}" onchange="updateExample(${ex.id}, 'output', this.value)" required style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">
          <textarea placeholder="Explanation (Optional)" onchange="updateExample(${ex.id}, 'explanation', this.value)" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">${ex.explanation}</textarea>
        </div>
        <button type="button" class="remove-btn" onclick="removeExampleHandler(${ex.id})"><i class="fas fa-trash"></i></button>
      `;
      examplesContainer.appendChild(el);
    });
  }

  window.updateExample = (id, field, value) => {
    const ex = examples.find(e => e.id === id);
    if (ex) ex[field] = value;
    saveDraft();
  };
  window.removeExampleHandler = removeExample;

  // --- Dynamic Test Cases (Drag & Drop) ---
  function addTestCase(data = { input: '', expected: '' }) {
    const id = Date.now() + Math.random();
    testCases.push({ id, ...data });
    renderTestCases();
  }

  function removeTestCase(id) {
    testCases = testCases.filter(tc => tc.id !== id);
    renderTestCases();
    saveDraft();
  }

  function renderTestCases() {
    testCasesList.innerHTML = '';
    testCases.forEach((tc, index) => {
      const li = document.createElement('li');
      li.className = 'test-case-item';
      li.draggable = true;
      li.dataset.index = index;
      
      li.innerHTML = `
        <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
        <div class="test-case-content">
          <input type="text" placeholder="Raw Input Arguments (e.g. [[2,7], 9])" value="${tc.input}" onchange="updateTestCase(${tc.id}, 'input', this.value)" required style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">
          <input type="text" placeholder="Raw Expected Output (e.g. [0,1])" value="${tc.expected}" onchange="updateTestCase(${tc.id}, 'expected', this.value)" required style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 4px; color: var(--text);">
        </div>
        <button type="button" class="remove-btn" onclick="removeTestCaseHandler(${tc.id})"><i class="fas fa-trash"></i></button>
      `;

      // Drag events
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('dragleave', handleDragLeave);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);

      testCasesList.appendChild(li);
    });
  }

  window.updateTestCase = (id, field, value) => {
    const tc = testCases.find(t => t.id === id);
    if (tc) tc[field] = value;
    saveDraft();
  };
  window.removeTestCaseHandler = removeTestCase;

  // --- Drag & Drop Handlers ---
  function handleDragStart(e) {
    dragStartIndex = +this.dataset.index;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
  }

  function handleDragLeave() {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');
    
    const dragEndIndex = +this.dataset.index;
    if (dragStartIndex !== dragEndIndex) {
      // Swap logic
      const itemOne = testCases[dragStartIndex];
      testCases.splice(dragStartIndex, 1);
      testCases.splice(dragEndIndex, 0, itemOne);
      
      renderTestCases();
      saveDraft();
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.test-case-item').forEach(el => el.classList.remove('drag-over'));
  }

  // --- Draft Management ---
  function saveDraft() {
    const state = {
      currentStep,
      title: document.getElementById('title').value,
      difficulty: document.getElementById('difficulty').value,
      category: document.getElementById('category').value,
      tags: document.getElementById('tags').value,
      description: document.getElementById('description').value,
      constraints: document.getElementById('constraints').value,
      followUp: document.getElementById('followUp').value,
      examples: examples,
      testCases: testCases,
      timestamp: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  }

  function checkDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Only prompt if there is actual data filled out
        if (state.title || state.description || state.examples.length > 1) {
          draftToast.classList.add('show');
          
          document.getElementById('restoreDraftBtn').onclick = () => {
            restoreDraft(state);
            draftToast.classList.remove('show');
          };
          
          document.getElementById('discardDraftBtn').onclick = () => {
            localStorage.removeItem(DRAFT_KEY);
            draftToast.classList.remove('show');
          };
        }
      } catch (e) {
        console.warn("Corrupted draft found, ignoring.");
      }
    }
  }

  function restoreDraft(state) {
    document.getElementById('title').value = state.title || '';
    document.getElementById('difficulty').value = state.difficulty || '';
    document.getElementById('category').value = state.category || '';
    document.getElementById('tags').value = state.tags || '';
    document.getElementById('description').value = state.description || '';
    document.getElementById('constraints').value = state.constraints || '';
    document.getElementById('followUp').value = state.followUp || '';
    
    if (state.examples && state.examples.length) {
      examples = state.examples;
      renderExamples();
    }
    
    if (state.testCases && state.testCases.length) {
      testCases = state.testCases;
      renderTestCases();
    }
    
    currentStep = state.currentStep || 1;
    updateStepVisibility();
  }

  // --- Review & Submit ---
  function generateReview() {
    const data = getFormData();
    
    const html = `
      <div class="review-content">
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Difficulty:</strong> <span class="difficulty-badge ${data.difficulty}">${data.difficulty}</span></p>
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Tags:</strong> ${data.tags.join(', ')}</p>
        <p><strong>Description:</strong><br>${data.description}</p>
        <p><strong>Constraints:</strong><br>${data.constraints.join('<br>')}</p>
        <p><strong>Test Cases Count:</strong> ${data.testCases.length}</p>
      </div>
    `;
    
    document.getElementById('reviewContainer').innerHTML = html;
    document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);
  }

  function getFormData() {
    return {
      id: document.getElementById('title').value.toLowerCase().replace(/\s+/g, '-'),
      title: document.getElementById('title').value,
      difficulty: document.getElementById('difficulty').value,
      category: document.getElementById('category').value,
      tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
      description: document.getElementById('description').value,
      constraints: document.getElementById('constraints').value.split('\n').map(c => c.trim()).filter(Boolean),
      followUp: document.getElementById('followUp').value,
      examples: examples.map(ex => ({ input: ex.input, output: ex.output, explanation: ex.explanation })),
      testCases: testCases.map(tc => ({ input: tc.input, expected: tc.expected }))
    };
  }

  function handleSubmit() {
    const data = getFormData();
    console.log("Problem Submitted:", data);
    
    // Clear draft
    localStorage.removeItem(DRAFT_KEY);
    
    // Simulate successful submission
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Published Successfully!';
      submitBtn.style.backgroundColor = 'var(--success)';
      
      setTimeout(() => {
        alert("Problem successfully created! You can copy the JSON from the console or the output box.");
        // Optional: redirect to admin dashboard or reset form
      }, 500);
    }, 1500);
  }

  // Start app
  init();
});
