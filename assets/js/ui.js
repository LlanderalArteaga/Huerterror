import { gameState, startGame } from './game.js';

export function setCrosshairVisible(visible) {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        if (visible) crosshair.classList.remove('d-none');
        else crosshair.classList.add('d-none');
    }
}

export function showInteractionPrompt(text) {
    const prompt = document.getElementById('interactionPrompt');
    const promptText = document.getElementById('promptText');
    if (prompt && promptText) {
        promptText.textContent = text;
        prompt.classList.remove('d-none');
    }
}

export function hideInteractionPrompt() {
    const prompt = document.getElementById('interactionPrompt');
    if (prompt) prompt.classList.add('d-none');
}

export function initUI(onStartCallback) {
    const btnStart = document.getElementById('btnStartGame');
    const btnRestart = document.getElementById('btnRestartGame');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.classList.remove('active');
                startScreen.classList.add('d-none');
            }

            const hud = document.getElementById('gameHUD');
            if (hud) hud.classList.remove('d-none');

            setCrosshairVisible(true);
            startGame();
            if (onStartCallback) onStartCallback();
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) {
                gameOverScreen.classList.add('d-none');
                gameOverScreen.classList.remove('active');
            }

            const hud = document.getElementById('gameHUD');
            if (hud) hud.classList.remove('d-none');

            setCrosshairVisible(true);
            startGame();
        });
    }
}

export function updateHUD() {
    const healthBar = document.getElementById('healthBar');
    const ammoCount = document.getElementById('ammoCount');
    const scoreCount = document.getElementById('scoreCount');
    const timerCount = document.getElementById('timerCount');
    const objectiveText = document.getElementById('objectiveText');

    if (healthBar) {
        const h = Math.max(0, Math.round(gameState.health));
        healthBar.style.width = h + '%';
        healthBar.textContent = h + '%';
    }

    if (ammoCount) ammoCount.textContent = gameState.ammo + ' / 10';
    if (scoreCount) scoreCount.textContent = gameState.score;

    if (timerCount) {
        const mins = Math.floor(gameState.time / 60).toString().padStart(2, '0');
        const secs = Math.floor(gameState.time % 60).toString().padStart(2, '0');
        timerCount.textContent = mins + ':' + secs;
    }

    // Lógica del Objetivo Nivel 1
    if (objectiveText) {
        if (gameState.level === 1) {
            if (!gameState.doorOpen) {
                objectiveText.textContent = `Elimina Zombies: ${gameState.zombiesKilled} / ${gameState.targetZombies}`;
                objectiveText.className = 'badge bg-warning text-dark fs-6';
            } else {
                objectiveText.textContent = '¡Puertas abiertas! Escapa por la salida 🚪';
                objectiveText.className = 'badge bg-success text-white fs-6';
            }
        }
    }
}

export function showGameOverScreen(title, message) {
    setCrosshairVisible(false);
    hideInteractionPrompt();

    const hud = document.getElementById('gameHUD');
    if (hud) hud.classList.add('d-none');

    const screen = document.getElementById('gameOverScreen');
    const endTitle = document.getElementById('endTitle');
    const endMessage = document.getElementById('endMessage');

    if (endTitle) endTitle.textContent = title;
    if (endMessage) endMessage.textContent = message;

    if (screen) {
        screen.classList.remove('d-none');
        screen.classList.add('active');
    }
}
