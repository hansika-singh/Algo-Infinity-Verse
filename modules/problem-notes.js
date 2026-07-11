window.switchQuizTab = function(tabName) {
  const probBtn = document.getElementById("btnQuizTabProblem");
  const notesBtn = document.getElementById("btnQuizTabNotes");
  const probContent = document.getElementById("quizTabProblemContent");
  const notesContent = document.getElementById("quizTabNotesContent");

  if (tabName === "problem") {
    if (probBtn) probBtn.classList.add("active");
    if (notesBtn) notesBtn.classList.remove("active");
    if (probContent) probContent.style.display = "block";
    if (notesContent) notesContent.style.display = "none";
  } else {
    if (probBtn) probBtn.classList.remove("active");
    if (notesBtn) notesBtn.classList.add("active");
    if (probContent) probContent.style.display = "none";
    if (notesContent) notesContent.style.display = "block";
  }
};

window.saveActiveProblemNotes = async function() {
  const currentProblem = window.currentProblem;
  const userProgress = window.userProgress || {};
  if (!currentProblem) return;

  const notesVal = document.getElementById("noteText")?.value || "";
  const mnemonicVal = document.getElementById("mnemonicText")?.value || "";
  const pitfallsVal = document.getElementById("pitfallsText")?.value || "";
  const whenToUseVal = document.getElementById("whenToUseText")?.value || "";
  const tagsVal = (document.getElementById("noteTags")?.value || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const noteSaveStatus = document.getElementById("noteSaveStatus");
  if (noteSaveStatus) noteSaveStatus.textContent = "Saving...";

  const noteData = {
    topicKey: currentProblem.category || "general",
    problemId: currentProblem.id,
    notes: notesVal,
    mnemonics: mnemonicVal,
    pitfalls: pitfallsVal,
    whenToUse: whenToUseVal,
    tags: tagsVal,
    updatedAt: new Date().toISOString()
  };

  if (!userProgress.problemNotes) userProgress.problemNotes = {};
  userProgress.problemNotes[currentProblem.id] = noteData;

  if (typeof saveUserData === "function") saveUserData();
  else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));

  try {
    const res = await fetch(`/api/problem-notes/${currentProblem.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteData)
    });
    const data = await res.json();
    if (data.success) {
      if (noteSaveStatus) {
        noteSaveStatus.textContent = "Saved to cloud!";
        setTimeout(() => { noteSaveStatus.textContent = ""; }, 3000);
      }
    } else {
      if (noteSaveStatus) noteSaveStatus.textContent = "Saved locally.";
    }
  } catch (err) {
    void 0;
    if (noteSaveStatus) noteSaveStatus.textContent = "Saved locally (offline).";
  }
};

window.syncProblemNotesDown = async function() {
  const userProgress = window.userProgress || {};
  if (location.protocol === "file:") return;
  try {
    const res = await fetch("/api/problem-notes", { credentials: "include" });
    if (res.status === 200) {
      const data = await res.json();
      if (data.success && data.notes) {
        userProgress.problemNotes = { ...(userProgress.problemNotes || {}), ...data.notes };
        if (typeof saveUserData === "function") saveUserData();
        else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
      }
    }
  } catch (err) {
    void 0;
  }
};

export function initProblemNotes() {}
// Legacy global exports
window.initProblemNotes = initProblemNotes;
