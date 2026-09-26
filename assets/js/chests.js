import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { playerMesh } from './player.js';
import { gameState, onKeyCollected } from './game.js';
import { showInteractionPrompt, hideInteractionPrompt } from './ui.js';
import { staticColliders } from './physics.js';

export const activeChests = [];
const structureBlocks = [];
const structureColliders = [];

let closedChestModel = null;
let openChestModel = null;
let crateBlockModel = null;
let woodBlockModel = null;
let stoneBlockModel = null;

const CHEST_SCALE = 0.22;

// 5 Posiciones para el Nivel 3
const CHEST_LOCATIONS_L3 = [
    { pos: new THREE.Vector3(5.0, 0.0, 8.0), rotY: 0, type: 'visible' },
    { pos: new THREE.Vector3(20.5, 0.0, -18.5), rotY: -Math.PI / 2, type: 'wood_shelter' },
    { pos: new THREE.Vector3(-21.5, 0.0, -21.5), rotY: Math.PI / 4, type: 'stone_bunker' },
    { pos: new THREE.Vector3(-17.5, 0.0, 15.0), rotY: Math.PI / 3, type: 'wood_shelter' },
    { pos: new THREE.Vector3(18.0, 0.0, 18.0), rotY: -Math.PI / 4, type: 'stone_bunker' }
];

// 3 Posiciones para el Nivel 2
const CHEST_LOCATIONS_L2 = [
    { pos: new THREE.Vector3(5.0, 0.0, 8.0), rotY: 0, type: 'visible' },
    { pos: new THREE.Vector3(20.5, 0.0, -18.5), rotY: -Math.PI / 2, type: 'wood_shelter' },
    { pos: new THREE.Vector3(-21.5, 0.0, -21.5), rotY: Math.PI / 4, type: 'stone_bunker' }
];

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

    loader.load('./assets/map/envirioment/Chest_Closed.gltf', (gltf) => {
        closedChestModel = gltf.scene;
        closedChestModel.scale.set(CHEST_SCALE, CHEST_SCALE, CHEST_SCALE);
    }, undefined, (err) => console.error("Error al cargar Chest_Closed.gltf:", err));

    loader.load('./assets/map/envirioment/Chest_Open.gltf', (gltf) => {
        openChestModel = gltf.scene;
        openChestModel.scale.set(CHEST_SCALE, CHEST_SCALE, CHEST_SCALE);
    }, undefined, (err) => console.error("Error al cargar Chest_Open.gltf:", err));

    loader.load('./assets/map/blocks/Block_Crate.gltf', (gltf) => { crateBlockModel = gltf.scene; });
    loader.load('./assets/map/blocks/Block_WoodPlanks.gltf', (gltf) => { woodBlockModel = gltf.scene; });
    loader.load('./assets/map/blocks/Block_Stone.gltf', (gltf) => { stoneBlockModel = gltf.scene; });
}

function buildChestStructure(scene, loc) {
    let offsets = [];
    let baseModel = null;

    if (loc.type === 'wood_shelter') {
        baseModel = crateBlockModel || woodBlockModel;
        if (!baseModel) return;

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

        block.updateMatrixWorld(true);
        const colliderBox = new THREE.Box3().setFromObject(block);
        
        staticColliders.push(colliderBox);
        structureColliders.push(colliderBox);
    });
}

export function spawnChests(scene) {
    clearChests(scene);

    const locations = (gameState.level === 3) ? CHEST_LOCATIONS_L3 : CHEST_LOCATIONS_L2;

    locations.forEach((loc, index) => {
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
    activeChests.forEach((c) => {
        if (c.closedMesh) scene.remove(c.closedMesh);
        if (c.openMesh) scene.remove(c.openMesh);
        if (c.light) scene.remove(c.light);
        if (c.keyMesh) scene.remove(c.keyMesh);
    });
    activeChests.length = 0;

    structureBlocks.forEach((b) => scene.remove(b));
    structureBlocks.length = 0;

    structureColliders.forEach((box) => {
        const index = staticColliders.indexOf(box);
        if (index !== -1) {
            staticColliders.splice(index, 1);
        }
    });
    structureColliders.length = 0;
}

export function updateChests(delta, scene) {
    if (!playerMesh || !gameState.isPlaying || (gameState.level !== 2 && gameState.level !== 3)) return;

    let isNearChest = false;

    activeChests.forEach((c) => {
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
    } else if (!gameState.doorOpen) {
        hideInteractionPrompt();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && playerMesh && gameState.isPlaying && (gameState.level === 2 || gameState.level === 3)) {
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