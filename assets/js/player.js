import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export let playerMesh = null;
export let mixer = null;
export const actions = {};
export let activeAction = null;

const keys = {};
const moveSpeed = 3.5;
const runSpeed = 6.0;

const PLAYER_HEIGHT_OFFSET = 0.45; 

export const MAP_LIMITS = {
    minX: -7.3,
    maxX: 7.3,
    minZ: -10.4,
    maxZ: 10.4
};

// --- Control de Cámara con Mouse ---
let yaw = 0;   // Rotación Horizontal (Izquierda / Derecha)
let pitch = 0; // Rotación Vertical (Arriba / Abajo)
const mouseSensitivity = 0.002;

export function initPlayer(scene, camera) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load('./assets/models/character/Character_Male_1.gltf', (gltf) => {
        playerMesh = gltf.scene;

        playerMesh.scale.set(0.13, 0.13, 0.13);
        playerMesh.position.set(0, PLAYER_HEIGHT_OFFSET, 0); 
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

    // Eventos de teclado
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    // Bloqueo de cursor al dar clic
    window.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    });

    // Lectura de movimiento del Mouse
    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            yaw -= e.movementX * mouseSensitivity;
            pitch -= e.movementY * mouseSensitivity;

            // Inclinación vertical
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

    // GIRAR EL PERSONAJE 180 GRADOS (Math.PI) para ver su espalda
    playerMesh.rotation.y = yaw + Math.PI;

    // Vector de dirección local
    const moveDir = new THREE.Vector3();

    if (keys['w']) { moveDir.z -= 1; isMoving = true; }
    if (keys['s']) { moveDir.z += 1; isMoving = true; }
    if (keys['a']) { moveDir.x -= 1; isMoving = true; }
    if (keys['d']) { moveDir.x += 1; isMoving = true; }

    if (isMoving) {
        moveDir.normalize();
        
        // Convertir la dirección local a dirección global
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        moveDir.multiplyScalar(speed * delta);

        // Desplazamiento
        playerMesh.position.x += moveDir.x;
        playerMesh.position.z += moveDir.z;

        // --- LÍMITES DEL MAPA ---
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

    // --- POSICIONAMIENTO DE CÁMARA TERCERA PERSONA (Espalda del personaje) ---
    const cameraDistance = 2.0; 
    const cameraHeight = 0.8;   

    const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
    
    cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    camera.position.copy(playerMesh.position).add(cameraOffset);

    // Punto hacia el que mira la cámara (hacia adelante)
    const targetOffset = new THREE.Vector3(0, 0.5, -5.0);
    targetOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    camera.lookAt(playerMesh.position.clone().add(targetOffset));
}