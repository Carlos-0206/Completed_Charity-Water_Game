// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
const GAME_DURATION = 30;    // Game duration in seconds
const WIN_SCORE = 20;        // Score needed to win
const WIN_MESSAGES = [
  'You Win!!',
  'Awesome job! You crushed it!',
  'Victory! Water saved the day!',
  'Great work! You reached the goal!'
];
const LOSS_MESSAGES = [
  'Try again..',
  'So close! Give it another shot!',
  'Nice effort! One more round?',
  'Keep going! You can do this!'
];
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;          // Holds the interval for spawning items
let timerInterval;          // Holds the interval for countdown timer
let timeLeft = GAME_DURATION;

function getRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function updateCanDisplay() {
  document.getElementById('current-cans').textContent = currentCans;
}

function updateTimerDisplay() {
  document.getElementById('timer').textContent = timeLeft;
}

function updateEndMessage(message = '') {
  document.getElementById('achievements').textContent = message;
}

function showEndPopup(message) {
  document.getElementById('popup-message').textContent = message;
  document.getElementById('end-game-popup').classList.remove('hidden');
}

function hideEndPopup() {
  document.getElementById('end-game-popup').classList.add('hidden');
}

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  currentCans = 0;
  timeLeft = GAME_DURATION;
  updateCanDisplay();
  updateTimerDisplay();
  updateEndMessage('');
  hideEndPopup();
  createGrid(); // Set up the game grid
  spawnInterval = setInterval(spawnWaterCan, 1000); // Spawn water cans every second
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop countdown timer

  let endMessage;
  if (currentCans >= WIN_SCORE) {
    endMessage = getRandomMessage(WIN_MESSAGES);
  } else {
    endMessage = getRandomMessage(LOSS_MESSAGES);
  }

  updateEndMessage(endMessage);
  showEndPopup(endMessage);

  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('play-again').addEventListener('click', startGame);

// Count clicks on spawned cans using event delegation on the grid
document.querySelector('.game-grid').addEventListener('click', event => {
  if (!gameActive) return;

  const can = event.target.closest('.water-can');
  if (!can) return;

  currentCans += 1;
  updateCanDisplay();

  const wrapper = can.closest('.water-can-wrapper');
  if (wrapper) wrapper.remove();
});
