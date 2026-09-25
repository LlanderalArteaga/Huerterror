import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { gameState, startLevel2 } from './game.js';
import { playerMesh } from './player.js';
import { staticColliders } from './physics.js';

const gateLights = [];
const gatePairs = [];

// Posiciones alineadas exactamente con las vallas (x=±25, z=±25, camino E-O en z=-1)
const GATE_POSITIONS = [
    { x: 0, z: -25.0, rotY: 0 },             // Salida Norte
    { x: 0, z: 25.0, rotY: Math.PI },        // Salida Sur
    { x: -25.0, z: -1.0, rotY: Math.PI / 2 }, // Salida Oeste
    { x: 25.0, z: -1.0, rotY: -Math.PI / 2 }  // Salida Este
];

// Crea una instancia del modelo ajustando automáticamente escalas gigantes o desfasadas
function createGateInstance(modelScene, pos) {
    const gate = SkeletonUtils.clone(modelScene);

    // 1. Calcular tamaño nativo en 3D
    const nativeBox = new THREE.Box3().setFromObject(gate);
    const nativeHeight = nativeBox.max.y - nativeBox.min.y;

    // 2. Normalizar la escala si el modelo es gigante (> 50 unidades)
    let scaleFactor = 1.35;
    if (nativeHeight > 50) {
        // Reducir proporcionalmente para que mida ~3.8 metros de alto
        scaleFactor = 3.8 / nativeHeight;
    }

    gate.scale.set(scaleFactor, scaleFactor, scaleFactor);
    gate.rotation.y = pos.rotY;

    // 3. Ajustar posición Y para que la base toque exactamente el suelo
    gate.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(gate);
    gate.position.set(pos.x, -scaledBox.min.y, pos.z);

    // 4. Restaurar sombras y materiales visibles para la escena nocturna
    gate.traverse((child) => {
        child.visible = true;
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Evita que Three.js lo descarte

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
            // Instancia Puerta Cerrada
            const closedGate = createGateInstance(closedModel, pos);
            closedGate.visible = true;
            scene.add(closedGate);

            // Generar caja de colisión para la puerta cerrada
            closedGate.updateMatrixWorld(true);
            const colliderBox = new THREE.Box3().setFromObject(closedGate);

            // Instancia Puerta Abierta (Oculta inicialmente)
            const openGate = createGateInstance(openModel, pos);
            openGate.visible = false;
            scene.add(openGate);

            gatePairs.push({ 
                closed: closedGate, 
                open: openGate,
                collider: colliderBox
            });

            // Luz mística verde de salida
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
        // Intercambiar visibilidad al modelo abierto y quitar físicas
        gatePairs.forEach((pair) => {
            if (pair.closed && pair.closed.visible) {
                pair.closed.visible = false;
            }
            if (pair.open && !pair.open.visible) {
                pair.open.visible = true;
                pair.open.traverse((c) => c.visible = true);
            }

            // Remover colisionador si la puerta está abierta
            if (pair.collider) {
                const index = staticColliders.indexOf(pair.collider);
                if (index !== -1) {
                    staticColliders.splice(index, 1);
                }
            }
        });

        // Parpadeo de luz verde mística
        const time = Date.now() * 0.005;
        gateLights.forEach((light) => {
            light.intensity = 4.0 + Math.sin(time) * 2.0;
        });

        // Transición de nivel al cruzar el portal
        GATE_POSITIONS.forEach((pos) => {
            const dist = playerMesh.position.distanceTo(new THREE.Vector3(pos.x, 0, pos.z));
            if (dist < 2.5) {
                if (gameState.level === 1) {
                    startLevel2();
                }
            }
        });
    } else {
        // Mantener modelo cerrado y activar sus físicas
        gatePairs.forEach((pair) => {
            if (pair.closed && !pair.closed.visible) {
                pair.closed.visible = true;
            }
            if (pair.open && pair.open.visible) {
                pair.open.visible = false;
            }

            // Agregar colisionador si la puerta está cerrada
            if (pair.collider && !staticColliders.includes(pair.collider)) {
                staticColliders.push(pair.collider);
            }
        });

        gateLights.forEach((light) => {
            light.intensity = 0;
        });
    }
}