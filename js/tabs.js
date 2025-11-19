/* 
  tabs.js
  ----------------
  Purpose:
  - Handles tab navigation for your tools (Ohm’s Law, Wire Color, Fishing, etc).

  How it's used:
  - Any element with [data-tab="#paneId"] will switch the visible .tab-pane.
  - Works with buttons and nav links.

  Requirements:
  - .tab-pane elements exist in DOM.
  - Optional: .nav-link elements for active state styling.
*/

document.addEventListener("DOMContentLoaded", () => {
  const triggers = document.querySelectorAll("[data-tab]");
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("data-tab"); // e.g. "#fishing"
      const targetPane = document.querySelector(targetId); // the tab-pane to activate

      // Hide all tab panes
      document
        .querySelectorAll(".tab-pane")
        .forEach((pane) => pane.classList.remove("active"));

      // If nav link was clicked, update nav styling
      if (this.classList.contains("nav-link")) {
        document
          .querySelectorAll(".nav-link")
          .forEach((nav) => nav.classList.remove("active"));
        this.classList.add("active");
      }

      // Show selected tab pane and scroll up
      if (targetPane) {
        targetPane.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
});
