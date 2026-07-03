const behavioralQuestions = [
{
  id: 1,
  category: "Communication",
  difficulty: "Easy",
  question: "Tell me about yourself.",
  description: "Assess communication skills, career motivation, and professional background.",
  answer: `
    <strong>What Interviewers Look For:</strong><br>
    A concise story connecting your past experiences, current skills, and future goals.<br><br>

    <strong>Structure:</strong><br>
    <strong>Present:</strong> Who you are today.<br>
    <strong>Past:</strong> Key experiences that shaped your journey.<br>
    <strong>Future:</strong> Why you're interested in this role.<br><br>

    <strong>Demo Answer:</strong><br>
    I am currently pursuing a B.Tech in Computer Science and Engineering with a strong interest in software development, problem-solving, and emerging technologies. Over the last year, I have worked on academic projects, participated in open-source programs, and continuously improved my programming skills through practical learning. One experience I'm particularly proud of is contributing to community-driven projects, where I learned how to collaborate with developers, understand real-world requirements, and write maintainable code. These experiences strengthened both my technical and communication skills. Going forward, I'm looking for opportunities where I can apply my knowledge, learn from experienced professionals, and contribute to building impactful products.
  `
},
{
  id: 2,
  category: "Leadership",
  difficulty: "Medium",
  question: "Tell me about a time you led a project.",
  description: "Demonstrates leadership, coordination, and responsibility.",

  tip: "Show how you guided the team, handled challenges, and delivered results.",

  answer: `
    <strong>Situation:</strong><br>
    During a mini-project in college, our team needed to develop a software solution within a strict deadline.

    <br><br>

    <strong>Task:</strong><br>
    I was responsible for coordinating the team's efforts and ensuring that everyone stayed on track.

    <br><br>

    <strong>Action:</strong><br>
    I divided tasks based on each member's strengths, scheduled regular progress discussions, and helped remove obstacles whenever issues arose. I also monitored deadlines and ensured effective communication among team members.

    <br><br>

    <strong>Result:</strong><br>
    The project was completed on time and met all requirements. The experience strengthened my leadership, communication, and organizational skills.
  `
},
{
  id: 3,
  category: "Conflict",
  difficulty: "Medium",
  question: "Describe a conflict you had with a teammate.",
  description: "Evaluates conflict resolution and professionalism.",

  tip: "Avoid blaming others. Focus on understanding, communication, and resolution.",

  answer: `
    <strong>Situation:</strong><br>
    During a group assignment, a teammate and I disagreed on how to approach a particular feature of the project.

    <br><br>

    <strong>Task:</strong><br>
    We needed to resolve the disagreement quickly so the project could continue without delays.

    <br><br>

    <strong>Action:</strong><br>
    I suggested discussing both approaches objectively and evaluating their advantages and disadvantages. We listened to each other's viewpoints, compared the options, and consulted our mentor for additional guidance.

    <br><br>

    <strong>Result:</strong><br>
    We reached a mutually acceptable solution, completed the project successfully, and improved our ability to communicate and collaborate effectively.
  `
},
{
  id: 4,
  category: "Communication",
  difficulty: "Easy",
  question: "Tell me about a time you had to explain a complex concept to someone.",
  description: "Tests communication and clarity.",

  tip: "Show how you adapted your explanation to your audience.",

  answer: `
    <strong>Situation:</strong><br>
    A teammate was struggling to understand a technical concept required for our project.

    <br><br>

    <strong>Task:</strong><br>
    I needed to help them understand the concept so they could contribute effectively.

    <br><br>

    <strong>Action:</strong><br>
    I broke the concept into smaller parts, used simple examples, and answered questions throughout the discussion.

    <br><br>

    <strong>Result:</strong><br>
    The teammate understood the concept and was able to complete their assigned tasks successfully.
  `
},
{
  id: 5,
  category: "Failure",
  difficulty: "Medium",
  question: "Tell me about a time you failed.",
  description: "Evaluates self-awareness and growth mindset.",

  tip: "Focus on what you learned rather than the failure itself.",

  answer: `
    <strong>Situation:</strong><br>
    During my first semester, I underestimated the time required for a programming assignment.

    <br><br>

    <strong>Task:</strong><br>
    I needed to submit a complete solution before the deadline.

    <br><br>

    <strong>Action:</strong><br>
    Due to poor planning, I submitted an incomplete assignment. Afterwards, I created a better study schedule and started tracking my tasks more effectively.

    <br><br>

    <strong>Result:</strong><br>
    I improved my time-management skills and performed much better in future projects.
  `
},
{
  id: 6,
  category: "Adaptability",
  difficulty: "Medium",
  question: "Describe a time you had to adapt to a sudden change.",
  description: "Tests flexibility and resilience.",

  tip: "Demonstrate how you stayed calm and adjusted your approach.",

  answer: `
    <strong>Situation:</strong><br>
    During a project, our requirements changed significantly just before submission.

    <br><br>

    <strong>Task:</strong><br>
    We needed to update our solution while staying within the deadline.

    <br><br>

    <strong>Action:</strong><br>
    I reassessed priorities, reorganized tasks, and focused on implementing the most important changes first.

    <br><br>

    <strong>Result:</strong><br>
    We delivered a successful project and learned how to respond effectively to changing requirements.
  `
},
{
  id: 7,
  category: "Problem Solving",
  difficulty: "Medium",
  question: "Tell me about a difficult problem you solved.",
  description: "Measures analytical and problem-solving skills.",

  tip: "Walk through your thinking process clearly.",

  answer: `
    <strong>Situation:</strong><br>
    A bug in our application was causing incorrect results and was difficult to reproduce.

    <br><br>

    <strong>Task:</strong><br>
    I needed to identify the root cause and fix the issue.

    <br><br>

    <strong>Action:</strong><br>
    I systematically tested different scenarios, analyzed logs, and isolated the source of the problem.

    <br><br>

    <strong>Result:</strong><br>
    The bug was fixed successfully, improving the application's reliability.
  `
},
{
  id: 8,
  category: "Time Management",
  difficulty: "Medium",
  question: "Describe a time you had to manage multiple deadlines.",
  description: "Evaluates prioritization and planning.",

  tip: "Explain how you organized your workload.",

  answer: `
    <strong>Situation:</strong><br>
    I had multiple project submissions and exams scheduled during the same week.

    <br><br>

    <strong>Task:</strong><br>
    I needed to complete all responsibilities without compromising quality.

    <br><br>

    <strong>Action:</strong><br>
    I created a schedule, prioritized tasks by urgency, and broke larger tasks into smaller milestones.

    <br><br>

    <strong>Result:</strong><br>
    I completed all deadlines successfully and reduced stress through better planning.
  `
},
{
  id: 9,
  category: "Leadership",
  difficulty: "Hard",
  question: "Tell me about a time you motivated others.",
  description: "Assesses leadership and influence.",

  tip: "Focus on how you inspired action.",

  answer: `
    <strong>Situation:</strong><br>
    During a project, team morale dropped after several technical setbacks.

    <br><br>

    <strong>Task:</strong><br>
    I wanted to help the team stay focused and positive.

    <br><br>

    <strong>Action:</strong><br>
    I encouraged open communication, celebrated small wins, and helped break challenges into manageable tasks.

    <br><br>

    <strong>Result:</strong><br>
    The team regained confidence and successfully completed the project.
  `
},
{
  id: 10,
  category: "Success",
  difficulty: "Easy",
  question: "Tell me about an achievement you are proud of.",
  description: "Highlights accomplishments and impact.",

  tip: "Choose an achievement with measurable results.",

  answer: `
    <strong>Situation:</strong><br>
    I set a goal to learn a new technical skill while balancing academic responsibilities.

    <br><br>

    <strong>Task:</strong><br>
    I wanted to apply the skill by building a practical project.

    <br><br>

    <strong>Action:</strong><br>
    I followed a structured learning plan and consistently practiced through projects.

    <br><br>

    <strong>Result:</strong><br>
    I successfully completed the project and gained confidence in applying the skill.
  `
},
{
  id: 11,
  category: "Communication",
  difficulty: "Medium",
  question: "Tell me about a time you received criticism.",
  description: "Evaluates coachability and self-improvement.",

  tip: "Show maturity and willingness to learn.",

  answer: `
    <strong>Situation:</strong><br>
    A mentor pointed out weaknesses in my presentation skills.

    <br><br>

    <strong>Task:</strong><br>
    I needed to improve my communication effectiveness.

    <br><br>

    <strong>Action:</strong><br>
    I accepted the feedback, practiced public speaking, and sought additional guidance.

    <br><br>

    <strong>Result:</strong><br>
    My presentations became more engaging and confident.
  `
},
{
  id: 12,
  category: "Teamwork",
  difficulty: "Medium",
  question: "Describe a time you helped a teammate succeed.",
  description: "Assesses collaboration and supportiveness.",

  tip: "Show teamwork without taking credit away from others.",

  answer: `
    <strong>Situation:</strong><br>
    A teammate was struggling to complete a technical task before a deadline.

    <br><br>

    <strong>Task:</strong><br>
    I wanted to support them while ensuring project progress.

    <br><br>

    <strong>Action:</strong><br>
    I explained the concepts involved, reviewed their work, and helped troubleshoot issues.

    <br><br>

    <strong>Result:</strong><br>
    The teammate completed the task successfully and the project remained on schedule.
  `
},
{
  id: 13,
  category: "Problem Solving",
  difficulty: "Hard",
  question: "Describe a situation where you had limited resources.",
  description: "Tests creativity and resourcefulness.",

  tip: "Highlight how you maximized what was available.",

  answer: `
    <strong>Situation:</strong><br>
    Our team had limited time and tools available for a project.

    <br><br>

    <strong>Task:</strong><br>
    We needed to deliver a functional solution despite constraints.

    <br><br>

    <strong>Action:</strong><br>
    I identified the highest-priority features and focused efforts on the areas with the greatest impact.

    <br><br>

    <strong>Result:</strong><br>
    We delivered a successful solution while staying within our limitations.
  `
},
{
  id: 14,
  category: "Failure",
  difficulty: "Hard",
  question: "Tell me about a time you made a mistake.",
  description: "One of the most frequently asked behavioral questions.",

  tip: "Take responsibility. Avoid blaming others.",

  answer: `
    <strong>Situation:</strong><br>
    During a team project, I was responsible for preparing the final presentation slides.

    <br><br>

    <strong>Task:</strong><br>
    I needed to compile everyone's work into a single presentation before the submission deadline.

    <br><br>

    <strong>Action:</strong><br>
    While merging the slides, I accidentally used an outdated version of one teammate's work. After noticing the mistake, I immediately informed the team, corrected the content, and introduced a version-naming system to prevent similar issues.

    <br><br>

    <strong>Result:</strong><br>
    The project was submitted successfully and the team appreciated the transparency. I learned the importance of version control and proactive communication.
  `
},
{
  id: 15,
  category: "Leadership",
  difficulty: "Hard",
  question: "Tell me about a time you took initiative without being asked.",
  description: "Measures ownership and proactive behavior.",

  tip: "Focus on identifying a problem and solving it independently.",

  answer: `
    <strong>Situation:</strong><br>
    During a hackathon, our team lacked clear task allocation and progress tracking.

    <br><br>

    <strong>Task:</strong><br>
    Although I wasn't the team leader, I wanted to improve coordination.

    <br><br>

    <strong>Action:</strong><br>
    I created a task board, assigned responsibilities based on strengths, and scheduled short status updates throughout the event.

    <br><br>

    <strong>Result:</strong><br>
    The team completed all planned features and submitted before the deadline. The experience taught me that leadership often means stepping up when needed.
  `
},
{
  id: 16,
  category: "Conflict",
  difficulty: "Hard",
  question: "Tell me about a time you disagreed with a teammate.",
  description: "Tests conflict resolution and professionalism.",

  tip: "Show collaboration, not confrontation.",

  answer: `
    <strong>Situation:</strong><br>
    During a software project, a teammate and I disagreed on the architecture we should use.

    <br><br>

    <strong>Task:</strong><br>
    We needed to reach a decision quickly without delaying development.

    <br><br>

    <strong>Action:</strong><br>
    I suggested comparing both approaches objectively based on scalability, maintainability, and implementation time. We discussed the pros and cons and sought feedback from our mentor.

    <br><br>

    <strong>Result:</strong><br>
    We chose a solution that combined the strengths of both ideas and completed the project successfully.
  `
},
{
  id: 17,
  category: "Leadership",
  difficulty: "Hard",
  question: "Tell me about a time you failed to meet a deadline.",
  description: "Evaluates accountability and recovery.",

  tip: "Be honest and emphasize lessons learned.",

  answer: `
    <strong>Situation:</strong><br>
    During my first semester, I underestimated the effort required for a coding assignment.

    <br><br>

    <strong>Task:</strong><br>
    I needed to submit a fully functional solution before the deadline.

    <br><br>

    <strong>Action:</strong><br>
    Poor planning caused me to miss the deadline. Afterward, I analyzed my mistakes, broke future projects into smaller milestones, and started using a task tracker.

    <br><br>

    <strong>Result:</strong><br>
    I improved my planning skills significantly and have met subsequent project deadlines consistently.
  `
},
{
  id: 18,
  category: "Problem Solving",
  difficulty: "Hard",
  question: "Describe a situation where you had very little information but still had to make a decision.",
  description: "Tests decision-making under uncertainty.",

  tip: "Explain how you assessed risks and gathered available information.",

  answer: `
    <strong>Situation:</strong><br>
    During a project demo, a key feature stopped working unexpectedly.

    <br><br>

    <strong>Task:</strong><br>
    We needed to decide whether to continue troubleshooting or switch to a backup plan.

    <br><br>

    <strong>Action:</strong><br>
    I quickly assessed the issue, estimated recovery time, and recommended using the backup feature while continuing investigation in parallel.

    <br><br>

    <strong>Result:</strong><br>
    The demo was completed successfully, and the issue was resolved afterward without impacting stakeholders.
  `
},
{
  id: 19,
  category: "Adaptability",
  difficulty: "Medium",
  question: "Tell me about a time your priorities suddenly changed.",
  description: "Measures flexibility and adaptability.",

  tip: "Demonstrate how you stayed calm, reprioritized tasks, and communicated effectively.",

  answer: `
    <strong>Situation:</strong><br>
    During a college project, our team was preparing for a presentation when our mentor asked us to add an entirely new feature just a few days before the deadline.

    <br><br>

    <strong>Task:</strong><br>
    We needed to adjust our plans and deliver the updated project without compromising quality.

    <br><br>

    <strong>Action:</strong><br>
    I helped the team reassess priorities, divided tasks based on urgency, and focused on completing the new feature while postponing less critical improvements.

    <br><br>

    <strong>Result:</strong><br>
    We successfully incorporated the feature and delivered the project on time. The experience improved my ability to adapt quickly to changing requirements.
  `
},
{
  id: 20,
  category: "Communication",
  difficulty: "Medium",
  question: "Tell me about a time you received difficult feedback.",
  description: "Evaluates coachability and willingness to improve.",

  tip: "Show that you accepted the feedback professionally and acted on it.",

  answer: `
    <strong>Situation:</strong><br>
    During a presentation, my faculty mentor pointed out that I relied too heavily on reading slides instead of engaging with the audience.

    <br><br>

    <strong>Task:</strong><br>
    I needed to improve my presentation and communication skills.

    <br><br>

    <strong>Action:</strong><br>
    I accepted the feedback, practiced presenting without notes, recorded myself to identify areas of improvement, and sought additional feedback from peers.

    <br><br>

    <strong>Result:</strong><br>
    My future presentations became more confident and interactive, and I received positive feedback for my communication skills.
  `
},
{
  id: 21,
  category: "Communication",
  difficulty: "Hard",
  question: "Tell me about a time you had to convince someone to accept your idea.",
  description: "Tests persuasion, communication, and influence.",

  tip: "Focus on logic, evidence, and understanding the other person's perspective.",

  answer: `
    <strong>Situation:</strong><br>
    During a project discussion, I proposed automating a repetitive process, but some teammates preferred continuing with the manual approach.

    <br><br>

    <strong>Task:</strong><br>
    I needed to explain why automation would be more efficient without creating conflict.

    <br><br>

    <strong>Action:</strong><br>
    I prepared a simple demonstration showing the time savings and reduction in errors. I also listened to their concerns and addressed them one by one.

    <br><br>

    <strong>Result:</strong><br>
    The team agreed to implement the automated solution, which reduced effort and improved overall productivity.
  `
},
{
  id: 22,
  category: "Teamwork",
  difficulty: "Medium",
  question: "Describe a time you worked with someone difficult.",
  description: "Measures teamwork and interpersonal skills.",

  tip: "Avoid criticizing the person. Focus on how you maintained professionalism.",

  answer: `
    <strong>Situation:</strong><br>
    During a group assignment, one team member frequently missed meetings and submitted work late.

    <br><br>

    <strong>Task:</strong><br>
    I wanted to ensure the project stayed on track while maintaining a positive team environment.

    <br><br>

    <strong>Action:</strong><br>
    Instead of becoming frustrated, I spoke with the teammate privately to understand the issue. We adjusted responsibilities and established clearer deadlines and expectations.

    <br><br>

    <strong>Result:</strong><br>
    Communication improved, the teammate became more engaged, and the project was completed successfully.
  `
},
{
  id: 23,
  category: "Success",
  difficulty: "Medium",
  question: "Tell me about a goal you achieved despite obstacles.",
  description: "Highlights perseverance and determination.",

  tip: "Choose an example that demonstrates resilience and measurable results.",

  answer: `
    <strong>Situation:</strong><br>
    I wanted to learn web development while managing college coursework and other commitments.

    <br><br>

    <strong>Task:</strong><br>
    My goal was to build and deploy a complete project within a limited timeframe.

    <br><br>

    <strong>Action:</strong><br>
    I created a study schedule, dedicated consistent hours each week to learning, and applied concepts by building small projects before starting the final one.

    <br><br>

    <strong>Result:</strong><br>
    I successfully completed and deployed the project. The experience strengthened both my technical and time-management skills.
  `
},
{
  id: 24,
  category: "Leadership",
  difficulty: "Hard",
  question: "Describe a situation where you had to lead without authority.",
  description: "Evaluates influence, collaboration, and initiative.",

  tip: "Show how you influenced others through trust and communication rather than position.",

  answer: `
    <strong>Situation:</strong><br>
    During a college event, several volunteers were unsure about their responsibilities, and progress was slowing down.

    <br><br>

    <strong>Task:</strong><br>
    Although I was not the official coordinator, I wanted to help the team become more organized.

    <br><br>

    <strong>Action:</strong><br>
    I helped clarify responsibilities, coordinated communication between volunteers, and encouraged team members to share updates regularly.

    <br><br>

    <strong>Result:</strong><br>
    The event preparations became more efficient, tasks were completed on time, and the event ran smoothly. I learned that leadership is often about influence and initiative rather than authority.
  `
},
{
  id: 25,
  category: "Teamwork",
  difficulty: "Easy",
  question: "Tell me about a time you worked in a team.",
  description: "Evaluates collaboration and communication skills.",

  tip: "Focus on your contribution while highlighting the team's success.",

  answer: `
    <strong>Situation:</strong><br>
    During a college project, our team was tasked with developing a simple web application within a limited timeframe.

    <br><br>

    <strong>Task:</strong><br>
    My responsibility was to develop part of the frontend and coordinate with teammates working on the backend.

    <br><br>

    <strong>Action:</strong><br>
    I maintained regular communication with team members, participated in planning discussions, and helped resolve integration issues between different modules. I also assisted teammates whenever they faced technical difficulties.

    <br><br>

    <strong>Result:</strong><br>
    The project was completed successfully before the deadline and received positive feedback from our faculty. I learned the importance of communication, collaboration, and supporting teammates to achieve a common goal.
  `
},
{
  id: 26,
  category: "Time Management",
  difficulty: "Medium",
  question: "Tell me about a time you handled multiple priorities.",
  description: "Evaluate prioritization, planning, and execution under pressure.",
  answer: `
    <strong>Situation:</strong><br>
    Describe a period when multiple important tasks competed for your attention.<br><br>

    <strong>Task:</strong><br>
    Explain the responsibilities and deadlines involved.<br><br>

    <strong>Action:</strong><br>
    Show how you prioritized work, managed time, and tracked progress.<br><br>

    <strong>Result:</strong><br>
    Demonstrate successful outcomes and lessons learned.<br><br>

    <strong>Demo Answer:</strong><br>
    During a particularly busy week in college, I was preparing for semester examinations while also contributing to an open-source project and completing an internship assignment. All three had deadlines within a short time frame. To manage everything effectively, I created a priority matrix based on urgency and impact. I divided larger tasks into smaller milestones, scheduled focused work sessions, and reviewed my progress every evening. This helped me stay organized without feeling overwhelmed. As a result, I completed all deliverables before their deadlines, performed well in my examinations, and successfully merged my contribution into the project. The experience taught me the importance of planning, prioritization, and consistency.
  `
},
{
  id: 27,
  category: "Adaptability",
  difficulty: "Medium",
  question: "Tell me about a time you received critical feedback.",
  description: "Assess self-awareness, coachability, and willingness to improve.",
  answer: `
    <strong>Situation:</strong><br>
    Explain the context in which you received feedback.<br><br>

    <strong>Task:</strong><br>
    Describe the area where improvement was needed.<br><br>

    <strong>Action:</strong><br>
    Show how you accepted the feedback, reflected on it, and made improvements.<br><br>

    <strong>Result:</strong><br>
    Highlight measurable growth or improved outcomes.<br><br>

    <strong>Demo Answer:</strong><br>
    During a project presentation, a faculty member pointed out that while my technical understanding was strong, my explanations were often too detailed and difficult for a non-technical audience to follow. Initially, I felt disappointed because I had invested significant effort into the presentation. However, I realized the feedback was valuable. I began focusing on storytelling, simplifying technical concepts, and organizing presentations around key takeaways rather than technical depth alone. I also practiced with classmates and asked for feedback before presenting. Over time, my presentations became more engaging and easier to understand. In later evaluations, I received positive feedback not only for technical accuracy but also for clarity and communication.
  `
},
{
  id: 28,
  category: "Self Awareness",
  difficulty: "Easy",
  question: "What are your strengths and weaknesses?",
  description: "Evaluate self-awareness, honesty, and growth mindset.",
  answer: `
    <strong>What Interviewers Look For:</strong><br>
    Self-awareness, confidence, and willingness to improve.<br><br>

    <strong>Demo Answer:</strong><br>

    <strong>Strength:</strong><br>
    One of my strengths is my ability to learn new concepts quickly. Whenever I encounter a new technology or tool, I enjoy exploring it independently and applying it through projects.<br><br>

    <strong>Weakness:</strong><br>
    Earlier, I sometimes spent too much time trying to perfect small details. Over time, I learned to balance quality with deadlines by prioritizing tasks and focusing on overall impact.<br><br>

    <strong>Key Tip:</strong><br>
    Choose a real weakness and explain how you are actively improving it.
  `
},
{
  id: 29,
  category: "Motivation",
  difficulty: "Easy",
  question: "Why do you want this role/company?",
  description: "Assess motivation, research, and cultural fit.",
  answer: `
    <strong>What Interviewers Look For:</strong><br>
    Genuine interest in the role, company, and growth opportunities.<br><br>

    <strong>Demo Answer:</strong><br>
    I am excited about this role because it aligns with my interests in software development and problem-solving. I am particularly attracted to the company's focus on innovation, learning culture, and impact-driven projects. I believe this role would allow me to apply my skills, learn from experienced professionals, and contribute meaningfully while continuing to grow both technically and professionally.<br><br>

    <strong>Key Tip:</strong><br>
    Mention something specific about the company instead of giving a generic answer.
  `
},
{
  id: 30,
  category: "Career Goals",
  difficulty: "Medium",
  question: "Where do you see yourself in 5 years?",
  description: "Evaluate ambition, planning, and long-term commitment.",
  answer: `
    <strong>What Interviewers Look For:</strong><br>
    Career direction, ambition, and realistic goals.<br><br>

    <strong>Demo Answer:</strong><br>
    In five years, I see myself as a skilled professional who has built strong technical expertise and contributed to impactful projects. I hope to take on greater responsibilities, mentor others, and continue learning emerging technologies. My goal is to grow into a role where I can combine technical knowledge, problem-solving, and leadership to create meaningful value for both users and the organization.<br><br>

    <strong>Key Tip:</strong><br>
    Focus on growth and learning rather than specific job titles.
  `
}
];
// ===== INITIALIZATION & STATE MANAGEMENT =====
document.addEventListener("DOMContentLoaded", () => {
  
  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) {
      loader.classList.add("hidden");
    }
  }, 1000);

  // Initialize Dark/Light Mode Sync
  syncTheme();

  // Initialize Navbar toggle
  initNavbar();

  // Initialize Print Flow
  initPrint();

  // Scroll to Top logic
  initScrollTop();
});

