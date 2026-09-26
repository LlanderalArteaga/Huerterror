import * as THREE from 'three';
import { playerMesh } from './player.js';
import { gameState, onKeyCollected } from './game.js';
import { showInteractionPrompt, hideInteractionPrompt } from './ui.js';

export const activeKeys = [];

// Posiciones estratégicas para las 3 llaves dentro de las vallas
const KEY_POSITIONS = [
    new THREE.Vector3(-18.0, 0.8, -18.0), // Esquina Noroeste
    new THREE.Vector3(18.0, 0.8, 18.0),   // Esquina Sureste
    new THREE.Vector3(-18.0, 0.8, 18.0)   // Esquina Suroeste
];

// Genera una llave dorada mediante geometrías 3D de Three.js
function createKeyMesh() {
    const keyGroup = new THREE.Group();

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x332200
    });

    // Anillo superior de la llave
    const ringGeo = new THREE.TorusGeometry(0.25, 0.05, 12, 24);
    const ringMesh = new THREE.Mesh(ringGeo, goldMaterial);
    ringMesh.position.y = 0.5;
    keyGroup.add(ringMesh);

    // Cuerpo de la llave
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const stemMesh = new THREE.Mesh(stemGeo, goldMaterial);
    stemMesh.position.y = 0.15;
    keyGroup.add(stemMesh);

    // Dientes de la llave
    const toothGeo = new THREE.BoxGeometry(0.15, 0.08, 0.04);
    const toothMesh = new THREE.Mesh(toothGeo, goldMaterial);
    toothMesh.position.set(0.08, -0.05, 0);
    keyGroup.add(toothMesh);

    // Luz dorada flotante
    const keyLight = new THREE.PointLight(0xffaa00, 2.0, 5.0);
    keyLight.position.set(0, 0.3, 0);
    keyGroup.add(keyLight);

    return keyGroup;
}

// Aparece las 3 llaves en la escena (llamar al iniciar Nivel 2)
export function spawnKeys(scene) {
    clearKeys(scene);

    KEY_POSITIONS.forEach((pos, index) => {
        const keyMesh = createKeyMesh();
        keyMesh.position.copy(pos);
        scene.add(keyMesh);

        activeKeys.push({
            id: index,
            mesh: keyMesh,
            pos: pos.clone(),
            collected: false,
            initialY: pos.y
        });
    });
}

// Limpia llaves anteriores
export function clearKeys(scene) {
    activeKeys.forEach((k) => {
        if (k.mesh) scene.remove(k.mesh);
    });
    activeKeys.length = 0;
}

// Bucle de animación e interacción con las llaves
export function updateKeys(delta, scene) {
    if (!playerMesh || !gameState.isPlaying || gameState.level !== 2) return;

    let isNearKey = false;
    let targetKey = null;

    const time = Date.now() * 0.003;

    activeKeys.forEach((k) => {
        if (k.collected) return;

        // Animación: Rotación y levitación suave
        k.mesh.rotation.y += 2.0 * delta;
        k.mesh.position.y = k.initialY + Math.sin(time + k.id) * 0.15;

        // Detección de cercanía al jugador
        const dist = playerMesh.position.distanceTo(k.mesh.position);
        if (dist < 2.5) {
            isNearKey = true;
            targetKey = k;
        }
    });

    // Control del aviso en pantalla
    if (isNearKey && targetKey) {
        showInteractionPrompt('[E] Recoger Llave Mística 🔑');
    } else if (gameState.level === 2 && !gameState.doorOpen) {
        hideInteractionPrompt();
    }
}

// Escuchar la tecla 'E' para recoger llaves
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && playerMesh && gameState.isPlaying && gameState.level === 2) {
        activeKeys.forEach((k) => {
            if (!k.collected && playerMesh.position.distanceTo(k.mesh.position) < 2.5) {
                k.collected = true;
                k.mesh.visible = false;
                hideInteractionPrompt();
                onKeyCollected(); // Notifica a game.js
            }
        });
    }
});