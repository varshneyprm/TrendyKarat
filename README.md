# Trendy Karat — Wear the Asset

**Enterprise Front-End FinTech & Luxury Bullion E-Commerce Application**

[![HTML5](https://img.shields.io/badge/Markup-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/Styling-CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Sass](https://img.shields.io/badge/Preprocessor-Sass%20%28SCSS%29-CC6699?style=flat-square&logo=sass&logoColor=white)](https://sass-lang.com/)
[![Bootstrap 5.3](https://img.shields.io/badge/Framework-Bootstrap%205.3.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![JavaScript ES6+](https://img.shields.io/badge/Runtime-Vanilla%20JS%20%28ES6%2B%29-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![REST API](https://img.shields.io/badge/Telemetry-Gold%20API%20%28INR%29-B8892D?style=flat-square)](https://gold-api.com/)

---

## 1. Executive Summary

**Trendy Karat ("Wear the Asset")** is a production-grade, responsive luxury jewellery e-commerce storefront engineered to eliminate opaque retail pricing in the Indian bullion and fine-jewellery sector[cite: 21, 24]. Built around real-time commodity telemetry, the application ingests live spot prices in Indian Rupees (`INR`) for **Gold (`XAU/INR`)**, **Silver (`XAG/INR`)**, and **Platinum (`XPT/INR`)** via asynchronous `REST` endpoints[cite: 21], executes deterministic Indian landed-duty and BIS hallmark purity conversions[cite: 21], and dynamically recalculates itemized retail catalog pricing in real time[cite: 21].

This system was architected and implemented as the capstone deliverable for the **Front-End Development Internship Program** at **Cognifyz Technologies**, fulfilling **100% (8 of 8)** of the technical evaluation milestones across progressive maturity tiers (`Level-1` through `Level-4`) alongside a consolidated modular production build (`Complete Website`)[cite: 6, 32].

---

## 2. Host Organization & Internship Program Governance

### 2.1 Host Organization Profile — Cognifyz Technologies
* **Entity:** Cognifyz Technologies (MSME Registered Technology & Data Science Enterprise)[cite: 2]
* **Core Operational Domains:** Artificial Intelligence (AI), Machine Learning (ML), Data Analytics Platforms, Enterprise Software Solutions, and Industry Technical Training[cite: 2]
* **Program Track:** Front-End Web Development Internship Program[cite: 1, 6]
* **Minimum Certification Threshold:** Completion of at least **6 of 8** technical tasks across four progressive engineering tiers[cite: 6]
* **Achieved Deliverable Scope:** **8 of 8** technical tasks completed, verified, and packaged into both incremental progression snapshots (`Level-1/` – `Level-4/`) and a unified production codebase (`Complete Website/`)

### 2.2 Program Compliance & Engineering Standards
* **Incremental Architecture Versioning:** Maintained isolated, self-contained builds for every difficulty tier (`Beginner`, `Intermediate`, `Advanced`, `Expert`) to provide auditable engineering progression[cite: 5, 7, 9, 11, 13, 32].
* **Academic Integrity & Original Engineering:** Engineered entirely from first principles with bespoke visual assets (inline vector `SVG` emblems, product illustrations, and favicon data URIs), custom domain logic, and zero plagiarized templates[cite: 4, 24].
* **Community & Technical Demonstration:** Documented via a public demonstration showcase on LinkedIn tagging **Cognifyz Technologies** (`#cognifyz`, `#cognifyzTech`, `#cognifyzTechnologies`) prior to final artifact submission[cite: 4, 5].

---

## 3. System Architecture & Functional Capabilities

### 3.1 Asynchronous Commodity Telemetry & Resilience Layer
* **Concurrent Multi-Asset Fetching:** Utilizes `Promise.all()` with native browser `fetch()` calls against unauthenticated, CORS-enabled `JSON` endpoints (`https://api.gold-api.com/price/{XAU|XAG|XPT}/INR`) to minimize network waterfall latency[cite: 21].
* **Rate-Limiting & Debounced Refresh Governance:** Implements a deterministic **5-second UI cooldown timer** (`REFRESH_COOLDOWN_MS = 5000`) on `#refreshRatesBtn` with live countdown state feedback to prevent upstream API throttling[cite: 21].
* **Fault-Tolerant Circuit Fallback:** Wraps network I/O in structured `try/catch` exception handling with HTTP status verification and `Number.isFinite()` payload guards[cite: 21]. Upon network degradation, the engine seamlessly degrades to calibrated Indian benchmark spot values (`FALLBACK_SPOT_INR`) and transitions `#rateStatusBadge` between `Live Market` and `Offline Benchmark` states[cite: 21].

### 3.2 IBJA-Aligned Bullion & BIS Hallmark Calculation Engine
To mirror India Bullion and Jewellers Association (IBJA) wholesale display standards—quoting pure bullion rates **excluding GST and making charges** while embedding retail operating spreads—the calculation pipeline executes a three-stage deterministic algorithm[cite: 21, 24]:

1. **Troy-Ounce Normalization & Indian Customs Landed Factor:**
   Converts international troy-ounce spot prices (`31.1034768g`) into per-gram Indian landed bullion rates by applying the `1.15` effective import duty multiplier (`INDIA_DUTY_FACTOR = 1.15`)[cite: 21].
2. **Retail Bullion Spread Injection (`RETAIL_MARGIN_PER_GRAM`):**
   * **24K Gold (`999`):** Injects `+₹300/g` (`+₹3,000 per 10g`) onto the landed 24K base rate[cite: 21].
   * **Fine Silver (`999`):** Injects `+₹10/g` (`+₹10,000 per 1kg`) onto the landed 999 silver base rate[cite: 21].
   * **Pure Platinum (`999`):** Injects `+₹10/g` (`+₹10,000 per 1kg`) onto the landed 999 platinum base rate[cite: 21].
3. **Proportional BIS Hallmark Fineness Derivation (`PURITY_FINENESS`):**
   * **Gold (Whole-Rupee `1g` & `10g` Precision):** `24K (1.000)`, `22K / BIS 916 (0.916)`, `20K / BIS 833 (0.833)`, `18K / BIS 750 (0.750)`, and `14K / BIS 585 (0.585)`[cite: 21].
   * **Silver (Exact Paise `1g` & `10g`, Whole-Rupee `1kg` Precision):** `999 Fine (1.000)`, `925 Sterling (0.925)`, and `800 Standard (0.800)`[cite: 21].
   * **Platinum (Whole-Rupee `1g` & `10g` Precision):** `999 Pure (1.000)`, `Pt950 (0.950)`, and `Pt900 (0.900)`[cite: 21].

### 3.3 Dynamic Catalog, Client-Side Filtering & Receipt Audit Modal
* **State-Driven Catalog Pipeline:** Renders 9 curated everyday luxury SKUs (`CATALOG_ITEMS`) with real-time category filtering (`All`, `Gold`, `Silver`, `Platinum`) and multi-criteria sorting (`price-asc`, `price-desc`, `weight-asc`)[cite: 21, 24].
* **Line-Item Invoice Reconciliation:** Computes `metalValue`, `makingCharges`, `gstAmount` (3% Indian Jewellery GST), and `finalPrice` using integer rounding at each line item so itemized components reconcile to the exact rupee inside `#priceBreakdownModal`[cite: 21].
* **Asynchronous Clipboard Integration:** Generates structured plain-text quotation summaries via `navigator.clipboard.writeText()` (with a legacy `textarea` fallback) for instant customer sharing[cite: 21].

### 3.4 Multi-Surface Design System & Client-Side Form Validation
* **3-Tier Ambience Engine:** Dynamically mutates `document.body` styles, custom `data-theme` attributes, and Bootstrap's `data-bs-theme` root attribute across **Ivory Light**, **Champagne Warm**, and **Royal Velvet (Dark)** with `localStorage` state persistence[cite: 21].
* **Modular Sass Architecture:** Leverages SCSS variables (`$gold-primary`, `$ivory-bg`, `$champagne-bg`, `$velvet-bg`), parameterized mixins (`@mixin card-hover-lift`, `@mixin theme-surface`), and nested component rules compiled into zero-dependency CSS3[cite: 23].
* **Timezone-Safe Input Validation:** Validates full names (`RegExp` alphabetic check), RFC-compliant email syntax, 10-digit Indian mobile numbers (`^[6-9]\d{9}$`), metal selection, and local `YYYY-MM-DD` appointment dates to prevent UTC midnight off-by-one boundary defects[cite: 21].

---

## 4. Repository Directory Structure

```text
TrendyKarat/
├── Complete Website/               # Production modular architecture
│   ├── index.html                  # Semantic HTML5 entry point & Bootstrap 5.3 layout
│   ├── css/
│   │   └── styles.css              # Compiled production stylesheet
│   ├── js/
│   │   └── script.js               # ES6+ IIFE state, API telemetry, pricing & validation engine
│   └── scss/
│       └── styles.scss             # Modular Sass source with variables, mixins & theme surfaces
├── Level-1/                        # Tier 1 (Beginner): Semantic HTML5 & Inline CSS touchpoints
│   └── index.html
├── Level-2/                        # Tier 2 (Intermediate): Responsive @media queries & JS theme switcher
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── Level-3/                        # Tier 3 (Advanced): Live REST API fetch() & client-side form validation
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── Level-4/                        # Tier 4 (Expert): Full Bootstrap 5 & Sass refactored application
│   ├── index.html
│   ├── styles.scss
│   ├── styles.css
│   └── script.js
└── README.md                       # Architectural & engineering documentation
