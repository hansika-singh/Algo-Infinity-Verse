const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {

        item.classList.toggle("active");

    });
});

const searchInput = document.getElementById("faqSearch");

searchInput.addEventListener("input", () => {

    const value = searchInput.value.toLowerCase();

    faqItems.forEach(item => {

        const text = item.textContent.toLowerCase();

        if (text.includes(value)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }

    });

});