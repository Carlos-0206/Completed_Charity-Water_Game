// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
const BASE_GAME_DURATION = 30; // Starting game duration in seconds
const BASE_WIN_SCORE = 20;     // Starting score needed to win
const LEVEL_STEP = 10;         // Increase goal/time by this amount per level
const WIN_MESSAGES = [
  'You Win!!',
  'Awesome job! You crushed it!',
  'Victory! Water saved the day!',
  'Great work! You reached the goal!'
];
const CAN_TYPES = [
  { className: 'water-can', points: 1, label: 'Water can' },
  { className: 'water-can water-can--gold', points: 3, label: 'Golden jerry can' },
  { className: 'water-can water-can--red', points: -1, label: 'Red jerry can' }
];
const MAX_CONSECUTIVE_RED_CANS = 3;
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
let timeLeft = BASE_GAME_DURATION;
let currentLevel = 1;
let currentWinScore = BASE_WIN_SCORE;
let currentGameDuration = BASE_GAME_DURATION;
let audioContext;
let consecutiveRedCanSpawns = 0;

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

function updateLevelDisplay() {
  document.getElementById('current-level').textContent = currentLevel;
}

function updateInstructions() {
  document.getElementById('game-instructions').textContent = `Collect ${currentWinScore} items in ${currentGameDuration} seconds to complete Level ${currentLevel}!`;
}

function updateEndMessage(message = '') {
  document.getElementById('achievements').textContent = message;
}

function getRandomCanType() {
  const randomIndex = Math.floor(Math.random() * CAN_TYPES.length);
  return CAN_TYPES[randomIndex];
}

function getSpawnCanType() {
  const canPool = consecutiveRedCanSpawns >= MAX_CONSECUTIVE_RED_CANS
    ? CAN_TYPES.filter(canType => canType.points !== -1)
    : CAN_TYPES;

  const randomIndex = Math.floor(Math.random() * canPool.length);
  const canType = canPool[randomIndex];

  consecutiveRedCanSpawns = canType.points === -1 ? consecutiveRedCanSpawns + 1 : 0;
  return canType;
}

function collectCan(can) {
  const points = Number(can.dataset.points || 0);
  currentCans = Math.max(0, currentCans + points);
  updateCanDisplay();
  playSplashSound();

  const wrapper = can.closest('.water-can-wrapper');
  if (wrapper) wrapper.remove();
}

function playSplashSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const duration = 0.14;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(420, now);
  oscillator.frequency.exponentialRampToValueAtTime(160, now + duration);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.Q.value = 0.7;

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
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
updateLevelDisplay();
updateInstructions();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const canType = getSpawnCanType();

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="${canType.className}" data-points="${canType.points}" aria-label="${canType.label}" role="button" tabindex="0"></div>
    </div>
  `;
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  currentCans = 0;
  consecutiveRedCanSpawns = 0;
  timeLeft = currentGameDuration;
  updateCanDisplay();
  updateTimerDisplay();
  updateLevelDisplay();
  updateInstructions();
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
  if (currentCans >= currentWinScore) {
    endMessage = `${getRandomMessage(WIN_MESSAGES)} Level ${currentLevel} complete!`;

    currentLevel += 1;
    currentWinScore += LEVEL_STEP;
    currentGameDuration += LEVEL_STEP;

    updateLevelDisplay();
    updateInstructions();
    document.getElementById('play-again').textContent = 'Start Next Level';
  } else {
    endMessage = getRandomMessage(LOSS_MESSAGES);
    document.getElementById('play-again').textContent = 'Try Level Again';
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

  collectCan(can);
});

document.querySelector('.game-grid').addEventListener('keydown', event => {
  if (!gameActive) return;

  const can = event.target.closest('.water-can');
  if (!can) return;

  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  collectCan(can);
});
