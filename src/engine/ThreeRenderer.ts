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
    propMeshes: THREE.Object3D[] = [];
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

    // Day/Night Cycle
    dayTime: number = 8; // Start at 8:00 AM
    dayDuration: number = 7200; // 2 hours (7200s) for full cycle
    isDayCycle: boolean = false;
    sunLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;

    // UI & Weather
    clockElement: HTMLElement | null = null;
    weather: 'none' | 'rain' | 'snow' = 'none';
    weatherParticles: { mesh: THREE.Mesh, velocity: THREE.Vector3 }[] = [];

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
        // Free Rotation (Unlocked for Inspecting)
        this.controls.minAzimuthAngle = -Infinity;
        this.controls.maxAzimuthAngle = Infinity;

        // Limit Tilt (Standard orbit)
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI / 2;

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

        // Completely Clear Scene (Robust Reset)
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            this.scene.remove(this.scene.children[i]);
        }

        this.tileMeshes = [];
        this.propMeshes = [];
        this.entityMeshes.clear();

        this.dynamicLights.clear();

        this.dynamicLights.clear();
        this.particles = [];
        this.floatingTexts = [];

        // Re-add Atmospheric Lighting
        // Re-add Atmospheric Lighting
        // Darker ambient for mood (Default)
        this.ambientLight = new THREE.AmbientLight(0x333344, 0.4);
        this.scene.add(this.ambientLight);

        // Moonlight / Dim light (Default)
        this.sunLight = new THREE.DirectionalLight(0x8888ff, 0.5);
        this.sunLight.position.set(10, 20, 10);
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);

        // Fog Logic
        this.isDayCycle = (map.level === 0);

        if (map.level === 0) {
            // Village: Dynamic Fog (Will be updated by cycle)
            this.scene.fog = new THREE.FogExp2(0xffffff, 0.02);
            this.renderer.setClearColor(0x87CEEB); // Sky Blue
            // Create Clock UI if not exists
            if (!this.clockElement) {
                this.clockElement = document.createElement('div');
                this.clockElement.style.position = 'absolute';
                this.clockElement.style.top = '10px';
                this.clockElement.style.left = '50%';
                this.clockElement.style.transform = 'translateX(-50%)';
                this.clockElement.style.color = 'white';
                this.clockElement.style.fontFamily = 'monospace';
                this.clockElement.style.fontSize = '24px';
                this.clockElement.style.fontWeight = 'bold';
                this.clockElement.style.textShadow = '2px 2px 0 #000';
                this.clockElement.style.pointerEvents = 'none';
                this.container.appendChild(this.clockElement);
            }
            this.clockElement.style.display = 'block';
        } else {
            // Dungeon: Pitch Black Fade
            // range 20-60 ensures visibility from camera distance (~35)
            this.scene.fog = new THREE.Fog(0x000000, 20, 60);
            this.renderer.setClearColor(0x000000);
            if (this.clockElement) this.clockElement.style.display = 'none';
        }

        console.log("initMap: Scene cleared and lights re-added.");

        // Create Tile Meshes via ModelLoader
        const meshes = this.modelLoader.createTileMeshes(map);
        meshes.forEach((mesh: THREE.InstancedMesh) => {
            this.scene.add(mesh);
            this.tileMeshes.push(mesh);
        });

        // Props logic follows...
        map.props.forEach((prop, i) => {
            const mesh = this.modelLoader.createProp(prop.type, prop.x, prop.y);
            if (mesh) {
                this.scene.add(mesh);
                mesh.userData = { x: prop.x, y: prop.y };
                this.propMeshes.push(mesh);
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
                    // Level 0 (Village) uses a Portal facade as the entrance
                    // Other levels use actual stairs
                    const propType = (map.level === 0) ? 'dungeon_entrance' : 'stairs';
                    const entrance = this.modelLoader.createProp(propType, x, y);
                    if (entrance) {
                        this.scene.add(entrance);
                        entrance.userData = { x: x, y: y };
                        this.propMeshes.push(entrance);

                        // keep light logic...
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

        // Create Black Underlay (Fog of War Background for holes)
        const planeGeo = new THREE.PlaneGeometry(this.mapWidth * 5, this.mapHeight * 5); // Huge plane
        const planeMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }); // Pure black, ignore fog
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(this.mapWidth / 2, -0.1, this.mapHeight / 2);
        this.scene.add(plane);
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
        if (game.player && !game.debug) {
            const targetX = game.player.x;
            const targetZ = game.player.y;

            const offset = this.camera.position.clone().sub(this.controls.target);
            this.controls.target.set(targetX, 0, targetZ);
            this.camera.position.copy(this.controls.target).add(offset);
            this.controls.update();
        }

        // REMOVED DUPLICATE TILE UPDATE LOOP
        // Visibility is handled by explicit calls to updateVisibility()

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

        if (this.isDayCycle) {
            this.updateSunCycle();
        }
    }

    updateSunCycle() {
        // Advance time (1 sec real time = X game minutes)
        // dt approx 0.016s (60fps)
        const dt = 0.016;
        const timeStep = (24 / this.dayDuration) * dt;
        this.dayTime = (this.dayTime + timeStep) % 24;

        // Update Clock UI
        if (this.clockElement) {
            const h = Math.floor(this.dayTime);
            const m = Math.floor((this.dayTime - h) * 60);
            const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            this.clockElement.innerText = `🕰️ ${timeString}`;
        }

        // Random Weather Change (very rare check)
        if (Math.random() < 0.0005) {
            const r = Math.random();
            if (r < 0.6) this.weather = 'none';
            else if (r < 0.8) this.weather = 'rain';
            else this.weather = 'snow';
        }

        // Visuals based on time
        const hour = this.dayTime;

        let ambientColor = new THREE.Color(0x222244);
        let sunColor = new THREE.Color(0x4444aa);
        let ambientIntensity = 0.2;
        let sunIntensity = 0.3;
        let fogColor = new THREE.Color(0x111122);

        // Sunrise (6-8)
        if (hour >= 6 && hour < 8) {
            const t = (hour - 6) / 2;
            ambientColor.lerpColors(new THREE.Color(0x222244), new THREE.Color(0xffaa88), t); // Blue -> Orange
            sunColor.lerpColors(new THREE.Color(0x4444aa), new THREE.Color(0xffaa00), t);
            ambientIntensity = THREE.MathUtils.lerp(0.2, 0.6, t);
            sunIntensity = THREE.MathUtils.lerp(0.3, 0.8, t);
            fogColor.lerpColors(new THREE.Color(0x111122), new THREE.Color(0xffaa88), t);
        }
        // Day (8-18)
        else if (hour >= 8 && hour < 18) {
            // Midday peak check
            let t = 1;
            if (hour < 12) {
                t = (hour - 8) / 4; // 0 to 1 scaling up brightness
                ambientColor.lerpColors(new THREE.Color(0xffaa88), new THREE.Color(0xffffff), t);
                sunColor.lerpColors(new THREE.Color(0xffaa00), new THREE.Color(0xffffee), t);
                ambientIntensity = THREE.MathUtils.lerp(0.6, 0.8, t);
                sunIntensity = THREE.MathUtils.lerp(0.8, 1.2, t);
                fogColor.lerpColors(new THREE.Color(0xffaa88), new THREE.Color(0x87CEEB), t);
            } else {
                t = (hour - 12) / 6; // 0 to 1 scaling down towards sunset
                // Stay bright mostly
                ambientColor = new THREE.Color(0xffffff);
                sunColor = new THREE.Color(0xffffee);
                ambientIntensity = 0.8;
                sunIntensity = 1.2;
                fogColor = new THREE.Color(0x87CEEB);
            }
        }
        // Sunset (18-20)
        else if (hour >= 18 && hour < 20) {
            const t = (hour - 18) / 2;
            ambientColor.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff6666), t); // White -> Red
            sunColor.lerpColors(new THREE.Color(0xffffee), new THREE.Color(0xff8800), t);
            ambientIntensity = THREE.MathUtils.lerp(0.8, 0.4, t);
            sunIntensity = THREE.MathUtils.lerp(1.2, 0.5, t);
            fogColor.lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0x442222), t);
        }
        // Night (20-6)
        else {
            // Deep Night
            ambientColor.setHex(0x111122);
            sunColor.setHex(0x222255);
            ambientIntensity = 0.2;
            sunIntensity = 0.1;
            fogColor.setHex(0x050510);
        }

        // Weather tinting (Rain makes it darker)
        if (this.weather === 'rain') {
            ambientIntensity *= 0.7;
            ambientColor.lerp(new THREE.Color(0x444455), 0.5); // Grey tint
            fogColor.lerp(new THREE.Color(0x333344), 0.5);
        } else if (this.weather === 'snow') {
            ambientIntensity *= 0.9;
            ambientColor.lerp(new THREE.Color(0xeeeeff), 0.2); // White tint
            fogColor.lerp(new THREE.Color(0xddddff), 0.3);
        }

        if (this.ambientLight) {
            this.ambientLight.color.copy(ambientColor);
            this.ambientLight.intensity = ambientIntensity;
        }
        if (this.sunLight) {
            this.sunLight.color.copy(sunColor);
            this.sunLight.intensity = sunIntensity;

            // Move sun for shadows
            const theta = (hour / 24) * Math.PI * 2 - (Math.PI / 2); // -PI/2 at 0h (midnight), 0 at 6h (sunrise), PI/2 at 12h, PI at 18h
            // Sun rises East, Sets West? Isometric is weird. Just orbit Y.
            this.sunLight.position.x = Math.cos(theta) * 20;
            this.sunLight.position.y = Math.sin(theta) * 20;
            this.sunLight.position.z = 10;
        }

        if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
            this.scene.fog.color.copy(fogColor);
            this.renderer.setClearColor(fogColor);
        }
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
        // Update Weather Particles (Rain/Snow)
        // Spawn
        if (this.weather !== 'none' && this.weatherParticles.length < 500) {
            // Spawn 2 per frame
            for (let i = 0; i < 2; i++) {
                let color = 0x8888ff; // Rain
                let geo: THREE.BufferGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05);
                let vel = new THREE.Vector3(0, -0.5, 0);

                if (this.weather === 'snow') {
                    color = 0xffffff;
                    geo = new THREE.BoxGeometry(0.08, 0.08, 0.08); // Flake
                    vel = new THREE.Vector3((Math.random() - 0.5) * 0.05, -0.05, (Math.random() - 0.5) * 0.05);
                }

                const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
                const mesh = new THREE.Mesh(geo, mat);

                // Spawn area around camera look target (approx)
                const cx = this.controls.target.x;
                const cz = this.controls.target.z;

                mesh.position.set(
                    cx + (Math.random() - 0.5) * 40,
                    15 + Math.random() * 5,
                    cz + (Math.random() - 0.5) * 40
                );

                this.scene.add(mesh);
                this.weatherParticles.push({ mesh, velocity: vel });
            }
        }

        // Update Weather Position
        for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
            const p = this.weatherParticles[i];
            p.mesh.position.add(p.velocity);

            // Reset if below ground
            if (p.mesh.position.y < 0) {
                this.scene.remove(p.mesh);
                this.weatherParticles.splice(i, 1);
            }
        }

        // Cleanup if weather stopped
        if (this.weather === 'none' && this.weatherParticles.length > 0) {
            for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
                this.scene.remove(this.weatherParticles[i].mesh);
            }
            this.weatherParticles = [];
        }


        // Update Particles (Explosions/Hits)
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
                t.sprite.material.opacity = t.life / t.maxLife;
            }
        }
    }

    updateVisibility(visibleTiles: Set<string>, exploredTiles: Set<string>, level: number) {
        // console.log("updateVisibility", level, visibleTiles.size, "meshes:", this.tileMeshes.length);
        if (this.tileMeshes.length < 10) return;

        let fIdx = 0, wIdx = 0, gIdx = 0, dIdx = 0, wwIdx = 0, waIdx = 0, lIdx = 0, mIdx = 0, cIdx = 0, doIdx = 0;

        const floorMesh = this.tileMeshes[0];
        const wallMesh = this.tileMeshes[1];
        const mossyMesh = this.tileMeshes[2];
        const crackedMesh = this.tileMeshes[3];
        const grassMesh = this.tileMeshes[4];
        const dirtMesh = this.tileMeshes[5];
        const woodWallMesh = this.tileMeshes[6];
        const waterMesh = this.tileMeshes[7];
        const lavaMesh = this.tileMeshes[8];
        const doorMesh = this.tileMeshes[9];

        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const key = `${x},${y}`;
                const tile = this.mapTiles[y][x];
                const isVisible = visibleTiles.has(key);
                const isExplored = exploredTiles.has(key);

                const updateMesh = (mesh: THREE.InstancedMesh, idx: number, baseColor: number, dimColor: number, yOffset: number = 0, rotationY: number = 0) => {
                    if (!isExplored) {
                        dummy.scale.set(0, 0, 0);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(idx, dummy.matrix);
                    } else {
                        dummy.position.set(x, 0, y);
                        dummy.scale.set(1, 1, 1);
                        dummy.rotation.set(0, 0, 0);
                        dummy.position.y = yOffset;
                        dummy.rotation.y = rotationY;

                        if (tile.startsWith('floor') && rotationY === 0) {
                            dummy.rotation.y = (x + y) % 4 * (Math.PI / 2);
                        }

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

                if (tile === 'floor' || tile.startsWith('door')) {
                    updateMesh(floorMesh, fIdx++, 0x888888, 0x444444);
                }

                if (tile.startsWith('wall')) {
                    // Decide color based on wall type
                    let color = 0x888888;
                    let dimColor = 0x444444;
                    if (tile === 'wall_mossy') { color = 0x55aa55; dimColor = 0x225522; }
                    else if (tile === 'wall_cracked') { color = 0xaaaaaa; dimColor = 0x555555; }
                    else if (tile === 'wall_wood') { color = 0x8B4513; dimColor = 0x452209; }

                    if (tile === 'wall_mossy') updateMesh(mossyMesh, mIdx++, color, dimColor, 0);
                    else if (tile === 'wall_cracked') updateMesh(crackedMesh, cIdx++, color, dimColor, 0);
                    else if (tile === 'wall_wood') updateMesh(woodWallMesh, wwIdx++, color, dimColor, 0);
                    else updateMesh(wallMesh, wIdx++, color, dimColor, 0);
                } else if (tile === 'grass') {
                    updateMesh(grassMesh, gIdx++, 0x44aa44, 0x225522);
                    // Also render floor under grass? Maybe not needed if dense
                } else if (tile === 'dirt') {
                    updateMesh(dirtMesh, dIdx++, 0x8B4513, 0x452209);
                } else if (tile === 'water') {
                    updateMesh(waterMesh, waIdx++, 0x0088ff, 0x004488, -0.2);
                } else if (tile === 'lava') {
                    updateMesh(lavaMesh, lIdx++, 0xffaa00, 0x884400); // Lava always bright?
                } else if (tile.startsWith('door')) {
                    // Door rotation logic
                    let rot = Math.PI / 2;
                    if (this.mapTiles[y] && this.mapTiles[y][x - 1] && this.mapTiles[y][x - 1].includes('wall')) {
                        rot = 0;
                    }
                    updateMesh(doorMesh, doIdx++, 0x5D4037, 0x2e201b, 0, rot);
                }
            }
        }

        // Update Prop Visibility & Dimming
        this.propMeshes.forEach(mesh => {
            const x = mesh.userData.x;
            const y = mesh.userData.y;
            const key = `${x},${y}`;
            const isExplored = exploredTiles.has(key);
            const isVisible = visibleTiles.has(key);

            mesh.visible = isExplored;

            if (isExplored) {
                mesh.traverse((child: any) => {
                    if (child.isMesh) {
                        // Store original color if not stored
                        if (!child.userData.originalColor) {
                            child.userData.originalColor = child.material.color.getHex();
                        }

                        if (isVisible) {
                            child.material.color.setHex(child.userData.originalColor);
                        } else {
                            // Dim the color (Simple 50% brightness approximation)
                            const original = new THREE.Color(child.userData.originalColor);
                            const dimmed = original.multiplyScalar(0.5);
                            child.material.color.copy(dimmed);
                        }
                    }
                });
            }
        });

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
