/**
 * analytics.js
 * ---------------------------------------
 * Purpose:
 * GA4 tracking for:
 * 1) Main portfolio site (tab/hash navigation like /#projects)
 * 2) Standalone product page at /artist-website-system/
 *
 * What it sends to GA4:
 * - page_view (manual): on initial load + on hash changes (main site)
 * - tab_view (custom): when a tab becomes active (main site only)
 * - product_* events: downloads, screenshot opens, CTA clicks (product page only)
 *
 * Safety:
 * - Do NOT send PII (names, emails, message content) to GA.
 *
 * Notes:
 * - Works even if loaded on both pages.
 * - On the standalone product page, we do NOT use hash routing, so we track:
 *   - page_view on load
 *   - product interactions on click
 */

(function () {
  // -----------------------------
  // Helpers
  // -----------------------------
  function hasGtag() {
    return typeof window.gtag === "function";
  }

  function isProductPage() {
    // Covers: /artist-website-system and /artist-website-system/
    return window.location.pathname.startsWith("/artist-website-system");
  }

  function virtualPath() {
    // For main tabbed site we include hash in path.
    // For product page, hash is usually empty but harmless.
    return window.location.pathname + window.location.hash;
  }

  function trackPageView(reason) {
    if (!hasGtag()) return;

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: virtualPath(),
      navigation_reason: reason || "unknown",
    });
  }

  function trackTabView(tabId, reason) {
    if (!hasGtag()) return;

    window.gtag("event", "tab_view", {
      tab_id: tabId || "(none)",
      page_path: virtualPath(),
      navigation_reason: reason || "unknown",
    });
  }

  function getActiveTabId() {
    const activePane = document.querySelector(".tab-pane.active");
    return activePane ? activePane.id : null;
  }

  function getHashTabId() {
    const hash = window.location.hash || "";
    if (!hash) return null;
    return hash.replace("#", "");
  }

  // -----------------------------
  // Initial load tracking
  // -----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // Always send one page_view on load (both pages)
    trackPageView("initial_load");

    // Only the main tabbed site uses tabs/hashes for "tab views"
    if (!isProductPage()) {
      const tabId = getHashTabId() || getActiveTabId();
      if (tabId) trackTabView(tabId, "initial_load");
    }
  });

  // -----------------------------
  // Main site: track hash changes + custom tab events
  // -----------------------------
  // If someone navigates hash-based tabs manually (or via back/forward)
  window.addEventListener("hashchange", () => {
    if (isProductPage()) return;

    const tabId = getHashTabId() || getActiveTabId();
    trackPageView("hashchange");
    if (tabId) trackTabView(tabId, "hashchange");
  });

  // If your tabs.js dispatches tab:changed, we also listen (main site only)
  window.addEventListener("tab:changed", (e) => {
    if (isProductPage()) return;

    // tabs.js may send: { tab_id, target_hash, reason }
    const tabId =
      e.detail?.tab_id ||
      e.detail?.tabId ||
      (e.detail?.target_hash ? e.detail.target_hash.replace("#", "") : null) ||
      getHashTabId() ||
      getActiveTabId();

    const reason = e.detail?.reason || "tab:changed";

    trackPageView(reason);
    if (tabId) trackTabView(tabId, reason);
  });

  // -----------------------------
  // Product page: interaction tracking
  // -----------------------------
  document.addEventListener("click", (e) => {
    if (!isProductPage()) return;

    // A) PDF download clicks (OneDrive)
    const link = e.target.closest("a");
    if (link) {
      const href = link.getAttribute("href") || "";
      const text = (link.textContent || "").trim();

      if (href.includes("1drv.ms/")) {
        if (!hasGtag()) return;
        window.gtag("event", "product_download_click", {
          link_url: href,
          link_text: text,
          page_path: window.location.pathname,
        });
        return;
      }
    }

    // B) Screenshot modal opens (thumbnail click)
    const img = e.target.closest("img.screenshot-thumb");
    if (img) {
      const full = img.getAttribute("data-full") || "";
      const caption = img.getAttribute("data-caption") || "";

      if (!hasGtag()) return;
      window.gtag("event", "product_screenshot_open", {
        image_full: full,
        image_caption: caption,
        page_path: window.location.pathname,
      });
      return;
    }

    // C) CTA clicks to Contact (these are links back to /#contact)
    const contactCta = e.target.closest('a.contact-cta[href="/#contact"]');
    if (contactCta) {
      if (!hasGtag()) return;
      window.gtag("event", "product_cta_contact_click", {
        page_path: window.location.pathname,
      });
      return;
    }

    // D) Video click: clicking inside an iframe won't reliably bubble.
    // If you want real YouTube engagement tracking, we can add the YouTube IFrame API later.
  });
})();
