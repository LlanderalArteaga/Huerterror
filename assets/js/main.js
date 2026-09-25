import * as THREE from 'three';
import { initPhysics, updatePhysics } from './physics.js';
import { loadCustomMap } from './mapLoader.js';
import { initPlayer, updatePlayer } from './player.js';
import { initTomatoProps, updateTomatoes } from './tomato.js';
import { initEnemiesAndProps, updateEnemies, spawnZombie } from './enemies.js';
import { initGameLogic, updateGame, gameState } from './game.js';
import { initAnimals, updateAnimals } from './animals.js';
import { initGates, updateGates } from './doors.js'; // <-- Importar puertas
import { initUI } from './ui.js';

let scene, camera, renderer, clock;
let spawnTimer = 0;

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
    initGates(scene); // <-- Inicializar arcos de entrada
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
        updatePhysics();
        updatePlayer(delta, camera);
        updateTomatoes(delta, scene);
        updateEnemies(delta, scene);
        updateAnimals(delta);
        updateGates(delta); // <-- Actualizar estado/luces de puertas
        updateGame(delta, scene);

        spawnTimer += delta;
        if (spawnTimer >= 4.0) {
            spawnZombie(scene);
            spawnTimer = 0;
        }
    }

    renderer.render(scene, camera);
}

init();