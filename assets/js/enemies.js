import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { addDynamicBody } from './physics.js';
import { activeTomatoes } from './tomato.js';
import { playerMesh } from './player.js';
import { gameState } from './game.js';
import { updateHUD } from './ui.js';

export const zombies = [];
let zombieModel = null;
let crateModel = null;
let zombieAttackClip = null;

const ZOMBIE_HEIGHT_OFFSET = 0.45;

export function initEnemiesAndProps(scene) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    // 1. Cargar Modelo del Zombie
    gltfLoader.load('./assets/models/enemies/Zombie_Male.gltf', (gltf) => {
        zombieModel = gltf.scene;
        zombieModel.scale.set(0.14, 0.14, 0.14);
    }, undefined, (err) => console.error("Error al cargar GLTF Zombie:", err));

    // 2. Cargar Animación FBX (Ruta corregida: Zombie_Attack.fbx)
    fbxLoader.load('./assets/models/enemies/animations/Zombie_Attack.fbx', (anim) => {
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
    }, undefined, (err) => console.error("Error al cargar FBX Animación Zombie:", err));

    // 3. Cargar Cajas
    gltfLoader.load('./assets/models/props/Block_WoodPlanks.gltf', (gltf) => {
        crateModel = gltf.scene;
        buildDestructibleTower(scene, 4, ZOMBIE_HEIGHT_OFFSET, -5);
    }, undefined, (err) => console.warn("Caja no encontrada, omitiendo props"));
}

function buildDestructibleTower(scene, x, y, z) {
    if (!crateModel) return;
    for (let i = 0; i < 3; i++) {
        const crate = crateModel.clone();
        crate.scale.set(0.3, 0.3, 0.3);
        crate.position.set(x, y + (i * 0.4), z);
        scene.add(crate);
        addDynamicBody(crate, 0.3, 0.3, 0.3, 2.0);
    }
}

export function spawnZombie(scene) {
    if (!zombieModel || !playerMesh) return;

    // Clonado correcto para mallas animadas usando SkeletonUtils
    const zombie = SkeletonUtils.clone(zombieModel);

    // Aparecer en un radio visible de 5 a 9 metros alrededor del personaje
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 4;

    const spawnX = playerMesh.position.x + Math.cos(angle) * radius;
    const spawnZ = playerMesh.position.z + Math.sin(angle) * radius;

    zombie.position.set(spawnX, ZOMBIE_HEIGHT_OFFSET, spawnZ);
    scene.add(zombie);

    const mixer = new THREE.AnimationMixer(zombie);
    if (zombieAttackClip) {
        const action = mixer.clipAction(zombieAttackClip);
        action.play();
    }

    zombies.push({ mesh: zombie, speed: 1.8, mixer });
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

        // Dentro del bucle en updateEnemies:
        z.mesh.position.addScaledVector(dir, z.speed * delta);
        // Limitar zombies para que no se salgan del suelo
        z.mesh.position.x = Math.max(-14.0, Math.min(14.0, z.mesh.position.x));
        z.mesh.position.z = Math.max(-18.0, Math.min(6.0, z.mesh.position.z));

        // Impacto con Jitomates
        for (let j = activeTomatoes.length - 1; j >= 0; j--) {
            const tom = activeTomatoes[j];
            if (z.mesh.position.distanceTo(tom.mesh.position) < 0.6) {
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
        if (z.mesh.position.distanceTo(playerMesh.position) < 0.6) {
            gameState.health -= 12 * delta;
            updateHUD();
        }
    }
}