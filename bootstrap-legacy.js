(function() {
  if (window.__MODULES_LOADED__) return;
  window.__MODULES_LOADED__ = true;

  var scripts = [
    "/data/quiz-questions.js",
    "/data/dsa-topics.js",
    "/data/practice-problems.js",
    "/data/daily-challenges.js",
    "/data/chatbot-responses.js",
    "/data/roadmap-steps.js",
    "/data/profile-avatars.js",
    "/data/facts.js",
    "/data/personality-questions.js",
    "/data/revision-intervals.js",
    "/data/filters.js",
    "/data/levels.js",
    "/data/gamification-assets.js",
    "/modules/abortManager.js",
    "/modules/cacheManager.js",
    "/modules/userProgress.js",
    "/modules/spaced-repetition.js",
    "/modules/utils.js"
  ];

  for (var i = 0; i < scripts.length; i++) {
    document.write('<script src="' + scripts[i] + '"><\/script>');
  }
})();
