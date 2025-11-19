/* 
  dark-mode.js
  ----------------
  Purpose:
  - Toggles dark mode on and off for the site.

  How it's used:
  - Click on #darkModeToggle button.
  - Swaps classes on <body> and the #darkModeIcon.

  Requirements:
  - #darkModeToggle button element.
  - #darkModeIcon inside that button (Font Awesome icon).
*/

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkModeToggle");
  const icon = document.getElementById("darkModeIcon");

  // If toggle or icon doesn't exist on the page, do nothing
  if (!toggle || !icon) return;

  toggle.addEventListener("click", () => {
    // Toggle dark mode class on body
    document.body.classList.toggle("dark-mode");

    // Swap between sun and moon icons
    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
  });
});
