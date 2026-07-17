document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("student-name").value.trim();
  if (!name) return;
  localStorage.setItem("vocab_current_student", name);
  showScreen("grid-screen");
  loadLevels(name);
});

document.getElementById("logout-btn-1").addEventListener("click", () => {
  localStorage.removeItem("vocab_current_student");
  showScreen("auth-screen");
});

window.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem("vocab_current_student");
  if (savedName) {
    showScreen("grid-screen");
    loadLevels(savedName);
  }
});