// ===== DARK/LIGHT THEME SYNCHRONIZATION =====
function syncTheme() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");

  // Check saved preference
  const savedMode = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  if (savedMode === "light") {
    document.documentElement.classList.add("light-mode");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  }

  toggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light-mode");
    const isLight = document.documentElement.classList.contains("light-mode");
    if (icon) {
      icon.classList.toggle("fa-moon");
      icon.classList.toggle("fa-sun");
    }
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });
}

// ===== MOBILE NAVBAR DRIVER =====
function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  let overlay = document.querySelector(".nav-overlay");
  if (!overlay && menuToggle && navLinks) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    if (overlay) overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };

  const closeMenu = () => {
    if (!navLinks.classList.contains("active")) return;
    toggleMenu(false);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    if (overlay) overlay.addEventListener("click", closeMenu);

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  // Dropdown functionality
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

  dropdownToggles.forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;

    let hoverTimeout;

    const showMenu = () => { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); };
    const hideMenu = () => { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); };

    parent.addEventListener("mouseenter", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) hideMenu(); });
    toggle.addEventListener("focus", () => { if (!isMobile()) showMenu(); });
    menu.addEventListener("focusin", () => { if (!isMobile()) showMenu(); });
    parent.addEventListener("focusout", () => { if (!isMobile()) hideMenu(); });

    toggle.addEventListener("click", (e) => {
      if (isMobile()) { e.preventDefault(); e.stopPropagation(); const isOpen = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", isOpen); }
    });

    menu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (isMobile()) { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
      });
    });
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      document.querySelectorAll(".has-dropdown.open").forEach((el) => el.classList.remove("open"));
      dropdownToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "false"));
    }
  });
}

