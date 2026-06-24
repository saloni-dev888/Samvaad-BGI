// 🌙 Apply saved theme on load
window.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  // Keep the toggle switch state in sync with theme
  const toggle = document.getElementById("darkModeSwitch") || document.getElementById("darkModeToggle");
  if (toggle) {
    toggle.checked = sessionStorage.getItem("theme") === "dark";
  }
});

// 🌙 Apply theme based on saved preference
function applyTheme() {
  if (sessionStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

// 🌙 Toggle Dark Mode
function toggleDark() {
  const isDark = document.body.classList.toggle("dark");
  sessionStorage.setItem("theme", isDark ? "dark" : "light");

  // Update toggle state visually
  const toggles = [document.getElementById("darkModeSwitch"), document.getElementById("darkModeToggle")];
  toggles.forEach(t => { if (t) t.checked = isDark; });
}

// 🚪 Logout Function
function logout() {
  sessionStorage.clear();
  alert("You have been logged out.");
  window.location.href = "index.html";
}
