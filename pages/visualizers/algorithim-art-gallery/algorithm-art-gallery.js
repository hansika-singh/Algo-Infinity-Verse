document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initArtGallery();
});

/* -------------------------------
   Hero Typing
-------------------------------- */
function initHeroTyping() {
  const el = document.getElementById("typingTextArt");

  if (!el) return;

  const words = [
    "Bubble Sort Paintings",
    "Quick Sort Fractals",
    "Merge Sort Waves",
    "Algorithm Generated Art",
    "Execution Becomes Creativity",
  ];

  let word = 0;
  let char = 0;
  let deleting = false;

  function type() {
    const current = words[word];

    if (deleting) {
      el.textContent = current.substring(0, char--);
    } else {
      el.textContent = current.substring(0, char++);
    }

    let speed = deleting ? 50 : 100;

    if (!deleting && char === current.length + 1) {
      deleting = true;
      speed = 1500;
    }

    if (deleting && char === 0) {
      deleting = false;
      word = (word + 1) % words.length;
    }

    setTimeout(type, speed);
  }

  type();
}

/* -------------------------------
   Art Generator
-------------------------------- */

function initArtGallery() {
  const canvas = document.getElementById("artCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  canvas.width = 1000;
  canvas.height = 600;

  const algorithmSelect = document.getElementById("algorithmSelect");

  const generateBtn = document.getElementById("generateBtn");

  const clearBtn = document.getElementById("clearBtn");
  const randomBtn = document.getElementById("randomBtn");

  randomBtn.addEventListener("click", () => {
    const algorithms = ["bubble", "selection", "insertion", "merge", "quick"];
    const styles = ["particles", "spiral", "wave", "galaxy", "mandala"];

    algorithmSelect.value =
      algorithms[Math.floor(Math.random() * algorithms.length)];

    const artStyle = document.getElementById("artStyle").value;
      styles[Math.floor(Math.random() * styles.length)];

    sizeSlider.value = Math.floor(Math.random() * 191) + 10;

    speedSlider.value = Math.floor(Math.random() * 10) + 1;

    document.getElementById("sizeValue").textContent = sizeSlider.value;

    generateArtwork();
});

  const sizeSlider = document.getElementById("sizeSlider");
  const shapeCount = document.getElementById("shapeCount");

  let shapes = 0;
  const speedSlider = document.getElementById("speedSlider");

  generateBtn.addEventListener("click", () => generateArtwork());

  clearBtn.addEventListener("click", () => clearCanvas());
let stopDrawing = false;
  function clearCanvas() {
    stopDrawing = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function generateArtwork() {
    stopDrawing = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes = 0;

    if (shapeCount) {
      shapeCount.textContent = "0";
    }

    const size = parseInt(sizeSlider.value);

    let arr = Array.from({ length: size }, () =>
      Math.floor(Math.random() * 500),
    );

    const algorithm = algorithmSelect.value;
    const artStyle = document.getElementById("artStyle").value;

    switch (algorithm) {
      case "bubble":
       await bubbleArt(arr, artStyle);
        break;

      case "selection":
        await selectionArt(arr, artStyle);
        break;

      case "merge":
        await mergeArt(arr, artStyle);
        break;

      case "quick":
        await quickArt(arr, artStyle);
        break;

      case "insertion":
        await insertionArt(arr, artStyle);
        break;
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* -------------------------
      Bubble Sort Painting
  -------------------------- */

  async function bubbleArt(arr,style) {
    const delay = parseInt(speedSlider.value);

    for (let i = 0; i < arr.length; i++) {
      if (stopDrawing) return;
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopDrawing) return;
        drawBubbleStroke(j, arr[j], artStyle);

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }

        await sleep(delay);
      }
    }
  }

  function drawBubbleStroke(x, value, style) {
    ctx.beginPath();

switch (style) {

case "particles":
    ctx.arc(x * 10, canvas.height - value, value / 30, 0, Math.PI * 2);
    ctx.stroke();
    break;

case "spiral":
    ctx.arc(
        canvas.width / 2 + Math.cos(x * 0.3) * value,
        canvas.height / 2 + Math.sin(x * 0.3) * value,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    break;

case "wave":
    ctx.arc(
        x * 10,
        canvas.height / 2 + Math.sin(x * 0.2) * value * 0.4,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    break;

case "galaxy":
    ctx.arc(
        canvas.width / 2 + Math.cos(x) * value,
        canvas.height / 2 + Math.sin(x) * value,
        2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    break;

case "mandala":
    for(let i=0;i<8;i++){
        ctx.moveTo(canvas.width/2,canvas.height/2);
        ctx.lineTo(
            canvas.width/2+Math.cos(i*Math.PI/4)*value,
            canvas.height/2+Math.sin(i*Math.PI/4)*value
        );
    }
    ctx.stroke();
    break;
}
    shapes++;

    if (shapeCount) {
      shapeCount.textContent = shapes;
    }
    const generatedShapeCount = document.getElementById("generatedShapeCount");
if (generatedShapeCount) {
  generatedShapeCount.textContent = shapes;
}
  }

  /* -------------------------
      Selection Art
  -------------------------- */

  async function selectionArt(arr, style) {
    const delay = parseInt(speedSlider.value);

    for (let i = 0; i < arr.length; i++) {
      if (stopDrawing) return;
      let min = i;

      for (let j = i + 1; j < arr.length; j++) {
        if (stopDrawing) return;
        if (arr[j] < arr[min]) {
          min = j;
        }

        drawSelectionPattern(j, arr[j]);

        await sleep(delay);
      }

      [arr[i], arr[min]] = [arr[min], arr[i]];
    }
  }

  function drawSelectionPattern(index, value) {
    ctx.beginPath();

    ctx.moveTo(canvas.width / 2, canvas.height / 2);

    ctx.lineTo(index * 8, value);

    ctx.stroke();
    shapes++;

    if (shapeCount) {
      shapeCount.textContent = shapes;
    }
    const generatedShapeCount = document.getElementById("generatedShapeCount");
if (generatedShapeCount) {
  generatedShapeCount.textContent = shapes;
}
  }

  /* -------------------------
      Merge Sort Waves
  -------------------------- */

  async function mergeArt(arr, style) {
    for (let i = 0; i < arr.length; i++) {
      if (stopDrawing) return;
      const x = i * 8;

      const y = canvas.height / 2 + Math.sin(i * 0.3) * arr[i] * 0.3;

      ctx.beginPath();

      ctx.arc(x, y, 3, 0, Math.PI * 2);

      ctx.fill();
      shapes++;

      if (shapeCount) {
        shapeCount.textContent = shapes;
      }

      await sleep(10);
      const generatedShapeCount = document.getElementById("generatedShapeCount");
if (generatedShapeCount) {
  generatedShapeCount.textContent = shapes;
}
    }
  }

  /* -------------------------
      Quick Sort Fractal
  -------------------------- */

  async function quickArt(arr, style) {
    for (let i = 0; i < arr.length; i++) {
      if (stopDrawing) return;
      const angle = (i / arr.length) * Math.PI * 10;

      const radius = arr[i];

      const x = canvas.width / 2 + Math.cos(angle) * radius;

      const y = canvas.height / 2 + Math.sin(angle) * radius;

      ctx.beginPath();

      ctx.arc(x, y, 2, 0, Math.PI * 2);

      ctx.fill();
      shapes++;
      const generatedShapeCount = document.getElementById("generatedShapeCount");
if (generatedShapeCount) {
  generatedShapeCount.textContent = shapes;
} 

      await sleep(8);
    }
  }
  async function insertionArt(arr, style) {
    const delay = parseInt(speedSlider.value);

    for (let i = 1; i < arr.length; i++) {
      if (stopDrawing) return;
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        if (stopDrawing) return;
        drawSelectionPattern(j, arr[j]);
        arr[j + 1] = arr[j];
        j--;

        await sleep(delay);
      }

      arr[j + 1] = key;
    }
  }
}

const downloadBtn = document.getElementById("downloadBtn");

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const canvas = document.getElementById("artCanvas");

    const link = document.createElement("a");

    link.download = "algorithm-artwork.png";

    link.href = canvas.toDataURL("image/png");

    link.click();
  });
}

const shareBtn = document.getElementById("shareBtn");

shareBtn?.addEventListener("click", async () => {
    const canvas = document.getElementById("artCanvas");

    const dataUrl = canvas.toDataURL("image/png");

    if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();

        const file = new File([blob], "algorithm-art.png", {
            type: "image/png",
        });

        await navigator.share({
            title: "Algorithm Artwork",
            files: [file],
        });
    } else {
        await navigator.clipboard.writeText(dataUrl);
        void 0;
    }
});