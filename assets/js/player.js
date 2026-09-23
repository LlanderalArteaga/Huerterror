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
    minZ: -10.0,
    maxZ: 10.7
};

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
        
        // Mover jugador
        playerMesh.position.x += moveVector.x;
        playerMesh.position.z += moveVector.z;
        
        // --- RESTANCIAS / LÍMITES DEL MAPA ---
        playerMesh.position.x = Math.max(MAP_LIMITS.minX, Math.min(MAP_LIMITS.maxX, playerMesh.position.x));
        playerMesh.position.z = Math.max(MAP_LIMITS.minZ, Math.min(MAP_LIMITS.maxZ, playerMesh.position.z));

        playerMesh.position.y = PLAYER_HEIGHT_OFFSET;
        playerMesh.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        switchAnimation(keys['shift'] ? 'run' : 'walk');
    } else {
        if (activeAction && activeAction !== actions['throw']) {
            activeAction.fadeOut(0.2);
            activeAction = null;
        }
    }

    if (mixer) mixer.update(delta);

    // Seguimiento de cámara
    const cameraDistance = 2.2;
    const cameraHeight = 1.0;

    camera.position.x = playerMesh.position.x;
    camera.position.y = playerMesh.position.y + cameraHeight;
    camera.position.z = playerMesh.position.z + cameraDistance;

    camera.lookAt(
        playerMesh.position.x,
        playerMesh.position.y + 0.3,
        playerMesh.position.z
    );
}