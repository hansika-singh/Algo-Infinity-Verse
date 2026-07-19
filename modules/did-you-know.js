let factCount = 0;
let isLoading = false;

const fallbackFacts = [
  "The first computer programmer was Ada Lovelace, who wrote the first algorithm in the 1840s.",
  "JavaScript was created by Brendan Eich in just 10 days in 1995.",
  "Python is named after Monty Python's Flying Circus, not the snake.",
  "The first computer mouse, invented by Douglas Engelbart in 1964, was made of wood.",
  "The first website (info.cern.ch) is still online today.",
];

function decodeHTML(text) {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

async function fetchFromAPI() {
  const res = await fetch('https://opentdb.com/api.php?amount=1&category=18');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.response_code !== 0) throw new Error('No results');

  const q = data.results[0];
  const question = decodeHTML(q.question);
  const answer = decodeHTML(q.correct_answer);

  if (q.type === 'boolean') {
    if (answer === 'True') return question;
    return 'Not quite: ' + question.charAt(0).toLowerCase() + question.slice(1);
  }

  if (question.endsWith('...')) {
    return question.replace(/\.\.\.$/, '').trim() + ' ' + answer + '.';
  }

  return question + ' ' + answer + '.';
}

function getFallbackFact() {
  return fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
}

function updateCounter() {
  const el = document.getElementById('factCounter');
  if (el) el.textContent = `#${factCount}`;
}

async function updateFact(element) {
  if (isLoading) return;
  isLoading = true;

  try {
    element.style.opacity = '0';
    await new Promise(r => setTimeout(r, 300));
    element.textContent = 'Loading...';
    element.style.opacity = '1';
    await new Promise(r => setTimeout(r, 200));

    element.style.opacity = '0';
    await new Promise(r => setTimeout(r, 300));
    element.textContent = await fetchFromAPI();
  } catch {
    element.style.opacity = '0';
    await new Promise(r => setTimeout(r, 300));
    element.textContent = getFallbackFact();
  }

  factCount++;
  updateCounter();
  element.style.opacity = '1';
  isLoading = false;
}

function showNextFact() {
  const el = document.getElementById('factText');
  if (el) updateFact(el);
}

async function showDailyFact() {
  const el = document.getElementById('factText');
  if (el) updateFact(el);
}

window.showNextFact = showNextFact;

export function initDidYouKnow() {
  factCount = 0;
  showDailyFact();
}
window.initDidYouKnow = initDidYouKnow;
