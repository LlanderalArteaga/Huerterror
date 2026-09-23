import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { addDynamicBody } from './physics.js';
import { activeTomatoes } from './tomato.js';
import { playerMesh } from './player.js';
import { gameState } from './game.js';
import { updateHUD } from './ui.js';

export const zombies = [];
let zombieModel = null;
let crateModel = null;
let zombieAttackClip = null;

export function initEnemiesAndProps(scene) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    // 1. Cargar Modelo del Zombie
    gltfLoader.load('./assets/models/enemies/Zombie_Male.gltf', (gltf) => {
        zombieModel = gltf.scene;
        zombieModel.scale.set(0.8, 0.8, 0.8); // Proporcional al jugador
    });

    // 2. Cargar Animación FBX de Ataque
    fbxLoader.load('./assets/models/enemies/animations/ZombieAttack.fbx', (anim) => {
        if (anim.animations && anim.animations.length) {
            zombieAttackClip = anim.animations[0];

            zombieAttackClip.tracks = zombieAttackClip.tracks.filter(track => {
                const isScale = track.name.endsWith('.scale');
                const isRootPosition = track.name.includes('Hips.position') || track.name.includes('Root.position');
                return !isScale && !isRootPosition;
            });

            zombieAttackClip.tracks.forEach((track) => {
                track.name = track.name.replace('mixamorig', '');
            });
        }
    });

    // 3. Cargar Cajas
    gltfLoader.load('./assets/models/props/Block_WoodPlanks.gltf', (gltf) => {
        crateModel = gltf.scene;
        buildDestructibleTower(scene, 8, 0, -10);
    });
}

function buildDestructibleTower(scene, x, y, z) {
    if (!crateModel) return;
    for (let i = 0; i < 3; i++) {
        const crate = crateModel.clone();
        crate.position.set(x, i * 1.1 + 0.5, z);
        scene.add(crate);
        addDynamicBody(crate, 1.0, 1.0, 1.0, 2.0);
    }
}

export function spawnZombie(scene) {
    if (!zombieModel || !playerMesh) return;

    const zombie = zombieModel.clone();
    
    // Generar zombies en un radio cercano alrededor del jugador (entre 12 y 20 metros)
    const angle = Math.random() * Math.PI * 2;
    const radius = 12 + Math.random() * 8;

    const spawnX = playerMesh.position.x + Math.cos(angle) * radius;
    const spawnZ = playerMesh.position.z + Math.sin(angle) * radius;

    zombie.position.set(spawnX, 0, spawnZ);
    scene.add(zombie);

    const mixer = new THREE.AnimationMixer(zombie);
    if (zombieAttackClip) {
        const action = mixer.clipAction(zombieAttackClip);
        action.play();
    }

    zombies.push({ mesh: zombie, speed: 2.5, mixer });
}

export function updateEnemies(delta, scene) {
    if (!playerMesh) return;

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];

        if (z.mixer) z.mixer.update(delta);

        // Movimiento en dirección al jugador
        const dir = new THREE.Vector3().subVectors(playerMesh.position, z.mesh.position);
        dir.y = 0;
        dir.normalize();

        z.mesh.position.addScaledVector(dir, z.speed * delta);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Impacto con Jitomates
        for (let j = activeTomatoes.length - 1; j >= 0; j--) {
            const tom = activeTomatoes[j];
            if (z.mesh.position.distanceTo(tom.mesh.position) < 1.5) {
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
        if (z.mesh.position.distanceTo(playerMesh.position) < 1.2) {
            gameState.health -= 12 * delta;
            updateHUD();
        }
    }
}