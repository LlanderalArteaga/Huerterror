import { gameState, startGame, startLevel2Game, startLevel3Game } from './game.js';

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
    const btnStartLevel2 = document.getElementById('btnStartLevel2');
    const btnStartLevel3 = document.getElementById('btnStartLevel3');

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

    if (btnStartLevel2) {
        btnStartLevel2.addEventListener('click', () => {
            const level2Screen = document.getElementById('level2Screen');
            if (level2Screen) {
                level2Screen.classList.remove('active');
                level2Screen.classList.add('d-none');
            }

            const hud = document.getElementById('gameHUD');
            if (hud) hud.classList.remove('d-none');

            setCrosshairVisible(true);
            startLevel2Game();
        });
    }

    if (btnStartLevel3) {
        btnStartLevel3.addEventListener('click', () => {
            const level3Screen = document.getElementById('level3Screen');
            if (level3Screen) {
                level3Screen.classList.remove('active');
                level3Screen.classList.add('d-none');
            }

            const hud = document.getElementById('gameHUD');
            if (hud) hud.classList.remove('d-none');

            setCrosshairVisible(true);
            startLevel3Game();
        });
    }
}

export function showLevel2Screen() {
    setCrosshairVisible(false);
    hideInteractionPrompt();

    const hud = document.getElementById('gameHUD');
    if (hud) hud.classList.add('d-none');

    const level2Screen = document.getElementById('level2Screen');
    if (level2Screen) {
        level2Screen.classList.remove('d-none');
        level2Screen.classList.add('active');
    }
}

export function showLevel3Screen() {
    setCrosshairVisible(false);
    hideInteractionPrompt();

    const hud = document.getElementById('gameHUD');
    if (hud) hud.classList.add('d-none');

    const level3Screen = document.getElementById('level3Screen');
    if (level3Screen) {
        level3Screen.classList.remove('d-none');
        level3Screen.classList.add('active');
    }
}

export function updateHUD() {
    const healthBar = document.getElementById('healthBar');
    const ammoCount = document.getElementById('ammoCount');
    const scoreCount = document.getElementById('scoreCount');
    const timerCount = document.getElementById('timerCount');
    const objectiveText = document.getElementById('objectiveText');
    const objectiveLabel = document.getElementById('objectiveLabel');

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

    if (objectiveText) {
        if (gameState.level === 1) {
            if (objectiveLabel) objectiveLabel.textContent = "NIVEL 1: OBJETIVO";
            if (!gameState.doorOpen) {
                objectiveText.textContent = 'Elimina Zombies: ' + gameState.zombiesKilled + ' / ' + gameState.targetZombies;
                objectiveText.className = 'badge bg-warning text-dark fs-6';
            } else {
                objectiveText.textContent = '¡Puertas abiertas! Escapa por la salida 🚪';
                objectiveText.className = 'badge bg-success text-white fs-6';
            }
        } else if (gameState.level === 2) {
            if (objectiveLabel) objectiveLabel.textContent = "NIVEL 2: OBJETIVO";
            if (!gameState.doorOpen) {
                objectiveText.textContent = 'Encuentra Llaves: ' + gameState.keysFound + ' / ' + gameState.targetKeys + ' 🔑';
                objectiveText.className = 'badge bg-danger text-white fs-6';
            } else {
                objectiveText.textContent = '¡Llaves completas! ¡Corre al portal final! 🚪';
                objectiveText.className = 'badge bg-success text-white fs-6';
            }
        } else if (gameState.level === 3) {
            if (objectiveLabel) objectiveLabel.textContent = "NIVEL 3: OBJETIVO";
            objectiveText.textContent = 'Sobrevive a la Horda Suprema 🔥';
            objectiveText.className = 'badge bg-danger text-white fs-6';
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
    const finalScore = document.getElementById('finalScore');
    const finalTime = document.getElementById('finalTime');

    if (endTitle) {
        endTitle.textContent = title;
        endTitle.className = "game-over-title display-1 fw-bold text-danger mb-2";
    }
    if (endMessage) endMessage.textContent = message;

    if (finalScore) finalScore.textContent = gameState.score;
    if (finalTime) {
        const mins = Math.floor(gameState.time / 60).toString().padStart(2, '0');
        const secs = Math.floor(gameState.time % 60).toString().padStart(2, '0');
        finalTime.textContent = mins + ':' + secs;
    }

    if (screen) {
        screen.classList.remove('d-none');
        screen.classList.add('active');
    }
}

export function showVictoryScreen() {
    setCrosshairVisible(false);
    hideInteractionPrompt();

    const hud = document.getElementById('gameHUD');
    if (hud) hud.classList.add('d-none');

    const screen = document.getElementById('gameOverScreen');
    const endTitle = document.getElementById('endTitle');
    const endMessage = document.getElementById('endMessage');
    const finalScore = document.getElementById('finalScore');
    const finalTime = document.getElementById('finalTime');

    if (endTitle) {
        endTitle.textContent = "¡HAS ESCAPADO!";
        endTitle.className = "game-title display-1 fw-bold text-success mb-2";
    }
    if (endMessage) {
        endMessage.textContent = "Lograste recolectar las llaves y sobrevivir a la noche zombie.";
    }

    if (finalScore) finalScore.textContent = gameState.score;
    if (finalTime) {
        const mins = Math.floor(gameState.time / 60).toString().padStart(2, '0');
        const secs = Math.floor(gameState.time % 60).toString().padStart(2, '0');
        finalTime.textContent = mins + ':' + secs;
    }

    if (screen) {
        screen.classList.remove('d-none');
        screen.classList.add('active');
    }
}

let damageFlashElem = null;
let flashTimeout = null;

function createDamageFlashUI() {
    if (document.getElementById('damage-flash')) return;
    
    damageFlashElem = document.createElement('div');
    damageFlashElem.id = 'damage-flash';
    damageFlashElem.style.position = 'fixed';
    damageFlashElem.style.top = '0';
    damageFlashElem.style.left = '0';
    damageFlashElem.style.width = '100vw';
    damageFlashElem.style.height = '100vh';
    damageFlashElem.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
    damageFlashElem.style.pointerEvents = 'none';
    damageFlashElem.style.opacity = '0';
    damageFlashElem.style.transition = 'opacity 0.1s ease-out';
    damageFlashElem.style.zIndex = '9999';
    document.body.appendChild(damageFlashElem);
}

export function triggerDamageFlash() {
    if (!damageFlashElem) createDamageFlashUI();

    damageFlashElem.style.opacity = '1';

    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
        if (damageFlashElem) damageFlashElem.style.opacity = '0';
    }, 150);
}