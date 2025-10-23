// 🎮 Flag Quiz + Leaderboard + Countdown Timer (20s per question)

// Clean, defensive implementation
(() => {
    const appError = document.getElementById("appError");
    const countSpan = document.querySelector(".count span");
    const flagImg = document.querySelector(".flag-img img");
    const optionLis = Array.from(
        document.querySelectorAll(".flag-options ul li")
    );
    const scoreSpan = document.querySelector("h3 span");
    const scoreDiv = document.querySelector(".score");
    const correctAns = document.querySelector(".score .right span");
    const incorrectAns = document.querySelector(".score .incorrect span");
    const btnRestart = document.querySelector("#restartGame");
    const btnNewGame = document.querySelector("#newGame");
    // Timer element: fall back to the span with id timeLeft if present
    const timerEl =
        document.getElementById("timeLeft") ||
        document.querySelector(".timer span");
    const nameModal = document.getElementById("nameModal");
    const playerNameInput = document.getElementById("playerName");
    const saveScoreBtn = document.getElementById("saveScoreBtn");

    let questions = [];
    let qCount = 5;
    let currentIndex = 0;
    let rightAnswers = 0;
    let wrongAnswers = 0;
    let questionTimer = null;
    let timeLeft = 15.0; // default per-question seconds
    let startTime = null; // timestamp when quiz starts

    function showError(msg) {
        console.error(msg);
        if (appError) {
            appError.style.display = "block";
            appError.textContent = msg;
        }
    }

    function fetchQuestions() {
        return fetch("assets/js/flag_questions.json").then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
            return r.json();
        });
    }

    function shuffle(a) {
        return a.sort(() => Math.random() - 0.5);
    }

    function startQuestionTimer(onExpire) {
        stopQuestionTimer();
        timeLeft = 15.0;
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1);
        questionTimer = setInterval(() => {
            timeLeft -= 0.1;
            if (timeLeft < 0) timeLeft = 0;
            if (timerEl) timerEl.textContent = timeLeft.toFixed(1);
            if (timeLeft <= 0) {
                stopQuestionTimer();
                if (typeof onExpire === "function") onExpire();
            }
        }, 100);
    }

    function stopQuestionTimer() {
        if (questionTimer) {
            clearInterval(questionTimer);
            questionTimer = null;
        }
    }

    function renderQuestion() {
        if (!questions || questions.length === 0) return;
        if (currentIndex >= qCount) {
            showResults();
            return;
        }
        const q = questions[currentIndex];
        if (countSpan)
            countSpan.textContent = `${currentIndex + 1} / ${qCount}`;
        if (flagImg) {
            flagImg.src = `assets/images/${q.img}`;
            flagImg.alt = q.options && q.options[0] ? q.options[0] : "flag";
        }
        optionLis.forEach((li, i) => {
            li.textContent = q.options[i] || "";
            li.classList.remove("active", "success", "wrong");
            li.style.pointerEvents = "auto";
        });
        if (scoreSpan) scoreSpan.textContent = String(rightAnswers);

        // start timer for this question
        startQuestionTimer(() => {
            // expire: mark wrong and advance
            wrongAnswers++;
            if (scoreSpan) scoreSpan.textContent = String(rightAnswers);
            // briefly show wrong on all options
            optionLis.forEach((li) => li.classList.add("wrong"));
            setTimeout(() => {
                currentIndex++;
                renderQuestion();
            }, 700);
        });
    }

    function handleChoiceClick(e) {
        const li = e.currentTarget;
        // prevent double clicks
        if (li.classList.contains("disabled")) return;
        stopQuestionTimer();
        const q = questions[currentIndex];
        const chosen = li.textContent.trim().toLowerCase();
        const right = (q.right_answer || "").toLowerCase();
        li.classList.add("active");
        optionLis.forEach((o) => (o.style.pointerEvents = "none"));
        if (chosen === right) {
            li.classList.add("success");
            rightAnswers++;
        } else {
            li.classList.add("wrong");
            wrongAnswers++;
            // highlight correct one
            const correctLi = optionLis.find(
                (x) => x.textContent.trim().toLowerCase() === right
            );
            if (correctLi) correctLi.classList.add("success");
        }
        if (scoreSpan) scoreSpan.textContent = String(rightAnswers);
        // after short delay, move on
        setTimeout(() => {
            currentIndex++;
            renderQuestion();
        }, 800);
    }

    function attachHandlers() {
        optionLis.forEach((li) => {
            li.addEventListener("click", handleChoiceClick);
        });
        if (btnRestart)
            btnRestart.addEventListener("click", () => location.reload());
        if (btnNewGame)
            btnNewGame.addEventListener("click", () => location.reload());
    }

    function showResults() {
        stopQuestionTimer();
        // hide quiz elements; show score
        if (flagImg && flagImg.parentElement)
            flagImg.parentElement.style.display = "none";
        const flagOptionsEl = document.querySelector(".flag-options");
        if (flagOptionsEl) flagOptionsEl.style.display = "none";
        if (scoreDiv) scoreDiv.style.display = "block";
        if (correctAns) correctAns.textContent = String(rightAnswers);
        if (incorrectAns) incorrectAns.textContent = String(wrongAnswers);
        // Show the modal to save player's name if present
        const nm = document.getElementById("nameModal");
        if (nm) nm.style.display = "block";
    }

    // Initialization
    fetchQuestions()
        .then((all) => {
            if (!Array.isArray(all) || all.length === 0) {
                showError("No questions available in JSON.");
                return;
            }
            questions = shuffle(all).slice(0, qCount);
            // record quiz start time
            startTime = Date.now();
            // expose quiz start time so save handler can compute elapsed time
            try {
                window.__quizStartTime = startTime;
            } catch (e) {
                /* ignore */
            }
            attachHandlers();
            renderQuestion();
            // render any existing leaderboard entries
            renderLeaderboard();
        })
        .catch((err) => {
            showError("Failed to load questions: " + err.message);
        });
})();

