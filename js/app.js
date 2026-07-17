// ==================== STATE ====================
let currentUserId = null;
let selectedWordIds = new Set();      // words flagged "don't know" on Page 1
let moduleOrder = [1, 2, 3];
let currentModuleIdx = 0;
let currentSubpages = [];             // chunks of ≤10 words for current module
let currentSubpageIdx = 0;
let wallWordPool = [];                // all flagged words, used in Page 3
let wallBlockCount = 0;
let wallMaxBlocks = 0;

// ==================== NAVIGATION ====================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ==================== PAGE 1: GRID ====================
function initGridScreen() {
  const grid = document.getElementById("number-grid");
  grid.innerHTML = "";
  VOCAB_WORDS.forEach(w => {
    const btn = document.createElement("button");
    btn.className = "grid-btn";
    btn.textContent = w.id;
    btn.dataset.id = w.id;
    btn.addEventListener("click", () => toggleWord(w.id, btn));
    grid.appendChild(btn);
  });
  updateGridCount();
}

function toggleWord(id, btn) {
  if (selectedWordIds.has(id)) {
    selectedWordIds.delete(id);
    btn.classList.remove("selected");
  } else {
    selectedWordIds.add(id);
    btn.classList.add("selected");
  }
  updateGridCount();
}

function updateGridCount() {
  const count = selectedWordIds.size;
  document.getElementById("grid-count").textContent = `${count} word${count !== 1 ? "s" : ""} selected`;
  document.getElementById("grid-continue").disabled = count === 0;
}

document.getElementById("grid-continue").addEventListener("click", () => {
  saveSelectedWords();
  wallWordPool = VOCAB_WORDS.filter(w => selectedWordIds.has(w.id));
  currentModuleIdx = 0;
  startModule(moduleOrder[currentModuleIdx]);
});

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
  initGridScreen();
  showScreen("grid-screen");
}

// ==================== PAGE 2: MODULES & SUBPAGES ====================
function startModule(moduleNum) {
  const moduleWords = getWordsForModule(moduleNum).filter(w => selectedWordIds.has(w.id));

  if (moduleWords.length === 0) {
    advanceModule();
    return;
  }

  currentSubpages = [];
  for (let i = 0; i < moduleWords.length; i += 10) {
    currentSubpages.push(moduleWords.slice(i, i + 10));
  }
  currentSubpageIdx = 0;
  renderSubpage(moduleNum);
}

function renderSubpage(moduleNum) {
  const words = currentSubpages[currentSubpageIdx];
  document.getElementById("module-label").textContent = `Module ${moduleNum}`;
  document.getElementById("subpage-label").textContent =
    `Page ${currentSubpageIdx + 1} of ${currentSubpages.length}`;

  const activityType = currentSubpageIdx % 3;
  const container = document.getElementById("activity-container");
  container.innerHTML = "";
  document.getElementById("confirm-continue").disabled = true;
  document.getElementById("activity-feedback").textContent = "";

  if (activityType === 0) renderMultipleChoice(words, container);
  else if (activityType === 1) renderFillBlank(words, container);
  else renderMatch(words, container);

  showScreen("practice-screen");
}

// --- Multiple Choice ---
function renderMultipleChoice(words, container) {
  let answeredCount = 0;
  words.forEach(w => {
    const wrongOptions = shuffle(VOCAB_WORDS.filter(x => x.id !== w.id))
      .slice(0, 3)
      .map(x => x.definition);
    const options = shuffle([w.definition, ...wrongOptions]);

    const card = document.createElement("div");
    card.className = "mc-question";
    card.innerHTML = `<p class="mc-word">${w.word}</p>`;
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "mc-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (btn.dataset.locked) return;
        card.querySelectorAll(".mc-option").forEach(o => o.dataset.locked = "true");
        if (opt === w.definition) {
          btn.classList.add("correct");
        } else {
          btn.classList.add("incorrect");
          [...card.querySelectorAll(".mc-option")].find(o => o.textContent === w.definition)
            .classList.add("correct");
        }
        answeredCount++;
        if (answeredCount === words.length) {
          document.getElementById("confirm-continue").disabled = false;
        }
      });
      card.appendChild(btn);
    });
    container.appendChild(card);
  });
}

// --- Fill in the Blank ---
function renderFillBlank(words, container) {
  let correctCount = 0;
  words.forEach(w => {
    const blanked = w.example.replace(new RegExp(w.word, "gi"), "_____");
    const card = document.createElement("div");
    card.className = "fib-question";
    card.innerHTML = `
      <p class="fib-sentence">${blanked}</p>
      <p class="fib-hint">${w.definition}</p>
      <input type="text" class="fib-input" placeholder="Type the word..." />
      <button class="fib-check">Check</button>
    `;
    const input = card.querySelector(".fib-input");
    const checkBtn = card.querySelector(".fib-check");
    checkBtn.addEventListener("click", () => {
      if (checkBtn.dataset.locked) return;
      checkBtn.dataset.locked = "true";
      input.disabled = true;
      if (input.value.trim().toLowerCase() === w.word.toLowerCase()) {
        input.classList.add("correct");
      } else {
        input.classList.add("incorrect");
        card.insertAdjacentHTML("beforeend", `<p class="fib-answer">Answer: ${w.word}</p>`);
      }
      correctCount++;
      if (correctCount === words.length) {
        document.getElementById("confirm-continue").disabled = false;
      }
    });
    container.appendChild(card);
  });
}

