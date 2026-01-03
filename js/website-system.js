/* 
  website-system.js
  -----------------
  Purpose:
  - Improves conversion flow for the Artist Website System page.

  What it does:
  - Any link with class "contact-cta" will:
    1) Switch to the Contact tab
    2) Auto-fill the subject line for clarity
*/

document.addEventListener("DOMContentLoaded", () => {
  const subjectInput = document.querySelector('input[name="subject"]');
  const contactLinks = document.querySelectorAll(".contact-cta");

  if (!subjectInput || !contactLinks.length) return;

  contactLinks.forEach((link) => {
    link.addEventListener("click", () => {
      subjectInput.value = "Artist Website System Inquiry";
    });
  });
});
