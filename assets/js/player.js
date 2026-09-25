import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { checkCollision } from './physics.js';

export let playerMesh = null;
export let mixer = null;
export const actions = {};
export let activeAction = null;

const keys = {};
const moveSpeed = 3.5;
const runSpeed = 6.0;

const PLAYER_HEIGHT_OFFSET = 0; 
const PLAYER_RADIUS = 0.2;

// Límites ajustados exactamente al perímetro de las cercas y el terreno (64x64)
export const MAP_LIMITS = {
    minX: -32,
    maxX: 32,
    minZ: -32,
    maxZ: 32 // Permite llegar hasta la entrada sur sin salirse del mapa
};

export let yaw = 0;   
export let pitch = 0; 
const mouseSensitivity = 0.002;

export function initPlayer(scene, camera) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load('./assets/models/character/Character_Male_1.gltf', (gltf) => {
        playerMesh = gltf.scene;

        // Activar sombras para todas las sub-mallas del personaje
        playerMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        playerMesh.scale.set(0.2, 0.2, 0.2);
        playerMesh.position.set(0, PLAYER_HEIGHT_OFFSET, 3.5); 
        scene.add(playerMesh);

        mixer = new THREE.AnimationMixer(playerMesh);

        const animFiles = [
            { name: 'walk', path: './assets/models/character/animations/Standard_Walk.fbx' },
            { name: 'run', path: './assets/models/character/animations/Running.fbx' },
            { name: 'throw', path: './assets/models/character/animations/Throw.fbx' }
        ];

        animFiles.forEach((item) => {
            fbxLoader.load(item.path, (anim) => {
                if (!anim.animations || !anim.animations.length) return;

                const clip = anim.animations[0];

                clip.tracks = clip.tracks.filter(track => {
                    const isScale = track.name.endsWith('.scale');
                    const isRootPosition = track.name.includes('Hips.position') || track.name.includes('Root.position');
                    return !isScale && !isRootPosition;
                });

                clip.tracks.forEach((track) => {
                    track.name = track.name.replace('mixamorig', '');
                });

                actions[item.name] = mixer.clipAction(clip);
            });
        });
    });

    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    window.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            yaw -= e.movementX * mouseSensitivity;
            pitch -= e.movementY * mouseSensitivity;

            pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, pitch));
        }
    });
}

export function switchAnimation(name) {
    if (!actions[name] || activeAction === actions[name]) return;
    if (activeAction) activeAction.fadeOut(0.15);
    activeAction = actions[name];
    activeAction.reset().fadeIn(0.15).play();
}

export function updatePlayer(delta, camera) {
    if (!playerMesh) return;

    let speed = keys['shift'] ? runSpeed : moveSpeed;
    let isMoving = false;

    playerMesh.rotation.y = yaw + Math.PI;

    const moveDir = new THREE.Vector3();

    if (keys['w']) { moveDir.z -= 1; isMoving = true; }
    if (keys['s']) { moveDir.z += 1; isMoving = true; }
    if (keys['a']) { moveDir.x -= 1; isMoving = true; }
    if (keys['d']) { moveDir.x += 1; isMoving = true; }

    if (isMoving) {
        moveDir.normalize();
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        moveDir.multiplyScalar(speed * delta);

        // Movimiento en X comprobando colisiones
        const nextXPos = playerMesh.position.clone();
        nextXPos.x += moveDir.x;
        if (!checkCollision(nextXPos, PLAYER_RADIUS)) {
            playerMesh.position.x = nextXPos.x;
        }

        // Movimiento en Z comprobando colisiones
        const nextZPos = playerMesh.position.clone();
        nextZPos.z += moveDir.z;
        if (!checkCollision(nextZPos, PLAYER_RADIUS)) {
            playerMesh.position.z = nextZPos.z;
        }

        // Límites strictly del escenario
        playerMesh.position.x = Math.max(MAP_LIMITS.minX, Math.min(MAP_LIMITS.maxX, playerMesh.position.x));
        playerMesh.position.z = Math.max(MAP_LIMITS.minZ, Math.min(MAP_LIMITS.maxZ, playerMesh.position.z));

        switchAnimation(keys['shift'] ? 'run' : 'walk');
    } else {
        if (activeAction && activeAction !== actions['throw']) {
            activeAction.fadeOut(0.2);
            activeAction = null;
        }
    }

    playerMesh.position.y = PLAYER_HEIGHT_OFFSET;

    if (mixer) mixer.update(delta);

    // Cámara en tercera persona
    const cameraDistance = 2.0; 
    const cameraHeight = 0.8;   

    const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
    cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    camera.position.copy(playerMesh.position).add(cameraOffset);

    const targetOffset = new THREE.Vector3(0, 0.5, -5.0);
    targetOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    camera.lookAt(playerMesh.position.clone().add(targetOffset));
}