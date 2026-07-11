// modules/revisionStorage.js

const LOCAL_STORAGE_KEY = "algoInfinityVerse";

/**
 * Checks if the user is authenticated by querying the session API.
 * @returns {Promise<Object>} { authenticated, user }
 */
export async function checkSession() {
  try {
    const res = await fetch("/api/session", { credentials: "include" });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("[RevisionStorage] Session check failed:", e);
  }
  return { authenticated: false, user: null };
}

/**
 * Loads revision data from local storage or cloud.
 * @param {Object} userProgress - Global user progress object
 * @returns {Promise<Object>} The updated revision data
 */
export async function loadRevisionData(userProgress) {
  const session = await checkSession();
  
  // Default structure
  const defaultCalendar = {
    tasks: [],
    history: [],
    streak: 0,
    longestStreak: 0,
    missedDays: 0,
    stats: {}
  };

  if (!userProgress.revisionSchedule) userProgress.revisionSchedule = {};
  if (!userProgress.revisionCalendar) userProgress.revisionCalendar = { ...defaultCalendar };

  if (session?.authenticated) {
    try {
      const res = await fetch("/api/revision", { credentials: "include" });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          // Merge local guest progress with remote progress
          const merged = mergeRevisionData(
            { schedule: userProgress.revisionSchedule, calendar: userProgress.revisionCalendar },
            { schedule: data.revisionSchedule || {}, calendar: data.revisionCalendar || defaultCalendar }
          );

          userProgress.revisionSchedule = merged.schedule;
          userProgress.revisionCalendar = merged.calendar;

          // Push merged changes to remote
          await saveRevisionData(userProgress);
          return merged;
        }
      }
    } catch (err) {
      console.warn("[RevisionStorage] Load from cloud failed, fallback to local:", err);
    }
  }

  // Load from local storage directly
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.revisionSchedule) userProgress.revisionSchedule = parsed.revisionSchedule;
      if (parsed.revisionCalendar) userProgress.revisionCalendar = parsed.revisionCalendar;
    }
  } catch (e) {
    console.error("[RevisionStorage] Local storage load failed:", e);
  }

  return {
    schedule: userProgress.revisionSchedule,
    calendar: userProgress.revisionCalendar
  };
}

/**
 * Saves revision data to local storage and firebase if authenticated.
 * @param {Object} userProgress - Global user progress object
 * @returns {Promise<boolean>} Success status
 */
export async function saveRevisionData(userProgress) {
  // Always write to local storage first
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {
    console.warn("[RevisionStorage] Local storage save failed:", e);
  }

  const session = await checkSession();
  if (session?.authenticated) {
    try {
      const res = await fetch("/api/revision", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisionSchedule: userProgress.revisionSchedule,
          revisionCalendar: userProgress.revisionCalendar
        })
      });
      return res.status === 200;
    } catch (err) {
      console.warn("[RevisionStorage] Cloud save failed:", err);
    }
  }
  return false;
}

/**
 * Merges two revision datasets by keeping the most advanced stages/records.
 */
function mergeRevisionData(local, remote) {
  const mergedSchedule = { ...remote.schedule };

  for (const topicKey in local.schedule) {
    const localTopic = local.schedule[topicKey];
    const remoteTopic = remote.schedule[topicKey];

    if (!remoteTopic) {
      mergedSchedule[topicKey] = localTopic;
    } else {
      // Keep the one with the higher stage or more history items
      const localHistoryCount = Array.isArray(localTopic.history) ? localTopic.history.length : 0;
      const remoteHistoryCount = Array.isArray(remoteTopic.history) ? remoteTopic.history.length : 0;

      if (localTopic.currentStage > remoteTopic.currentStage || localHistoryCount > remoteHistoryCount) {
        mergedSchedule[topicKey] = localTopic;
      }
    }
  }

  // Merge calendar histories uniquely based on dayKey + taskId
  const historyMap = new Map();
  const combineHistory = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const key = `${item.dayKey || ""}_${item.taskId || ""}`;
        historyMap.set(key, item);
      });
    }
  };

  combineHistory(remote.calendar?.history);
  combineHistory(local.calendar?.history);

  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => String(a.dayKey).localeCompare(String(b.dayKey)));

  const mergedCalendar = {
    tasks: remote.calendar?.tasks || local.calendar?.tasks || [],
    history: mergedHistory.slice(-120), // Cap history items to avoid size bloat
    streak: Math.max(Number(local.calendar?.streak) || 0, Number(remote.calendar?.streak) || 0),
    longestStreak: Math.max(Number(local.calendar?.longestStreak) || 0, Number(remote.calendar?.longestStreak) || 0),
    missedDays: Math.max(Number(local.calendar?.missedDays) || 0, Number(remote.calendar?.missedDays) || 0),
    stats: { ...(remote.calendar?.stats || {}), ...(local.calendar?.stats || {}) }
  };

  return {
    schedule: mergedSchedule,
    calendar: mergedCalendar
  };
}
