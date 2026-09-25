import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export let world = null;
export const staticColliders = [];
const dynamicBodies = [];

// Inicialización del motor físico Rapier
export async function initPhysics() {
    await RAPIER.init();
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    world = new RAPIER.World(gravity);

    // Suelo base
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    world.createCollider(groundColliderDesc);

    console.log("Físicas Rapier inicializadas.");
}

// Limpiar colisionadores (útil al reiniciar o recargar mapa)
export function clearColliders() {
    staticColliders.length = 0;
}

/**
 * Agrega una caja de colisión ajustada al objeto.
 * @param {THREE.Object3D} object Objeto 3D al que generar colisionador.
 * @param {number} shrinkFactor Porcentaje a reducir la caja (ej: 0.1 reduce un 10%).
 * @param {number|null} customRadiusXZ Radio exacto opcional para X/Z (ideal para troncos de árboles).
 */
export function addStaticCollider(object, shrinkFactor = 0.0, customRadiusXZ = null) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);

    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    let halfX, halfZ;

    // Si definimos un radio personalizado (ej. para troncos), lo usamos directamente
    if (customRadiusXZ !== null && customRadiusXZ > 0) {
        halfX = customRadiusXZ;
        halfZ = customRadiusXZ;
    } else {
        const factor = Math.max(0.05, 1.0 - shrinkFactor);
        halfX = (size.x * factor) / 2;
        halfZ = (size.z * factor) / 2;
    }

    const adjustedBox = new THREE.Box3(
        new THREE.Vector3(center.x - halfX, box.min.y, center.z - halfZ),
        new THREE.Vector3(center.x + halfX, box.max.y, center.z + halfZ)
    );

    staticColliders.push(adjustedBox);
}

// Agrega cuerpo dinámico
export function addDynamicBody(mesh, width = 0.3, height = 0.3, depth = 0.3, mass = 2.0) {
    if (!world) return;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
        .setMass(mass);
    world.createCollider(colliderDesc, rigidBody);

    dynamicBodies.push({ mesh, rigidBody });
}

// Comprueba colisiones considerando posición Y real del personaje
export function checkCollision(targetPosition, radius = 0.3, height = 1.8) {
    const yMin = targetPosition.y !== undefined ? targetPosition.y : 0.1;

    const playerBox = new THREE.Box3(
        new THREE.Vector3(targetPosition.x - radius, yMin, targetPosition.z - radius),
        new THREE.Vector3(targetPosition.x + radius, yMin + height, targetPosition.z + radius)
    );

    for (const collider of staticColliders) {
        if (playerBox.intersectsBox(collider)) {
            return true;
        }
    }
    return false;
}

// Actualización del bucle físico
export function updatePhysics() {
    if (!world) return;
    world.step();

    for (const item of dynamicBodies) {
        const position = item.rigidBody.translation();
        const rotation = item.rigidBody.rotation();

        item.mesh.position.set(position.x, position.y, position.z);
        item.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
}