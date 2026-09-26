import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { playerMesh } from './player.js';
import { gameState } from './game.js';
import { showInteractionPrompt, hideInteractionPrompt } from './ui.js';
import { GATE_POSITIONS, openSpecificGate } from './doors.js';
import { staticColliders } from './physics.js';

let coffinModel = null;
let skeletonModel = null;

let currentCoffin = null;
let coffinColliderBox = null;
let currentSkeleton = null;
let targetGateIndex = -1;
let skeletonActive = false;

const TOMB_POSITION = new THREE.Vector3(2, 0, 0);

export function initTomb(scene) {
    const loader = new GLTFLoader();

    loader.load('./assets/map/halloween/Coffin-ySERERWPgE.glb', (gltf) => {
        coffinModel = gltf.scene;
        coffinModel.scale.set(0.6, 0.6, 0.6);
    }, undefined, (err) => console.error("Error al cargar Coffin-ySERERWPgE.glb:", err));

    loader.load('./assets/map/enemies/Skeleton.gltf', (gltf) => {
        skeletonModel = gltf.scene;
        skeletonModel.scale.set(0.25, 0.25, 0.25);
    }, undefined, () => {
        loader.load('./assets/models/enemies/Skeleton.gltf', (g2) => {
            skeletonModel = g2.scene;
            skeletonModel.scale.set(0.25, 0.25, 0.25);
        }, undefined, () => {});
    });
}

export function spawnTomb(scene) {
    clearTomb(scene);

    if (gameState.level !== 3) return;

    if (coffinModel) {
        currentCoffin = SkeletonUtils.clone(coffinModel);
    } else {
        const geo = new THREE.BoxGeometry(1.2, 0.6, 2.0);
        const mat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.8 });
        currentCoffin = new THREE.Mesh(geo, mat);
    }

    currentCoffin.position.copy(TOMB_POSITION);
    currentCoffin.visible = true;
    scene.add(currentCoffin);

    // Agregar colisión física al Ataúd
    currentCoffin.updateMatrixWorld(true);
    coffinColliderBox = new THREE.Box3().setFromObject(currentCoffin);
    if (!staticColliders.includes(coffinColliderBox)) {
        staticColliders.push(coffinColliderBox);
    }
}

export function clearTomb(scene) {
    if (currentCoffin) scene.remove(currentCoffin);
    if (currentSkeleton) scene.remove(currentSkeleton);

    if (coffinColliderBox) {
        const idx = staticColliders.indexOf(coffinColliderBox);
        if (idx !== -1) staticColliders.splice(idx, 1);
        coffinColliderBox = null;
    }

    currentCoffin = null;
    currentSkeleton = null;
    skeletonActive = false;
    targetGateIndex = -1;
}

export function updateTomb(delta, scene) {
    if (!playerMesh || !gameState.isPlaying || gameState.level !== 3) return;

    // Interacción para entregar llaves
    if (currentCoffin && currentCoffin.visible && gameState.keysFound >= gameState.targetKeys && !gameState.tombDelivered) {
        const dist = playerMesh.position.distanceTo(TOMB_POSITION);
        if (dist < 3.5) {
            showInteractionPrompt('[E] Entregar Llaves al Ataúd Místico ⚰️');
        } else {
            hideInteractionPrompt();
        }
    }

    // Desplazamiento del Esqueleto hacia la puerta elegida
    if (skeletonActive && currentSkeleton && targetGateIndex !== -1) {
        const targetPos = GATE_POSITIONS[targetGateIndex];
        const destVector = new THREE.Vector3(targetPos.x, 0, targetPos.z);

        const distToGate = currentSkeleton.position.distanceTo(destVector);

        currentSkeleton.lookAt(destVector.x, currentSkeleton.position.y, destVector.z);

        if (distToGate > 2.0) {
            const dir = new THREE.Vector3().subVectors(destVector, currentSkeleton.position).normalize();
            currentSkeleton.position.add(dir.multiplyScalar(2.2 * delta));
        } else {
            skeletonActive = false;
            openSpecificGate(targetGateIndex);
            gameState.doorOpen = true;
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && playerMesh && gameState.isPlaying && gameState.level === 3) {
        if (currentCoffin && currentCoffin.visible && gameState.keysFound >= gameState.targetKeys && !gameState.tombDelivered) {
            if (playerMesh.position.distanceTo(TOMB_POSITION) < 3.5) {
                gameState.tombDelivered = true;
                hideInteractionPrompt();

                // Desaparecer ataúd y quitar sus físicas
                currentCoffin.visible = false;
                if (coffinColliderBox) {
                    const idx = staticColliders.indexOf(coffinColliderBox);
                    if (idx !== -1) staticColliders.splice(idx, 1);
                    coffinColliderBox = null;
                }

                const scene = currentCoffin.parent || playerMesh.parent;

                if (skeletonModel) {
                    currentSkeleton = SkeletonUtils.clone(skeletonModel);
                } else {
                    const geo = new THREE.CylinderGeometry(0.3, 0.3, 1.8);
                    const mat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
                    currentSkeleton = new THREE.Mesh(geo, mat);
                }

                currentSkeleton.position.copy(TOMB_POSITION);
                scene.add(currentSkeleton);

                targetGateIndex = Math.floor(Math.random() * GATE_POSITIONS.length);
                gameState.openedGateIndex = targetGateIndex;
                skeletonActive = true;
            }
        }
    }
});