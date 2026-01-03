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

  Updates in this version:
  - Adds support for opening hidden panes via URL hash on page load.
    Example: https://joeyoyong.com/#website-system
  - Updates the URL hash when a tab is clicked, so the page is shareable/bookmarkable.

  Analytics-friendly additions (minimal + non-breaking):
  - Dispatches a CustomEvent ("tab:changed") whenever a pane is activated.
    This allows GA4 tracking to hook into tab changes reliably.
  - Listens for "hashchange" in addition to "popstate".
  - On initial load with NO hash, dispatches an event for the default active pane.
*/

document.addEventListener("DOMContentLoaded", () => {
  const triggers = document.querySelectorAll("[data-tab]");
  if (!triggers.length) return;

  /**
   * Helper: Broadcast a tab change event for analytics (and any future features).
   * This does NOT depend on GA existing. It's just a clean signal.
   */
  function emitTabChanged(tabId, reason) {
    if (!tabId) return;

    window.dispatchEvent(
      new CustomEvent("tab:changed", {
        detail: {
          tabId: tabId.replace("#", ""), // store without "#"
          reason: reason || "activatePane",
        },
      })
    );
  }

  /**
   * Activates a tab-pane by id string like "#bio" or "#website-system".
   * This works for visible nav tabs and invisible panes alike.
   */
  function activatePane(targetId, reason) {
    const targetPane = document.querySelector(targetId);
    if (!targetPane || !targetPane.classList.contains("tab-pane")) return;

    // Hide all tab panes
    document
      .querySelectorAll(".tab-pane")
      .forEach((pane) => pane.classList.remove("active"));

    // Remove active state from nav links (if present)
    document
      .querySelectorAll(".nav-link")
      .forEach((nav) => nav.classList.remove("active"));

    // If there is a nav tab that matches this pane, mark it active.
    // (For invisible panes like #website-system, no nav link exists. That is fine.)
    const matchingNav = document.querySelector(
      `.nav-link[data-tab="${targetId}"]`
    );
    if (matchingNav) matchingNav.classList.add("active");

    // Show selected tab pane and scroll up
    targetPane.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // NEW: Emit a reliable "tab changed" signal (used by analytics.js)
    emitTabChanged(targetId, reason || "activatePane");
  }

  // --- Open pane by URL hash on first load (supports invisible tabs) ---
  // If user visits https://joeyoyong.com/#website-system, this will open that pane.
  if (window.location.hash) {
    activatePane(window.location.hash, "initial_hash");
  } else {
    // NEW: If no hash, still emit an event for the default active pane
    // so analytics can record what users land on.
    const activePane = document.querySelector(".tab-pane.active");
    if (activePane && activePane.id) {
      emitTabChanged(`#${activePane.id}`, "initial_default");
    }
  }

  // Existing click behavior, upgraded to also update URL hash
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("data-tab"); // e.g. "#fishing"

      // Update the URL hash for shareable links/bookmarks
      // This also allows browser back/forward to work more predictably.
      if (targetId && targetId.startsWith("#")) {
        history.pushState(null, "", targetId);
      }

      // Activate the pane (works for both visible and invisible panes)
      activatePane(targetId, "click");
    });
  });

  // Support browser back/forward to switch panes
  window.addEventListener("popstate", () => {
    if (window.location.hash) {
      activatePane(window.location.hash, "popstate");
    }
  });

  // Support hash changes directly (covers cases popstate doesn't)
  window.addEventListener("hashchange", () => {
    if (window.location.hash) {
      activatePane(window.location.hash, "hashchange");
    }
  });
});
