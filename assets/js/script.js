// 🎮 Flag Quiz + Leaderboard + Countdown Timer (20s per question)


let countSpan = document.querySelector(".count span");
let flagImgDiv = document.querySelector(".flag-img");
let flagImg = document.querySelector(".flag-img img");
let flagOptions = document.querySelector(".flag-options ul");
let flagLis = document.querySelectorAll(".flag-options ul li");
let score = document.querySelector("h3 span");
let scoreDiv = document.querySelector(".score");
let correctAns = document.querySelector(".score .right span");
let incorrectAns = document.querySelector(".score .incorrect span");
let btnNewGame = document.querySelector("#newGame");
let btnRestart = document.querySelector("#restartGame");


// Leaderboard elements
let nameModal = document.getElementById("nameModal");
let playerNameInput = document.getElementById("playerName");
let saveScoreBtn = document.getElementById("saveScoreBtn");


// Timer display (add this <div class="timer"><span></span></div> in your HTML near the question)
let timerDisplay = document.querySelector(".timer span") || document.getElementById("timeLeft");


let currentIndex = 0;
let rightAnswers = 0;
let wrongAnswers = 0;
let totalSeconds = 0;
let questionTimer; // per-question timer
let overallTimer;  // total game timer
let timeLeft = 20; // seconds per question


// Restart button
btnRestart.addEventListener("click", () => {
  restartGame();
});


// Start total timer
function startTotalTimer() {
  totalSeconds = 0;
  overallTimer = clearInterval(overallTimer);
  overallTimer = setInterval(() => {
    totalSeconds++;
  }, 1000);
}


// Start per-question countdown
function startQuestionTimer(questions, qCount) {
  clearInterval(questionTimer);
  timeLeft = 20;
  if (timerDisplay) timerDisplay.textContent = timeLeft;

  questionTimer = setInterval(() => {
    timeLeft--;
    if (timerDisplay) timerDisplay.textContent = timeLeft;

    // Time ran out
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      wrongAnswers++;
      currentIndex++;
      setTimeout(() => {
        moveToNextQuestion(questions, qCount);
      }, 300);
    }
  }, 1000);
}


// Fetch questions
function getQuestions() {
  let myRequest = new XMLHttpRequest();
  myRequest.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      let questions = JSON.parse(this.responseText);
      let qCount = 5;
      questionNum(qCount);

      // Randomize and pick qCount questions
      questions = questions.sort(() => Math.random() - Math.random()).slice(0, qCount);

      // Show first question
      addQuestionData(questions[currentIndex], qCount);

      // Start timers
      startTotalTimer();
      startQuestionTimer(questions, qCount);

      // Attach click handlers once
      flagLis.forEach((li) => {
        li.addEventListener("click", () => {
          // Prevent clicks when game finished
          if (currentIndex >= qCount) return;

          clearInterval(questionTimer);
          let rightAnswer = questions[currentIndex].right_answer;
          li.classList.add("active");

          // Increase index so next question will be used when moving on
          currentIndex++;

          // Check answer after a short delay for UX
          setTimeout(() => {
            checkAnswer(rightAnswer, qCount);
          }, 150);

          // Prepare next question / end after showing result
          setTimeout(() => {
            // Remove active class and status classes from this li
            li.classList.remove("active", "success", "wrong");

            // Move to next question or show results
            moveToNextQuestion(questions, qCount);
          }, 1000);
        });
      });
    }
  };
  myRequest.open("GET", "assets/js/flag_questions.json", true);
  myRequest.send();
}


getQuestions();




function questionNum(num) {
  countSpan.innerHTML = num;
}


function addQuestionData(obj, count) {
  if (currentIndex < count) {
    countSpan.innerHTML = `${currentIndex + 1} / ${count}`;
    // set image src (relative to index.html)
    flagImg.src = `assets/images/${obj.img}`;
    flagImg.alt = obj.options ? obj.options[0] : "flag";
    flagLis.forEach((li, index) => {
      li.innerHTML = obj.options[index];
      li.classList.remove("success", "wrong");
    });
    score.innerHTML = rightAnswers;
  }
}


// Move to next question or end
function moveToNextQuestion(questions, qCount) {
  if (currentIndex < qCount) {
    addQuestionData(questions[currentIndex], qCount);
    startQuestionTimer(questions, qCount);
  } else {
    showResults(qCount);
  }
}


function checkAnswer(rAnswer, count) {
  flagLis.forEach((li) => {
    if (li.classList.contains("active")) {
      let choosenAnswer = li.innerHTML.toLowerCase();
      if (rAnswer.toLowerCase() === choosenAnswer) {
        li.classList.add("success");
        rightAnswers++;
      } else {
        li.classList.add("wrong");
        wrongAnswers++;
      }
    }
  });
}


// 🧮 Leaderboard Functions
function showLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";


  leaderboard
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 10)
    .forEach((player, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.name}</td>
        <td>${player.score}</td>
        <td>${player.wrong}</td>
        <td>${player.time}</td>
        <td>${player.date}</td>
      `;
      tbody.appendChild(row);
    });
}


function savePlayerData(name, score, wrong, time) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({
    name: name || "Player",
    score,
    wrong,
    time,
    date: new Date().toLocaleString(),
  });
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  showLeaderboard();
}


function showResults(count) {
  if (currentIndex === count) {
    clearInterval(questionTimer);
    clearInterval(overallTimer);
    flagImgDiv.remove();
    flagOptions.remove();
    scoreDiv.style.display = "block";
    correctAns.innerHTML = rightAnswers;
    incorrectAns.innerHTML = wrongAnswers;


    // Ask for player name
    nameModal.style.display = "block";
    saveScoreBtn.onclick = () => {
      const name = playerNameInput.value.trim() || "Player";
      savePlayerData(name, rightAnswers, wrongAnswers, totalSeconds);
      nameModal.style.display = "none";
    };
  }
}


function restartGame() {
  currentIndex = 0;
  rightAnswers = 0;
  wrongAnswers = 0;
  totalSeconds = 0;
  clearInterval(questionTimer);
  clearInterval(overallTimer);
  scoreDiv.style.display = "none";
  window.location.reload();
}


btnNewGame.addEventListener("click", restartGame);
showLeaderboard();



