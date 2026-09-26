import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { addDynamicBody, checkCollision } from './physics.js';
import { activeTomatoes, createTomatoExplosion } from './tomato.js';
import { playerMesh, MAP_LIMITS } from './player.js';
import { gameState, onZombieKilled } from './game.js';
import { updateHUD, triggerDamageFlash } from './ui.js';

export const zombies = [];
let zombieModel = null;
let crateModel = null;
let zombieAttackClip = null;

const ZOMBIE_HEIGHT_OFFSET = 0;
const ZOMBIE_RADIUS = 0.35;
const ATTACK_RANGE = 1.1; // Distancia límite para detenerse y atacar sin meterse al jugador

const FENCE_LIMITS = {
    minX: -23.5,
    maxX: 23.5,
    minZ: -23.5,
    maxZ: 23.5
};

export function initEnemiesAndProps(scene) {
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load('./assets/models/enemies/Zombie_Male.gltf', (gltf) => {
        zombieModel = gltf.scene;
        zombieModel.scale.set(0.2, 0.2, 0.2);
        zombieModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, undefined, (err) => console.error("Error al cargar GLTF Zombie:", err));

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

    gltfLoader.load('./assets/models/props/Block_WoodPlanks.gltf', (gltf) => {
        crateModel = gltf.scene;
        crateModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, undefined, (err) => console.warn("Caja no encontrada, omitiendo props"));
}

let damageFlashCooldown = 0;

export function spawnZombie(scene) {
    if (!zombieModel || !playerMesh) return;

    const zombie = SkeletonUtils.clone(zombieModel);
    zombie.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 4;

    let spawnX = playerMesh.position.x + Math.cos(angle) * radius;
    let spawnZ = playerMesh.position.z + Math.sin(angle) * radius;

    spawnX = Math.max(FENCE_LIMITS.minX, Math.min(FENCE_LIMITS.maxX, spawnX));
    spawnZ = Math.max(FENCE_LIMITS.minZ, Math.min(FENCE_LIMITS.maxZ, spawnZ));

    zombie.position.set(spawnX, ZOMBIE_HEIGHT_OFFSET, spawnZ);
    scene.add(zombie);

    const mixer = new THREE.AnimationMixer(zombie);
    if (zombieAttackClip) {
        const action = mixer.clipAction(zombieAttackClip);
        action.play();
    }

    // Velocidad incrementada si la horda está enfurecida (puertas abiertas en Nivel 2)
    const isEnraged = (gameState.level === 3) || (gameState.level === 2 && gameState.doorOpen);
    const initialSpeed = isEnraged ? 3.5 : 1.8;

    zombies.push({ mesh: zombie, speed: initialSpeed, mixer });
}

// Elimina todos los zombies activos de la escena y reinicia la lista
export function clearEnemies(scene) {
    zombies.forEach((z) => {
        if (z && z.mesh) {
            scene.remove(z.mesh);
        }
    });
    zombies.length = 0;
}

export function updateEnemies(delta, scene) {
    if (!playerMesh) return;

    if (damageFlashCooldown > 0) {
        damageFlashCooldown -= delta;
    }

    // Si están abiertas las puertas en el Nivel 2, los zombies entran en modo Furia
    const isEnraged = (gameState.level === 3) || (gameState.level === 2 && gameState.doorOpen);
    const currentSpeed = isEnraged ? 3.5 : 1.8;
    const currentDamage = isEnraged ? 28 : 12;

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        z.speed = currentSpeed; // Aplica velocidad de furia a todos los zombies existentes

        if (z.mixer) z.mixer.update(delta);

        const distToPlayer = z.mesh.position.distanceTo(playerMesh.position);

        z.mesh.lookAt(playerMesh.position.x, z.mesh.position.y, playerMesh.position.z);

        if (distToPlayer > ATTACK_RANGE) {
            const dir = new THREE.Vector3().subVectors(playerMesh.position, z.mesh.position);
            dir.y = 0;
            dir.normalize();

            const moveStep = dir.multiplyScalar(z.speed * delta);

            const nextXPos = z.mesh.position.clone();
            nextXPos.x += moveStep.x;
            if (!checkCollision(nextXPos, ZOMBIE_RADIUS)) {
                z.mesh.position.x = nextXPos.x;
            }

            const nextZPos = z.mesh.position.clone();
            nextZPos.z += moveStep.z;
            if (!checkCollision(nextZPos, ZOMBIE_RADIUS)) {
                z.mesh.position.z = nextZPos.z;
            }

            z.mesh.position.x = Math.max(MAP_LIMITS.minX, Math.min(MAP_LIMITS.maxX, z.mesh.position.x));
            z.mesh.position.z = Math.max(MAP_LIMITS.minZ, Math.min(MAP_LIMITS.maxZ, z.mesh.position.z));
        }

        // --- Impacto de tomates ---
        const zombieCenter = z.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
        let zombieHit = false;

        for (let j = activeTomatoes.length - 1; j >= 0; j--) {
            const tom = activeTomatoes[j];

            if (zombieCenter.distanceTo(tom.mesh.position) < 1.2) {
                createTomatoExplosion(scene, tom.mesh.position.clone());

                scene.remove(tom.mesh);
                activeTomatoes.splice(j, 1);

                scene.remove(z.mesh);
                zombies.splice(i, 1);

                onZombieKilled();
                zombieHit = true;
                break;
            }
        }

        if (zombieHit) continue;

        // Daño al jugador (Daño incrementado en fase de escape)
        if (distToPlayer <= ATTACK_RANGE) {
            gameState.health -= currentDamage * delta;
            updateHUD();

            if (damageFlashCooldown <= 0) {
                triggerDamageFlash();
                damageFlashCooldown = 0.3;
            }
        }
    }
}