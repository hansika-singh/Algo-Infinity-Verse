/**
 * ai-analyst.js
 * Utilizes TensorFlow.js and MediaPipe FaceMesh to track facial landmarks,
 * calculate head pose (yaw/pitch), and determine eye-contact and posture stability.
 */

document.addEventListener("DOMContentLoaded", () => {
    initVisionEngine();
});

// App State
const state = {
    isAnalyzing: false,
    model: null,
    
    // Telemetry History (for smoothing)
    yawHistory: [],
    yHistory: [],
    
    // Aggregated Scores
    eyeContactScore: 100, // Starts at 100%
    postureScore: 100,
    framesProcessed: 0,
    framesLookingAway: 0,
    framesFidgeting: 0,
    
    sessionSeconds: 0,
    timerInterval: null
};

// DOM Elements
const els = {
    engineStatus: document.getElementById('engineStatus'),
    btnStartAnalysis: document.getElementById('btnStartAnalysis'),
    webcamVideo: document.getElementById('webcamVideo'),
    outputCanvas: document.getElementById('outputCanvas'),
    videoOverlay: document.getElementById('videoOverlay'),
    
    // Dashboard
    eyeContactScore: document.getElementById('eyeContactScore'),
    eyeContactBar: document.getElementById('eyeContactBar'),
    postureScore: document.getElementById('postureScore'),
    postureBar: document.getElementById('postureBar'),
    behaviorStatus: document.getElementById('behaviorStatus'),
    sessionTimer: document.getElementById('sessionTimer'),
    
    // Debug
    fpsDisplay: document.getElementById('fpsDisplay'),
    debugYaw: document.getElementById('debugYaw'),
    debugPitch: document.getElementById('debugPitch'),
    debugVar: document.getElementById('debugVar')
};

// Variables for Canvas context and FPS calculation
let ctx;
let lastFrameTime = 0;

async function initVisionEngine() {
    ctx = els.outputCanvas.getContext('2d');
    
    try {
        // 1. Initialize TensorFlow.js WebGL Backend
        await tf.setBackend('webgl');
        await tf.ready();
        
        // 2. Load MediaPipe FaceMesh Model via the TF.js API
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'tfjs',
            refineLandmarks: true, // Enables iris tracking
            maxFaces: 1
        };
        
        state.model = await faceLandmarksDetection.createDetector(model, detectorConfig);
        
        // 3. Update UI
        els.engineStatus.innerHTML = '<i class="fas fa-check-circle"></i> Vision Model Loaded';
        els.engineStatus.classList.add('ready');
        els.btnStartAnalysis.disabled = false;
        els.btnStartAnalysis.addEventListener('click', toggleAnalysis);
        
    } catch (err) {
        console.error("Failed to load TF.js model:", err);
        els.engineStatus.innerHTML = '<i class="fas fa-times-circle"></i> Error loading model';
        els.engineStatus.style.color = 'var(--cv-danger)';
        els.engineStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        els.engineStatus.style.background = 'rgba(239, 68, 68, 0.1)';
        void 0;
    }
}

async function toggleAnalysis() {
    if (state.isAnalyzing) {
        stopAnalysis();
    } else {
        await startAnalysis();
    }
}

async function startAnalysis() {
    try {
        // Reset per-session telemetry
        state.yawHistory = [];
        state.yHistory = [];
        state.eyeContactScore = 100;
        state.postureScore = 100;
        state.framesProcessed = 0;
        state.framesLookingAway = 0;
        state.framesFidgeting = 0;
        lastFrameTime = 0;

        els.eyeContactScore.textContent = '100%';
        els.postureScore.textContent = '100%';
        els.eyeContactBar.style.width = '100%';
        els.postureBar.style.width = '100%';

        // Request Camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });
        
        els.webcamVideo.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            els.webcamVideo.onloadedmetadata = () => {
                els.webcamVideo.play();
                resolve();
            };
        });
        
        // Set canvas dimensions to match video
        els.outputCanvas.width = els.webcamVideo.videoWidth;
        els.outputCanvas.height = els.webcamVideo.videoHeight;
        
        // Update UI State
        state.isAnalyzing = true;
        els.videoOverlay.classList.add('hidden');
        els.btnStartAnalysis.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Analysis';
        els.btnStartAnalysis.className = 'btn btn-danger';
        
        startTimer();
        
        // Kick off the prediction loop
        predictLoop();
        
    } catch (err) {
        console.error("Camera access denied or failed.", err);
        void 0;
    }
}

function stopAnalysis() {
    state.isAnalyzing = false;
    
    // Stop camera stream
    const stream = els.webcamVideo.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    els.webcamVideo.srcObject = null;
    
    // Reset UI
    els.videoOverlay.classList.remove('hidden');
    els.btnStartAnalysis.innerHTML = '<i class="fas fa-video"></i> Start Camera & Analysis';
    els.btnStartAnalysis.className = 'btn btn-primary';
    
    clearInterval(state.timerInterval);
    
    // Clear Canvas
    ctx.clearRect(0, 0, els.outputCanvas.width, els.outputCanvas.height);
}

// ----------------------------------------------------
// CORE TF.JS PREDICTION & MATH LOOP
// ----------------------------------------------------

