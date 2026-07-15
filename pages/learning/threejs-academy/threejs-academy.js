document.addEventListener("DOMContentLoaded", () => {
    // 1. Core Structural Three.js Space Nodes Variables
    const container = document.getElementById("threejsCanvasContainer");
    let scene, camera, renderer, currentMesh;
    let directionalLight, ambientLight;

    // Parameters modifiers tracking matrices
    let currentShape = "cube";
    let currentMaterial = "normal";
    let speedModifier = 1.0;

    function init3DSpace() {
        // Clear previous configurations if existing
        container.innerHTML = "";

        // Establish the container global scene instance wrapper
        scene = new THREE.Scene();

        // Configure Perspective Projection Frustum Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / 400, 0.1, 100);
        camera.position.z = 8;

        // Set up the WebGL engine core renderer layer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, 400);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Map light vectors into the node environment
        ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        buildGeometryNode();
        animateLoop();
    }

    function buildGeometryNode() {
        if (currentMesh) scene.remove(currentMesh);

        // Formulate Geometry Nodes Primitive mapping
        let geometry;
        if (currentShape === "cube") geometry = new THREE.BoxGeometry(2, 2, 2);
        else if (currentShape === "sphere") geometry = new THREE.SphereGeometry(1.4, 32, 32);
        else if (currentShape === "torus") geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);

        // Formulate Material Shader Mesh Maps mapping
        let material;
        if (currentMaterial === "normal") material = new THREE.MeshNormalMaterial();
        else if (currentMaterial === "phong") material = new THREE.MeshPhongMaterial({ color: 0x6366f1, shininess: 100 });
        else if (currentMaterial === "basic") material = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });

        currentMesh = new THREE.Mesh(geometry, material);
        scene.add(currentMesh);
    }

    function animateLoop() {
        if (currentMesh) {
            currentMesh.rotation.x += 0.01 * speedModifier;
            currentMesh.rotation.y += 0.01 * speedModifier;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animateLoop);
    }

    // 2. Control Interceptor Events Listeners
    document.getElementById("geometryShape").addEventListener("change", (e) => {
        currentShape = e.target.value;
        buildGeometryNode();
    });

    document.getElementById("materialType").addEventListener("change", (e) => {
        currentMaterial = e.target.value;
        buildGeometryNode();
    });

    document.getElementById("rotationSpeed").addEventListener("input", (e) => {
        speedModifier = parseFloat(e.target.value);
        document.getElementById("speedVal").textContent = `${speedModifier.toFixed(1)}x`;
    });

    document.getElementById("lightIntensity").addEventListener("input", (e) => {
        const intensity = parseFloat(e.target.value);
        if (ambientLight) ambientLight.intensity = intensity;
        document.getElementById("lightVal").textContent = `${intensity.toFixed(1)}lm`;
    });

    document.getElementById("resetSceneBtn").addEventListener("click", () => {
        document.getElementById("geometryShape").value = "cube";
        document.getElementById("materialType").value = "normal";
        document.getElementById("rotationSpeed").value = 1;
        document.getElementById("lightIntensity").value = 1;
        
        currentShape = "cube";
        currentMaterial = "normal";
        speedModifier = 1.0;
        if (ambientLight) ambientLight.intensity = 1.0;

        document.getElementById("speedVal").textContent = "1.0x";
        document.getElementById("lightVal").textContent = "1.0lm";
        buildGeometryNode();
    });

    // Handle view dimensional changes dynamically
    window.addEventListener("resize", () => {
        if (!camera || !renderer) return;
        camera.aspect = container.clientWidth / 400;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, 400);
    });

    // Fire application launch execution loops
    init3DSpace();

    // 3. Educational Milestones Quiz Validation Logic
    const completedMilestones = new Set();
    document.querySelectorAll(".three-quiz-card").forEach(card => {
        const checkBtn = card.querySelector(".btn-quiz-check");
        const feedback = card.querySelector(".quiz-feedback");
        checkBtn.addEventListener("click", () => {
            const checked = card.querySelector('input[type="radio"]:checked');
            if (checked && checked.value === "B") {
                feedback.textContent = "Correct validation! THREE.Scene mapped safely.";
                feedback.className = "quiz-feedback correct";
                completedMilestones.add(card.closest(".three-lesson").getAttribute("data-topic"));

                const percentage = Math.round((completedMilestones.size / 4) * 100);
                document.getElementById("progressCount").textContent = completedMilestones.size;
                document.getElementById("progressFill").style.width = `${percentage}%`;
                document.getElementById("progressPercent").textContent = `${percentage}%`;
            } else {
                feedback.textContent = "Scene structure broken. Re-read core dependencies checklist.";
                feedback.className = "quiz-feedback wrong";
            }
        });
    });

    // Clear loader transitions overlay
    const loader = document.getElementById("loading-screen");
    if (loader) setTimeout(() => loader.remove(), 600);
});
