const facts = [
    "The first computer virus, called 'Creeper', was created in 1971",
    "The term 'bug' was coined when a moth got stuck in a computer in 1947",
    "The first algorithm was written over 4,000 years ago by Babylonians",
    "There are over 700 programming languages in use today",
    "The first computer programmer was Ada Lovelace in the 1840s",
    "Google processes over 3.5 billion searches per day",
    "The first website is still online (info.cern.ch)",
    "Python is named after Monty Python, not the snake",
    "The first hard drive weighed over a ton and stored 5MB",
    "JavaScript was created in just 10 days",
    "The first computer mouse was made of wood",
    "The first email was sent in 1971 by Ray Tomlinson",
    "CAPTCHA stands for Completely Automated Public Turing test",
    "The first webcam was used to monitor a coffee pot",
    "There are more than 1.5 billion websites on the internet"
];

function getDailyFact() {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash) + today.charCodeAt(i);
        hash = hash & hash;
    }
    const index = Math.abs(hash) % facts.length;
    return facts[index];
}

function showNextFact() {
    const factText = document.getElementById('factText');
    const factDate = document.getElementById('factDate');
    const randomIndex = Math.floor(Math.random() * facts.length);
    if (factText) factText.textContent = facts[randomIndex];
    if (factDate) factDate.textContent = `💡 Fun fact #${randomIndex + 1}`;
}

function showDailyFact() {
    const factText = document.getElementById('factText');
    const factDate = document.getElementById('factDate');
    if (!factText || !factDate) {
        console.warn('Daily fact elements not found');
        return;
    }
    factText.textContent = getDailyFact();
    const today = new Date().toLocaleDateString();
    factDate.textContent = `📅 Fact of the day • ${today}`;
}

window.showNextFact = showNextFact;

export function initDidYouKnow() {
    showDailyFact();
}
// Legacy global exports
window.initDidYouKnow = initDidYouKnow;
