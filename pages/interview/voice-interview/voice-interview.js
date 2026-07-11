/**
 * voice-interview.js
 * main thread
 * Handles Web Audio API (Visualizer), Speech Recognition (STT), 
 * Speech Synthesis (TTS), and Web Worker communication.
 */

document.addEventListener("DOMContentLoaded", () => {
    initVoiceInterview();
});

const els = {
    aiStatusBadge: document.getElementById('aiStatusBadge'),
    btnStartInterview: document.getElementById('btnStartInterview'),
    btnEndInterview: document.getElementById('btnEndInterview'),
    glowRing: document.getElementById('glowRing'),
    statusText: document.getElementById('statusText'),
    transcriptContent: document.getElementById('transcriptContent'),
    typingIndicator: document.getElementById('typingIndicator')
};

// State
let aiWorker;
let isModelReady = false;
let isInterviewActive = false;
let conversationHistory = [];

// Speech & Audio APIs
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let synth = window.speechSynthesis;
let audioContext;
let analyser;
let microphone;
let animationId;

function initVoiceInterview() {
    // 1. Check Browser Support
    if (!SpeechRecognition) {
        void 0;
        return;
    }

    // 2. Init Web Worker
    try {
        aiWorker = new Worker('voice-worker.js', { type: 'module' });
        setupWorkerListeners();
    } catch (e) {
        console.error("Worker Error:", e);
        els.statusText.textContent = "Error: Cannot load AI Worker.";
    }

    // 3. Init Speech Recognition
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after each sentence to process
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setupSpeechListeners();

    // 4. Bind Events
    els.btnStartInterview.addEventListener('click', startInterview);
    els.btnEndInterview.addEventListener('click', stopInterview);
}

function setupWorkerListeners() {
    aiWorker.addEventListener('message', (event) => {
        const { status, output, error } = event.data;

        if (status === 'ready') {
            isModelReady = true;
            els.aiStatusBadge.className = 'ai-status ready';
            els.aiStatusBadge.innerHTML = `<i class="fas fa-check-circle"></i> AI Engine Ready`;
        } 
        else if (status === 'complete') {
            els.typingIndicator.classList.add('hidden');
            
            // Add to history and transcript
            conversationHistory.push(`Interviewer: ${output}`);
            appendTranscript('Interviewer', output, 'ai');
            
            // Speak the response
            speakResponse(output);
        }
        else if (status === 'error') {
            console.error("AI Error:", error);
            els.typingIndicator.classList.add('hidden');
            appendTranscript('System', 'AI Engine encountered an error.', 'system');
        }
    });
}

async function startInterview() {
    if (!isModelReady) {
        void 0;
        return;
    }

    isInterviewActive = true;
    els.btnStartInterview.classList.add('listening');
    els.btnEndInterview.classList.remove('hidden');
    els.transcriptContent.innerHTML = '';
    
    // Request Microphone access for visualizer
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setupAudioVisualizer(stream);
        
        // Start the Interview
        const greeting = "Hello. I will be your interviewer today. Let's start with a system design question. How would you design a URL shortener like TinyURL?";
        conversationHistory.push(`Interviewer: ${greeting}`);
        appendTranscript('Interviewer', greeting, 'ai');
        speakResponse(greeting);

    } catch (err) {
        console.error("Mic Error:", err);
        void 0;
    }
}

function stopInterview() {
    isInterviewActive = false;
    recognition.stop();
    synth.cancel();
    
    if (audioContext) audioContext.close();
    cancelAnimationFrame(animationId);
    
    els.btnStartInterview.classList.remove('listening', 'speaking');
    els.glowRing.classList.remove('active');
    els.glowRing.style.transform = `scale(1)`;
    els.btnEndInterview.classList.add('hidden');
    els.statusText.textContent = "Interview Ended.";
}

// --- Audio Visualizer ---
function setupAudioVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    els.glowRing.classList.add('active');

    function draw() {
        if (!isInterviewActive) return;
        animationId = requestAnimationFrame(draw);
        
        // Only pulse if user is speaking (mic is active) and AI is not speaking
        if (els.btnStartInterview.classList.contains('listening')) {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
            let average = sum / bufferLength;
            
            // Scale ring based on volume (1.0 to 1.8)
            let scale = 1 + (average / 128); 
            els.glowRing.style.transform = `scale(${scale})`;
        } else {
            els.glowRing.style.transform = `scale(1)`;
        }
    }
    draw();
}

// --- Speech Recognition (STT) ---
function setupSpeechListeners() {
    recognition.onstart = () => {
        els.statusText.textContent = "Listening...";
        els.btnStartInterview.classList.add('listening');
        els.btnStartInterview.classList.remove('speaking');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Add to transcript
        appendTranscript('You', transcript, 'user');
        conversationHistory.push(`Candidate: ${transcript}`);
        
        // Pause listening, show thinking, send to AI
        recognition.stop();
        els.statusText.textContent = "AI is evaluating...";
        els.btnStartInterview.classList.remove('listening');
        els.typingIndicator.classList.remove('hidden');
        
        // Post entire history to worker for context
        aiWorker.postMessage({ history: conversationHistory });
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            // Restart if it just timed out on silence
            if (isInterviewActive && !synth.speaking) recognition.start();
        } else {
            console.error("Speech Rec Error:", event.error);
        }
    };
    
    recognition.onend = () => {
        // If not actively speaking or evaluating, restart listening
        if (isInterviewActive && !synth.speaking && els.typingIndicator.classList.contains('hidden')) {
            try { recognition.start(); } catch(e){}
        }
    };
}

// --- Speech Synthesis (TTS) ---
function speakResponse(text) {
    els.btnStartInterview.classList.remove('listening');
    els.btnStartInterview.classList.add('speaking');
    els.statusText.textContent = "Interviewer speaking...";
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick a professional sounding voice if available
    const voices = synth.getVoices();
    const googleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (googleVoice) utterance.voice = googleVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 0.9;

    utterance.onend = () => {
        if (isInterviewActive) {
            // Restart listening once AI finishes
            els.btnStartInterview.classList.remove('speaking');
            try { recognition.start(); } catch(e){}
        }
    };

    synth.speak(utterance);
}

// --- UI Helpers ---
function appendTranscript(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${type}`;
    
    msgDiv.innerHTML = `
        <div class="msg-bubble">
            <span class="msg-label">${sender}</span>
            ${text}
        </div>
    `;
    
    els.transcriptContent.appendChild(msgDiv);
    els.transcriptContent.scrollTop = els.transcriptContent.scrollHeight;
}
