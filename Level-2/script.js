(() => {
  "use strict";

  const THEMES = [
    { key: "ivory", bg: "#faf8f5", text: "#18181b", label: "Ambience: Ivory Light" },
    { key: "champagne", bg: "#f5ecdc", text: "#2c2219", label: "Ambience: Champagne Warm" },
    { key: "velvet", bg: "#121215", text: "#f4f1ea", label: "Ambience: Royal Velvet" }
  ];

  let currentIndex = 0;
  const toggleBtn = document.getElementById("themeToggleBtn");

  function applyTheme(index) {
    const theme = THEMES[index];
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    document.body.setAttribute("data-theme", theme.key);
    if (toggleBtn) {
      toggleBtn.textContent = theme.label;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % THEMES.length;
      applyTheme(currentIndex);
    });
  }
})();
