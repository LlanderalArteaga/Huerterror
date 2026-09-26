import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { playerMesh } from './player.js';
import { gameState, onKeyCollected } from './game.js';
import { showInteractionPrompt, hideInteractionPrompt } from './ui.js';
import { staticColliders } from './physics.js'; // <-- Importado para físicas reales

export const activeChests = [];
const structureBlocks = [];
const structureColliders = []; // Guarda las colisiones de los bloques para eliminarlas al limpiar

let closedChestModel = null;
let openChestModel = null;
let crateBlockModel = null;
let woodBlockModel = null;
let stoneBlockModel = null;

const CHEST_SCALE = 0.22;

// Ubicaciones de los 3 cofres
const CHEST_LOCATIONS = [
    // Cofre 1: A la vista en los cultivos
    {
        pos: new THREE.Vector3(5.0, 0.0, 8.0),
        rotY: 0,
        type: 'visible'
    },
    // Cofre 2: Escondido detrás del granero rodeado de cajas de madera
    {
        pos: new THREE.Vector3(20.5, 0.0, -18.5),
        rotY: -Math.PI / 2,
        type: 'wood_shelter'
    },
    // Cofre 3: Escondido en la esquina lejana dentro de un pequeño refugio de piedra
    {
        pos: new THREE.Vector3(-21.5, 0.0, -21.5),
        rotY: Math.PI / 4,
        type: 'stone_bunker'
    }
];

// Crea la malla 3D de la llave giratoria mística
function createKeyMesh() {
    const keyGroup = new THREE.Group();

    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x554400
    });

    const ringGeo = new THREE.TorusGeometry(0.2, 0.04, 12, 24);
    const ringMesh = new THREE.Mesh(ringGeo, goldMaterial);
    ringMesh.position.y = 0.4;
    keyGroup.add(ringMesh);

    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const stemMesh = new THREE.Mesh(stemGeo, goldMaterial);
    stemMesh.position.y = 0.12;
    keyGroup.add(stemMesh);

    const toothGeo = new THREE.BoxGeometry(0.12, 0.06, 0.03);
    const toothMesh = new THREE.Mesh(toothGeo, goldMaterial);
    toothMesh.position.set(0.07, -0.05, 0);
    keyGroup.add(toothMesh);

    const keyLight = new THREE.PointLight(0xffcc00, 3.0, 4.0);
    keyLight.position.set(0, 0.2, 0);
    keyGroup.add(keyLight);

    return keyGroup;
}

export function initChests(scene) {
    const loader = new GLTFLoader();

    // Carga de modelos de cofres
    loader.load('./assets/map/envirioment/Chest_Closed.gltf', (gltf) => {
        closedChestModel = gltf.scene;
        closedChestModel.scale.set(CHEST_SCALE, CHEST_SCALE, CHEST_SCALE);
    }, undefined, (err) => console.error("Error al cargar Chest_Closed.gltf:", err));

    loader.load('./assets/map/envirioment/Chest_Open.gltf', (gltf) => {
        openChestModel = gltf.scene;
        openChestModel.scale.set(CHEST_SCALE, CHEST_SCALE, CHEST_SCALE);
    }, undefined, (err) => console.error("Error al cargar Chest_Open.gltf:", err));

    // Carga de bloques decorativos para los escondites
    loader.load('./assets/map/blocks/Block_Crate.gltf', (gltf) => {
        crateBlockModel = gltf.scene;
    }, undefined, () => {});

    loader.load('./assets/map/blocks/Block_WoodPlanks.gltf', (gltf) => {
        woodBlockModel = gltf.scene;
    }, undefined, () => {});

    loader.load('./assets/map/blocks/Block_Stone.gltf', (gltf) => {
        stoneBlockModel = gltf.scene;
    }, undefined, () => {});
}

// Construye estructuras de bloques alrededor de los cofres difíciles y les asigna físicas
function buildChestStructure(scene, loc) {
    let offsets = [];
    let baseModel = null;

    if (loc.type === 'wood_shelter') {
        baseModel = crateBlockModel || woodBlockModel;
        if (!baseModel) return;

        // Pared de cajas apiladas tapando la vista frontal
        offsets = [
            { x: -0.8, y: 0, z: 0.6 },
            { x: 0, y: 0, z: 0.8 },
            { x: 0.8, y: 0, z: 0.6 },
            { x: -0.8, y: 0.6, z: 0.6 },
            { x: 0, y: 0.6, z: 0.8 }
        ];

    } else if (loc.type === 'stone_bunker') {
        baseModel = stoneBlockModel || woodBlockModel;
        if (!baseModel) return;

        // Estructura en "U" rodeando el cofre en la esquina
        offsets = [
            { x: 0.8, y: 0, z: 0 },
            { x: 0.8, y: 0.6, z: 0 },
            { x: 0, y: 0, z: 0.8 },
            { x: 0, y: 0.6, z: 0.8 },
            { x: 0.8, y: 0, z: 0.8 },
            { x: -0.8, y: 0, z: 0.8 }
        ];
    }

    offsets.forEach((off) => {
        const block = SkeletonUtils.clone(baseModel);
        const scale = loc.type === 'wood_shelter' ? 0.6 : 0.65;
        block.scale.set(scale, scale, scale);
        block.position.copy(loc.pos).add(new THREE.Vector3(off.x, off.y, off.z));
        scene.add(block);
        structureBlocks.push(block);

        // Generar caja de colisión física (Box3) para detener al jugador, zombies y jitomates
        block.updateMatrixWorld(true);
        const colliderBox = new THREE.Box3().setFromObject(block);
        
        staticColliders.push(colliderBox);
        structureColliders.push(colliderBox);
    });
}

