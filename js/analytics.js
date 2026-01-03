/**
 * analytics.js
 * ---------------------------------------
 * Purpose:
 * Track "tab views" and product-page interactions in GA4 on a single-page
 * tab site (hash-based navigation like /#website-system).
 *
 * What it sends to GA4:
 * - page_view (manual): whenever a tab becomes active
 * - tab_view (custom): includes tab_id (example: "website-system")
 * - product_* events: downloads, screenshot opens, video clicks, CTA to contact
 *
 * Safety:
 * - Do NOT send PII (names, emails, message content) to GA.
 */

(function () {
  function hasGtag() {
    return typeof window.gtag === "function";
  }

  function virtualPath() {
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

  // Listen for tab changes from tabs.js
  window.addEventListener("tab:changed", (e) => {
    // tabs.js currently sends: { tab_id, target_hash, reason }
    // Support both styles just in case you refactor later.
    const tabId =
      e.detail?.tab_id ||
      e.detail?.tabId ||
      (e.detail?.target_hash ? e.detail.target_hash.replace("#", "") : null) ||
      getActiveTabId();

    const reason = e.detail?.reason || "tab:changed";

    trackPageView(reason);
    trackTabView(tabId, reason);
  });

  // Track product interactions only while product tab is active
  document.addEventListener("click", (e) => {
    const activeTab = getActiveTabId();
    const onProductTab = activeTab === "website-system";
    if (!onProductTab) return;

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
          tab_id: "website-system",
        });
        return;
      }
    }

    // B) Screenshot modal opens
    const img = e.target.closest("img.screenshot-thumb");
    if (img) {
      const full = img.getAttribute("data-full") || "";
      const caption = img.getAttribute("data-caption") || "";

      if (!hasGtag()) return;
      window.gtag("event", "product_screenshot_open", {
        image_full: full,
        image_caption: caption,
        tab_id: "website-system",
      });
      return;
    }

    // C) Video click (basic signal)
    const iframe = e.target.closest("iframe");
    if (iframe) {
      const src = iframe.getAttribute("src") || "";
      if (src.includes("youtube.com/embed/")) {
        if (!hasGtag()) return;
        window.gtag("event", "product_video_click", {
          video_src: src,
          tab_id: "website-system",
        });
      }
      return;
    }

    // D) CTA: "Contact Joey" button
    const contactCta = e.target.closest(
      'a[href="#contact"][data-tab="#contact"]'
    );
    if (contactCta) {
      if (!hasGtag()) return;
      window.gtag("event", "product_cta_contact_click", {
        tab_id: "website-system",
      });
    }
  });
})();

// Initial load: if landing directly on a hash, send one virtual page view
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (!hash) return;

  const tabId = hash.replace("#", "");
  trackPageView("initial_load");
  trackTabView(tabId, "initial_load");
});
