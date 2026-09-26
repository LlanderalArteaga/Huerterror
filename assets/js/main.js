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
import { initTomb, spawnTomb, updateTomb, clearTomb } from './tomb.js';

let scene, camera, renderer, clock;
let spawnTimer = 0;
let activeLevelLoaded = 0;

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
    initChests(scene);
    initTomb(scene);
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
        // Gestión de carga de props según el nivel activo
        if (gameState.level !== activeLevelLoaded) {
            clearChests(scene);
            clearTomb(scene);

            if (gameState.level === 2) {
                spawnChests(scene); // 3 cofres para el nivel 2
            } else if (gameState.level === 3) {
                spawnChests(scene); // 5 cofres para el nivel 3
                spawnTomb(scene);   // Genera el ataúd en el centro
            }

            activeLevelLoaded = gameState.level;
        }

        updatePhysics();
        updatePlayer(delta, camera);
        updateTomatoes(delta, scene);
        updateEnemies(delta, scene);
        updateAnimals(delta);
        updateGates(delta);
        updateChests(delta, scene);
        updateTomb(delta, scene);
        updateGame(delta, scene);

        // Ajuste de velocidad de aparición de zombies según el nivel y estado
        let spawnInterval = 4.0;
        if (gameState.level === 2) {
            spawnInterval = gameState.doorOpen ? 1.5 : 2.5;
        } else if (gameState.level === 3) {
            spawnInterval = 1.5; // Furia continua en Nivel 3
        }

        spawnTimer += delta;
        if (spawnTimer >= spawnInterval) {
            spawnZombie(scene);
            spawnTimer = 0;
        }
    } else {
        // Si no está jugando, reiniciamos el control de nivel cargado
        if (activeLevelLoaded !== 0) {
            clearChests(scene);
            clearTomb(scene);
            activeLevelLoaded = 0;
        }
    }

    renderer.render(scene, camera);
}

init();