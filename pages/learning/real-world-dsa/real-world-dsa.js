/* ==========================================================
   REAL WORLD DSA
   Interactive JavaScript
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       Stack Demo
    ====================================================== */

    const stackBtn = document.getElementById("stackDemoBtn");
    const stackDemo = document.getElementById("stackDemo");

    if (stackBtn && stackDemo) {

        stackBtn.addEventListener("click", () => {

            const pages = [
                "🏠 Home",
                "📖 Learn DSA",
                "📘 Stack",
                "🎯 Quiz"
            ];

            stackDemo.innerHTML = `
                <strong>Browser History (LIFO)</strong><br><br>
                Current History:<br>
                ${pages.join(" → ")}
                <br><br>
                ⬅ User presses Back
                <br><br>
                Current Page:
                <strong>${pages[pages.length - 2]}</strong>
            `;
        });

    }

    /* ======================================================
       Queue Demo
    ====================================================== */

    const queueBtn = document.getElementById("queueDemoBtn");
    const queueDemo = document.getElementById("queueDemo");

    if (queueBtn && queueDemo) {

        queueBtn.addEventListener("click", () => {

            const jobs = [
                "📄 Resume.pdf",
                "📄 Assignment.pdf",
                "📄 Invoice.pdf"
            ];

            const printing = jobs.shift();

            queueDemo.innerHTML = `
                <strong>Printer Queue (FIFO)</strong><br><br>

                Printing Now:<br>

                <strong>${printing}</strong>

                <br><br>

                Remaining Queue:<br>

                ${jobs.join("<br>")}
            `;
        });

    }

    /* ======================================================
       Interactive Challenge
    ====================================================== */

    const result = document.getElementById("challengeResult");

    document.querySelectorAll(".choice-btn").forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".choice-btn")
                .forEach(btn => btn.classList.remove("selected"));

            button.classList.add("selected");

            const answer = button.dataset.answer;

            if (answer === "linkedlist") {

                result.innerHTML = `
                    ✅ <strong>Correct!</strong><br><br>

                    Linked Lists allow efficient insertion,
                    deletion and rearrangement of songs,
                    making them an excellent choice for
                    playlist management.
                `;

                result.style.color = "#22c55e";

            } else {

                result.innerHTML = `
                    ❌ <strong>Not the best choice.</strong><br><br>

                    Think about operations like inserting,
                    deleting and reordering songs frequently.

                    A Linked List handles these efficiently.
                `;

                result.style.color = "#ef4444";

            }

        });

    });

    /* ======================================================
       Smooth Navigation
    ====================================================== */

    document.querySelectorAll(".topic-nav a").forEach(link => {

        link.addEventListener("click", e => {

            e.preventDefault();

            const target = document.querySelector(
                link.getAttribute("href")
            );

            if (target) {

                target.scrollIntoView({

                    behavior: "smooth"

                });

            }

        });

    });

    /* ======================================================
       Reveal Animation
    ====================================================== */

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

            }

        });

    }, {

        threshold: 0.15

    });

    document.querySelectorAll(".topic-card").forEach(card => {
    observer.observe(card);
});

    /* ======================================================
       Active Navigation Highlight
    ====================================================== */

    const sections = document.querySelectorAll(".topic-card");

    window.addEventListener("scroll", () => {

        let current = "";

        sections.forEach(section => {

            const top = section.offsetTop - 180;

            if (window.scrollY >= top) {

                current = section.id;

            }

        });

        document.querySelectorAll(".topic-nav a").forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + current) {

                link.classList.add("active");

            }

        });

    });

});