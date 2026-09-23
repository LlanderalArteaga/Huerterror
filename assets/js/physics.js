import RAPIER from '@dimforge/rapier3d-compat';

export let world = null;
const dynamicBodies = []; // Para sincronizar la física con la malla gráfica de Three.js

export async function initPhysics() {
    await RAPIER.init();
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    world = new RAPIER.World(gravity);

    // Crear el plano del piso físico de la granja (100x100 metros)
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    world.createCollider(groundColliderDesc);

    console.log("Mundo Rapier 3D inicializado con éxito.");
}

// Agregar un objeto físico dinámico (para cajas derribables o proyectiles)
export function addDynamicBody(mesh, width, height, depth, mass = 1.0) {
    if (!world) return null;

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
        .setDensity(mass);
    world.createCollider(colliderDesc, rigidBody);

    dynamicBodies.push({ mesh, rigidBody });
    return rigidBody;
}

// Sincronizar las posiciones físicas con Three.js en cada fotograma
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