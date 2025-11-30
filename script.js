let questions = [];
let currentQuestion = 0;
let score = 0;
let timerInterval;

// Elements
const startBtn = document.getElementById("start-btn");
const topicInput = document.getElementById("topic");
const quizArea = document.getElementById("quiz-area");
const questionCard = document.getElementById("question-card");
const resultArea = document.getElementById("result-area");
const scoreText = document.getElementById("score-text");
const timerEl = document.getElementById("timer");
const loading = document.getElementById("loading");

// Dynamically create submit button
const submitBtn = document.createElement("button");
submitBtn.id = "submit-btn";
submitBtn.innerText = "Submit";
submitBtn.style.padding = "10px 20px";
submitBtn.style.marginTop = "15px";
submitBtn.style.borderRadius = "12px";
submitBtn.style.border = "none";
submitBtn.style.background = "linear-gradient(90deg, #4facfe, #00f2fe)";
submitBtn.style.color = "#fff";
submitBtn.style.fontWeight = "bold";
submitBtn.style.cursor = "pointer";
submitBtn.style.display = "none";

let selectedAnswer = null;

// Map topics to Open Trivia DB categories
const categoryMap = {
  "General Knowledge": 9,
  "Books": 10,
  "Film": 11,
  "Music": 12,
  "Science": 17,
  "Computers": 18,
  "Math": 19,
  "Mythology": 20,
  "Sports": 21,
  "Geography": 22,
  "History": 23,
  "Politics": 24,
  "Art": 25,
  "Celebrities": 26,
  "Animals": 27,
  "Vehicles": 28,
  "Comics": 29,
  "Gadgets": 30
};

// Start quiz
startBtn.addEventListener("click", async () => {
  const topic = topicInput.value.trim();
  if (!topic) return alert("Please enter a topic!");

  loading.classList.remove("hidden");
  quizArea.classList.add("hidden");
  resultArea.classList.add("hidden");

  try {
    questions = await generateQuestions(topic);
    loading.classList.add("hidden");

    if (questions.length === 0) {
      alert("No questions found for this topic. Try another topic.");
      return;
    }

    currentQuestion = 0;
    score = 0;
    quizArea.classList.remove("hidden");
    showQuestion();
  } catch (err) {
    loading.classList.add("hidden");
    alert("Failed to generate questions. Check console.");
    console.error(err);
  }
});

// Show question
function showQuestion() {
  clearInterval(timerInterval);
  selectedAnswer = null;
  questionCard.innerHTML = "";

  const q = questions[currentQuestion];
  const questionTitle = document.createElement("h3");
  questionTitle.innerText = decodeHTML(q.question);
  questionCard.appendChild(questionTitle);

  const options = shuffleArray([q.correct_answer, ...q.incorrect_answers]);
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = decodeHTML(opt);
    btn.addEventListener("click", () => selectOption(btn, opt));
    questionCard.appendChild(btn);
  });

  // Append submit button
  submitBtn.style.display = "none";
  submitBtn.innerText = "Submit";
  submitBtn.disabled = true; // disabled until user selects
  submitBtn.onclick = () => submitAnswer(q.correct_answer);
  questionCard.appendChild(submitBtn);

  startTimer(30);
}

// Timer
function startTimer(seconds) {
  let time = seconds;
  timerEl.innerText = `⏰ ${time}s`;

  timerInterval = setInterval(() => {
    time--;
    timerEl.innerText = `⏰ ${time}s`;

    if (time <= 0) {
      clearInterval(timerInterval);
      submitAnswer(questions[currentQuestion].correct_answer, true);
    }
  }, 1000);
}

// Option selection
function selectOption(button, answer) {
  selectedAnswer = answer;

  // Highlight selected option
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(btn => btn.style.borderColor = "#aaa"); // reset borders
  button.style.borderColor = "#4facfe";

  // Show submit button
  submitBtn.style.display = "inline-block";
  submitBtn.disabled = false;
}

// Submit answer
function submitAnswer(correct, timeout = false) {
  clearInterval(timerInterval);

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerText === decodeHTML(correct)) {
      btn.style.backgroundColor = "#4facfe";
      btn.style.color = "#fff";
    }
  });

  if (!timeout && selectedAnswer && selectedAnswer !== correct) {
    buttons.forEach(btn => {
      if (btn.innerText === selectedAnswer) {
        btn.style.backgroundColor = "#f44336";
      }
    });

    const explanation = document.createElement("p");
    explanation.innerText = `💡 Hint/Explanation: Think why "${decodeHTML(correct)}" is correct.`;
    explanation.style.marginTop = "10px";
    explanation.style.color = "#555";
    questionCard.appendChild(explanation);

    // Wait 2 seconds before enabling Next Question
    submitBtn.innerText = "Next Question (after 2s)";
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerText = "Next Question";
    }, 2000);
  } else if (selectedAnswer === correct) {
    score++;
    submitBtn.innerText = "Next Question";
  }

  // Change submit button to move to next question
  submitBtn.onclick = () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      showResult();
    }
  };
}

// Show result
function showResult() {
  quizArea.classList.add("hidden");
  resultArea.classList.remove("hidden");

  scoreText.innerText = `You scored ${score} out of ${questions.length}`;

  const ctx = document.getElementById("score-chart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [score, questions.length - score],
        backgroundColor: ["#4facfe", "#f44336"]
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// Retry button
document.getElementById("retry-btn").addEventListener("click", () => {
  topicInput.value = "";
  resultArea.classList.add("hidden");
});

// ===================
// Fetch Trivia Questions
// ===================
async function generateQuestions(topic) {
  const category = categoryMap[topic] || 9;
  const response = await fetch(`https://opentdb.com/api.php?amount=15&category=${category}&type=multiple`);
  const data = await response.json();

  if (!data.results) throw new Error("No questions returned");

  return data.results;
}

// ===================
// Utility functions
// ===================
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}
