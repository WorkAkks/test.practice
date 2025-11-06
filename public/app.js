const registerForm = document.getElementById('register-form');
const nextCaseButton = document.getElementById('next-case');
const caseCounter = document.getElementById('case-counter');
const bugReport = document.getElementById('bug-report');
const bugType = document.getElementById('bug-type');
const resultsContainer = document.getElementById('results-container');
const results = document.getElementById('results');
const container = document.querySelector('.container');
const h1 = document.querySelector('h1');
const swaggerLink = document.querySelector('.swagger-link');

let stage = 0;
const userAnswers = [];

const getStage = async () => {
  const response = await fetch('/stage');
  const data = await response.json();
  stage = data.stage;
  caseCounter.textContent = `Case ${stage + 1}`;
  if (stage === 5) {
    nextCaseButton.textContent = 'Finish';
  } else {
    nextCaseButton.textContent = 'Next Case';
  }
};

getStage();

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  let url = '/register';
  let headers = { 'Content-Type': 'application/json' };
  let body = JSON.stringify({ name, email, password });
  let method = 'POST';

  if (stage === 0) {
    // No request
    return;
  }

  if (stage === 3) {
    url = '/register-bad';
  }

  if (stage === 4) {
    body = JSON.stringify({ n: name, e: email, p: password });
  }

  if (stage === 5) {
    method = 'PUT';
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    const data = await response.text();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
});

nextCaseButton.addEventListener('click', async () => {
  userAnswers[stage] = { 
    description: bugReport.value,
    type: bugType.value
  };
  bugReport.value = '';

  if (stage === 5) {
    const response = await fetch('/bugs');
    const correctAnswers = await response.json();
    displayResults(correctAnswers);
  } else {
    await fetch('/next-case', { method: 'POST' });
    getStage();
  }
});

const displayResults = (correctAnswers) => {
  h1.style.display = 'none';
  caseCounter.style.display = 'none';
  swaggerLink.style.display = 'none';
  container.style.display = 'none';
  resultsContainer.style.display = 'block';
  results.innerHTML = '';
  for (let i = 0; i < correctAnswers.length; i++) {
    const result = document.createElement('div');
    result.classList.add('result');
    result.innerHTML = `
      <h3>Case ${i + 1}</h3>
      <p><strong>Your Answer:</strong> ${userAnswers[i] ? `${userAnswers[i].type} - ${userAnswers[i].description}` : 'No answer'}</p>
      <p><strong>Correct Answer:</strong> ${correctAnswers[i]}</p>
    `;
    results.appendChild(result);
  }
};
