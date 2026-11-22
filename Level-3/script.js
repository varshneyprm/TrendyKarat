(() => {
  "use strict";

  const TROY_OUNCE_GRAMS = 31.1034768;
  const INDIA_DUTY_FACTOR = 1.15;
  const FALLBACK_SPOT = { XAU: 365000, XAG: 5100, XPT: 115000 };

  const inr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  const CATALOG = [
    { name: "Cuban Micro Link Chain", metal: "gold", purity: "22K", weight: 8.5, making: 11 },
    { name: "Everyday Chunky Huggies", metal: "gold", purity: "18K", weight: 3.4, making: 13 },
    { name: "Minimal Bar Pendant", metal: "gold", purity: "14K", weight: 2.6, making: 14 },
    { name: "Architectural Open Cuff", metal: "silver", purity: "999", weight: 24.0, making: 16 },
    { name: "Stackable Dome Band", metal: "silver", purity: "925", weight: 9.5, making: 18 },
    { name: "Brushed Matte Couple Band", metal: "platinum", purity: "950", weight: 6.0, making: 14 }
  ];

  const THEMES = [
    { key: "ivory", bg: "#faf8f5", text: "#18181b", label: "Ambience: Ivory Light" },
    { key: "champagne", bg: "#f5ecdc", text: "#2c2219", label: "Ambience: Champagne Warm" },
    { key: "velvet", bg: "#121215", text: "#f4f1ea", label: "Ambience: Royal Velvet" }
  ];

  let themeIdx = 0;
  const themeBtn = document.getElementById("themeToggleBtn");
  const rateStatus = document.getElementById("rateStatus");
  const ratesGrid = document.getElementById("ratesGrid");
  const catalogGrid = document.getElementById("catalogGrid");
  const refreshBtn = document.getElementById("refreshRatesBtn");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      themeIdx = (themeIdx + 1) % THEMES.length;
      const t = THEMES[themeIdx];
      document.body.style.backgroundColor = t.bg;
      document.body.style.color = t.text;
      document.body.setAttribute("data-theme", t.key);
      themeBtn.textContent = t.label;
    });
  }

  async function loadBullionRates() {
    let xau = FALLBACK_SPOT.XAU;
    let xag = FALLBACK_SPOT.XAG;
    let xpt = FALLBACK_SPOT.XPT;
    let live = false;

    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU/INR"),
        fetch("https://api.gold-api.com/price/XAG/INR"),
        fetch("https://api.gold-api.com/price/XPT/INR")
      ]);
      if (r1.ok && r2.ok && r3.ok) {
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        xau = d1.price;
        xag = d2.price;
        xpt = d3.price;
        live = true;
      }
    } catch {
      live = false;
    }

    const gold24 = Math.round(((xau / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + 300);
    const silver999 = Math.round((((xag / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + 10) * 100) / 100;
    const plat999 = Math.round(((xpt / TROY_OUNCE_GRAMS) * INDIA_DUTY_FACTOR) + 10);

    const perGram = {
      gold: {
        "24K": gold24,
        "22K": Math.round(gold24 * 0.916),
        "18K": Math.round(gold24 * 0.750),
        "14K": Math.round(gold24 * 0.585)
      },
      silver: {
        "999": silver999,
        "925": Math.round(silver999 * 0.925 * 100) / 100
      },
      platinum: {
        "999": plat999,
        "950": Math.round(plat999 * 0.950)
      }
    };

    rateStatus.textContent = live
      ? "Live Market Rates Synced via gold-api.com"
      : "Showing Offline Benchmark Rates";

    const cards = [
      { label: "Gold 24K (999)", val: `${inr.format(perGram.gold["24K"] * 10)} / 10g` },
      { label: "Gold 22K (916)", val: `${inr.format(perGram.gold["22K"] * 10)} / 10g` },
      { label: "Gold 18K (750)", val: `${inr.format(perGram.gold["18K"] * 10)} / 10g` },
      { label: "Silver 999 Fine", val: `${inr.format(Math.round(perGram.silver["999"] * 1000))} / 1kg` },
      { label: "Silver 925 Sterling", val: `₹${perGram.silver["925"].toFixed(2)} / 1g` },
      { label: "Platinum 950 (Pt950)", val: `${inr.format(perGram.platinum["950"] * 10)} / 10g` }
    ];

    ratesGrid.innerHTML = cards
      .map(
        (c) => `
          <div class="card">
            <span class="card-tag">Bullion Rate</span>
            <h3>${c.label}</h3>
            <div class="price">${c.val}</div>
          </div>
        `
      )
      .join("");

    catalogGrid.innerHTML = CATALOG.map((item) => {
      const rate = perGram[item.metal][item.purity];
      const base = Math.round(item.weight * rate);
      const making = Math.round(base * (item.making / 100));
      const gst = Math.round((base + making) * 0.03);
      const total = base + making + gst;
      return `
        <article class="card">
          <span class="card-tag">${item.metal.toUpperCase()} ${item.purity}</span>
          <h3>${item.name}</h3>
          <p class="muted">Weight: ${item.weight}g &bull; Making: ${item.making}% + 3% GST</p>
          <div class="price">${inr.format(total)}</div>
        </article>
      `;
    }).join("");
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadBullionRates);
  }

  // Form Validation
  const form = document.getElementById("bookingForm");
  const visitDate = document.getElementById("visitDate");
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (visitDate) visitDate.min = todayStr;

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("customerName");
      const email = document.getElementById("customerEmail");
      const phone = document.getElementById("customerPhone");
      const metal = document.getElementById("metalPreference");
      const banner = document.getElementById("formSuccessBanner");
      banner.textContent = "";

      let valid = true;

      const check = (input, errId, ok, msg) => {
        const err = document.getElementById(errId);
        input.classList.toggle("invalid", !ok);
        err.textContent = ok ? "" : msg;
        if (!ok) valid = false;
      };

      check(name, "nameError", /^[A-Za-z\s]{2,}$/.test(name.value.trim()), "Enter a valid full name.");
      check(email, "emailError", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), "Enter a valid email.");
      check(phone, "phoneError", /^[6-9]\d{9}$/.test(phone.value.trim()), "Enter a 10-digit Indian mobile number.");
      check(metal, "metalError", metal.value !== "", "Select a metal & purity.");
      check(visitDate, "dateError", visitDate.value !== "" && visitDate.value >= todayStr, "Select today or a future date.");

      if (!valid) return;

      banner.textContent = `Confirmed for ${name.value.trim()}! Studio visit for ${metal.value} booked on ${visitDate.value}.`;
      form.reset();
    });
  }

  loadBullionRates();
})();
