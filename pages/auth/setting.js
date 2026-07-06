// Show / Hide Password

function togglePassword(id) {

    const passwordField = document.getElementById(id);

    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }

}

document.querySelectorAll(".eye").forEach((eye) => {
    eye.addEventListener("click", function () {
        togglePassword(this.dataset.target);
    });
});

// Optional Save Changes Button

const saveBtn = document.querySelector(".btn");

if (saveBtn) {
    saveBtn.addEventListener("click", function () {
        console.warn("Alert:", "Changes saved successfully!");
    });
}

// Optional Update Password Button

const buttons = document.querySelectorAll(".btn");

if (buttons.length > 1) {
    buttons[1].addEventListener("click", function () {

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (
            currentPassword === "" ||
            newPassword === "" ||
            confirmPassword === ""
        ) {
            console.warn("Alert:", "Please fill all password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            console.warn("Alert:", "Passwords do not match.");
            return;
        }

        console.warn("Alert:", "Password updated successfully!");
    });
}

// Notification Toggle Status

const toggles = document.querySelectorAll(
    '.switch input[type="checkbox"]'
);

toggles.forEach(toggle => {

    toggle.addEventListener("change", function () {

        console.log(
            this.checked ? "Enabled" : "Disabled"
        );

    });

});

// Delete Account Button
const deleteBtn = document.getElementById("deleteAccountBtn");

if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
        const confirmDelete = false /* confirm removed */;

        if (confirmDelete) {
            console.warn("Alert:", "Account deleted successfully (frontend only).");
            
        }
    });
}

    