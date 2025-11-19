/* 
  contact.js
  ----------------
  Purpose:
  - Handles AJAX submission for the contact form.

  How it's used:
  - Listens to "submit" on #contactForm.
  - Sends JSON to /contact endpoint (Flask).
  - Displays success / error messages in #formResponse div.

  Notes:
  - Safe on pages without a contact form (checks for element first).
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const messageDiv = document.getElementById("formResponse");

  // If this page has no contact form, do nothing.
  if (!form || !messageDiv) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.status === "success") {
        messageDiv.textContent = data.message;
        messageDiv.className = "mt-3 text-success fw-bold text-center fade-out";
        messageDiv.style.display = "block";
        form.reset();

        // Add temporary fade-out effect
        setTimeout(() => messageDiv.classList.add("hide"), 4000);
        setTimeout(() => {
          messageDiv.style.display = "none";
          messageDiv.classList.remove("hide");
        }, 5000);
      } else {
        messageDiv.textContent = "There was an issue submitting the form.";
        messageDiv.className = "mt-3 text-danger fw-bold text-center";
        messageDiv.style.display = "block";
      }
    } catch (err) {
      messageDiv.textContent = "Submission failed. Please try again.";
      messageDiv.className = "mt-3 text-danger fw-bold text-center";
      messageDiv.style.display = "block";
    }
  });
});
