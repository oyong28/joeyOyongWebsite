/* 
  screenshot-modal.js
  -------------------
  Purpose:
  - When you click a screenshot thumbnail on the product page, open a Bootstrap 5 modal
    and display the full-size image + a caption.

  Requirements (HTML):
  1) You must have ONE modal in the page with:
     - id="screenshotModal"
     - img id="screenshotModalImg"
     - caption id="screenshotModalCaption"
     - title id="screenshotModalLabel"

  2) Each clickable screenshot <img> should include:
     class="screenshot-thumb"
     data-bs-toggle="modal"
     data-bs-target="#screenshotModal"
     data-full="images/demo-home.png"        (optional, falls back to src)
     data-caption="Some caption text here"   (optional)
     alt="Descriptive title"                 (used for modal title)

  Notes:
  - Bootstrap opens the modal automatically because of the data-bs-* attributes.
  - This script runs at the moment Bootstrap is about to show the modal
    and fills in the modal content based on the clicked image.

  Common failure causes:
  - This file is not being loaded (check <script src="js/screenshot-modal.js" defer></script>)
  - Wrong IDs in the modal HTML
  - Wrong file name/path (Linux is case-sensitive)
*/

document.addEventListener("DOMContentLoaded", () => {
  // 1) Grab the modal element (the container Bootstrap will open/close)
  const modalEl = document.getElementById("screenshotModal");

  // If the modal isn't on this page, exit safely (prevents errors on other pages)
  if (!modalEl) return;

  // 2) Grab the elements INSIDE the modal that we want to update
  const modalImg = document.getElementById("screenshotModalImg");
  const modalCaption = document.getElementById("screenshotModalCaption");
  const modalTitle = document.getElementById("screenshotModalLabel");

  // If any of these are missing, exit safely (your IDs must match the HTML)
  if (!modalImg || !modalCaption || !modalTitle) return;

  /*
    3) Bootstrap fires a custom event right before the modal opens:
       "show.bs.modal"

       The key detail:
       - event.relatedTarget is the element that triggered the modal (the clicked <img>).
  */
  modalEl.addEventListener("show.bs.modal", (event) => {
    const triggerEl = event.relatedTarget;

    // If we can't detect what triggered the modal, do nothing.
    if (!triggerEl) return;

    // 4) Read values from the clicked thumbnail
    // Use data-full for the modal image if provided, otherwise fall back to the img's src.
    const fullSrc =
      triggerEl.getAttribute("data-full") ||
      triggerEl.getAttribute("src") ||
      "";

    // Caption text is optional (defaults to empty string)
    const caption = triggerEl.getAttribute("data-caption") || "";

    // Title text: use the image alt text (good for accessibility)
    const altText = triggerEl.getAttribute("alt") || "Screenshot";

    // 5) Update modal content
    modalImg.src = fullSrc;
    modalImg.alt = altText;

    modalCaption.textContent = caption;
    modalTitle.textContent = altText;
  });

  /*
    6) Optional cleanup when modal closes:
       This prevents old images/captions from flashing if you reopen quickly
       or if you later add more complex behavior.
  */
  modalEl.addEventListener("hidden.bs.modal", () => {
    modalImg.src = "";
    modalImg.alt = "";
    modalCaption.textContent = "";
    modalTitle.textContent = "Screenshot";
  });
});
