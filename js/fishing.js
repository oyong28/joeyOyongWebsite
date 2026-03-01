/**
 * fishing.js
 * ─────────────────────────────────────────────────────────────────
 * Purpose:
 *   Handles the Fishing Conditions app UI — form submission,
 *   loading states, result rendering, score meter, weather icons,
 *   geolocation, localStorage, and expandable detail view.
 *
 * Architecture:
 *   - FishingUI   : DOM helpers and animation utilities
 *   - FishingAPI  : Fetch logic (POST to Flask /fishing)
 *   - FishingApp  : Orchestrates UI + API, owns all state
 *
 * Flask contract:
 *   POST /fishing  →  returns HTML fragment containing #fishingAppContent
 *   The fragment should include data-* attributes on #fishingAppContent:
 *     data-score      : integer 0–100 (overall fishing score)
 *     data-rating     : "Good" | "Fair" | "Poor"
 *     data-temp       : temperature string  e.g. "72°F"
 *     data-wind       : wind string         e.g. "8 mph NW"
 *     data-condition  : sky condition       e.g. "Partly Cloudy"
 *     data-humidity   : humidity string     e.g. "65%"
 *     data-pressure   : pressure string     e.g. "30.1 inHg"
 *     data-moon       : moon phase string   e.g. "Waxing Gibbous"
 *     data-tip        : optional advice string
 *
 * ─────────────────────────────────────────────────────────────────
 */

/* ============================================================
   SECTION 1 — CONSTANTS & CONFIGURATION
   ============================================================ */

const FISHING_CONFIG = {
  storageKey: "fishingLastLocation", // localStorage key for remembered location
  minInputLength: 2, // minimum chars before submit allowed
  animationDuration: 300, // ms — matches CSS transition duration
};

/**
 * Maps sky condition keywords → Font Awesome icon classes.
 * Used to pick a weather icon for the result card header.
 */
const CONDITION_ICONS = {
  clear: "fa-sun",
  sunny: "fa-sun",
  cloudy: "fa-cloud",
  overcast: "fa-cloud",
  partly: "fa-cloud-sun",
  rain: "fa-cloud-rain",
  rainy: "fa-cloud-rain",
  shower: "fa-cloud-showers-heavy",
  storm: "fa-bolt",
  thunder: "fa-bolt",
  snow: "fa-snowflake",
  fog: "fa-smog",
  windy: "fa-wind",
  default: "fa-water", // fallback: fishing-themed
};

/**
 * Maps rating string → color token (CSS class suffix + ARIA label).
 */
const RATING_META = {
  Good: {
    colorClass: "rating--good",
    emoji: "🟢",
    label: "Good fishing conditions",
  },
  Fair: {
    colorClass: "rating--fair",
    emoji: "🟡",
    label: "Fair fishing conditions",
  },
  Poor: {
    colorClass: "rating--poor",
    emoji: "🔴",
    label: "Poor fishing conditions",
  },
};

/* ============================================================
   SECTION 2 — FishingUI (DOM & animation utilities)
   ============================================================ */