// --- Leaderboard helpers (outside IIFE so they can be called from other code if needed) ---
function loadLeaderboard() {
    try {
        return JSON.parse(localStorage.getItem("leaderboard") || "[]");
    } catch (e) {
        console.error("Failed to parse leaderboard", e);
        return [];
    }
}

function saveLeaderboard(list) {
    localStorage.setItem("leaderboard", JSON.stringify(list));
}

function renderLeaderboard() {
    const list = loadLeaderboard();
    const tbody = document.querySelector("#leaderboardTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    list.sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, 20)
        .forEach((p, i) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(
                p.name
            )}</td><td>${p.score}</td><td>${p.wrong}</td><td>${
                p.time
            }</td><td>${p.date}</td>`;
            tbody.appendChild(tr);
        });
}

function savePlayerData(name, score, wrong, time) {
    const list = loadLeaderboard();
    list.push({
        name: name || "Player",
        score,
        wrong,
        time: Number(time) || 0,
        date: new Date().toLocaleString(),
    });
    saveLeaderboard(list);
    renderLeaderboard();
}

function escapeHtml(s) {
    return String(s).replace(
        /[&<>"']/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[c])
    );
}

// Wire up save button if present
(function wireSave() {
    const btn = document.getElementById("saveScoreBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        const name =
            (
                document.getElementById("playerName") || { value: "" }
            ).value.trim() || "Player";
        // infer score and wrong from DOM if possible
        const score =
            Number(
                (
                    document.querySelector(".score .right span") || {
                        textContent: "0",
                    }
                ).textContent
            ) || 0;
        const wrong =
            Number(
                (
                    document.querySelector(".score .incorrect span") || {
                        textContent: "0",
                    }
                ).textContent
            ) || 0;
        const time =
            Math.round(
                (Date.now() - (window.__quizStartTime || Date.now())) / 1000
            ) || 0;
        savePlayerData(name, score, wrong, time);
        const modal = document.getElementById("nameModal");
        if (modal) modal.style.display = "none";
    });
})();
