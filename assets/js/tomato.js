import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { playerMesh, switchAnimation } from './player.js';
import { gameState } from './game.js';
import { updateHUD } from './ui.js';

export const activeTomatoes = [];
let tomatoModel = null;
let tomatoPlantMesh = null;

export function initTomatoProps(scene) {
    const gltfLoader = new GLTFLoader();

    // Cargar modelo del Jitomate
    gltfLoader.load('./assets/models/props/Tomato.glb', (gltf) => {
        tomatoModel = gltf.scene;
        tomatoModel.scale.set(0.5, 0.5, 0.5);
    });

    // Cargar Planta de recarga de Jitomate en el centro de la granja
    gltfLoader.load('./assets/models/props/Tomato_Crop.glb', (gltf) => {
        tomatoPlantMesh = gltf.scene;
        tomatoPlantMesh.position.set(2, 0, 2);
        tomatoPlantMesh.scale.set(1.2, 1.2, 1.2);
        scene.add(tomatoPlantMesh);
    });

    // Evento de disparo con Clic Izquierdo
    window.addEventListener('click', () => {
        if (gameState.isPlaying && gameState.ammo > 0 && playerMesh) {
            shootTomato(scene);
        }
    });

    // Evento de recarga con la tecla 'E'
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'e' && tomatoPlantMesh && playerMesh) {
            const dist = playerMesh.position.distanceTo(tomatoPlantMesh.position);
            if (dist < 3.0) {
                gameState.ammo = 10;
                updateHUD();
            }
        }
    });
}

function shootTomato(scene) {
    if (!tomatoModel) return;

    switchAnimation('throw');
    gameState.ammo--;
    updateHUD();

    const tomato = tomatoModel.clone();
    tomato.position.copy(playerMesh.position);
    tomato.position.y += 1.2;

    // Calcular dirección del disparo
    const direction = new THREE.Vector3(0, 0.3, -1).applyQuaternion(playerMesh.quaternion).normalize();
    const velocity = direction.multiplyScalar(18.0);

    scene.add(tomato);
    activeTomatoes.push({ mesh: tomato, velocity, life: 3.0 });
}

export function updateTomatoes(delta, scene) {
    for (let i = activeTomatoes.length - 1; i >= 0; i--) {
        const t = activeTomatoes[i];
        t.life -= delta;

        // Gravedad parabólica
        t.velocity.y -= 9.8 * delta;
        t.mesh.position.addScaledVector(t.velocity, delta);

        // Destruir si toca el piso o expira su tiempo
        if (t.mesh.position.y <= 0.1 || t.life <= 0) {
            scene.remove(t.mesh);
            activeTomatoes.splice(i, 1);
        }
    }
}