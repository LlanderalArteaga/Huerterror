import { gameState, startGame } from './game.js';

export function initUI(onStartCallback) {
    const btnStart = document.getElementById('btnStartGame');
    const btnRestart = document.getElementById('btnRestartGame');

    btnStart.addEventListener('click', () => {
        document.getElementById('startScreen').classList.remove('active');
        document.getElementById('gameHUD').classList.remove('d-none');
        startGame();
        if (onStartCallback) onStartCallback();
    });

    btnRestart.addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('d-none');
        document.getElementById('gameOverScreen').classList.remove('active');
        startGame();
    });
}

export function updateHUD() {
    const healthBar = document.getElementById('healthBar');
    const ammoCount = document.getElementById('ammoCount');
    const scoreCount = document.getElementById('scoreCount');
    const timerCount = document.getElementById('timerCount');
    const cycleText = document.getElementById('cycleText');

    if (healthBar) {
        const h = Math.max(0, Math.round(gameState.health));
        healthBar.style.width = `${h}%`;
        healthBar.textContent = `${h}%`;
    }

    if (ammoCount) ammoCount.textContent = `${gameState.ammo} / 10`;
    if (scoreCount) scoreCount.textContent = gameState.score;

    if (timerCount) {
        const mins = Math.floor(gameState.time / 60).toString().padStart(2, '0');
        const secs = Math.floor(gameState.time % 60).toString().padStart(2, '0');
        timerCount.textContent = `${mins}:${secs}`;
    }

    if (cycleText) {
        cycleText.textContent = gameState.isNight ? "NOCHE 🌙" : "DÍA ☀️";
        cycleText.className = gameState.isNight ? "badge bg-dark fs-6" : "badge bg-primary fs-6";
    }
}

export function showGameOverScreen(message) {
    document.getElementById('gameHUD').classList.add('d-none');
    const screen = document.getElementById('gameOverScreen');
    document.getElementById('endMessage').textContent = message;
    screen.classList.remove('d-none');
    screen.classList.add('active');
}