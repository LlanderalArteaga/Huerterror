import * as THREE from 'three';
import { initPhysics, updatePhysics } from './physics.js';
import { loadCustomMap } from './mapLoader.js';
import { initPlayer, updatePlayer } from './player.js';
import { initTomatoProps, updateTomatoes } from './tomato.js';
import { initEnemiesAndProps, updateEnemies, spawnZombie } from './enemies.js';
import { initGameLogic, updateGame, gameState } from './game.js';
import { initAnimals, updateAnimals } from './animals.js';
import { initGates, updateGates } from './doors.js';
import { initUI } from './ui.js';
import { initChests, spawnChests, updateChests, clearChests } from './chests.js';

let scene, camera, renderer, clock;
let spawnTimer = 0;
let level2ChestsSpawned = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f101d);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    clock = new THREE.Clock();

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    initPhysics().then(async () => {
        await loadCustomMap(scene);
    }).catch(err => console.error("Error al cargar Rapier Physics / Mapa:", err));

    initGameLogic(scene);
    initPlayer(scene, camera);
    initTomatoProps(scene);
    initEnemiesAndProps(scene);
    initAnimals(scene);
    initGates(scene);
    initChests(scene); // <-- Inicializa precarga de modelos de cofres
    initUI();

    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (gameState.isPlaying) {
        // Control de spawn/limpieza de cofres
        if (gameState.level === 2 && !level2ChestsSpawned) {
            spawnChests(scene);
            level2ChestsSpawned = true;
        } else if (gameState.level === 1 && level2ChestsSpawned) {
            clearChests(scene);
            level2ChestsSpawned = false;
        }

        updatePhysics();
        updatePlayer(delta, camera);
        updateTomatoes(delta, scene);
        updateEnemies(delta, scene);
        updateAnimals(delta);
        updateGates(delta);
        updateChests(delta, scene); // <-- Actualiza interacción de cofres
        updateGame(delta, scene);

        // Frecuencia de aparición de zombies (más rápida cuando la horda se enfurece)
        const spawnInterval = (gameState.level === 2 && gameState.doorOpen) ? 1.5 : (gameState.level === 2 ? 2.5 : 4.0);

        spawnTimer += delta;
        if (spawnTimer >= spawnInterval) {
            spawnZombie(scene);
            spawnTimer = 0;
        }
    }

    renderer.render(scene, camera);
}

init();