export function spawnChests(scene) {
    clearChests(scene);

    CHEST_LOCATIONS.forEach((loc, index) => {
        // Construye el escondite visual y físico si aplica
        buildChestStructure(scene, loc);

        let closedMesh = closedChestModel ? SkeletonUtils.clone(closedChestModel) : createFallbackChest(0x8b4513);
        let openMesh = openChestModel ? SkeletonUtils.clone(openChestModel) : createFallbackChest(0x5c2c06);

        closedMesh.position.copy(loc.pos);
        closedMesh.rotation.y = loc.rotY;
        closedMesh.visible = true;
        scene.add(closedMesh);

        openMesh.position.copy(loc.pos);
        openMesh.rotation.y = loc.rotY;
        openMesh.visible = false;
        scene.add(openMesh);

        // Luz dorada suave dentro del cofre
        const light = new THREE.PointLight(0xff8800, 1.0, 2.5);
        light.position.copy(loc.pos).add(new THREE.Vector3(0, 0.4, 0));
        scene.add(light);

        activeChests.push({
            id: index,
            closedMesh,
            openMesh,
            light,
            pos: loc.pos,
            opened: false,
            animatingKey: false,
            keyMesh: null,
            keyTimer: 0
        });
    });
}

function createFallbackChest(colorHex) {
    const geo = new THREE.BoxGeometry(0.5, 0.35, 0.35);
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
    return new THREE.Mesh(geo, mat);
}

export function clearChests(scene) {
    // Remover cofres y luces
    activeChests.forEach((c) => {
        if (c.closedMesh) scene.remove(c.closedMesh);
        if (c.openMesh) scene.remove(c.openMesh);
        if (c.light) scene.remove(c.light);
        if (c.keyMesh) scene.remove(c.keyMesh);
    });
    activeChests.length = 0;

    // Remover bloques visuales
    structureBlocks.forEach((b) => scene.remove(b));
    structureBlocks.length = 0;

    // Remover cajas de colisión de las físicas globales
    structureColliders.forEach((box) => {
        const index = staticColliders.indexOf(box);
        if (index !== -1) {
            staticColliders.splice(index, 1);
        }
    });
    structureColliders.length = 0;
}

export function updateChests(delta, scene) {
    if (!playerMesh || !gameState.isPlaying || gameState.level !== 2) return;

    let isNearChest = false;

    activeChests.forEach((c) => {
        // Animación de la llave mística al abrir el cofre
        if (c.animatingKey) {
            c.keyTimer += delta;

            if (c.keyMesh) {
                c.keyMesh.rotation.y += 3.5 * delta;
                c.keyMesh.position.y += 0.25 * delta;
            }

            if (c.keyTimer >= 3.0) {
                c.animatingKey = false;
                if (c.keyMesh) {
                    scene.remove(c.keyMesh);
                    c.keyMesh = null;
                }
                onKeyCollected();
            }
        }

        if (c.opened) return;

        const dist = playerMesh.position.distanceTo(c.pos);
        if (dist < 2.2) {
            isNearChest = true;
        }
    });

    if (isNearChest && !gameState.doorOpen) {
        showInteractionPrompt('[E] Abrir Cofre Místico 🔑');
    } else if (gameState.level === 2 && !gameState.doorOpen) {
        hideInteractionPrompt();
    }
}

// Abrir cofre con la tecla 'E'
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && playerMesh && gameState.isPlaying && gameState.level === 2) {
        activeChests.forEach((c) => {
            if (!c.opened && playerMesh.position.distanceTo(c.pos) < 2.2) {
                c.opened = true;
                c.closedMesh.visible = false;
                c.openMesh.visible = true;

                if (c.light) c.light.color.setHex(0x00ff66);

                hideInteractionPrompt();

                const keyMesh = createKeyMesh();
                keyMesh.position.copy(c.pos).add(new THREE.Vector3(0, 0.3, 0));
                keyMesh.lookAt(playerMesh.position.x, keyMesh.position.y, playerMesh.position.z);

                const currentScene = c.openMesh.parent || playerMesh.parent;
                if (currentScene) {
                    currentScene.add(keyMesh);
                }

                c.keyMesh = keyMesh;
                c.animatingKey = true;
                c.keyTimer = 0;
            }
        });
    }
});