import * as THREE from 'three';
import { updateHUD, showGameOverScreen } from './ui.js';

export const gameState = {
    isPlaying: false,
    health: 100,
    ammo: 10,
    score: 0,
    time: 0,
    isNight: false
};

let dirLight = null;
let ambientLight = null;

export function initGameLogic(scene) {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
}

export function startGame() {
    gameState.isPlaying = true;
    gameState.health = 100;
    gameState.ammo = 10;
    gameState.score = 0;
    gameState.time = 0;
    updateHUD();
}

export function updateGame(delta, scene) {
    if (!gameState.isPlaying) return;

    gameState.time += delta;

    // Ciclo Día / Noche cada 30 segundos
    const cycle = Math.floor(gameState.time / 30) % 2;
    gameState.isNight = cycle === 1;

    if (gameState.isNight) {
        dirLight.intensity = 0.15;
        ambientLight.intensity = 0.2;
    } else {
        dirLight.intensity = 1.2;
        ambientLight.intensity = 0.6;
    }

    // Condición de Derrota
    if (gameState.health <= 0) {
        gameState.isPlaying = false;
        showGameOverScreen("¡LOS ZOMBIES INVADIERON LA GRANJA!");
    }

    updateHUD();
}