(() => {
  "use strict";

  // ==========================================================================
  // Constants & Configuration
  // ==========================================================================
  const THEME_STORAGE_KEY = "trendy-karat-ambience";
  const TROY_OUNCE_GRAMS = 31.1034768; // Exact international troy ounce in grams
  const INDIA_DUTY_FACTOR = 1.15; // 15% Effective Import Duty (10% BCD + 5% AIDC, effective May 2026)
  const REFRESH_COOLDOWN_MS = 5000;

  // Retail margin added onto pure (999) landed base rates
  const RETAIL_MARGIN_PER_GRAM = {
    gold: 300,     // +₹3,000 per 10g on 24K (999)
    silver: 10,     // +₹10,000 per 1kg on 999 Fine Silver
    platinum: 10    // +₹10,000 per 1kg on 999 Pure Platinum
  };

  // Official BIS / IBJA Hallmark Fineness Ratios (derived from 999 pure base)
  const PURITY_FINENESS = {
    gold: {
      "24K": 1.000, // 999 Pure Bullion
      "22K": 0.916, // BIS 916 Hallmark (91.6%)
      "20K": 0.833, // BIS 833 Hallmark (83.3%)
      "18K": 0.750, // BIS 750 Hallmark (75.0%)
      "14K": 0.585  // BIS 585 Hallmark (58.5%)
    },
    silver: {
      "999": 1.000, // 999 Fine Silver
      "925": 0.925, // BIS 925 Sterling Silver
      "800": 0.800  // BIS 800 Standard Silver
    },
    platinum: {
      "999": 1.000, // 999 Pure Platinum
      "950": 0.950, // Pt950 Fine Jewellery
      "900": 0.900  // Pt900 Durable Alloy
    }
  };

  // Fallback benchmark spot prices (INR per troy ounce) if API is unreachable
  const FALLBACK_SPOT_INR = {
    XAU: 365000,
    XAG: 5100,
    XPT: 115000
  };

  const AMBIENCE_THEMES = [
    {
      key: "ivory",
      bg: "#faf8f5",
      text: "#18181b",
      bsTheme: "light",
      label: "Ambience: Ivory Light"
    },
    {
      key: "champagne",
      bg: "#f5ecdc",
      text: "#2c2219",
      bsTheme: "light",
      label: "Ambience: Champagne Warm"
    },
    {
      key: "velvet",
      bg: "#121215",
      text: "#f4f1ea",
      bsTheme: "dark",
      label: "Ambience: Royal Velvet"
    }
  ];

  const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  const inrDecimalFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Curated 9-piece Gen Z everyday luxury catalog
  const CATALOG_ITEMS = [
    {
      id: "tk-g22-chain",
      name: "Cuban Micro Link Chain",
      metal: "gold",
      purityKey: "22K",
      purityLabel: "Gold 22K (916)",
      weightGrams: 8.5,
      makingPercent: 11,
      svgType: "chain"
    },
    {
      id: "tk-g20-signet",
      name: "Hex Facet Signet Ring",
      metal: "gold",
      purityKey: "20K",
      purityLabel: "Gold 20K (833)",
      weightGrams: 5.2,
      makingPercent: 12,
      svgType: "ring"
    },
    {
      id: "tk-g18-huggies",
      name: "Everyday Chunky Huggies",
      metal: "gold",
      purityKey: "18K",
      purityLabel: "Gold 18K (750)",
      weightGrams: 3.4,
      makingPercent: 13,
      svgType: "hoop"
    },
    {
      id: "tk-g14-pendant",
      name: "Minimal Bar Pendant",
      metal: "gold",
      purityKey: "14K",
      purityLabel: "Gold 14K (585)",
      weightGrams: 2.6,
      makingPercent: 14,
      svgType: "pendant"
    },
    {
      id: "tk-s999-cuff",
      name: "Architectural Open Cuff",
      metal: "silver",
      purityKey: "999",
      purityLabel: "Silver 999 Fine",
      weightGrams: 24.0,
      makingPercent: 16,
      svgType: "cuff"
    },
    {
      id: "tk-s925-ring",
      name: "Stackable Dome Band",
      metal: "silver",
      purityKey: "925",
      purityLabel: "Silver 925 Sterling",
      weightGrams: 9.5,
      makingPercent: 18,
      svgType: "ring"
    },
    {
      id: "tk-s925-chain",
      name: "Box Link Street Chain",
      metal: "silver",
      purityKey: "925",
      purityLabel: "Silver 925 Sterling",
      weightGrams: 18.0,
      makingPercent: 15,
      svgType: "chain"
    },
    {
      id: "tk-p950-band",
      name: "Brushed Matte Couple Band",
      metal: "platinum",
      purityKey: "950",
      purityLabel: "Platinum 950 (Pt950)",
      weightGrams: 6.0,
      makingPercent: 14,
      svgType: "ring"
    },
    {
      id: "tk-p900-pendant",
      name: "Geometric Prism Tag",
      metal: "platinum",
      purityKey: "900",
      purityLabel: "Platinum 900 (Pt900)",
      weightGrams: 4.5,
      makingPercent: 15,
      svgType: "pendant"
    }
  ];

  // Application State
  let currentThemeIndex = 0;
  let activeMetalFilter = "all";
  let activeSortOrder = "price-asc";
  let metalRates = null;
  let activeQuoteText = "";
  let isRefreshOnCooldown = false;

  // Cached DOM Elements
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const rateStatusBadge = document.getElementById("rateStatusBadge");
  const rateTimestamp = document.getElementById("rateTimestamp");
  const refreshRatesBtn = document.getElementById("refreshRatesBtn");
  const goldRatesGrid = document.getElementById("goldRatesGrid");
  const silverRatesGrid = document.getElementById("silverRatesGrid");
  const platinumRatesGrid = document.getElementById("platinumRatesGrid");

  const filterButtons = document.querySelectorAll("[data-metal-filter]");
  const catalogSort = document.getElementById("catalogSort");
  const catalogGrid = document.getElementById("catalogGrid");

  // Modal Elements
  const priceBreakdownModalEl = document.getElementById("priceBreakdownModal");
  const modalItemName = document.getElementById("modalItemName");
  const modalItemMeta = document.getElementById("modalItemMeta");
  const modalItemWeight = document.getElementById("modalItemWeight");
  const modalRatePerGram = document.getElementById("modalRatePerGram");
  const modalMetalValue = document.getElementById("modalMetalValue");
  const modalMakingLabel = document.getElementById("modalMakingLabel");
  const modalMakingCharges = document.getElementById("modalMakingCharges");
  const modalGstAmount = document.getElementById("modalGstAmount");
  const modalFinalPrice = document.getElementById("modalFinalPrice");
  const modalCopyQuoteBtn = document.getElementById("modalCopyQuoteBtn");

  // Booking Form Elements
  const bookingForm = document.getElementById("bookingForm");
  const customerName = document.getElementById("customerName");
  const customerEmail = document.getElementById("customerEmail");
  const customerPhone = document.getElementById("customerPhone");
  const metalPreference = document.getElementById("metalPreference");
  const visitDate = document.getElementById("visitDate");
  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const phoneError = document.getElementById("phoneError");
  const metalError = document.getElementById("metalError");
  const dateError = document.getElementById("dateError");
  const formSuccessBanner = document.getElementById("formSuccessBanner");

  // ==========================================================================
  // Utility Helpers
  // ==========================================================================
  function formatINR(amount) {
    return inrWholeFormatter.format(Math.round(amount));
  }

  function formatINRPaise(amount) {
    return inrDecimalFormatter.format(amount);
  }

  function roundToPaise(amount) {
    return Math.round(amount * 100) / 100;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getTodayLocalYYYYMMDD() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getMetalAccentColor(metal) {
    if (metal === "gold") return "#c89b3c";
    if (metal === "silver") return "#94a3b8";
    return "#cbd5e1";
  }

  function buildProductSvg(type, metal) {
    const stroke = getMetalAccentColor(metal);
    const highlight = metal === "gold" ? "#f5deb3" : "#f8fafc";

    if (type === "ring") {
      return `
        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="60" cy="66" r="32" stroke="${stroke}" stroke-width="9"/>
          <circle cx="60" cy="66" r="24" stroke="${highlight}" stroke-width="1.5" opacity="0.7"/>
          <polygon points="60,16 74,30 60,44 46,30" fill="${highlight}" stroke="${stroke}" stroke-width="2.5"/>
        </svg>
      `;
    }

    if (type === "chain") {
      return `
        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <path d="M24 22 C24 78, 96 78, 96 22" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>
          <path d="M32 22 C32 68, 88 68, 88 22" stroke="${highlight}" stroke-width="2" stroke-dasharray="5 5"/>
          <rect x="52" y="68" width="16" height="24" rx="4" fill="${stroke}" stroke="${highlight}" stroke-width="2"/>
        </svg>
      `;
    }

    if (type === "hoop") {
      return `
        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <circle cx="44" cy="60" r="22" stroke="${stroke}" stroke-width="8"/>
          <circle cx="76" cy="60" r="22" stroke="${stroke}" stroke-width="8"/>
          <circle cx="44" cy="60" r="15" stroke="${highlight}" stroke-width="1.5" opacity="0.7"/>
          <circle cx="76" cy="60" r="15" stroke="${highlight}" stroke-width="1.5" opacity="0.7"/>
        </svg>
      `;
    }

    if (type === "cuff") {
      return `
        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <path d="M34 84 A36 36 0 1 1 86 84" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
          <path d="M40 78 A28 28 0 1 1 80 78" stroke="${highlight}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        </svg>
      `;
    }

    // Default: pendant
    return `
      <svg width="110" height="110" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <path d="M36 16 L60 50 L84 16" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
        <polygon points="60,46 78,72 60,100 42,72" fill="${stroke}" fill-opacity="0.22" stroke="${stroke}" stroke-width="4"/>
        <line x1="60" y1="46" x2="60" y2="100" stroke="${highlight}" stroke-width="2"/>
      </svg>
    `;
  }

  // ==========================================================================
  // 1. Interactive Store Ambience Switcher
  // ==========================================================================
  function applyTheme(index) {
    const theme = AMBIENCE_THEMES[index] || AMBIENCE_THEMES[0];
    currentThemeIndex = AMBIENCE_THEMES.indexOf(theme);

    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    document.body.setAttribute("data-theme", theme.key);
    document.documentElement.setAttribute("data-bs-theme", theme.bsTheme);

    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme.label;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.key);
    } catch {
      // Ignore storage restrictions
    }
  }

  function cycleAmbienceMode() {
    const nextIndex = (currentThemeIndex + 1) % AMBIENCE_THEMES.length;
    applyTheme(nextIndex);
  }

  function restoreSavedTheme() {
    let savedKey = "ivory";
    try {
      savedKey = localStorage.getItem(THEME_STORAGE_KEY) || "ivory";
    } catch {
      savedKey = "ivory";
    }

    const foundIdx = AMBIENCE_THEMES.findIndex((t) => t.key === savedKey);
    applyTheme(foundIdx >= 0 ? foundIdx : 0);
  }

  // ==========================================================================
  // 2. Live Precious Metals API, Cooldown & Jeweller-Standard Purity Engine
  // ==========================================================================
  function buildWholeRupeePurity(basePer1g, fineness, label, tag) {
    // Fix per-1g rate first in whole rupees, then scale cleanly to 10g (1g × 10 = 10g)
    const per1g = Math.round(basePer1g * fineness);
    return {
      label,
      tag,
      per1g,
      per10g: per1g * 10
    };
  }

  function buildSilverPurity(basePer1g, fineness, label, tag) {
    // Keep exact paise (2 decimals) on per-1g so 1g × 10 = 10g and 1g × 1000 = 1kg exactly
    const per1g = roundToPaise(basePer1g * fineness);
    return {
      label,
      tag,
      per1g,
      per10g: roundToPaise(per1g * 10),
      per1kg: Math.round(per1g * 1000)
    };
  }

  function calculateAllMetalRates(spotXauInr, spotXagInr, spotXptInr) {
    // 1. Gold: Fix 24K (999) per-1g rate first (includes 15% duty + ₹200/g = ₹2,000/10g margin)
    const gold24kPer1g = Math.round(
      ((spotXauInr / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + RETAIL_MARGIN_PER_GRAM.gold
    );

    const gold = {
      "24K": buildWholeRupeePurity(gold24kPer1g, PURITY_FINENESS.gold["24K"], "24K (999)", "Pure Bullion"),
      "22K": buildWholeRupeePurity(gold24kPer1g, PURITY_FINENESS.gold["22K"], "22K (916)", "BIS Hallmark"),
      "20K": buildWholeRupeePurity(gold24kPer1g, PURITY_FINENESS.gold["20K"], "20K (833)", "Everyday Heavy"),
      "18K": buildWholeRupeePurity(gold24kPer1g, PURITY_FINENESS.gold["18K"], "18K (750)", "Modern Fine"),
      "14K": buildWholeRupeePurity(gold24kPer1g, PURITY_FINENESS.gold["14K"], "14K (585)", "Daily Wear")
    };

    // 2. Silver: Fix 999 Fine per-1g rate to exact paise (includes 15% duty + ₹5/g = ₹5,000/1kg margin)
    const silver999Per1g = roundToPaise(
      ((spotXagInr / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + RETAIL_MARGIN_PER_GRAM.silver
    );

    const silver = {
      "999": buildSilverPurity(silver999Per1g, PURITY_FINENESS.silver["999"], "999 Fine", "Pure Silver"),
      "925": buildSilverPurity(silver999Per1g, PURITY_FINENESS.silver["925"], "925 Sterling", "Jewellery Grade"),
      "800": buildSilverPurity(silver999Per1g, PURITY_FINENESS.silver["800"], "800 Standard", "Classic Alloy")
    };

    // 3. Platinum: Fix 999 Pure per-1g rate first (includes 15% duty + ₹5/g = ₹5,000/1kg margin)
    const plat999Per1g = Math.round(
      ((spotXptInr / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + RETAIL_MARGIN_PER_GRAM.platinum
    );

    const platinum = {
      "999": buildWholeRupeePurity(plat999Per1g, PURITY_FINENESS.platinum["999"], "999 Pure", "Bullion Grade"),
      "950": buildWholeRupeePurity(plat999Per1g, PURITY_FINENESS.platinum["950"], "950 (Pt950)", "Fine Jewellery"),
      "900": buildWholeRupeePurity(plat999Per1g, PURITY_FINENESS.platinum["900"], "900 (Pt900)", "Durable Alloy")
    };

    return { gold, silver, platinum };
  }

  function renderRateBoard(rates) {
    if (goldRatesGrid) {
      goldRatesGrid.innerHTML = Object.values(rates.gold)
        .map(
          (entry) => `
            <div class="col-12 col-sm-6 col-lg-4">
              <div class="rate-card">
                <div class="rate-purity">${escapeHtml(entry.label)}</div>
                <span class="rate-tag">${escapeHtml(entry.tag)}</span>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 1g</span>
                  <span class="rate-value">${formatINR(entry.per1g)}</span>
                </div>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 10g</span>
                  <span class="rate-value">${formatINR(entry.per10g)}</span>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    }

    if (silverRatesGrid) {
      silverRatesGrid.innerHTML = Object.values(rates.silver)
        .map(
          (entry) => `
            <div class="col-12 col-md-4">
              <div class="rate-card">
                <div class="rate-purity">${escapeHtml(entry.label)}</div>
                <span class="rate-tag">${escapeHtml(entry.tag)}</span>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 1g</span>
                  <span class="rate-value">${formatINRPaise(entry.per1g)}</span>
                </div>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 10g</span>
                  <span class="rate-value">${formatINRPaise(entry.per10g)}</span>
                </div>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 1kg</span>
                  <span class="rate-value">${formatINR(entry.per1kg)}</span>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    }

    if (platinumRatesGrid) {
      platinumRatesGrid.innerHTML = Object.values(rates.platinum)
        .map(
          (entry) => `
            <div class="col-12 col-md-4">
              <div class="rate-card">
                <div class="rate-purity">${escapeHtml(entry.label)}</div>
                <span class="rate-tag">${escapeHtml(entry.tag)}</span>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 1g</span>
                  <span class="rate-value">${formatINR(entry.per1g)}</span>
                </div>
                <div class="rate-metric">
                  <span class="rate-unit-label">Per 10g</span>
                  <span class="rate-value">${formatINR(entry.per10g)}</span>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    }
  }

  function startRefreshCooldown() {
    if (!refreshRatesBtn) return;
    isRefreshOnCooldown = true;
    refreshRatesBtn.disabled = true;

    let secondsLeft = Math.ceil(REFRESH_COOLDOWN_MS / 1000);
    refreshRatesBtn.textContent = `Updated (${secondsLeft}s)`;

    const intervalId = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        refreshRatesBtn.textContent = `Updated (${secondsLeft}s)`;
      } else {
        window.clearInterval(intervalId);
        isRefreshOnCooldown = false;
        refreshRatesBtn.disabled = false;
        refreshRatesBtn.textContent = "Refresh Rates";
      }
    }, 1000);
  }

  async function fetchLiveRates() {
    if (isRefreshOnCooldown) return;

    if (refreshRatesBtn) {
      refreshRatesBtn.disabled = true;
      refreshRatesBtn.textContent = "Syncing...";
    }

    let spotXau = FALLBACK_SPOT_INR.XAU;
    let spotXag = FALLBACK_SPOT_INR.XAG;
    let spotXpt = FALLBACK_SPOT_INR.XPT;
    let isLive = false;

    try {
      const endpoints = [
        "https://api.gold-api.com/price/XAU/INR",
        "https://api.gold-api.com/price/XAG/INR",
        "https://api.gold-api.com/price/XPT/INR"
      ];

      const responses = await Promise.all(
        endpoints.map((url) => fetch(url, { headers: { Accept: "application/json" } }))
      );

      if (responses.some((res) => !res.ok)) {
        throw new Error("Non-OK response from Gold API");
      }

      const [xauData, xagData, xptData] = await Promise.all(responses.map((res) => res.json()));

      if (
        Number.isFinite(xauData?.price) &&
        Number.isFinite(xagData?.price) &&
        Number.isFinite(xptData?.price)
      ) {
        spotXau = xauData.price;
        spotXag = xagData.price;
        spotXpt = xptData.price;
        isLive = true;
      } else {
        throw new Error("Invalid price payload");
      }
    } catch {
      isLive = false;
    }

    metalRates = calculateAllMetalRates(spotXau, spotXag, spotXpt);
    renderRateBoard(metalRates);

    if (rateStatusBadge) {
      rateStatusBadge.textContent = isLive ? "Live Market" : "Offline Benchmark";
      rateStatusBadge.classList.remove("status-live", "status-fallback");
      rateStatusBadge.classList.add(isLive ? "status-live" : "status-fallback");
    }

    if (rateTimestamp) {
      const timeString = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      rateTimestamp.textContent = `Updated ${timeString}`;
    }

    renderCatalog();
    startRefreshCooldown();
  }

  // ==========================================================================
  // 3. Dynamic Catalog Rendering, Filtering, Sorting & Modal
  // ==========================================================================
  function computeItemPricing(item) {
    // Round each invoice line item so Base + Making + GST === Final Price exactly
    const ratePerGram = metalRates[item.metal][item.purityKey].per1g;
    const metalValue = Math.round(item.weightGrams * ratePerGram);
    const makingCharges = Math.round(metalValue * (item.makingPercent / 100));
    const gstAmount = Math.round((metalValue + makingCharges) * 0.03);
    const finalPrice = metalValue + makingCharges + gstAmount;

    return {
      ratePerGram,
      metalValue,
      makingCharges,
      gstAmount,
      finalPrice
    };
  }

  function renderCatalog() {
    if (!catalogGrid || !metalRates) return;

    const enriched = CATALOG_ITEMS.filter(
      (item) => activeMetalFilter === "all" || item.metal === activeMetalFilter
    ).map((item) => ({
      ...item,
      pricing: computeItemPricing(item)
    }));

    if (activeSortOrder === "price-asc") {
      enriched.sort((a, b) => a.pricing.finalPrice - b.pricing.finalPrice);
    } else if (activeSortOrder === "price-desc") {
      enriched.sort((a, b) => b.pricing.finalPrice - a.pricing.finalPrice);
    } else if (activeSortOrder === "weight-asc") {
      enriched.sort((a, b) => a.weightGrams - b.weightGrams);
    }

    catalogGrid.innerHTML = enriched
      .map(
        (item) => `
          <div class="col-12 col-md-6 col-lg-4">
            <article class="product-card">
              <div class="product-visual-wrap">
                ${buildProductSvg(item.svgType, item.metal)}
              </div>
              <div class="product-body">
                <span class="product-badge">${escapeHtml(item.purityLabel)}</span>
                <h3 class="product-title">${escapeHtml(item.name)}</h3>
                <p class="product-meta-text">
                  Net Weight: <strong>${item.weightGrams.toFixed(1)}g</strong> &bull; Making: ${item.makingPercent}%
                </p>

                <div class="product-footer">
                  <div>
                    <span class="product-price">${formatINR(item.pricing.finalPrice)}</span>
                    <span class="product-price-note">Incl. Making &amp; 3% GST</span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-gold js-open-breakdown"
                    data-id="${escapeHtml(item.id)}"
                  >
                    View Price Breakdown
                  </button>
                </div>
              </div>
            </article>
          </div>
        `
      )
      .join("");
  }

  function openPriceModal(itemId) {
    if (!metalRates || !priceBreakdownModalEl) return;
    const item = CATALOG_ITEMS.find((entry) => entry.id === itemId);
    if (!item) return;

    const pricing = computeItemPricing(item);
    const formattedPerGram =
      item.metal === "silver"
        ? formatINRPaise(pricing.ratePerGram)
        : formatINR(pricing.ratePerGram);

    modalItemName.textContent = item.name;
    modalItemMeta.textContent = item.purityLabel;
    modalItemWeight.textContent = `${item.weightGrams.toFixed(1)} g`;
    modalRatePerGram.textContent = `${formattedPerGram} / g`;
    modalMetalValue.textContent = formatINR(pricing.metalValue);
    modalMakingLabel.textContent = `Making Charges (${item.makingPercent}%)`;
    modalMakingCharges.textContent = formatINR(pricing.makingCharges);
    modalGstAmount.textContent = formatINR(pricing.gstAmount);
    modalFinalPrice.textContent = formatINR(pricing.finalPrice);

    activeQuoteText = `Trendy Karat Quote — ${item.name} | ${item.purityLabel} | ${item.weightGrams.toFixed(1)}g | ${formatINR(pricing.finalPrice)} (Incl. Making & 3% GST)`;

    if (window.bootstrap && window.bootstrap.Modal) {
      const modalInstance = window.bootstrap.Modal.getOrCreateInstance(priceBreakdownModalEl);
      modalInstance.show();
    }
  }

  async function copyModalQuote() {
    if (!activeQuoteText || !modalCopyQuoteBtn) return;
    const originalLabel = modalCopyQuoteBtn.textContent;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeQuoteText);
      } else {
        const temp = document.createElement("textarea");
        temp.value = activeQuoteText;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      modalCopyQuoteBtn.textContent = "Quote Copied!";
      window.setTimeout(() => {
        modalCopyQuoteBtn.textContent = originalLabel;
      }, 1800);
    } catch {
      modalCopyQuoteBtn.textContent = "Copy Failed";
      window.setTimeout(() => {
        modalCopyQuoteBtn.textContent = originalLabel;
      }, 1800);
    }
  }

  // ==========================================================================
  // 4. Timezone-Safe Client-Side Form Validation
  // ==========================================================================
  function setValidationState(inputEl, errorEl, isValid, message) {
    if (isValid) {
      inputEl.classList.remove("is-invalid");
      inputEl.classList.add("is-valid");
      errorEl.textContent = "";
    } else {
      inputEl.classList.remove("is-valid");
      inputEl.classList.add("is-invalid");
      errorEl.textContent = message;
    }
  }

  function validateBookingForm(event) {
    event.preventDefault();
    if (formSuccessBanner) {
      formSuccessBanner.innerHTML = "";
    }

    const nameVal = customerName.value.trim();
    const emailVal = customerEmail.value.trim();
    const phoneVal = customerPhone.value.trim();
    const metalVal = metalPreference.value.trim();
    const dateVal = visitDate.value.trim();
    const todayLocal = getTodayLocalYYYYMMDD();

    let isFormValid = true;

    // Full Name
    if (nameVal.length < 2 || !/^[A-Za-z\s]+$/.test(nameVal)) {
      setValidationState(
        customerName,
        nameError,
        false,
        "Please enter a valid full name (at least 2 letters, spaces allowed)."
      );
      isFormValid = false;
    } else {
      setValidationState(customerName, nameError, true, "");
    }

    // Email Address
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setValidationState(
        customerEmail,
        emailError,
        false,
        "Please enter a valid email address."
      );
      isFormValid = false;
    } else {
      setValidationState(customerEmail, emailError, true, "");
    }

    // 10-Digit Indian Mobile Number
    if (!/^[6-9]\d{9}$/.test(phoneVal)) {
      setValidationState(
        customerPhone,
        phoneError,
        false,
        "Enter a valid 10-digit Indian mobile number starting with 6-9."
      );
      isFormValid = false;
    } else {
      setValidationState(customerPhone, phoneError, true, "");
    }

    // Metal Preference
    if (!metalVal) {
      setValidationState(
        metalPreference,
        metalError,
        false,
        "Please select a metal and purity preference."
      );
      isFormValid = false;
    } else {
      setValidationState(metalPreference, metalError, true, "");
    }

    // Timezone-Safe Visit Date Comparison
    if (!dateVal || dateVal < todayLocal) {
      setValidationState(
        visitDate,
        dateError,
        false,
        "Please choose today or a future visit date."
      );
      isFormValid = false;
    } else {
      setValidationState(visitDate, dateError, true, "");
    }

    if (!isFormValid) return;

    formSuccessBanner.innerHTML = `
      <div class="booking-success-alert" role="alert">
        Confirmed for <strong>${escapeHtml(nameVal)}</strong>! Your studio visit for
        <strong>${escapeHtml(metalVal)}</strong> is scheduled for <strong>${escapeHtml(dateVal)}</strong>.
        A summary has been queued for ${escapeHtml(emailVal)}.
      </div>
    `;

    bookingForm.reset();
    [customerName, customerEmail, customerPhone, metalPreference, visitDate].forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
    });
  }

  // ==========================================================================
  // Initialization & Event Wiring
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    restoreSavedTheme();

    if (visitDate) {
      visitDate.min = getTodayLocalYYYYMMDD();
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", cycleAmbienceMode);
    }

    if (refreshRatesBtn) {
      refreshRatesBtn.addEventListener("click", () => {
        fetchLiveRates();
      });
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeMetalFilter = btn.getAttribute("data-metal-filter") || "all";
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderCatalog();
      });
    });

    if (catalogSort) {
      catalogSort.addEventListener("change", () => {
        activeSortOrder = catalogSort.value;
        renderCatalog();
      });
    }

    if (catalogGrid) {
      catalogGrid.addEventListener("click", (event) => {
        const trigger = event.target.closest(".js-open-breakdown");
        if (!trigger) return;
        const itemId = trigger.getAttribute("data-id");
        if (itemId) {
          openPriceModal(itemId);
        }
      });
    }

    if (modalCopyQuoteBtn) {
      modalCopyQuoteBtn.addEventListener("click", copyModalQuote);
    }

    if (bookingForm) {
      bookingForm.addEventListener("submit", validateBookingForm);
    }

    // Initial live bullion fetch on load
    fetchLiveRates();
  });
})();
