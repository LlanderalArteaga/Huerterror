import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// ===================================================
// CONFIGURACIÓN DE ANIMALES EN LA GRANJA
// (Puedes agregar o quitar elementos de esta lista)
// ===================================================
const ANIMALS_CONFIG = [
    // --- PERROS ---
    { type: 'dog', modelPath: './assets/map/animals/Dog.gltf', scale: 0.27, speed: 1.5 },
    { type: 'dog', modelPath: './assets/map/animals/Dog.gltf', scale: 0.27, speed: 1.3 },
    { type: 'dog', modelPath: './assets/map/animals/Dog.gltf', scale: 0.20, speed: 1.6 },

    // --- GATOS ---
    { type: 'cat', modelPath: './assets/map/animals/Cat.gltf', scale: 0.19, speed: 1.2 },
    { type: 'cat', modelPath: './assets/map/animals/Cat.gltf', scale: 0.20, speed: 1.1 },
    { type: 'cat', modelPath: './assets/map/animals/Cat.gltf', scale: 0.17, speed: 1.4 },
    { type: 'cat', modelPath: './assets/map/animals/Cat.gltf', scale: 0.19, speed: 1.3 }
];

// Límites del área por donde pasean libremente
const MAP_BOUNDS = { minX: -22, maxX: 22, minZ: -22, maxZ: 22 };

export const activeAnimals = [];

// Función para obtener puntos de paseo dentro de la granja
function getRandomWaypoint() {
    const x = MAP_BOUNDS.minX + Math.random() * (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
    const z = MAP_BOUNDS.minZ + Math.random() * (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ);
    return new THREE.Vector3(x, 0, z);
}

export async function initAnimals(scene) {
    const loader = new GLTFLoader();
    const loadedBaseModels = {};

    // Cargar los archivos .gltf base una sola vez para optimizar
    const loadModel = (path) => {
        return new Promise((resolve) => {
            loader.load(
                path,
                (gltf) => resolve(gltf),
                undefined,
                (err) => {
                    console.error(`Error al cargar ${path}:`, err);
                    resolve(null);
                }
            );
        });
    };

    loadedBaseModels['./assets/map/animals/Dog.gltf'] = await loadModel('./assets/map/animals/Dog.gltf');
    loadedBaseModels['./assets/map/animals/Cat.gltf'] = await loadModel('./assets/map/animals/Cat.gltf');

    // Instanciar cada animal de la lista
    ANIMALS_CONFIG.forEach((config) => {
        const baseGltf = loadedBaseModels[config.modelPath];
        if (!baseGltf) return;

        // Clonar la estructura 3D y esqueletos
        const animalMesh = SkeletonUtils.clone(baseGltf.scene);
        animalMesh.scale.set(config.scale, config.scale, config.scale);

        // Ubicar en una posición aleatoria de la granja al aparecer
        const startX = MAP_BOUNDS.minX + Math.random() * (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
        const startZ = MAP_BOUNDS.minZ + Math.random() * (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ);
        animalMesh.position.set(startX, 0, startZ);

        // Habilitar sombras proyectadas por la luna
        animalMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(animalMesh);

        // Configurar animaciones independientes
        let mixer = null;
        if (baseGltf.animations && baseGltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(animalMesh);

            const clip = baseGltf.animations.find(anim => {
                const name = anim.name.toLowerCase();
                return name.includes('walk') || name.includes('run') || name.includes('trot') || name.includes('caminar');
            }) || baseGltf.animations[0];

            if (clip) {
                const cleanedClip = clip.clone();
                cleanedClip.tracks = cleanedClip.tracks.filter(track => {
                    const isScale = track.name.endsWith('.scale');
                    const isRootPos = track.name.includes('Hips.position') || track.name.includes('Root.position');
                    return !isScale && !isRootPos;
                });

                const action = mixer.clipAction(cleanedClip);
                action.play();
            }
        }

        activeAnimals.push({
            mesh: animalMesh,
            mixer: mixer,
            speed: config.speed,
            targetPosition: getRandomWaypoint(),
            turnSpeed: 3.5 + Math.random() * 2.0
        });
    });
}

export function updateAnimals(delta) {
    activeAnimals.forEach((animal) => {
        if (!animal.mesh) return;

        // Actualizar la animación individual
        if (animal.mixer) animal.mixer.update(delta);

        // Corregir postura para evitar inclinaciones verticales
        animal.mesh.rotation.x = 0;
        animal.mesh.rotation.z = 0;
        animal.mesh.position.y = 0;

        // Sistema de recorrido en patrulla
        const currentPos = animal.mesh.position.clone();
        currentPos.y = 0;

        const distance = currentPos.distanceTo(animal.targetPosition);

        // Al aproximarse al objetivo, asigna otro inmediatamente sin detenerse
        if (distance < 0.9) {
            animal.targetPosition = getRandomWaypoint();
        }

        // Dirección e interpolación suave de rotación
        const moveDir = new THREE.Vector3().subVectors(animal.targetPosition, currentPos).normalize();
        const targetRotation = Math.atan2(moveDir.x, moveDir.z);

        let diff = targetRotation - animal.mesh.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        animal.mesh.rotation.y += diff * animal.turnSpeed * delta;

        // Desplazamiento según su velocidad asignada
        animal.mesh.position.x += Math.sin(animal.mesh.rotation.y) * animal.speed * delta;
        animal.mesh.position.z += Math.cos(animal.mesh.rotation.y) * animal.speed * delta;
    });
}