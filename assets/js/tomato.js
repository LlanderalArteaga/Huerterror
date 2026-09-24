import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { playerMesh, switchAnimation, yaw, pitch } from './player.js';
import { gameState } from './game.js';
import { updateHUD } from './ui.js';

export const activeTomatoes = [];
let tomatoModel = null;

// Objeto para almacenar las 4 etapas del modelo de la planta
const plantStages = {
    1: null, // Tomato_1.glb (Tierra/Semilla)
    2: null, // Tomato_2.glb (Brote)
    3: null, // Tomato_3.glb (Planta sin frutos)
    4: null  // Tomato_4.glb (Planta con jitomates lista para cosechar)
};

let currentPlantMesh = null;
let currentStageIndex = 4; // Comienza en la etapa 4 (Lista)
let isPlantReady = true;    // Controla si se pueden recoger tomates

const PLANT_POSITION = new THREE.Vector3(2, 0, 9.5);
const PLANT_SCALE = new THREE.Vector3(0.8, 0.8, 0.8);

export function initTomatoProps(scene) {
    const gltfLoader = new GLTFLoader();

    // 1. Cargar modelo del proyectil Jitomate
    gltfLoader.load('./assets/models/props/Tomato.glb', (gltf) => {
        tomatoModel = gltf.scene;
        tomatoModel.scale.set(0.5, 0.5, 0.5);

        tomatoModel.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.transparent = false;
                child.material.opacity = 1.0;
            }
        });
    });

    // 2. Precargar las 4 etapas de crecimiento de la planta
    const stagesToLoad = [
        { id: 1, path: './assets/models/props/Tomato_1.glb' },
        { id: 2, path: './assets/models/props/Tomato_2.glb' },
        { id: 3, path: './assets/models/props/Tomato_3.glb' },
        { id: 4, path: './assets/models/props/Tomato_4.glb' }
    ];

    stagesToLoad.forEach((stage) => {
        gltfLoader.load(stage.path, (gltf) => {
            const mesh = gltf.scene;
            mesh.position.copy(PLANT_POSITION);
            mesh.scale.copy(PLANT_SCALE);

            mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                }
            });

            plantStages[stage.id] = mesh;

            // Al cargar la etapa 4 por primera vez, colocarla en la escena
            if (stage.id === 4) {
                currentPlantMesh = mesh;
                scene.add(currentPlantMesh);
            }
        });
    });

    // Evento de disparo con Clic Izquierdo
    window.addEventListener('click', () => {
        if (document.pointerLockElement === document.body && gameState.isPlaying && gameState.ammo > 0 && playerMesh) {
            shootTomato(scene);
        }
    });

    // Evento de recarga con la tecla 'E'
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'e' && currentPlantMesh && playerMesh && isPlantReady) {
            const dist = playerMesh.position.distanceTo(currentPlantMesh.position);
            if (dist < 4.0) {
                // Recargar munición
                gameState.ammo = 10;
                updateHUD();

                // Iniciar proceso de regeneración/crecimiento de la planta
                harvestAndRegrow(scene);
            }
        }
    });
}

// Función para cambiar de modelo en la escena
function setPlantStage(scene, stageNumber) {
    if (!plantStages[stageNumber]) return;

    // Remover la malla actual
    if (currentPlantMesh) {
        scene.remove(currentPlantMesh);
    }

    // Colocar la nueva malla de la etapa correspondiente
    currentPlantMesh = plantStages[stageNumber];
    currentStageIndex = stageNumber;
    scene.add(currentPlantMesh);
}

// Secuencia de crecimiento progresivo tras cosechar
function harvestAndRegrow(scene) {
    isPlantReady = false; // Bloquear recargas mientras crece

    // Etapa 1: Recolectado -> Pasa inmediatamente a Tomato_1.glb
    setPlantStage(scene, 1);

    // Etapa 2: A los 4 segundos pasa a Tomato_2.glb
    setTimeout(() => {
        setPlantStage(scene, 2);
    }, 4000);

    // Etapa 3: A los 8 segundos pasa a Tomato_3.glb
    setTimeout(() => {
        setPlantStage(scene, 3);
    }, 8000);

    // Etapa 4: A los 12 segundos vuelve a Tomato_4.glb (Lista de nuevo)
    setTimeout(() => {
        setPlantStage(scene, 4);
        isPlantReady = true; // Se vuelve a permitir la cosecha
    }, 12000);
}

function shootTomato(scene) {
    if (!playerMesh) return;

    switchAnimation('throw');
    gameState.ammo--;
    updateHUD();

    let tomato;

    if (tomatoModel) {
        tomato = tomatoModel.clone(true);
    } else {
        const geo = new THREE.SphereGeometry(0.3, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        tomato = new THREE.Mesh(geo, mat);
    }

    const spawnOffset = new THREE.Vector3(0, 0.8, -0.8);
    spawnOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    spawnOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    tomato.position.copy(playerMesh.position).add(spawnOffset);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    direction.normalize();

    const speed = 18.0;
    const velocity = direction.multiplyScalar(speed);

    scene.add(tomato);

    activeTomatoes.push({ 
        mesh: tomato, 
        velocity, 
        life: 3.0,
        gracePeriod: 0.2
    });
}

export function updateTomatoes(delta, scene) {
    for (let i = activeTomatoes.length - 1; i >= 0; i--) {
        const t = activeTomatoes[i];
        t.life -= delta;
        if (t.gracePeriod > 0) t.gracePeriod -= delta;

        t.velocity.y -= 7.0 * delta;
        t.mesh.position.addScaledVector(t.velocity, delta);
        t.mesh.rotation.x += 12 * delta;

        if (t.life <= 0 || (t.gracePeriod <= 0 && t.mesh.position.y <= 0.05)) {
            scene.remove(t.mesh);
            activeTomatoes.splice(i, 1);
        }
    }
}