import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { addDynamicBody } from './physics.js';
import { activeTomatoes } from './tomato.js';
import { playerMesh } from './player.js';
import { gameState } from './game.js';
import { updateHUD } from './ui.js';

export const zombies = [];
let zombieModel = null;
let crateModel = null;

export function initEnemiesAndProps(scene) {
    const gltfLoader = new GLTFLoader();

    // Cargar modelo del Zombie
    gltfLoader.load('./assets/models/enemies/Zombie_Male.gltf', (gltf) => {
        zombieModel = gltf.scene;
        zombieModel.scale.set(1.4, 1.4, 1.4);
    });

    // Cargar Cajas de Madera para Estructuras Derribables
    gltfLoader.load('./assets/models/props/Block_WoodPlanks.gltf', (gltf) => {
        crateModel = gltf.scene;
        buildDestructibleTower(scene, 8, 0, -10);
    });
}

// Construir una torre derribable de cajas con física
function buildDestructibleTower(scene, x, y, z) {
    if (!crateModel) return;
    for (let i = 0; i < 3; i++) {
        const crate = crateModel.clone();
        crate.position.set(x, i * 1.1 + 0.5, z);
        scene.add(crate);
        addDynamicBody(crate, 1.0, 1.0, 1.0, 2.0);
    }
}

// Invocación aleatoria de Zombies
export function spawnZombie(scene) {
    if (!zombieModel) return;

    const zombie = zombieModel.clone();
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 10;

    zombie.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    scene.add(zombie);

    zombies.push({ mesh: zombie, speed: 2.2 });
}

export function updateEnemies(delta, scene) {
    if (!playerMesh) return;

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];

        // Persecución hacia el jugador
        const dir = new THREE.Vector3().subVectors(playerMesh.position, z.mesh.position);
        dir.y = 0;
        dir.normalize();

        z.mesh.position.addScaledVector(dir, z.speed * delta);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Colisión con Jitomate (Derrota del Zombie)
        for (let j = activeTomatoes.length - 1; j >= 0; j--) {
            const tom = activeTomatoes[j];
            if (z.mesh.position.distanceTo(tom.mesh.position) < 1.2) {
                scene.remove(z.mesh);
                zombies.splice(i, 1);

                scene.remove(tom.mesh);
                activeTomatoes.splice(j, 1);

                gameState.score++;
                updateHUD();
                break;
            }
        }

        // Ataque al jugador
        if (z.mesh.position.distanceTo(playerMesh.position) < 1.0) {
            gameState.health -= 10 * delta;
            updateHUD();
        }
    }
}