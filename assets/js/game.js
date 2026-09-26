import * as THREE from 'three';
import { updateHUD, showGameOverScreen, showLevel2Screen, showLevel3Screen } from './ui.js';
import { playerMesh } from './player.js';

export const gameState = {
    isPlaying: false,
    level: 1,
    health: 100,
    ammo: 10,
    score: 0,            // Score global
    zombiesKilled: 0,    // Nivel 1
    targetZombies: 10,
    keysFound: 0,        // Nivel 2
    targetKeys: 3,
    doorOpen: false,
    time: 0
};

let dirLight = null;
let ambientLight = null;

export function initGameLogic(scene) {
    ambientLight = new THREE.AmbientLight(0x665577, 0.4);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0x8899cc, 0.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
}

export function startGame() {
    gameState.isPlaying = true;
    gameState.level = 1;
    gameState.health = 100;
    gameState.ammo = 10;
    gameState.score = 0;            // Reinicio global
    gameState.zombiesKilled = 0;
    gameState.targetZombies = 10;
    gameState.keysFound = 0;
    gameState.targetKeys = 3;
    gameState.doorOpen = false;
    gameState.time = 0;

    if (playerMesh) {
        playerMesh.position.set(0, 0, 0);
    }

    updateHUD();
}

export function triggerLevel2Transition() {
    gameState.isPlaying = false;
    showLevel2Screen();
}

export function startLevel2Game() {
    gameState.isPlaying = true;
    gameState.level = 2;
    gameState.health = 100;
    gameState.ammo = 10;
    gameState.doorOpen = false;
    gameState.keysFound = 0;
    gameState.targetKeys = 3;
    gameState.time = 0;

    if (playerMesh) {
        playerMesh.position.set(0, 0, 0);
    }

    updateHUD();
}

export function triggerLevel3Transition() {
    gameState.isPlaying = false;
    showLevel3Screen();
}

export function startLevel3Game() {
    gameState.isPlaying = true;
    gameState.level = 3;
    gameState.health = 100;
    gameState.ammo = 10;
    gameState.doorOpen = false;
    gameState.time = 0;

    if (playerMesh) {
        playerMesh.position.set(0, 0, 0);
    }

    updateHUD();
}

export function onZombieKilled() {
    if (!gameState.isPlaying) return;

    gameState.score += 1;

    if (gameState.level === 1) {
        gameState.zombiesKilled += 1;
        if (gameState.zombiesKilled >= gameState.targetZombies && !gameState.doorOpen) {
            gameState.doorOpen = true;
        }
    }

    updateHUD();
}

export function onKeyCollected() {
    if (!gameState.isPlaying || gameState.level !== 2) return;

    gameState.keysFound += 1;
    if (gameState.keysFound >= gameState.targetKeys) {
        gameState.doorOpen = true;
    }

    updateHUD();
}

export function updateGame(delta) {
    if (!gameState.isPlaying) return;

    gameState.time += delta;

    if (gameState.health <= 0) {
        gameState.isPlaying = false;
        showGameOverScreen("¡HAS MUERTO!", "Los zombies arrasaron con el huerto.");
    }

    updateHUD();
}