// ===== PDF EXPORT DRIVER =====
function initPrint() {
  const exportBtn = document.getElementById("exportPdfBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

// ===== SCROLL TO TOP DRIVER =====
function initScrollTop() {
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/*Elements*/
const questionsContainer =
  document.getElementById("questions-container");

const searchInput =
  document.getElementById("searchQuestions");

const filterButtons =
  document.querySelectorAll(".filter-btn");

let currentCategory = "All";

//Render
const answerModal =
  document.getElementById("answerModal");

const modalQuestion =
  document.getElementById("modalQuestion");

const modalCategory =
  document.getElementById("modalCategory");

const modalAnswer =
  document.getElementById("modalAnswer");

const modalDifficulty =
  document.getElementById("modalDifficulty");

const closeAnswerModal =
  document.getElementById("closeAnswer");
//Open Modal
function openAnswerModal(questionId){

  const question =
    behavioralQuestions.find(
      q => q.id === questionId
    );

  if(!question) return;

  modalQuestion.textContent =
    question.question;

  modalCategory.textContent =
    question.category;

  modalAnswer.innerHTML =
    question.answer;

  modalDifficulty.textContent =
  question.difficulty;

modalDifficulty.className =
  `modal-difficulty difficulty-${question.difficulty.toLowerCase()}`;

  answerModal.classList.add("active");
}
//Close Modal
closeAnswerModal.addEventListener(
  "click",
  () => {
    answerModal.classList.remove("active");
  }
);
questionsContainer.addEventListener("click", (e) => {

  if (e.target.classList.contains("view-answer-btn")) {

    openAnswerModal(
      Number(e.target.dataset.id)
    );

  }

});
//Connect Buttons
function renderQuestions(questions) {

  questionsContainer.innerHTML = "";

  // Empty State
  if (questions.length === 0) {

    questionsContainer.innerHTML = `
      <div class="behavioral-card">
        <h3>No Questions Found</h3>
        <p>
          Try a different search term or category.
        </p>
      </div>
    `;

    return;
  }

  questions.forEach(question => {

    const card = document.createElement("div");

    card.className = "behavioral-card";

    card.innerHTML = `
      <div class="card-meta">

  <span class="category-tag">
    ${question.category}
  </span>

 <span class="
  difficulty-badge
  difficulty-${question.difficulty.toLowerCase()}
">
  ${question.difficulty}
</span>

</div>

      <h3>${question.question}</h3>

      <p>${question.description}</p>

      <button
        class="btn btn-primary view-answer-btn"
        data-id="${question.id}">
        View Answer
      </button>
    `;

    questionsContainer.appendChild(card);

  });


}
//initial
renderQuestions(behavioralQuestions);

/*Search*/
searchInput.addEventListener("input", () => {

  const searchTerm =
    searchInput.value.toLowerCase();

  const filtered =
    behavioralQuestions.filter(question =>
      question.question
        .toLowerCase()
        .includes(searchTerm)
    );

    
  renderQuestions(filtered);

});

/*Category Filter*/
filterButtons.forEach(button => {

  button.addEventListener("click", () => {

    filterButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    const category =
      button.textContent.trim();

    if(category === "All"){
      renderQuestions(behavioralQuestions);
      return;
    }

    const filtered =
      behavioralQuestions.filter(
        question =>
          question.category === category
      );

    renderQuestions(filtered);

  });

});


answerModal.addEventListener("click", (e) => {

  if (e.target === answerModal) {

    answerModal.classList.remove("active");

  }

});

document.addEventListener("keydown", (e) => {

  if (e.key === "Escape") {
    answerModal.classList.remove("active");
  }

});
