document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("scanFile");
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        fileInput.classList.add("border-primary");
      }
    });
  }

  // Dark mode / light mode toggle using Bootstrap's data-bs-theme attribute.
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  if (themeToggle) {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");

    if (initial === "dark") {
      document.documentElement.setAttribute("data-bs-theme", "dark");
      if (themeIcon) themeIcon.textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-bs-theme");
      if (themeIcon) themeIcon.textContent = "🌙";
    }

    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        localStorage.setItem("theme", "dark");
        if (themeIcon) themeIcon.textContent = "☀️";
      } else {
        document.documentElement.removeAttribute("data-bs-theme");
        localStorage.setItem("theme", "light");
        if (themeIcon) themeIcon.textContent = "🌙";
      }
    });
  }
});

