import * as THREE from 'three';
import { updateHUD, showGameOverScreen, setCrosshairVisible } from './ui.js';

export const gameState = {
    isPlaying: false,
    level: 1,
    health: 100,
    ammo: 10,
    score: 0,
    zombiesKilled: 0,
    targetZombies: 10,
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
    gameState.score = 0;
    gameState.zombiesKilled = 0;
    gameState.targetZombies = 10;
    gameState.doorOpen = false;
    gameState.time = 0;

    setCrosshairVisible(true);
    updateHUD();
}

// Llama a esta función cada vez que un zombie es eliminado por un jitomate
export function onZombieKilled() {
    if (!gameState.isPlaying) return;

    gameState.score += 1;
    gameState.zombiesKilled += 1;

    // Verificar si se completó la meta del Nivel 1
    if (gameState.level === 1 && gameState.zombiesKilled >= gameState.targetZombies && !gameState.doorOpen) {
        gameState.doorOpen = true;
        // Aquí puedes agregar el código de animación para abrir las puertas 3D
    }

    updateHUD();
}

export function updateGame(delta, scene) {
    if (!gameState.isPlaying) return;

    gameState.time += delta;

    if (gameState.health <= 0) {
        gameState.isPlaying = false;
        showGameOverScreen("GAME OVER", "Los zombies arrasaron con el huerto.");
    }

    updateHUD();
}