async function predictLoop(currentTime) {
    if (!state.isAnalyzing) return;
    
    // Calculate FPS
    if (lastFrameTime) {
        const fps = Math.round(1000 / (currentTime - lastFrameTime));
        els.fpsDisplay.textContent = fps;
    }
    lastFrameTime = currentTime;

    // Draw the video frame to the canvas first
    ctx.clearRect(0, 0, els.outputCanvas.width, els.outputCanvas.height);
    ctx.drawImage(els.webcamVideo, 0, 0, els.outputCanvas.width, els.outputCanvas.height);

    try {
        // Detect Faces
        const faces = await state.model.estimateFaces(els.webcamVideo);
        
        if (faces.length > 0) {
            const face = faces[0];
            const keypoints = face.keypoints;
            
            // Draw Mesh Wireframe
            drawFaceMesh(keypoints);
            
            // Calculate Analytics
            analyzeBodyLanguage(keypoints);
        } else {
            // No face detected - Penalty!
            applyPenalty("No face detected! Maintain presence.");
        }
        
    } catch (err) {
        console.error("Estimation error:", err);
    }
    
    // Loop
    requestAnimationFrame(predictLoop);
}

function drawFaceMesh(keypoints) {
    // Draw a subtle wireframe effect over the eyes and nose
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan
    
    // Draw Iris/Eyes (Specific indices for MediaPipe FaceMesh)
    const leftEye = [33, 133, 159, 145];
    const rightEye = [263, 362, 386, 374];
    const nose = [1];
    
    const drawPoints = [...leftEye, ...rightEye, ...nose];
    
    drawPoints.forEach(index => {
        const p = keypoints[index];
        if (p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}

// ----------------------------------------------------
// BEHAVIORAL MATHEMATICS
// ----------------------------------------------------

function analyzeBodyLanguage(keypoints) {
    state.framesProcessed++;
    
    // 1. Calculate Head Pose (Yaw) to determine Eye Contact
    // We compare the distance from the nose to the left edge vs right edge of the face.
    const nose = keypoints[1];
    const leftEdge = keypoints[234];
    const rightEdge = keypoints[454];
    
    if (nose && leftEdge && rightEdge) {
        const distLeft = Math.abs(nose.x - leftEdge.x);
        const distRight = Math.abs(nose.x - rightEdge.x);
        
        // Ratio ideally near 1.0 if looking straight
        const yawRatio = distLeft / (distRight + 0.001); 
        els.debugYaw.textContent = yawRatio.toFixed(2);
        
        // If ratio is wildly off (< 0.5 or > 2.0), user has turned their head significantly
        if (yawRatio < 0.5 || yawRatio > 2.0) {
            state.framesLookingAway++;
        }
    }

    // 2. Calculate Posture Stability (Fidgeting)
    // We track the Y-coordinate of the nose over the last 30 frames.
    if (nose) {
        state.yHistory.push(nose.y);
        if (state.yHistory.length > 30) state.yHistory.shift();
        
        // Calculate variance (max - min)
        if (state.yHistory.length === 30) {
            const max = Math.max(...state.yHistory);
            const min = Math.min(...state.yHistory);
            const variance = max - min;
            els.debugVar.textContent = variance.toFixed(1);
            
            // If nose moves more than 20 pixels up and down continuously, they are rocking/fidgeting
            if (variance > 20) {
                state.framesFidgeting++;
            }
        }
    }
    
    updateTelemetryUI();
}

function applyPenalty(msg) {
    state.framesProcessed++;
    state.framesLookingAway++;
    state.framesFidgeting++;
    updateTelemetryUI(msg);
}

// ----------------------------------------------------
// UI UPDATES
// ----------------------------------------------------

function updateTelemetryUI(overrideMsg = null) {
    // Recalculate global scores (Percentage of frames where behavior was GOOD)
    state.eyeContactScore = Math.max(0, Math.round(((state.framesProcessed - state.framesLookingAway) / state.framesProcessed) * 100));
    state.postureScore = Math.max(0, Math.round(((state.framesProcessed - state.framesFidgeting) / state.framesProcessed) * 100));
    
    // Update Eye Contact DOM
    els.eyeContactScore.textContent = `${state.eyeContactScore}%`;
    els.eyeContactBar.style.width = `${state.eyeContactScore}%`;
    els.eyeContactBar.className = `progress-fill ${getScoreClass(state.eyeContactScore)}`;
    
    // Update Posture DOM
    els.postureScore.textContent = `${state.postureScore}%`;
    els.postureBar.style.width = `${state.postureScore}%`;
    els.postureBar.className = `progress-fill ${getScoreClass(state.postureScore)}`;
    
    // Update Master Status Box
    if (overrideMsg) {
        setStatusBox('danger', 'fa-exclamation-triangle', overrideMsg);
    } else if (state.eyeContactScore < 70) {
        setStatusBox('warning', 'fa-eye-slash', "You are losing eye contact. Look at the camera.");
    } else if (state.postureScore < 70) {
        setStatusBox('warning', 'fa-chair', "You are fidgeting. Try to maintain a stable posture.");
    } else {
        setStatusBox('success', 'fa-check-circle', "Great eye contact and posture.");
    }
}

function getScoreClass(score) {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
}

function setStatusBox(type, icon, text) {
    els.behaviorStatus.className = `status-alert ${type}`;
    els.behaviorStatus.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
}

function startTimer() {
    state.sessionSeconds = 0;
    state.timerInterval = setInterval(() => {
        state.sessionSeconds++;
        const m = String(Math.floor(state.sessionSeconds / 60)).padStart(2, '0');
        const s = String(state.sessionSeconds % 60).padStart(2, '0');
        els.sessionTimer.textContent = `${m}:${s}`;
    }, 1000);
}