const FishingUI = {
  /**
   * Show the spinner overlay and hide the results area.
   * @param {HTMLElement} resultBox - #fishingResult
   */
  showLoading(resultBox) {
    resultBox.setAttribute("aria-busy", "true");
    resultBox.innerHTML = `
      <div class="fishing-loader" role="status" aria-label="Loading fishing conditions">
        <div class="fishing-spinner">
          <i class="fa-solid fa-fish fishing-spinner__icon" aria-hidden="true"></i>
        </div>
        <p class="fishing-loader__text">Fetching conditions<span class="fishing-loader__dots"></span></p>
      </div>`;
  },

  /**
   * Show an error message with an icon and optional detail.
   * @param {HTMLElement} resultBox
   * @param {string} message - User-facing message
   */
  showError(resultBox, message) {
    resultBox.setAttribute("aria-busy", "false");
    resultBox.innerHTML = `
      <div class="fishing-error" role="alert" aria-live="assertive">
        <i class="fa-solid fa-circle-exclamation fishing-error__icon" aria-hidden="true"></i>
        <p class="fishing-error__message">${this.escapeHTML(message)}</p>
        <p class="fishing-error__hint">Check your location spelling or try a city name.</p>
      </div>`;
  },

  /**
   * Render the full results panel into the resultBox.
   * Pulls structured data from data-* attributes on #fishingAppContent
   * AND renders the raw HTML content from Flask inside the card.
   *
   * @param {HTMLElement} resultBox
   * @param {HTMLElement} newContent  - #fishingAppContent from Flask response
   */
  renderResult(resultBox, newContent) {
    resultBox.setAttribute("aria-busy", "false");

    // ── Pull data attributes from Flask's content element ──
    const score = parseInt(newContent.dataset.score ?? "50", 10);
    const rating = newContent.dataset.rating ?? "Fair";
    const temp = newContent.dataset.temp ?? "—";
    const wind = newContent.dataset.wind ?? "—";
    const condition = newContent.dataset.condition ?? "—";
    const humidity = newContent.dataset.humidity ?? "—";
    const pressure = newContent.dataset.pressure ?? "—";
    const moon = newContent.dataset.moon ?? "—";
    const tip = newContent.dataset.tip ?? "";

    const ratingMeta = RATING_META[rating] ?? RATING_META.Fair;
    const iconClass = this.getConditionIcon(condition);

    // ── Build the result card HTML ──
    const html = `
      <div class="fishing-result fishing-result--animate" id="fishingResultCard">

        <!-- Score header -->
        <div class="fishing-result__header ${ratingMeta.colorClass}">
          <i class="fa-solid ${iconClass} fishing-result__weather-icon" aria-hidden="true"></i>
          <div class="fishing-result__rating-block">
            <span class="fishing-result__rating-label"
                  aria-label="${ratingMeta.label}">
              ${ratingMeta.emoji} ${rating}
            </span>
            <span class="fishing-result__condition">${this.escapeHTML(condition)}</span>
          </div>
        </div>

        <!-- Score meter -->
        <div class="fishing-meter" aria-label="Fishing score: ${score} out of 100">
          <div class="fishing-meter__track" role="progressbar"
               aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100">
            <div class="fishing-meter__fill fishing-meter__fill--animate"
                 style="--target-width: ${score}%;"
                 data-score="${score}">
            </div>
          </div>
          <div class="fishing-meter__labels">
            <span>Poor</span>
            <span class="fishing-meter__score">${score}<small>/100</small></span>
            <span>Excellent</span>
          </div>
        </div>

        <!-- Quick-stats grid (always visible) -->
        <div class="fishing-stats" aria-label="Weather summary">
          ${this.statChip("fa-thermometer-half", "Temp", temp)}
          ${this.statChip("fa-wind", "Wind", wind)}
          ${this.statChip("fa-droplet", "Humidity", humidity)}
          ${this.statChip("fa-moon", "Moon", moon)}
        </div>

        <!-- Expandable detail section -->
        <div class="fishing-expand">
          <button class="fishing-expand__toggle"
                  aria-expanded="false"
                  aria-controls="fishingDetail"
                  id="fishingExpandBtn">
            <i class="fa-solid fa-chevron-down fishing-expand__chevron" aria-hidden="true"></i>
            Full Weather Breakdown
          </button>
          <div class="fishing-expand__content" id="fishingDetail" hidden>
            <div class="fishing-detail-grid">
              ${this.detailRow("fa-gauge-high", "Pressure", pressure)}
              ${this.detailRow("fa-cloud", "Sky", condition)}
              ${this.detailRow("fa-moon", "Moon Phase", moon)}
              ${this.detailRow("fa-wind", "Wind", wind)}
              ${this.detailRow("fa-droplet", "Humidity", humidity)}
              ${this.detailRow("fa-thermometer-half", "Temp", temp)}
            </div>

            <!-- Flask-rendered detail content goes here -->
            <div class="fishing-flask-content">
              ${newContent.innerHTML}
            </div>
          </div>
        </div>

        <!-- Optional fishing tip -->
        ${
          tip
            ? `
        <div class="fishing-tip" role="note" aria-label="Fishing tip">
          <i class="fa-solid fa-lightbulb fishing-tip__icon" aria-hidden="true"></i>
          <p>${this.escapeHTML(tip)}</p>
        </div>`
            : ""
        }

      </div>`;

    resultBox.innerHTML = html;

    // ── Wire up the expand toggle ──
    const btn = resultBox.querySelector("#fishingExpandBtn");
    const detail = resultBox.querySelector("#fishingDetail");
    if (btn && detail) {
      btn.addEventListener("click", () => this.toggleDetail(btn, detail));
    }

    // ── Animate the score meter fill ──
    // rAF ensures the element is painted before we add the width transition
    requestAnimationFrame(() => {
      const fill = resultBox.querySelector(".fishing-meter__fill");
      if (fill) {
        fill.style.width = fill.dataset.score + "%";
      }
    });
  },

  /**
   * Build a small stat chip (icon + label + value).
   */
  statChip(icon, label, value) {
    return `
      <div class="fishing-stat-chip">
        <i class="fa-solid ${icon} fishing-stat-chip__icon" aria-hidden="true"></i>
        <span class="fishing-stat-chip__label">${label}</span>
        <span class="fishing-stat-chip__value">${this.escapeHTML(String(value))}</span>
      </div>`;
  },

  /**
   * Build a detail row for the expandable section.
   */
  detailRow(icon, label, value) {
    return `
      <div class="fishing-detail-row">
        <i class="fa-solid ${icon}" aria-hidden="true"></i>
        <span class="fishing-detail-row__label">${label}</span>
        <span class="fishing-detail-row__value">${this.escapeHTML(String(value))}</span>
      </div>`;
  },

  /**
   * Toggle the expandable detail panel open / closed.
   * Updates ARIA attributes for screen readers.
   */
  toggleDetail(btn, detail) {
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!isExpanded));
    detail.hidden = isExpanded;

    const chevron = btn.querySelector(".fishing-expand__chevron");
    if (chevron) {
      chevron.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
    }
  },

  /**
   * Pick a Font Awesome icon based on condition text (case-insensitive keyword match).
   * @param {string} condition
   * @returns {string} FA icon class e.g. "fa-sun"
   */
  getConditionIcon(condition) {
    const lower = condition.toLowerCase();
    for (const [keyword, icon] of Object.entries(CONDITION_ICONS)) {
      if (lower.includes(keyword)) return icon;
    }
    return CONDITION_ICONS.default;
  },

  /**
   * Escape HTML special characters to prevent XSS when inserting user/API data.
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  },

  /**
   * Inline validation — show/hide error state on the input.
   * @param {HTMLInputElement} input
   * @param {boolean} valid
   */
  setInputValidity(input, valid) {
    const errorEl = document.getElementById("fishingInputError");
    if (valid) {
      input.removeAttribute("aria-invalid");
      input.classList.remove("fishing-input--invalid");
      if (errorEl) errorEl.hidden = true;
    } else {
      input.setAttribute("aria-invalid", "true");
      input.classList.add("fishing-input--invalid");
      if (errorEl) {
        errorEl.textContent =
          "Please enter a city or location name (at least 2 characters).";
        errorEl.hidden = false;
      }
    }
  },
};

