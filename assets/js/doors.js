import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { gameState, triggerLevel2Transition, triggerLevel3Transition } from './game.js';
import { playerMesh } from './player.js';
import { staticColliders } from './physics.js';
import { showVictoryScreen } from './ui.js';

// Configuración de audio del portal
const portalSound = new Audio('./assets/audio/Sonido_Portal.mp3');
portalSound.volume = 0.6;
let portalSoundPlayed = false;

const gateLights = [];
const gatePairs = [];

// Posiciones alineadas exactamente con las vallas
export const GATE_POSITIONS = [
    { x: 0, z: -25.0, rotY: 0 },              // Salida Norte (0)
    { x: 0, z: 25.0, rotY: Math.PI },         // Salida Sur (1)
    { x: -25.0, z: -1.0, rotY: Math.PI / 2 }, // Salida Oeste (2)
    { x: 25.0, z: -1.0, rotY: -Math.PI / 2 }   // Salida Este (3)
];

function createGateInstance(modelScene, pos) {
    const gate = SkeletonUtils.clone(modelScene);

    const nativeBox = new THREE.Box3().setFromObject(gate);
    const nativeHeight = nativeBox.max.y - nativeBox.min.y;

    let scaleFactor = 1.35;
    if (nativeHeight > 50) {
        scaleFactor = 3.8 / nativeHeight;
    }

    gate.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gate.rotation.y = pos.rotY;

    gate.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(gate);
    gate.position.set(pos.x, -scaledBox.min.y, pos.z);

    gate.traverse((child) => {
        child.visible = true;
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;

            if (!child.material || (child.material.color && child.material.color.r < 0.05)) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x777788,
                    roughness: 0.8,
                    metalness: 0.1,
                    side: THREE.DoubleSide
                });
            } else {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                    mat.transparent = false;
                    mat.opacity = 1.0;
                    mat.depthWrite = true;
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                });
            }
        }
    });

    return gate;
}

// Abre únicamente la puerta elegida por el Esqueleto en el Nivel 3
export function openSpecificGate(index) {
    if (index >= 0 && index < gatePairs.length) {
        const pair = gatePairs[index];
        if (pair.closed) pair.closed.visible = false;
        if (pair.open) {
            pair.open.visible = true;
            pair.open.traverse((c) => c.visible = true);
        }

        if (pair.collider) {
            const idx = staticColliders.indexOf(pair.collider);
            if (idx !== -1) staticColliders.splice(idx, 1);
        }

        if (gateLights[index]) {
            gateLights[index].intensity = 5.0;
        }
    }
}

export function initGates(scene) {
    const loader = new GLTFLoader();

    let closedModel = null;
    let openModel = null;

    const loadClosed = new Promise((resolve) => {
        loader.load('./assets/map/halloween/Arch Gate.glb', (gltf) => {
            closedModel = gltf.scene;
            resolve();
        }, undefined, (err) => console.error("Error al cargar Arch Gate.glb:", err));
    });

    const loadOpen = new Promise((resolve) => {
        loader.load('./assets/map/halloween/Arch.glb', (gltf) => {
            openModel = gltf.scene;
            resolve();
        }, undefined, (err) => console.error("Error al cargar Arch.glb:", err));
    });

    Promise.all([loadClosed, loadOpen]).then(() => {
        if (!closedModel || !openModel) return;

        GATE_POSITIONS.forEach((pos) => {
            const closedGate = createGateInstance(closedModel, pos);
            closedGate.visible = true;
            scene.add(closedGate);

            closedGate.updateMatrixWorld(true);
            const colliderBox = new THREE.Box3().setFromObject(closedGate);

            const openGate = createGateInstance(openModel, pos);
            openGate.visible = false;
            scene.add(openGate);

            gatePairs.push({
                closed: closedGate,
                open: openGate,
                collider: colliderBox
            });

            const greenLight = new THREE.PointLight(0x00ff66, 0, 10);
            greenLight.position.set(pos.x, 3.0, pos.z);
            scene.add(greenLight);
            gateLights.push(greenLight);
        });
    });
}

export function updateGates(delta) {
    if (!playerMesh || !gameState.isPlaying) return;

    if (gameState.doorOpen) {
        // Reproducir el sonido del portal una sola vez al activarse
        if (!portalSoundPlayed) {
            portalSound.currentTime = 0;
            portalSound.play().catch(() => {});
            portalSoundPlayed = true;
        }

        if (gameState.level === 3 && gameState.openedGateIndex !== undefined && gameState.openedGateIndex !== -1) {
            // NIVEL 3: Abrir solo la puerta seleccionada por el Esqueleto
            openSpecificGate(gameState.openedGateIndex);

            const time = Date.now() * 0.005;
            if (gateLights[gameState.openedGateIndex]) {
                gateLights[gameState.openedGateIndex].intensity = 4.0 + Math.sin(time) * 2.0;
            }

            // Detectar si el jugador cruza la puerta específica para ganar
            const targetPos = GATE_POSITIONS[gameState.openedGateIndex];
            const dist = playerMesh.position.distanceTo(new THREE.Vector3(targetPos.x, 0, targetPos.z));
            if (dist < 2.5) {
                gameState.isPlaying = false; // Detiene completamente el juego
                showVictoryScreen();
            }
        } else {
            // NIVEL 1 y NIVEL 2: Se abren todas las puertas
            gatePairs.forEach((pair) => {
                if (pair.closed && pair.closed.visible) {
                    pair.closed.visible = false;
                }
                if (pair.open && !pair.open.visible) {
                    pair.open.visible = true;
                    pair.open.traverse((c) => c.visible = true);
                }

                if (pair.collider) {
                    const index = staticColliders.indexOf(pair.collider);
                    if (index !== -1) {
                        staticColliders.splice(index, 1);
                    }
                }
            });

            const time = Date.now() * 0.005;
            gateLights.forEach((light) => {
                light.intensity = 4.0 + Math.sin(time) * 2.0;
            });

            GATE_POSITIONS.forEach((pos) => {
                const dist = playerMesh.position.distanceTo(new THREE.Vector3(pos.x, 0, pos.z));
                if (dist < 2.5) {
                    if (gameState.level === 1) {
                        triggerLevel2Transition();
                    } else if (gameState.level === 2) {
                        triggerLevel3Transition();
                    }
                }
            });
        }
    } else {
        portalSoundPlayed = false;

        // Puertas cerradas y con físicas
        gatePairs.forEach((pair) => {
            if (pair.closed && !pair.closed.visible) {
                pair.closed.visible = true;
            }
            if (pair.open && pair.open.visible) {
                pair.open.visible = false;
            }

            if (pair.collider && !staticColliders.includes(pair.collider)) {
                staticColliders.push(pair.collider);
            }
        });

        gateLights.forEach((light) => {
            light.intensity = 0;
        });
    }
}