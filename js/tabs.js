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

  Updates in this version (minimal, focused):
  - Supports opening a pane via URL hash on page load (ex: /#website-system).
  - Updates the URL hash when a tab is clicked (shareable/bookmarkable).
  - Supports browser back/forward navigation (popstate).
  - Dispatches a custom event "tab:changed" so analytics.js can track tab views reliably.
*/

document.addEventListener("DOMContentLoaded", () => {
  const triggers = document.querySelectorAll("[data-tab]");
  if (!triggers.length) return;

  /**
   * Activates a tab-pane by id string like "#bio" or "#website-system".
   * This works for visible nav tabs and invisible panes alike.
   *
   * Also dispatches a custom event:
   * window.dispatchEvent(new CustomEvent("tab:changed", { detail: {...} }))
   * so other scripts (analytics.js) can track tab views.
   */
  function activatePane(targetId, reason) {
    if (!targetId || !targetId.startsWith("#")) return;

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

    // Emit a reliable signal for analytics (and anything else)
    // detail.tab_id will be "website-system" for "#website-system"
    window.dispatchEvent(
      new CustomEvent("tab:changed", {
        detail: {
          tab_id: targetId.replace("#", ""),
          target_hash: targetId,
          reason: reason || "unknown",
        },
      })
    );
  }

  // ---  Open pane by URL hash on first load (supports invisible tabs) ---
  // Example: https://joeyoyong.com/#website-system
  if (window.location.hash) {
    activatePane(window.location.hash, "initial_load");
  } else {
    // If no hash, still emit for the default active pane so analytics can record it
    const activePane = document.querySelector(".tab-pane.active");
    if (activePane && activePane.id) {
      window.dispatchEvent(
        new CustomEvent("tab:changed", {
          detail: {
            tab_id: activePane.id,
            target_hash: `#${activePane.id}`,
            reason: "initial_load_default",
          },
        })
      );
    }
  }

  // Existing click behavior, upgraded to also update URL hash + support analytics hook
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("data-tab"); // e.g. "#fishing"
      if (!targetId || !targetId.startsWith("#")) return;

      // ---  Update the URL hash for shareable links/bookmarks ---
      // This also makes browser back/forward work.
      history.pushState(null, "", targetId);

      // Activate the pane (works for both visible and invisible panes)
      activatePane(targetId, "click");
    });
  });

  // --- Support browser back/forward to switch panes ---
  window.addEventListener("popstate", () => {
    if (window.location.hash) {
      activatePane(window.location.hash, "popstate");
    }
  });
});
