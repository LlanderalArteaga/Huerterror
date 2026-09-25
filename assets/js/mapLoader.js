import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { addStaticCollider, clearColliders } from './physics.js';

const loader = new GLTFLoader();

export async function loadCustomMap(scene) {
    clearColliders();

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    // --- 1. ATMÓSFERA E ILUMINACIÓN ---
    const fogColor = 0x0f101d;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.025); // Fog ajustado para dar mayor alcance visual

    const ambientLight = new THREE.AmbientLight(0x665577, 0.8);
    mapGroup.add(ambientLight);

    // --- LUNA Y LUZ DE SOMBRAS ALINEADAS ---
    const moonPosition = new THREE.Vector3(45, 55, -80);

    const moonLight = new THREE.DirectionalLight(0x8899cc, 1.4);
    moonLight.position.copy(moonPosition);
    moonLight.castShadow = true;

    // Ajustes del mapa de sombras para que la luna sirva como foco principal
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 200;

    const shadowExtent = 45; // Cobertura de la proyección para abarcar todo el terreno (64x64)
    moonLight.shadow.camera.left = -shadowExtent;
    moonLight.shadow.camera.right = shadowExtent;
    moonLight.shadow.camera.top = shadowExtent;
    moonLight.shadow.camera.bottom = -shadowExtent;
    moonLight.shadow.bias = -0.0005; // Evita solapamientos/artefactos de sombra en la superficie

    mapGroup.add(moonLight);

    // --- LUNA (Modelo visual en la bóveda celeste) ---
    const moonGeo = new THREE.SphereGeometry(6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae6, fog: false }); 
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.copy(moonPosition); 
    mapGroup.add(moonMesh);

    // --- CIELO ESTRELLADO 360° (Domo hemisférico alrededor de todo el mapa) ---
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const domeRadius = 140; // Radio del domo de estrellas

    for (let i = 0; i < starCount; i++) {
        const y = Math.random() * (domeRadius - 8) + 8; // Altura en el cielo
        const rHorizontal = Math.sqrt(domeRadius * domeRadius - y * y);
        const theta = Math.random() * Math.PI * 2; // 360 grados alrededor

        starPos[i * 3] = rHorizontal * Math.cos(theta);
        starPos[i * 3 + 1] = y;
        starPos[i * 3 + 2] = rHorizontal * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    
    const starMat = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.6, 
        transparent: true, 
        opacity: 0.9, 
        fog: false // Ignora la niebla para que brillen en todo el domo
    });
    const stars = new THREE.Points(starGeo, starMat);
    mapGroup.add(stars);

    // --- 2. TERRENO BASE Y SENDEROS ---
    const groundGeo = new THREE.PlaneGeometry(64, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2416, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    mapGroup.add(ground);

    const pathMat = new THREE.MeshStandardMaterial({ color: 0x3e2d21, roughness: 0.9 });
    
    const nsPath = new THREE.Mesh(new THREE.PlaneGeometry(6, 48), pathMat);
    nsPath.rotation.x = -Math.PI / 2;
    nsPath.position.set(0, 0.02, -1);
    nsPath.receiveShadow = true;
    mapGroup.add(nsPath);

    const ewPath = new THREE.Mesh(new THREE.PlaneGeometry(50, 6), pathMat);
    ewPath.rotation.x = -Math.PI / 2;
    ewPath.position.set(0, 0.02, -1);
    ewPath.receiveShadow = true;
    mapGroup.add(ewPath);

    // --- 3. PARCELAS DE TIERRA ---
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x2b1b10, roughness: 1.0 });

    const cornPlot = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), dirtMat);
    cornPlot.rotation.x = -Math.PI / 2;
    cornPlot.position.set(13, 0.01, -13);
    cornPlot.receiveShadow = true;
    mapGroup.add(cornPlot);

    const vegPlot = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), dirtMat);
    vegPlot.rotation.x = -Math.PI / 2;
    vegPlot.position.set(-13, 0.01, 11);
    vegPlot.receiveShadow = true;
    mapGroup.add(vegPlot);

    const pumpkinPlot = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), dirtMat);
    pumpkinPlot.rotation.x = -Math.PI / 2;
    pumpkinPlot.position.set(13, 0.01, 11);
    pumpkinPlot.receiveShadow = true;
    mapGroup.add(pumpkinPlot);

    // --- 4. SURCOS DE AGUA ---
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x1f7282,
        roughness: 0.1,
        metalness: 0.7,
        transparent: true,
        opacity: 0.82
    });

    const wetDirtMat = new THREE.MeshStandardMaterial({
        color: 0x150d07,
        roughness: 0.95
    });

    const createWaterFurrow = (x, z, width, length) => {
        const trench = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.3, length), wetDirtMat);
        trench.rotation.x = -Math.PI / 2;
        trench.position.set(x, 0.015, z);
        trench.receiveShadow = true;
        mapGroup.add(trench);

        const water = new THREE.Mesh(new THREE.PlaneGeometry(width, length), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(x, 0.025, z);
        water.receiveShadow = true;
        mapGroup.add(water);
    };

    createWaterFurrow(-16.0, 11, 0.7, 13);
    createWaterFurrow(-10.2, 11, 0.7, 13);
    createWaterFurrow(13.0, -13, 0.9, 13);
    createWaterFurrow(13.0, 11, 0.9, 13);

    // --- 5. CARGADOR DE MODELOS ---
    const loadModel = (primaryPath, fallbackPath = null) => {
        return new Promise((resolve) => {
            loader.load(
                primaryPath,
                (gltf) => resolve({ status: 'ok', scene: gltf.scene, path: primaryPath }),
                undefined,
                () => {
                    if (fallbackPath) {
                        loader.load(
                            fallbackPath,
                            (gltf) => resolve({ status: 'ok', scene: gltf.scene, path: fallbackPath }),
                            undefined,
                            () => resolve({ status: 'error', path: primaryPath })
                        );
                    } else {
                        resolve({ status: 'error', path: primaryPath });
                    }
                }
            );
        });
    };

    const results = await Promise.all([
        loadModel('./assets/map/farm/BigBarn.glb'),
        loadModel('./assets/map/farm/Silo.glb'),
        loadModel('./assets/map/farm/Windmill.glb'),
        loadModel('./assets/map/farm/Well.glb'),
        loadModel('./assets/map/farm/ChickenCoop.glb'),
        loadModel('./assets/map/farm/WaterTower.glb'),
        loadModel('./assets/map/farm/Fence.glb'),
        loadModel('./assets/map/farm/Fence2.glb'),

        loadModel('./assets/map/envirioment/Beet_1.glb'),
        loadModel('./assets/map/envirioment/Beet_4.glb'),
        loadModel('./assets/map/envirioment/Carrot_1.glb'),
        loadModel('./assets/map/envirioment/Carrot_3.glb'),
        loadModel('./assets/map/envirioment/Corn_2.glb'),
        loadModel('./assets/map/envirioment/Corn_4.glb'),
        loadModel('./assets/map/envirioment/Lettuce_1.glb'),
        loadModel('./assets/map/envirioment/Lettuce_3.glb'),
        loadModel('./assets/map/envirioment/Pumpkin_2.glb'),
        loadModel('./assets/map/envirioment/Pumpkin_4.glb'),

        loadModel('./assets/map/envirioment/Apple_4.glb'),
        loadModel('./assets/map/envirioment/Orange_2.glb'),
        loadModel('./assets/map/envirioment/Orange_4.glb'),

        loadModel('./assets/map/envirioment/Flowers_1.gltf'),
        loadModel('./assets/map/envirioment/Flowers_2.gltf'),
        loadModel('./assets/map/envirioment/Grass_2.glb'),
        loadModel('./assets/map/envirioment/Grass_4.glb'),

        loadModel('./assets/map/halloween/Autumn pine.glb', './assets/map/envirioment/Autumn pine.glb'),
        loadModel('./assets/map/halloween/Post Lantern.glb', './assets/map/envirioment/Post Lantern.glb')
    ]);

    const models = {};
    results.forEach(res => {
        if (res.status === 'ok') {
            const fileName = res.path.split('/').pop();
            const key = fileName.replace('.glb', '').replace('.gltf', '');
            models[key] = res.scene;
        }
    });

    // --- FUNCIÓN SPAWNOBJECT ---
    const spawnObject = (baseModel, x, z, targetSize = 1.0, rotationY = 0, shrinkHitbox = 0.0, hasCollider = true, offsetY = 0, customRadius = null) => {
        if (!baseModel) return null;

        const clone = baseModel.clone(true);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        mapGroup.add(clone);

        const initialBox = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        initialBox.getSize(size);

        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
            const scaleFactor = targetSize / maxDimension;
            clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        clone.rotation.y = rotationY;
        clone.position.set(x, 0, z);

        clone.updateMatrixWorld(true);

        const updatedBox = new THREE.Box3().setFromObject(clone);
        const minY = updatedBox.min.y;
        clone.position.y = -minY + offsetY;

        clone.updateMatrixWorld(true);

        if (hasCollider) {
            addStaticCollider(clone, shrinkHitbox, customRadius);
        }

        return clone;
    };

    // --- 6. ESTRUCTURAS EN ESQUINA NOROESTE ---
    const barnX = -13;
    const barnZ = -15;
    const barnRotY = 1.0;

    if (models['BigBarn']) {
        spawnObject(models['BigBarn'], barnX, barnZ, 6.0, barnRotY, 0.0, false, -0.17);

        const barnInteriorLight = new THREE.PointLight(0xffa544, 4.5, 12);
        barnInteriorLight.position.set(barnX, 2.2, barnZ);
        mapGroup.add(barnInteriorLight);

        const debugWallMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.0 });

        const createWallSphere = (localX, localZ, radius = 0.45) => {
            const localPos = new THREE.Vector3(localX, 1.0, localZ);
            localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), barnRotY);
            localPos.add(new THREE.Vector3(barnX, 0, barnZ));

            const sphereGeo = new THREE.SphereGeometry(radius, 8, 8);
            const sphereMesh = new THREE.Mesh(sphereGeo, debugWallMat);
            sphereMesh.position.copy(localPos);
            mapGroup.add(sphereMesh);

            addStaticCollider(sphereMesh, 0.0, radius);
        };

        for (let z = -2.6; z <= 2.2; z += 0.55) createWallSphere(-2.5, z);
        for (let z = -2.6; z <= 2.2; z += 0.55) createWallSphere(2.5, z);
        for (let x = -2.5; x <= 2.5; x += 0.55) createWallSphere(x, -2.6);

        for (let x = -2.5; x <= 2.5; x += 0.55) {
            if (Math.abs(x) < 0.8) continue;
            createWallSphere(x, 2.2);
        }
    }

    if (models['Silo']) spawnObject(models['Silo'], -20, -15, 6.5, 0, 0.0);
    if (models['Windmill']) spawnObject(models['Windmill'], -6, -17, 6.5, 0, 0.0);
    if (models['WaterTower']) spawnObject(models['WaterTower'], -20, -7, 5.5, 0, 0.0);
    if (models['ChickenCoop']) spawnObject(models['ChickenCoop'], -12, -7, 2.5, Math.PI / 4, 0.0);
    if (models['Well']) spawnObject(models['Well'], -5, -6, 1.5, 0, 0.1);

    // --- 7. ÁRBOLES Y PINOS ---
    const pineModel = models['Autumn pine'];
    const appleTree = models['Apple_4'];
    const orangeTree1 = models['Orange_2'];
    const orangeTree2 = models['Orange_4'];

    const TRUNK_RADIUS = 0.35;

    if (pineModel) {
        for (let x = -28; x <= 28; x += 6) {
            if (Math.abs(x) < 4) continue;
            spawnObject(pineModel, x, -28, 5.5, Math.random() * Math.PI, 0, true, 0, TRUNK_RADIUS);
            spawnObject(pineModel, x, 28, 5.5, Math.random() * Math.PI, 0, true, 0, TRUNK_RADIUS);
        }
        for (let z = -24; z <= 24; z += 6) {
            if (Math.abs(z + 1) < 4) continue;
            spawnObject(pineModel, -28, z, 5.5, Math.random() * Math.PI, 0, true, 0, TRUNK_RADIUS);
            spawnObject(pineModel, 28, z, 5.5, Math.random() * Math.PI, 0, true, 0, TRUNK_RADIUS);
        }
    }

    if (appleTree) {
        spawnObject(appleTree, 21, -20, 4.0, 0, 0, true, 0, TRUNK_RADIUS);
        spawnObject(appleTree, 21, 20, 4.0, Math.PI / 2, 0, true, 0, TRUNK_RADIUS);
    }
    if (orangeTree1) {
        spawnObject(orangeTree1, -21, 20, 4.0, 0, 0, true, 0, TRUNK_RADIUS);
    }
    if (orangeTree2) {
        spawnObject(orangeTree2, 5, -20, 4.0, Math.PI / 3, 0, true, 0, TRUNK_RADIUS);
    }

    // --- 8. SIEMBRA ---
    const cornModel1 = models['Corn_2'];
    const cornModel2 = models['Corn_4'];
    if (cornModel1) {
        for (let x = 6; x <= 11; x += 2.0) {
            for (let z = -19; z <= -7; z += 2.0) {
                spawnObject(cornModel1, x, z, 1.6, (Math.random() - 0.5) * 0.3, 0, false);
            }
        }
    }
    if (cornModel2) {
        for (let x = 15; x <= 20; x += 2.0) {
            for (let z = -19; z <= -7; z += 2.0) {
                spawnObject(cornModel2, x, z, 1.6, (Math.random() - 0.5) * 0.3, 0, false);
            }
        }
    }

    const carrotModel1 = models['Carrot_3'];
    const carrotModel2 = models['Carrot_1'];
    const lettuceModel1 = models['Lettuce_1'];
    const lettuceModel2 = models['Lettuce_3'];
    const beetModel1 = models['Beet_1'];
    const beetModel2 = models['Beet_4'];

    if (carrotModel1) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(carrotModel1, -20, z, 0.85, Math.random() * Math.PI, 0, false, -0.3);
        }
    }
    if (carrotModel2) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(carrotModel2, -18, z, 0.65, Math.random() * Math.PI, 0, false, -0.4);
        }
    }

    if (lettuceModel1) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(lettuceModel1, -14, z, 0.65, Math.random() * Math.PI, 0, false, -0.4);
        }
    }
    if (lettuceModel2) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(lettuceModel2, -12, z, 0.65, Math.random() * Math.PI, 0, false, 0);
        }
    }

    if (beetModel1) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(beetModel1, -8.5, z, 0.65, Math.random() * Math.PI, 0, false, -0.2);
        }
    }
    if (beetModel2) {
        for (let z = 5; z <= 17; z += 1.8) {
            spawnObject(beetModel2, -6.8, z, 0.65, Math.random() * Math.PI, 0, false, -0.17);
        }
    }

    const pumpkinModel1 = models['Pumpkin_2'];
    const pumpkinModel2 = models['Pumpkin_4'];
    if (pumpkinModel1) {
        for (let x = 6; x <= 11; x += 2.2) {
            for (let z = 5; z <= 17; z += 2.2) {
                spawnObject(pumpkinModel1, x, z, 0.8, Math.random() * Math.PI, 0, false, -0.05);
            }
        }
    }
    if (pumpkinModel2) {
        for (let x = 15; x <= 20; x += 2.2) {
            for (let z = 5; z <= 17; z += 2.2) {
                spawnObject(pumpkinModel2, x, z, 0.8, Math.random() * Math.PI, 0, false, -0.05);
            }
        }
    }

    // --- 9. DECORACIÓN Y CERCAS ---
    const flower1 = models['Flowers_1'];
    const flower2 = models['Flowers_2'];
    if (flower1) {
        spawnObject(flower1, -4, 4, 0.6, 0, 0, false);
        spawnObject(flower1, 4, -6, 0.6, 0, 0, false);
    }
    if (flower2) {
        spawnObject(flower2, 4, 4, 0.6, 0, 0, false);
        spawnObject(flower2, -4, -6, 0.6, 0, 0, false);
    }

    const grass1 = models['Grass_2'];
    if (grass1) {
        spawnObject(grass1, -22, -22, 0.6, 0, 0, false);
        spawnObject(grass1, 22, -22, 0.6, 0, 0, false);
        spawnObject(grass1, -22, 22, 0.6, 0, 0, false);
        spawnObject(grass1, 22, 22, 0.6, 0, 0, false);
    }

    const fence1 = models['Fence'];
    const fence2 = models['Fence2'];
    const fenceStep = 0.7;

    if (fence1) {
        for (let x = -25; x <= 25; x += fenceStep * 2) {
            if (x > -4 && x < 4) continue;
            spawnObject(fence1, x, -23, 1.0, 0, 0.0, true);
            spawnObject(fence1, x, 23, 1.0, 0, 0.0, true);
        }
    }
    if (fence2) {
        for (let x = -25 + fenceStep; x <= 25; x += fenceStep * 2) {
            if (x > -4 && x < 4) continue;
            spawnObject(fence2, x, -23, 1.0, 0, 0.0, true);
            spawnObject(fence2, x, 23, 1.0, 0, 0.0, true);
        }
    }

    if (fence1) {
        for (let z = -23; z <= 23; z += fenceStep * 2) {
            if (z > -4 && z < 2) continue;
            spawnObject(fence1, -25, z, 1.0, Math.PI / 2, 0.0, true);
            spawnObject(fence1, 25, z, 1.0, Math.PI / 2, 0.0, true);
        }
    }
    if (fence2) {
        for (let z = -23 + fenceStep; z <= 23; z += fenceStep * 2) {
            if (z > -4 && z < 2) continue;
            spawnObject(fence2, -25, z, 1.0, Math.PI / 2, 0.0, true);
            spawnObject(fence2, 25, z, 1.0, Math.PI / 2, 0.0, true);
        }
    }

    // --- 10. FAROLES CON PARPADEO ---
    const lanternLights = [];

    const spawnPostLantern = (x, z) => {
        if (models['Post Lantern']) {
            spawnObject(models['Post Lantern'], x, z, 1.8, 0, 0.1, true);
        }
        const light = new THREE.PointLight(0xffaa22, 2.5, 8);
        light.position.set(x, 1.6, z);
        mapGroup.add(light);
        lanternLights.push(light);
    };

    spawnPostLantern(-3.8, -4);
    spawnPostLantern(3.8, -4);
    spawnPostLantern(-3.8, 2);
    spawnPostLantern(3.8, 2);

    // --- 11. LUCIÉRNAGAS ---
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePos[i] = (Math.random() - 0.5) * 48;
        particlePos[i + 1] = 0.5 + Math.random() * 2.5;
        particlePos[i + 2] = (Math.random() - 0.5) * 48;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
        color: 0xccff66,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const fireflies = new THREE.Points(particleGeo, particleMat);
    mapGroup.add(fireflies);

    // --- BUCLE DE ANIMACIÓN ---
    const clock = new THREE.Clock();
    const animateEnvironment = () => {
        const time = clock.getElapsedTime();

        const positions = particleGeo.attributes.position.array;
        for (let i = 1; i < particleCount * 3; i += 3) {
            positions[i] += Math.sin(time + i) * 0.002;
        }
        particleGeo.attributes.position.needsUpdate = true;

        lanternLights.forEach((light, index) => {
            light.intensity = 2.3 + Math.sin(time * 10 + index) * 0.3 + (Math.random() - 0.5) * 0.15;
        });

        requestAnimationFrame(animateEnvironment);
    };
    animateEnvironment();
}