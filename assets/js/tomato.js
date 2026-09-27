import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { playerMesh, switchAnimation, yaw, pitch, MAP_LIMITS } from './player.js';
import { checkCollision } from './physics.js';
import { gameState } from './game.js';
import { updateHUD, showInteractionPrompt, hideInteractionPrompt } from './ui.js';

// Configuración del audio de impacto del jitomate
const tomatoImpactSound = new Audio('./assets/audio/Sonido_Jitomate.mp3');
tomatoImpactSound.volume = 0.5;

// Función exportada para reproducir el sonido desde cualquier archivo
export function playTomatoImpactSound() {
    tomatoImpactSound.currentTime = 0;
    tomatoImpactSound.play().catch(() => {});
}

export const activeTomatoes = [];
const activeParticles = [];
let tomatoModel = null;

// Parámetro configurable: Potencia de tiro dinámica
export let throwForce = 25;

export function setThrowForce(val) {
    throwForce = parseFloat(val);
}

// Modelos base precargados de las 4 etapas de crecimiento
const loadedStages = { 1: null, 2: null, 3: null, 4: null };

// Lista con las 4 plantas en el mapa
const plants = [
    { id: 'static_1', pos: new THREE.Vector3(16, 0, 9.5), isRenewable: false, isReady: true, mesh: null },
    { id: 'static_2', pos: new THREE.Vector3(18, 0, -12.0), isRenewable: false, isReady: true, mesh: null },
    { id: 'static_3', pos: new THREE.Vector3(-18, 0, 12.0), isRenewable: false, isReady: true, mesh: null },
    { id: 'renewable', pos: new THREE.Vector3(-22, 0, -22.0), isRenewable: true, isReady: true, mesh: null }
];

export function createTomatoExplosion(scene, position) {
    const particleCount = 10;
    const geometry = new THREE.SphereGeometry(0.08, 6, 6);
    const material = new THREE.MeshStandardMaterial({
        color: 0xd32f2f,
        roughness: 0.3,
        metalness: 0.1
    });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 4 + 1.5,
            (Math.random() - 0.5) * 5
        );

        scene.add(particle);

        activeParticles.push({
            mesh: particle,
            velocity: velocity,
            life: 0.35 + Math.random() * 0.2
        });
    }
}

function updateExplosions(delta, scene) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.life -= delta;

        p.velocity.y -= 14.0 * delta;
        p.mesh.position.addScaledVector(p.velocity, delta);

        const scale = Math.max(0, p.life * 2.5);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            activeParticles.splice(i, 1);
        }
    }
}

export function initTomatoProps(scene) {
    const gltfLoader = new GLTFLoader();

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

    const stagesToLoad = [
        { id: 1, path: './assets/models/props/Tomato_1.glb' },
        { id: 2, path: './assets/models/props/Tomato_2.glb' },
        { id: 3, path: './assets/models/props/Tomato_3.glb' },
        { id: 4, path: './assets/models/props/Tomato_4.glb' }
    ];

    let loadedCount = 0;

    stagesToLoad.forEach((stage) => {
        gltfLoader.load(stage.path, (gltf) => {
            const mesh = gltf.scene;
            mesh.scale.set(0.8, 0.8, 0.8);
            mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            loadedStages[stage.id] = mesh;
            loadedCount++;

            if (loadedCount === 4) {
                spawnInitialPlants(scene);
            }
        });
    });

    window.addEventListener('click', () => {
        if (document.pointerLockElement === document.body && gameState.isPlaying && gameState.ammo > 0 && playerMesh) {
            shootTomato(scene);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'e' && playerMesh && gameState.isPlaying) {
            plants.forEach((plant) => {
                if (plant.isReady && plant.mesh) {
                    const dist = playerMesh.position.distanceTo(plant.pos);
                    if (dist < 3.0 && gameState.ammo < 10) {
                        gameState.ammo = 10;
                        updateHUD();

                        if (plant.isRenewable) {
                            harvestAndRegrow(scene, plant);
                        } else {
                            setPlantStage(scene, plant, 1);
                            plant.isReady = false;
                        }
                    }
                }
            });
        }
    });
}

function spawnInitialPlants(scene) {
    plants.forEach((plant) => {
        setPlantStage(scene, plant, 4);
    });
}

function setPlantStage(scene, plant, stageNumber) {
    if (!loadedStages[stageNumber]) return;

    if (plant.mesh) {
        scene.remove(plant.mesh);
    }

    const newMesh = SkeletonUtils.clone(loadedStages[stageNumber]);
    newMesh.position.copy(plant.pos);
    scene.add(newMesh);
    plant.mesh = newMesh;
}

function harvestAndRegrow(scene, plant) {
    plant.isReady = false;
    setPlantStage(scene, plant, 1);

    setTimeout(() => {
        if (gameState.isPlaying) setPlantStage(scene, plant, 2);
    }, 4000);

    setTimeout(() => {
        if (gameState.isPlaying) setPlantStage(scene, plant, 3);
    }, 8000);

    setTimeout(() => {
        if (gameState.isPlaying) {
            setPlantStage(scene, plant, 4);
            plant.isReady = true;
        }
    }, 12000);
}

function shootTomato(scene) {
    if (!playerMesh) return;

    switchAnimation('throw');
    gameState.ammo--;
    updateHUD();

    setTimeout(() => {
        if (!playerMesh) return;

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

        const velocity = direction.multiplyScalar(throwForce);

        scene.add(tomato);

        activeTomatoes.push({ 
            mesh: tomato, 
            velocity, 
            life: 3.0,
            gracePeriod: 0.15
        });
    }, 250);
}

export function updateTomatoes(delta, scene) {
    updateExplosions(delta, scene);

    for (let i = activeTomatoes.length - 1; i >= 0; i--) {
        const t = activeTomatoes[i];
        t.life -= delta;
        if (t.gracePeriod > 0) t.gracePeriod -= delta;

        t.velocity.y -= 7.0 * delta;

        const nextPos = t.mesh.position.clone().addScaledVector(t.velocity, delta);
        t.mesh.rotation.x += 12 * delta;

        let hasHit = false;

        if (t.gracePeriod <= 0) {
            if (nextPos.y <= 0.1) {
                hasHit = true;
            } else if (checkCollision(nextPos, 0.3)) {
                hasHit = true;
            } else if (
                nextPos.x <= MAP_LIMITS.minX || nextPos.x >= MAP_LIMITS.maxX ||
                nextPos.z <= MAP_LIMITS.minZ || nextPos.z >= MAP_LIMITS.maxZ
            ) {
                hasHit = true;
            }
        }

        if (hasHit) {
            createTomatoExplosion(scene, nextPos);
            playTomatoImpactSound();

            scene.remove(t.mesh);
            activeTomatoes.splice(i, 1);
        } else if (t.life <= 0) {
            scene.remove(t.mesh);
            activeTomatoes.splice(i, 1);
        } else {
            t.mesh.position.copy(nextPos);
        }
    }

    if (playerMesh && gameState.isPlaying) {
        let isNearReadyPlant = false;

        plants.forEach((plant) => {
            if (plant.isReady && plant.mesh) {
                const dist = playerMesh.position.distanceTo(plant.pos);
                if (dist < 3.0 && gameState.ammo < 10) {
                    isNearReadyPlant = true;
                }
            }
        });

        if (isNearReadyPlant) {
            showInteractionPrompt('[E] Cosechar Jitomates');
        } else {
            hideInteractionPrompt();
        }
    }
}