// --- Match ---
function renderMatch(words, container) {
  const wordCol = shuffle([...words]);
  const defCol = shuffle([...words]);
  let selectedWord = null;
  let matchedCount = 0;

  const wrap = document.createElement("div");
  wrap.className = "match-wrap";
  const wordList = document.createElement("div");
  wordList.className = "match-col";
  const defList = document.createElement("div");
  defList.className = "match-col";

  wordCol.forEach(w => {
    const el = document.createElement("button");
    el.className = "match-item";
    el.textContent = w.word;
    el.dataset.id = w.id;
    el.addEventListener("click", () => {
      if (el.classList.contains("matched")) return;
      wordList.querySelectorAll(".match-item").forEach(i => i.classList.remove("active"));
      el.classList.add("active");
      selectedWord = w.id;
    });
    wordList.appendChild(el);
  });

  defCol.forEach(w => {
    const el = document.createElement("button");
    el.className = "match-item";
    el.textContent = w.definition;
    el.dataset.id = w.id;
    el.addEventListener("click", () => {
      if (el.classList.contains("matched") || selectedWord === null) return;
      const wordEl = wordList.querySelector(`.match-item[data-id="${selectedWord}"]`);
      if (selectedWord === w.id) {
        el.classList.add("matched");
        wordEl.classList.add("matched");
        matchedCount++;
        if (matchedCount === words.length) {
          document.getElementById("confirm-continue").disabled = false;
        }
      } else {
        el.classList.add("shake");
        setTimeout(() => el.classList.remove("shake"), 400);
      }
      selectedWord = null;
      wordList.querySelectorAll(".match-item").forEach(i => i.classList.remove("active"));
    });
    defList.appendChild(el);
  });

  wrap.appendChild(wordList);
  wrap.appendChild(defList);
  container.appendChild(wrap);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// --- Confirm & Continue ---
document.getElementById("confirm-continue").addEventListener("click", () => {
  currentSubpageIdx++;
  if (currentSubpageIdx < currentSubpages.length) {
    renderSubpage(moduleOrder[currentModuleIdx]);
  } else {
    showModuleComplete();
  }
});

function showModuleComplete() {
  const moduleNum = moduleOrder[currentModuleIdx];
  document.getElementById("module-complete-title").textContent = `Module ${moduleNum} Complete!`;
  document.getElementById("module-complete-text").textContent =
    currentModuleIdx < moduleOrder.length - 1
      ? "Nice work. Ready for the next module?"
      : "You've finished all modules. Time for the final challenge.";
  showScreen("module-complete-screen");
}

document.getElementById("module-complete-next").addEventListener("click", () => {
  advanceModule();
});

function advanceModule() {
  currentModuleIdx++;
  if (currentModuleIdx < moduleOrder.length) {
    startModule(moduleOrder[currentModuleIdx]);
  } else {
    startWallGame();
  }
}

// ==================== PAGE 3: WALL GAME ====================
function startWallGame() {
  wallMaxBlocks = wallWordPool.length > 0 ? wallWordPool.length : 10;
  wallBlockCount = wallMaxBlocks;
  renderWallBlocks();
  nextWallQuestion();
  showScreen("wall-screen");
}

function renderWallBlocks() {
  const display = document.getElementById("wall-display");
  display.innerHTML = "";
  for (let i = 0; i < wallBlockCount; i++) {
    const block = document.createElement("div");
    block.className = "wall-block";
    display.appendChild(block);
  }
  document.getElementById("wall-block-count").textContent = `${wallBlockCount} blocks remaining`;
}

function nextWallQuestion() {
  if (wallBlockCount <= 0) {
    finishWall();
    return;
  }
  const w = wallWordPool[Math.floor(Math.random() * wallWordPool.length)];
  const wrongOptions = shuffle(VOCAB_WORDS.filter(x => x.id !== w.id)).slice(0, 3).map(x => x.definition);
  const options = shuffle([w.definition, ...wrongOptions]);

  document.getElementById("wall-word").textContent = w.word;
  const answersDiv = document.getElementById("wall-answers");
  answersDiv.innerHTML = "";
  document.getElementById("wall-feedback").textContent = "";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "mc-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      if (opt === w.definition) {
        wallBlockCount = Math.max(0, wallBlockCount - 1);
        document.getElementById("wall-feedback").textContent = "Correct! A block comes down.";
      } else {
        wallBlockCount = Math.min(wallMaxBlocks, wallBlockCount + 1);
        document.getElementById("wall-feedback").textContent = `Not quite — the wall grows. Answer: ${w.definition}`;
      }
      renderWallBlocks();
      setTimeout(nextWallQuestion, 1200);
    });
    answersDiv.appendChild(btn);
  });
}

function finishWall() {
  document.getElementById("win-summary").textContent =
    `You practiced ${wallWordPool.length} words and brought the whole wall down.`;
  showScreen("win-screen");
}

document.getElementById("win-restart").addEventListener("click", () => {
  selectedWordIds.clear();
  showScreen("grid-screen");
  initGridScreen();
});
