function saveSelectedWords() {
  if (!currentUserId) return;
  localStorage.setItem(
    `vocab_words_${currentUserId}`,
    JSON.stringify(Array.from(selectedWordIds))
  );
}

function loadLevels(name) {
  currentUserId = name;
  document.getElementById("student-label").textContent = name;
  const saved = localStorage.getItem(`vocab_words_${name}`);
  if (saved) {
    // Words are saved but we still start fresh at the grid each session —
    // change this later if you want auto-resume into practice.
  }
  initGridScreen();
  showScreen("grid-screen");
}
