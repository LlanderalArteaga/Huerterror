import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initPhysics, updatePhysics } from './physics.js';
import { initPlayer, updatePlayer } from './player.js';
import { initTomatoProps, updateTomatoes } from './tomato.js';
import { initEnemiesAndProps, updateEnemies, spawnZombie } from './enemies.js';
import { initGameLogic, updateGame, gameState } from './game.js';
import { initUI } from './ui.js';

let scene, camera, renderer, clock;
let spawnTimer = 0;

async function init() {
    // 1. Crear Escena, Cámara y Renderizador
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    clock = new THREE.Clock();

    // 2. Cargar Mapa de la Granja
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./assets/models/environment/granja.gltf', (gltf) => {
        scene.add(gltf.scene);
    });

    // 3. Inicializar Módulos
    await initPhysics();
    initGameLogic(scene);
    initPlayer(scene, camera);
    initTomatoProps(scene);
    initEnemiesAndProps(scene);
    initUI();

    // Ajustar ventana al redimensionar
    window.addEventListener('resize', onWindowResize);

    // Iniciar Bucle de Animación
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
        updateGame(delta, scene);

        // Generar Zombie cada 4 segundos
        spawnTimer += delta;
        if (spawnTimer >= 4.0) {
            spawnZombie(scene);
            spawnTimer = 0;
        }
    }

    renderer.render(scene, camera);
}

init();