window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");

  if (loader) {
    loader.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const startBtn =
    document.getElementById("startInterviewBtn");

  const interviewType =
    document.getElementById("interviewType");

  const questionContainer =
    document.getElementById("questionContainer");

  const timerDisplay =
    document.getElementById("timer");

  const technicalScore =
    document.getElementById("technicalScore");

  const behavioralScore =
    document.getElementById("behavioralScore");

  const overallScore =
    document.getElementById("overallScore");
    const submitBtn =
  document.getElementById("submitInterviewBtn");

  if (
    !startBtn ||
     !submitBtn ||
    !interviewType ||
    !questionContainer ||
    !timerDisplay ||
    !technicalScore ||
    !behavioralScore ||
    !overallScore
  ) {
    return;
  }

  const technicalQuestions = [
    "Two Sum",
    "Binary Search",
    "Merge Intervals",
    "Sliding Window Maximum",
    "Longest Substring Without Repeating Characters",
    "DFS Traversal",
    "BFS Traversal",
    "Detect Cycle in Graph",
    "Topological Sort",
    "Dijkstra Algorithm"
  ];

  const behavioralQuestions = [
    "Tell me about yourself.",
    "Describe a challenge you faced.",
    "Tell me about a leadership experience.",
    "How do you handle conflicts?",
    "Describe a failure and what you learned.",
    "How do you prioritize tasks?",
    "Tell me about teamwork experience.",
    "Describe a difficult decision.",
    "How do you handle deadlines?",
    "Why should we hire you?"
  ];

  startBtn.addEventListener("click", () => {
    const type = interviewType.value;

    if (!type) {
      console.warn("Alert:", "Please select an interview type.");
      return;
    }

    questionContainer.innerHTML = "";

    let questions = [];

    if (type === "technical") {
      questions = technicalQuestions;
    } else if (type === "behavioral") {
      questions = behavioralQuestions;
    } else {
      questions = [
        ...technicalQuestions.slice(0, 5),
        ...behavioralQuestions.slice(0, 5)
      ];
    }

    questions.forEach((question, index) => {
      const card = document.createElement("div");

      card.className = "question-card";

      card.innerHTML = `
  <h3>Question ${index + 1}</h3>
  <p>${question}</p>

  <textarea
    class="problem-input answer-box"
    placeholder="Type your answer here..."
  ></textarea>
`;

      questionContainer.appendChild(card);
    });
    submitBtn.style.display = "inline-block";

    startTimer();
    });

    submitBtn.addEventListener("click", () => {
  const answers =
    document.querySelectorAll(".answer-box");

  let completed = 0;

  answers.forEach((answer) => {
    if (answer.value.trim() !== "") {
      completed++;
    }
  });

  const total = answers.length;

  const percentage =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  technicalScore.textContent =
    `${completed}/${total}`;

  behavioralScore.textContent =
    `${completed}/${total}`;

  overallScore.textContent =
    `${percentage}%`;
});

  function startTimer() {
    let time = 15 * 60;

    clearInterval(window.interviewTimer);

    window.interviewTimer = setInterval(() => {
      const minutes =
        Math.floor(time / 60)
          .toString()
          .padStart(2, "0");

      const seconds =
        (time % 60)
          .toString()
          .padStart(2, "0");

      timerDisplay.textContent =
        `${minutes}:${seconds}`;

      if (time <= 0) {
        clearInterval(window.interviewTimer);

        console.warn("Alert:", "Interview session completed!");
      }

      time--;
    }, 1000);
  }
});