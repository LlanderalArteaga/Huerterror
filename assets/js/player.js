import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export let playerMesh = null;
export let mixer = null;
export const actions = {};
export let activeAction = null;

const keys = {};
const moveSpeed = 5.0;
const runSpeed = 9.0;

export function initPlayer(scene, camera) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    // 1. Cargar el personaje base
    gltfLoader.load('./assets/models/character/Character_Male_1.gltf', (gltf) => {
        playerMesh = gltf.scene;
        playerMesh.scale.set(1.5, 1.5, 1.5);
        playerMesh.position.set(0, 0, 0);
        scene.add(playerMesh);

        mixer = new THREE.AnimationMixer(playerMesh);

        // 2. Cargar animaciones FBX
        const animFiles = [
            { name: 'walk', path: './assets/models/character/animations/Standard Walk.fbx' },
            { name: 'run', path: './assets/models/character/animations/Running.fbx' },
            { name: 'throw', path: './assets/models/character/animations/Throw.fbx' }
        ];

        animFiles.forEach((item) => {
            fbxLoader.load(item.path, (anim) => {
                const clip = anim.animations[0];
                actions[item.name] = mixer.clipAction(clip);
            });
        });
    });

    // Escuchar eventos de teclado
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
}

// Cambiar suavemente entre animaciones (Fade)
export function switchAnimation(name) {
    if (!actions[name] || activeAction === actions[name]) return;
    if (activeAction) activeAction.fadeOut(0.2);
    activeAction = actions[name];
    activeAction.reset().fadeIn(0.2).play();
}

export function updatePlayer(delta, camera) {
    if (!playerMesh) return;

    let speed = keys['shift'] ? runSpeed : moveSpeed;
    let isMoving = false;
    const moveVector = new THREE.Vector3();

    if (keys['w']) { moveVector.z -= 1; isMoving = true; }
    if (keys['s']) { moveVector.z += 1; isMoving = true; }
    if (keys['a']) { moveVector.x -= 1; isMoving = true; }
    if (keys['d']) { moveVector.x += 1; isMoving = true; }

    if (isMoving) {
        moveVector.normalize().multiplyScalar(speed * delta);
        playerMesh.position.add(moveVector);
        playerMesh.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        switchAnimation(keys['shift'] ? 'run' : 'walk');
    }

    if (mixer) mixer.update(delta);

    // Cámara en 3ª Persona siguiendo al personaje
    camera.position.x = playerMesh.position.x;
    camera.position.y = playerMesh.position.y + 4.5;
    camera.position.z = playerMesh.position.z + 8.0;
    camera.lookAt(playerMesh.position.x, playerMesh.position.y + 1.2, playerMesh.position.z);
}