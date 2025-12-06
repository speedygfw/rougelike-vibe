import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapData } from './MapGenerator.js';
import Entity from '../entities/Entity.js';
import { ModelLoader } from './ModelLoader.js';

export default class ThreeRenderer {
    container: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    modelLoader: ModelLoader;

    // Cache for meshes
    tileMeshes: THREE.InstancedMesh[] = [];
    propMeshes: THREE.Group[] = [];
    entityMeshes: Map<Entity, THREE.Object3D> = new Map();
    dynamicLights: Map<string, THREE.PointLight> = new Map();

    // Matrix Cache for restoring visibility
    floorMatrixCache: THREE.Matrix4[] = [];
    wallMatrixCache: THREE.Matrix4[] = [];

    // Effects
    particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number, maxLife: number }[] = [];
    floatingTexts: { sprite: THREE.Sprite, velocity: THREE.Vector3, life: number, maxLife: number }[] = [];
    animations: { entity: Entity, type: string, startTime: number, duration: number }[] = [];

    mapWidth: number = 0;
    mapHeight: number = 0;
    mapTiles: string[][] = [];

    constructor() {
        this.container = document.body; // Or specific element if needed
        this.modelLoader = new ModelLoader();

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Black (Void)
        this.scene.fog = new THREE.Fog(0x000000, 30, 60); // Distance Fog

        // Camera (Isometric)
        const aspect = window.innerWidth / window.innerHeight;
        const d = 10;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

        // Isometric view: Rotate 45 deg on Y, then look down ~35.264 deg
        this.camera.position.set(20, 20, 20); // High up
        this.camera.lookAt(this.scene.position); // Look at center initially

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Remove old canvas if exists and append new one
        const oldCanvas = document.getElementById('three-canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }

        this.renderer.domElement.id = 'three-canvas';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '-1'; // Behind UI
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.container);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.2;

        // Zoom limits for Orthographic Camera
        this.controls.minZoom = 0.5;
        this.controls.maxZoom = 2.0;

        // Lock Rotation (Isometric)
        this.controls.minAzimuthAngle = Math.PI / 4; // Fixed 45 degrees
        this.controls.maxAzimuthAngle = Math.PI / 4;

        // Limit Tilt
        this.controls.minPolarAngle = 0; // Top down
        this.controls.maxPolarAngle = Math.PI / 2.5; // Angled view

        // Main directional light (Sunlight/Moonlight)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Resize Handler
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 10; // View size

        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initMap(map: MapData) {
        this.mapWidth = map.width;
        this.mapHeight = map.height;
        this.mapTiles = map.tiles;

        // Clear old meshes
        this.tileMeshes.forEach(m => this.scene.remove(m));
        this.tileMeshes = [];
        this.propMeshes.forEach(m => this.scene.remove(m));
        this.propMeshes = [];

        // Create Tile Meshes via ModelLoader
        const meshes = this.modelLoader.createTileMeshes(map);
        meshes.forEach((mesh: THREE.InstancedMesh) => {
            this.scene.add(mesh);
            this.tileMeshes.push(mesh);
        });

        // Props
        const propGroup = new THREE.Group();
        this.scene.add(propGroup);
        this.propMeshes.push(propGroup);

        map.props.forEach((prop, i) => {
            const mesh = this.modelLoader.createProp(prop.type, prop.x, prop.y);
            if (mesh) {
                propGroup.add(mesh);
            }

            if (prop.type === 'torch' || prop.type === 'fireplace') {
                const key = `light_${i}`;
                let light = this.dynamicLights.get(key);
                if (!light) {
                    light = new THREE.PointLight(0xff5500, 1.0, 8);
                    this.scene.add(light);
                    this.dynamicLights.set(key, light);
                }
                light.position.set(prop.x, 1.0, prop.y + 0.5);
            }
        });

        // Special handling for stairs (Dungeon Entrance)
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.tiles[y][x] === 'stairs') {
                    const entrance = this.modelLoader.createProp('dungeon_entrance', x, y);
                    if (entrance) {
                        propGroup.add(entrance);

                        // Add dynamic lights for the entrance torches
                        const key1 = `entrance_light_1`;
                        const key2 = `entrance_light_2`;

                        let l1 = this.dynamicLights.get(key1);
                        if (!l1) {
                            l1 = new THREE.PointLight(0xffaa00, 1.0, 5);
                            this.scene.add(l1);
                            this.dynamicLights.set(key1, l1);
                        }
                        l1.position.set(x - 0.8, 1.5, y + 0.2);

                        let l2 = this.dynamicLights.get(key2);
                        if (!l2) {
                            l2 = new THREE.PointLight(0xffaa00, 1.0, 5);
                            this.scene.add(l2);
                            this.dynamicLights.set(key2, l2);
                        }
                        l2.position.set(x + 0.8, 1.5, y + 0.2);
                    }
                }
            }
        }
    }





    getViewRotation(): number {
        if (!this.controls) return 0;
        const angle = this.controls.getAzimuthalAngle();
        let normalized = angle;
        if (normalized < 0) normalized += Math.PI * 2;
        const snap = Math.round(normalized / (Math.PI / 2)) % 4;
        return snap;
    }

    render(game: any) {
        if (game.player) {
            const targetX = game.player.x;
            const targetZ = game.player.y;

            const offset = this.camera.position.clone().sub(this.controls.target);
            this.controls.target.set(targetX, 0, targetZ);
            this.camera.position.copy(this.controls.target).add(offset);
            this.controls.update();

        }

        // Update other meshes visibility (simplified: just show all for now or implement similar logic)
        // For now, we just update the first two (floor/wall) in the loop above.
        // To support all, we need a more generic approach or repeat the loop for each mesh type.
        // Given the complexity, let's just ensure the new meshes are added to tileMeshes and we iterate them all?
        // Actually, the loop above uses specific indices (fIdx, wIdx).
        // We need to track indices for all types.

        // Re-implement visibility loop for all types
        // Reset indices
        let fIdx = 0;
        let wIdx = 0;
        let gIdx = 0;
        let dIdx = 0;
        let wwIdx = 0;
        let waIdx = 0;
        const floorMesh = this.tileMeshes[0];
        const wallMesh = this.tileMeshes[1];
        const grassMesh = this.tileMeshes[2];
        const dirtMesh = this.tileMeshes[3];
        const woodWallMesh = this.tileMeshes[4];
        const waterMesh = this.tileMeshes[5];

        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const key = `${x},${y}`;
                const tile = game.map.tiles[y][x];
                const isVisible = game.visibleTiles.has(key);
                const isExplored = game.exploredTiles.has(key) || game.player.level === 0; // Village always explored

                const updateMesh = (mesh: THREE.InstancedMesh, idx: number, baseColor: number, dimColor: number) => {
                    if (!isExplored) {
                        dummy.scale.set(0, 0, 0);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);
                    } else {
                        // We need to restore the matrix. Since we don't cache ALL matrices in this simplified version,
                        // we might have issues if we don't.
                        // However, for static tiles, we can re-calculate position.
                        dummy.position.set(x, 0, y);
                        dummy.scale.set(1, 1, 1);
                        dummy.rotation.set(0, 0, 0);
                        if (tile.startsWith('floor')) dummy.rotation.y = (x + y) % 4 * (Math.PI / 2); // Deterministic rotation
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);

                        if (isVisible) {
                            _color.setHex(baseColor);
                        } else {
                            _color.setHex(dimColor);
                        }
                        if (mesh.instanceColor) mesh.setColorAt(idx, _color);
                    }
                };

                if (tile === 'floor' || tile === 'stairs' || tile.startsWith('door')) {
                    updateMesh(floorMesh, fIdx++, 0x888888, 0x444444);
                } else if (tile === 'wall' || tile === 'door_closed') {
                    updateMesh(wallMesh, wIdx++, 0xaaaaaa, 0x555555);
                } else if (tile === 'floor_grass') {
                    updateMesh(grassMesh, gIdx++, 0x88cc88, 0x446644);
                } else if (tile === 'floor_dirt') {
                    updateMesh(dirtMesh, dIdx++, 0x8B4513, 0x452209);
                } else if (tile === 'wall_wood') {
                    updateMesh(woodWallMesh, wwIdx++, 0x8B4513, 0x452209);
                } else if (tile === 'water') {
                    updateMesh(waterMesh, waIdx++, 0x0088ff, 0x004488);
                }
            }
        }

        this.tileMeshes.forEach(m => {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        });


        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.add(p.velocity);
                p.mesh.rotation.x += 0.1;
                p.mesh.rotation.y += 0.1;
                const scale = p.life / p.maxLife;
                p.mesh.scale.set(scale * 0.3, scale * 0.3, scale * 0.3);
            }
        }

        // Update Floating Text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life--;
            if (ft.life <= 0) {
                this.scene.remove(ft.sprite);
                this.floatingTexts.splice(i, 1);
            } else {
                ft.sprite.position.add(ft.velocity);
                ft.sprite.material.opacity = ft.life / ft.maxLife;
            }
        }

        // Update Animations
        const now = Date.now();
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            const elapsed = now - anim.startTime;
            if (elapsed > anim.duration) {
                this.animations.splice(i, 1);
                const mesh = this.entityMeshes.get(anim.entity);
                if (mesh) {
                    if (anim.type === 'hit') {
                        mesh.traverse((child: any) => {
                            if (child.isMesh && child.material.emissive) {
                                child.material.emissive.setHex(0x000000);
                            }
                        });
                    } else if (anim.type === 'attack') {
                        const body = mesh.getObjectByName('body');
                        if (body) body.rotation.x = 0;
                    }
                }
            } else {
                const mesh = this.entityMeshes.get(anim.entity);
                if (mesh) {
                    if (anim.type === 'hit') {
                        mesh.traverse((child: any) => {
                            if (child.isMesh && child.material.emissive) {
                                child.material.emissive.setHex(0xff0000);
                            }
                        });
                    } else if (anim.type === 'attack') {
                        const progress = elapsed / anim.duration;
                        const body = mesh.getObjectByName('body');
                        if (body) {
                            body.rotation.x = -Math.sin(progress * Math.PI) * 0.5;
                            body.position.z = Math.sin(progress * Math.PI) * 0.2;
                        }
                    }
                }
            }
        }

        this.updateLights();
        this.renderer.render(this.scene, this.camera);
    }

    drawEntity(entity: any) {
        let mesh = this.entityMeshes.get(entity);
        if (!mesh) {
            mesh = this.modelLoader.createEntity(entity);
            this.scene.add(mesh);
            this.entityMeshes.set(entity, mesh);
        }

        mesh.visible = true;

        const x = (entity.drawX !== undefined) ? entity.drawX : entity.x;
        const y = (entity.drawY !== undefined) ? entity.drawY : entity.y;

        mesh.position.set(x, 0, y);

        if (entity.facing !== undefined) {
            mesh.rotation.y = entity.facing * -(Math.PI / 2);
        }

        const time = Date.now() * 0.005;

        if (entity.constructor.name === 'Potion' || entity.constructor.name === 'Weapon' || entity.constructor.name === 'Armor' || entity.constructor.name.includes('Scroll') || entity.constructor.name === 'Key' || entity.constructor.name === 'HarmonicCore') {
            mesh.position.y = 0.5 + Math.sin(time) * 0.1;
            mesh.rotation.y += 0.02;
        } else if (entity.constructor.name === 'Player' || entity.faction === 'monster' || entity.faction === 'undead' || entity.faction === 'beast') {
            const body = mesh.getObjectByName('body');
            if (body) {
                const isAttacking = this.animations.some(a => a.entity === entity && a.type === 'attack');
                if (!isAttacking) {
                    body.position.y = 0.5 + Math.sin(time * 2) * 0.05;
                }
            }

            const hpGroup = mesh.getObjectByName('healthBar');
            if (hpGroup) {
                if (entity.hp !== undefined && entity.maxHp !== undefined && entity.maxHp > 0) {
                    const pct = Math.max(0, Math.min(1, entity.hp / entity.maxHp));
                    const fill = hpGroup.getObjectByName('healthBarFill');
                    if (fill) {
                        fill.scale.x = pct;
                    }
                    hpGroup.visible = true;
                }
            }
        }
    }
    hideEntity(entity: any) {
        const mesh = this.entityMeshes.get(entity);
        if (mesh) {
            mesh.visible = false;
        }
    }

    removeEntity(entity: any) {
        const mesh = this.entityMeshes.get(entity);
        if (mesh) {
            this.scene.remove(mesh);
            this.entityMeshes.delete(entity);
        }
    }

    updateLights() {
        const time = Date.now() * 0.005;
        this.dynamicLights.forEach((light, _key) => {
            // Flicker intensity
            light.intensity = 1.0 + Math.sin(time * 10 + Math.random()) * 0.1;
            // Slight position jitter
            light.position.y = 1.0 + Math.sin(time * 5) * 0.05;
        });
    }

    clear() {
        // No-op for Three.js (auto-clears)
    }

    triggerEffect(x: number, y: number, type: string) {
        if (type === 'hit') {
            // Spawn particles
            for (let i = 0; i < 10; i++) {
                const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0.5, y);

                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2 + 0.2, // Upward
                    (Math.random() - 0.5) * 0.2
                );

                this.scene.add(mesh);
                this.particles.push({ mesh, velocity, life: 1.0, maxLife: 1.0 });
            }
        }
    }

    createFloatingText(x: number, y: number, text: string, color: string) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = 256;
        canvas.height = 64;
        context.font = 'Bold 40px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.fillText(text, 128, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, 1.5, y);
        sprite.scale.set(2, 0.5, 1);

        this.scene.add(sprite);
        this.floatingTexts.push({ sprite, velocity: new THREE.Vector3(0, 0.05, 0), life: 1.0, maxLife: 1.0 });
    }

    drawEffects() {
        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= 0.05;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.add(p.velocity);
                p.velocity.y -= 0.01; // Gravity
                p.mesh.rotation.x += 0.1;
                p.mesh.rotation.y += 0.1;
                (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
                (p.mesh.material as THREE.MeshBasicMaterial).transparent = true;
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.life -= 0.02;
            if (t.life <= 0) {
                this.scene.remove(t.sprite);
                this.floatingTexts.splice(i, 1);
            } else {
                t.sprite.position.add(t.velocity);
                t.sprite.material.opacity = t.life;
            }
        }
    }

    drawMinimap(_map: MapData, _player: any, _exploredTiles: Set<string>) {
        // Not implemented in 3D view
    }


    updateVisibility(visibleTiles: Set<string>, exploredTiles: Set<string>, level: number) {
        if (this.tileMeshes.length < 6) return;

        let fIdx = 0, wIdx = 0, gIdx = 0, dIdx = 0, wwIdx = 0, waIdx = 0;

        const floorMesh = this.tileMeshes[0];
        const wallMesh = this.tileMeshes[1];
        const grassMesh = this.tileMeshes[2];
        const dirtMesh = this.tileMeshes[3];
        const woodWallMesh = this.tileMeshes[4];
        const waterMesh = this.tileMeshes[5];

        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const key = `${x},${y}`;
                const tile = this.mapTiles[y][x];
                const isVisible = visibleTiles.has(key);
                const isExplored = exploredTiles.has(key) || level === 0; // Village always explored

                const updateMesh = (mesh: THREE.InstancedMesh, idx: number, baseColor: number, dimColor: number) => {
                    if (!isExplored) {
                        dummy.scale.set(0, 0, 0);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);
                    } else {
                        dummy.position.set(x, 0, y);
                        dummy.scale.set(1, 1, 1);
                        dummy.rotation.set(0, 0, 0);
                        if (tile.startsWith('floor')) dummy.rotation.y = (x + y) % 4 * (Math.PI / 2);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);

                        if (isVisible) {
                            _color.setHex(baseColor);
                        } else {
                            _color.setHex(dimColor);
                        }
                        if (mesh.instanceColor) mesh.setColorAt(idx, _color);
                    }
                };

                if (tile === 'floor' || tile === 'stairs' || tile.startsWith('door')) {
                    updateMesh(floorMesh, fIdx++, 0x888888, 0x444444);
                } else if (tile === 'wall' || tile === 'door_closed') {
                    updateMesh(wallMesh, wIdx++, 0xaaaaaa, 0x555555);
                } else if (tile === 'floor_grass') {
                    updateMesh(grassMesh, gIdx++, 0x88cc88, 0x446644);
                } else if (tile === 'floor_dirt') {
                    updateMesh(dirtMesh, dIdx++, 0x8B4513, 0x452209);
                } else if (tile === 'wall_wood') {
                    updateMesh(woodWallMesh, wwIdx++, 0x8B4513, 0x452209);
                } else if (tile === 'water') {
                    updateMesh(waterMesh, waIdx++, 0x0088ff, 0x004488);
                }
            }
        }

        this.tileMeshes.forEach(m => {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        });
    }

    playAnimation(entity: any, type: string) {
        this.animations.push({
            entity,
            type,
            startTime: Date.now(),
            duration: 300
        });
    }


}