/* ============================================================
   SECTION 3 — FishingAPI (network layer)
   ============================================================ */

const FishingAPI = {
  /**
   * POST form data to Flask's /fishing endpoint.
   * Returns the parsed HTML document from the response.
   *
   * @param {FormData} formData
   * @returns {Promise<Document>} Parsed HTML document
   * @throws {Error} on non-2xx responses or network failure
   */
  async submit(formData) {
    const res = await fetch("/fishing", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}. Please try again.`);
    }

    const html = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  },
};

/* ============================================================
   SECTION 4 — FishingApp (orchestrator)
   ============================================================ */

const FishingApp = {
  form: null, // #fishingForm
  input: null, // location text input within the form
  resultBox: null, // #fishingResult

  /**
   * Entry point — called on DOMContentLoaded.
   * Bails out silently if the fishing widget isn't on this page.
   */
  init() {
    this.form = document.getElementById("fishingForm");
    this.resultBox = document.getElementById("fishingResult");

    // Guard: fishing widget may not exist on every page
    if (!this.form || !this.resultBox) return;

    this.input = this.form.querySelector("input[name='location']");

    this.bindEvents();
    this.restoreLastLocation();
    this.initGeolocation();
  },

  /**
   * Attach all event listeners.
   */
  bindEvents() {
    // Form submit
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Inline validation — only fires after first interaction (blur)
    if (this.input) {
      this.input.addEventListener("blur", () => this.validateInput(false));
      this.input.addEventListener("input", () => {
        // Clear invalid state as soon as user starts typing again
        if (this.input.classList.contains("fishing-input--invalid")) {
          FishingUI.setInputValidity(this.input, true);
        }
      });
    }
  },

  /**
   * Handle form submit: validate → show loader → fetch → render.
   * @param {Event} e
   */
  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateInput(true)) return; // abort if invalid

    const formData = new FormData(this.form);
    const location = formData.get("location")?.trim() ?? "";

    // Save to localStorage so it's remembered next visit
    this.saveLastLocation(location);

    FishingUI.showLoading(this.resultBox);

    try {
      const doc = await FishingAPI.submit(formData);
      const newContent = doc.querySelector("#fishingAppContent");

      if (!newContent) {
        throw new Error("Unexpected response from server. Please try again.");
      }

      FishingUI.renderResult(this.resultBox, newContent);
    } catch (err) {
      FishingUI.showError(
        this.resultBox,
        err.message ?? "Something went wrong.",
      );
    }
  },

  /**
   * Validate the location input. Returns true if valid.
   * @param {boolean} showError - if true, always show error on failure
   *                              if false, only show when field was touched
   * @returns {boolean}
   */
  validateInput(showError) {
    if (!this.input) return true;

    const value = this.input.value.trim();
    const valid = value.length >= FISHING_CONFIG.minInputLength;

    if (!valid && showError) {
      FishingUI.setInputValidity(this.input, false);
    } else if (valid) {
      FishingUI.setInputValidity(this.input, true);
    }

    return valid;
  },

  /**
   * Save last searched location to localStorage.
   * @param {string} location
   */
  saveLastLocation(location) {
    try {
      localStorage.setItem(FISHING_CONFIG.storageKey, location);
    } catch (_) {
      // localStorage may be unavailable in private browsing — fail silently
    }
  },

  /**
   * Restore last searched location from localStorage into the input.
   */
  restoreLastLocation() {
    if (!this.input) return;
    try {
      const saved = localStorage.getItem(FISHING_CONFIG.storageKey);
      if (saved) {
        this.input.value = saved;
        this.input.setAttribute(
          "aria-label",
          `Location (last searched: ${saved})`,
        );
      }
    } catch (_) {
      // fail silently
    }
  },

  /**
   * Add a "Use my location" button if the Geolocation API is available.
   * On click, reverse-geocodes coords to a city name using the free
   * nominatim.openstreetmap.org API (no key required).
   */
  initGeolocation() {
    if (!navigator.geolocation || !this.input) return;

    // Find or build the geo button container
    const geoBtn = document.getElementById("fishingGeoBtn");
    if (!geoBtn) return; // button must be added to HTML markup (see README below)

    geoBtn.hidden = false; // reveal the button now that we know geo is supported
    geoBtn.addEventListener("click", () => this.useGeolocation());
  },

  /**
   * Request browser geolocation, reverse-geocode to city, fill input.
   */
  useGeolocation() {
    const geoBtn = document.getElementById("fishingGeoBtn");
    if (geoBtn) {
      geoBtn.disabled = true;
      geoBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Locating…';
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Nominatim reverse-geocode (free, no API key)
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
          const resp = await fetch(url, {
            headers: { "Accept-Language": "en" },
          });
          const data = await resp.json();

          // Prefer city → town → county as the location name
          const city =
            data.address?.city ??
            data.address?.town ??
            data.address?.county ??
            `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

          if (this.input) {
            this.input.value = city;
            FishingUI.setInputValidity(this.input, true);
          }
        } catch (_) {
          // reverse-geocode failed — coordinates are still useful
          const { latitude, longitude } = pos.coords;
          if (this.input)
            this.input.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } finally {
          if (geoBtn) {
            geoBtn.disabled = false;
            geoBtn.innerHTML =
              '<i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i> Use My Location';
          }
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        if (geoBtn) {
          geoBtn.disabled = false;
          geoBtn.innerHTML =
            '<i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i> Use My Location';
        }
      },
      { timeout: 8000 },
    );
  },
};

/* ============================================================
   SECTION 5 — BOOT
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => FishingApp.init());
