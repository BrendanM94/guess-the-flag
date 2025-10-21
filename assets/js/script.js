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

let currentIndex = 0;
let rightAnswers = 0;
let wrongAnswers = 0;

function getQuestions() {
    let myRequest = new XMLHttpRequest();
    myRequest.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            let questions = JSON.parse(this.responseText);
            //Number Of Question Each New Game
            let qCount = 5;
            questionNum(qCount);
            //Random Question Each New Game
            questions = questions
                .sort(() => Math.random() - Math.random())
                .slice(0, qCount);

            //Add Questions Data
            addQuestionData(questions[currentIndex], qCount);

            flagLis.forEach((li) => {
                li.addEventListener("click", () => {
                    let rightAnswer = questions[currentIndex].right_answer;
                    li.classList.add("active");
                    //Increase Index
                    currentIndex++;

                    //Check The Answer after 500ms
                    setTimeout(() => {
                        checkAnswer(rightAnswer, qCount);
                    }, 150);

                    setTimeout(() => {
                        //Remove Previous Image Source
                        flagImg.src = "";
                        //Remove All Classes (active,success,wrong)
                        li.classList.remove("active");
                        li.classList.remove("success");
                        li.classList.remove("wrong");

                        //Add Questions Data To Show The Next Question
                        addQuestionData(questions[currentIndex], qCount);
                    }, 1000);

                    //Show Results
                    setTimeout(() => {
                        showResults(qCount);
                    }, 1002);
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
        //Update question counter
        countSpan.innerHTML = `${currentIndex + 1} / ${count}`;

        //Add flag image
        flagImg.src = `assets/images/${obj.img}`;

        //Add options
        flagLis.forEach((li, index) => {
            li.innerHTML = obj.options[index];
            li.classList.remove("success", "wrong");
        });

        //Update score
        score.innerHTML = rightAnswers;
    }
}

function checkAnswer(rAnswer, count) {
    let choosenAnswer;

    flagLis.forEach((li) => {
        if (li.classList.contains("active")) {
            choosenAnswer = li.innerHTML.toLowerCase();

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

function showResults(count) {
    if (currentIndex === count) {
        flagImgDiv.remove();
        flagOptions.remove();
        scoreDiv.style.display = "block";
        correctAns.innerHTML = rightAnswers;
        incorrectAns.innerHTML = wrongAnswers;
    }
}

btnNewGame.addEventListener("click", () => {
    window.location.reload();
});
