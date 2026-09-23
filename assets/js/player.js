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

// Elevación ajustada al nuevo tamaño pequeño del personaje
const PLAYER_HEIGHT_OFFSET = 0.45; 

export function initPlayer(scene, camera) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    // 1. Cargar el personaje base
    gltfLoader.load('./assets/models/character/Character_Male_1.gltf', (gltf) => {
        playerMesh = gltf.scene;

        // Escala realista en relación con las vallas y las puertas del granero
        playerMesh.scale.set(0.13, 0.13, 0.13);
        playerMesh.position.set(0, PLAYER_HEIGHT_OFFSET, 0); 
        scene.add(playerMesh);

        mixer = new THREE.AnimationMixer(playerMesh);

        // Archivos de animación
        const animFiles = [
            { name: 'walk', path: './assets/models/character/animations/Standard Walk.fbx' },
            { name: 'run', path: './assets/models/character/animations/Running.fbx' },
            { name: 'throw', path: './assets/models/character/animations/Throw.fbx' }
        ];

        animFiles.forEach((item) => {
            fbxLoader.load(item.path, (anim) => {
                if (!anim.animations || !anim.animations.length) return;

                const clip = anim.animations[0];

                // Filtrar pistas que causan deformación o desplazamiento no deseado
                clip.tracks = clip.tracks.filter(track => {
                    const isScale = track.name.endsWith('.scale');
                    const isRootPosition = track.name.includes('Hips.position') || track.name.includes('Root.position');
                    return !isScale && !isRootPosition;
                });

                // Renombrar huesos de Mixamo para sincronizar con el GLTF
                clip.tracks.forEach((track) => {
                    track.name = track.name.replace('mixamorig', '');
                });

                actions[item.name] = mixer.clipAction(clip);
            });
        });
    });

    // Registrar controles por teclado
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
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
    const moveVector = new THREE.Vector3();

    if (keys['w']) { moveVector.z -= 1; isMoving = true; }
    if (keys['s']) { moveVector.z += 1; isMoving = true; }
    if (keys['a']) { moveVector.x -= 1; isMoving = true; }
    if (keys['d']) { moveVector.x += 1; isMoving = true; }

    if (isMoving) {
        moveVector.normalize().multiplyScalar(speed * delta);
        playerMesh.position.x += moveVector.x;
        playerMesh.position.z += moveVector.z;
        
        // Mantenemos la altura fija en Y
        playerMesh.position.y = PLAYER_HEIGHT_OFFSET;

        // Orientar el modelo según la dirección de movimiento
        playerMesh.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        switchAnimation(keys['shift'] ? 'run' : 'walk');
    } else {
        if (activeAction && activeAction !== actions['throw']) {
            activeAction.fadeOut(0.2);
            activeAction = null;
        }
    }

    if (mixer) mixer.update(delta);

    // Cámara en 3ª Persona ajustada al nuevo tamaño del personaje
    const cameraDistance = 2.2; // Distancia desde la espalda
    const cameraHeight = 1.2;   // Altura de la cámara

    camera.position.x = playerMesh.position.x;
    camera.position.y = playerMesh.position.y + cameraHeight;
    camera.position.z = playerMesh.position.z + cameraDistance;

    // Apuntar la cámara a la altura del pecho/cabeza del personaje
    camera.lookAt(
        playerMesh.position.x,
        playerMesh.position.y + 0.4,
        playerMesh.position.z
    );
}