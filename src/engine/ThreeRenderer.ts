import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapData } from './MapGenerator.js';
import Entity from '../entities/Entity.js';

export default class ThreeRenderer {
    container: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;

    // Cache for meshes
    tileMeshes: THREE.InstancedMesh[] = [];
    propMeshes: THREE.Group[] = [];
    entityMeshes: Map<Entity, THREE.Object3D> = new Map();
    dynamicLights: Map<string, THREE.PointLight> = new Map();

    // Matrix Cache for restoring visibility
    floorMatrixCache: THREE.Matrix4[] = [];
    wallMatrixCache: THREE.Matrix4[] = [];

    // Textures
    textures: { [key: string]: THREE.Texture } = {};

    tileSize: number = 1; // 1 unit in 3D space = 1 tile

    // Effects
    particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number, maxLife: number }[] = [];
    floatingTexts: { sprite: THREE.Sprite, velocity: THREE.Vector3, life: number, maxLife: number }[] = [];
    animations: { entity: Entity, type: string, startTime: number, duration: number }[] = [];

    constructor() {
        this.container = document.body; // Or specific element if needed

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

        this.loadTextures();
    }

    loadTextures() {
        const loader = new THREE.TextureLoader();
        const names = [
            'floor_stone', 'wall_stone', 'wall_stone_top',
            'floor_moss', 'wall_cracked',
            'prop_torch', 'prop_banner'
        ];

        names.forEach(name => {
            loader.load(`${import.meta.env.BASE_URL}textures/${name}.png`, (tex) => {
                tex.magFilter = THREE.NearestFilter; // Pixel art look
                tex.minFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                this.textures[name] = tex;
            });
        });
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
        // Clear existing meshes
        this.tileMeshes.forEach(mesh => this.scene.remove(mesh));
        this.tileMeshes = [];
        this.propMeshes.forEach(mesh => this.scene.remove(mesh));
        this.propMeshes = [];
        this.floorMatrixCache = [];
        this.wallMatrixCache = [];

        // Geometries
        const floorGeo = new THREE.PlaneGeometry(1, 1);
        floorGeo.rotateX(-Math.PI / 2); // Flat on ground

        const wallGeo = new THREE.BoxGeometry(1, 1, 1);
        wallGeo.translate(0, 0.5, 0); // Pivot at bottom

        // Materials
        const floorMat = new THREE.MeshStandardMaterial({
            map: this.textures.floor_stone || null,
            color: 0xffffff // White to let instance color control brightness
        });
        const wallMat = new THREE.MeshStandardMaterial({
            map: this.textures.wall_stone || null,
            color: 0xaaaaaa
        });

        const floorCount = map.width * map.height;
        const wallCount = map.width * map.height;

        const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, floorCount);
        const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);

        // Enable shadows
        floorMesh.receiveShadow = true;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;

        let fIdx = 0;
        let wIdx = 0;
        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];

                // Position: x, 0, y
                dummy.position.set(x, 0, y);
                dummy.scale.set(1, 1, 1);
                dummy.rotation.set(0, 0, 0);

                if (tile.startsWith('floor') || tile === 'stairs' || tile.startsWith('door')) {
                    // Floor: Random rotation (0, 90, 180, 270) around Y axis
                    dummy.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
                    dummy.updateMatrix();
                    floorMesh.setMatrixAt(fIdx, dummy.matrix);
                    this.floorMatrixCache[fIdx] = dummy.matrix.clone();

                    // Slight color variation
                    _color.setHex(0x888888); // Base grey
                    const variation = (Math.random() - 0.5) * 0.1;
                    _color.r += variation;
                    _color.g += variation;
                    _color.b += variation;
                    floorMesh.setColorAt(fIdx, _color);

                    fIdx++;
                }

                if (tile.startsWith('wall') || tile === 'door_closed') {
                    // Wall
                    dummy.rotation.set(0, 0, 0); // Reset rotation
                    dummy.updateMatrix();
                    wallMesh.setMatrixAt(wIdx, dummy.matrix);
                    this.wallMatrixCache[wIdx] = dummy.matrix.clone();
                    wIdx++;
                }
            }
        }

        floorMesh.instanceMatrix.needsUpdate = true;
        if (floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate = true;
        wallMesh.instanceMatrix.needsUpdate = true;
        floorMesh.count = fIdx;
        wallMesh.count = wIdx;

        this.scene.add(floorMesh);
        this.scene.add(wallMesh);

        this.tileMeshes.push(floorMesh, wallMesh);

        this.initProps(map);
    }

    initProps(map: MapData) {
        const propGroup = new THREE.Group();
        this.scene.add(propGroup);
        this.propMeshes.push(propGroup);

        map.props.forEach(prop => {
            let mesh: THREE.Mesh | THREE.Group | null = null;

            if (prop.type === 'torch') {
                const group = new THREE.Group();
                const stick = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
                group.add(stick);
                const flame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
                flame.position.y = 0.2;
                group.add(flame);
                group.position.set(prop.x, 0.5, prop.y + 0.5);
                mesh = group;
            } else if (prop.type === 'banner') {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0x880000 }));
                mesh.position.set(prop.x, 0.6, prop.y + 0.5);
            } else if (prop.type === 'crate') {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
                mesh.position.set(prop.x, 0.3, prop.y);
            } else if (prop.type === 'barrel') {
                mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
                mesh.position.set(prop.x, 0.35, prop.y);
            } else if (prop.type === 'table') {
                const group = new THREE.Group();
                const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
                top.position.y = 0.4;
                group.add(top);
                const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
                const l1 = new THREE.Mesh(legGeo, legMat); l1.position.set(-0.3, 0.2, -0.3); group.add(l1);
                const l2 = new THREE.Mesh(legGeo, legMat); l2.position.set(0.3, 0.2, -0.3); group.add(l2);
                const l3 = new THREE.Mesh(legGeo, legMat); l3.position.set(-0.3, 0.2, 0.3); group.add(l3);
                const l4 = new THREE.Mesh(legGeo, legMat); l4.position.set(0.3, 0.2, 0.3); group.add(l4);
                group.position.set(prop.x, 0, prop.y);
                mesh = group;
            } else if (prop.type === 'chair') {
                const group = new THREE.Group();
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
                seat.position.y = 0.25;
                group.add(seat);
                const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
                back.position.set(0, 0.5, -0.175);
                group.add(back);
                const legGeo = new THREE.BoxGeometry(0.05, 0.25, 0.05);
                const legMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
                const l1 = new THREE.Mesh(legGeo, legMat); l1.position.set(-0.15, 0.125, -0.15); group.add(l1);
                const l2 = new THREE.Mesh(legGeo, legMat); l2.position.set(0.15, 0.125, -0.15); group.add(l2);
                const l3 = new THREE.Mesh(legGeo, legMat); l3.position.set(-0.15, 0.125, 0.15); group.add(l3);
                const l4 = new THREE.Mesh(legGeo, legMat); l4.position.set(0.15, 0.125, 0.15); group.add(l4);
                group.position.set(prop.x, 0, prop.y);
                group.rotation.y = Math.random() * Math.PI * 2;
                mesh = group;
            } else if (prop.type === 'rubble') {
                const group = new THREE.Group();
                for (let i = 0; i < 3; i++) {
                    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.1), new THREE.MeshStandardMaterial({ color: 0x777777 }));
                    rock.position.set((Math.random() - 0.5) * 0.5, 0.1, (Math.random() - 0.5) * 0.5);
                    group.add(rock);
                }
                group.position.set(prop.x, 0, prop.y);
                mesh = group;
            } else if (prop.type === 'web') {
                const web = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
                web.position.set(prop.x, 0.5, prop.y);
                web.rotation.y = Math.PI / 4;
                mesh = web;
            }

            if (mesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                propGroup.add(mesh);
            }
        });
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

            if (game.exploredTiles && this.tileMeshes.length >= 2) {
                const floorMesh = this.tileMeshes[0];
                const wallMesh = this.tileMeshes[1];
                const _color = new THREE.Color();
                const dummy = new THREE.Object3D();

                let fIdx = 0;
                let wIdx = 0;

                for (let y = 0; y < game.map.height; y++) {
                    for (let x = 0; x < game.map.width; x++) {
                        const key = `${x},${y}`;
                        const tile = game.map.tiles[y][x];
                        const isVisible = game.visibleTiles.has(key);
                        const isExplored = game.exploredTiles.has(key);

                        if (tile.startsWith('floor') || tile === 'stairs' || tile.startsWith('door')) {
                            if (!isExplored) {
                                dummy.scale.set(0, 0, 0);
                                dummy.updateMatrix();
                                floorMesh.setMatrixAt(fIdx, dummy.matrix);
                            } else {
                                floorMesh.setMatrixAt(fIdx, this.floorMatrixCache[fIdx]);
                                if (isVisible) {
                                    _color.setHex(0x888888);
                                } else {
                                    _color.setHex(0x444444);
                                }
                                floorMesh.setColorAt(fIdx, _color);
                            }
                            fIdx++;
                        }

                        if (tile.startsWith('wall') || tile === 'door_closed') {
                            if (!isExplored) {
                                dummy.scale.set(0, 0, 0);
                                dummy.updateMatrix();
                                wallMesh.setMatrixAt(wIdx, dummy.matrix);
                            } else {
                                wallMesh.setMatrixAt(wIdx, this.wallMatrixCache[wIdx]);
                                if (isVisible) {
                                    _color.setHex(0xaaaaaa);
                                } else {
                                    _color.setHex(0x555555);
                                }
                                wallMesh.setColorAt(wIdx, _color);
                            }
                            wIdx++;
                        }
                    }
                }

                floorMesh.instanceMatrix.needsUpdate = true;
                if (floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate = true;
                wallMesh.instanceMatrix.needsUpdate = true;
                if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
            }
        }

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

        this.renderer.render(this.scene, this.camera);
    }

    drawEntity(entity: any) {
        let mesh = this.entityMeshes.get(entity);
        if (!mesh) {
            mesh = this.createEntityMesh(entity);
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

    generateTexture(type: string, color: THREE.Color): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = `#${color.getHexString()}`;
        ctx.fillRect(0, 0, 64, 64);

        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
        }

        if (type === 'face') {
            ctx.fillStyle = '#000';
            if (color.getHexString() === 'ff4444' || color.getHexString() === '00aa00') ctx.fillStyle = '#f00';

            ctx.fillRect(16, 24, 8, 8);
            ctx.fillRect(40, 24, 8, 8);

            ctx.fillStyle = '#330000';
            ctx.fillRect(20, 48, 24, 4);
        } else if (type === 'armor') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let y = 0; y < 64; y += 8) {
                for (let x = 0; x < 64; x += 8) {
                    if ((x + y) % 16 === 0) ctx.fillRect(x, y, 4, 4);
                }
            }
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, 64, 64);
        } else if (type === 'skin') {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(10, 10, 10, 10);
            ctx.fillRect(40, 50, 8, 8);
        } else if (type === 'ribs') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            for (let y = 10; y < 50; y += 8) {
                ctx.fillRect(10, y, 44, 4);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    }

    createEntityMesh(entity: any): THREE.Object3D {
        const group = new THREE.Group();
        const type = entity.type || entity.constructor.name.toLowerCase();
        const color = new THREE.Color(entity.color || 0xffffff);

        const bodyTex = this.generateTexture('armor', color);
        const headTex = this.generateTexture('face', color);
        const skinTex = this.generateTexture('skin', color);
        const ribTex = type === 'skeleton' ? this.generateTexture('ribs', color) : null;

        const mat = new THREE.MeshStandardMaterial({ map: bodyTex });
        const skinMat = new THREE.MeshStandardMaterial({ map: skinTex });
        const headMat = new THREE.MeshStandardMaterial({ map: headTex });
        const darkMat = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.5) });

        const faceMaterials = [
            skinMat, skinMat, skinMat, skinMat,
            new THREE.MeshStandardMaterial({ map: headTex }),
            skinMat
        ];

        if (entity.type === 'player' || entity.constructor.name === 'Player') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), mat);
            body.position.y = 0.5;
            body.name = 'body';

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), faceMaterials);
            head.position.y = 0.4;
            body.add(head);

            const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
            const lArm = new THREE.Mesh(armGeo, skinMat);
            lArm.position.set(-0.3, 0, 0);
            body.add(lArm);
            const rArm = new THREE.Mesh(armGeo, skinMat);
            rArm.position.set(0.3, 0, 0);
            body.add(rArm);

            const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const lHand = new THREE.Mesh(handGeo, skinMat);
            lHand.position.y = -0.25;
            lArm.add(lHand);
            const rHand = new THREE.Mesh(handGeo, skinMat);
            rHand.position.y = -0.25;
            rArm.add(rHand);

            const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
            const lLeg = new THREE.Mesh(legGeo, darkMat);
            lLeg.position.set(-0.1, 0.2, 0);
            group.add(lLeg);
            const rLeg = new THREE.Mesh(legGeo, darkMat);
            rLeg.position.set(0.1, 0.2, 0);
            group.add(rLeg);

            const footGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
            const lFoot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({ color: 0x331100 }));
            lFoot.position.set(0, -0.25, 0.05);
            lLeg.add(lFoot);
            const rFoot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({ color: 0x331100 }));
            rFoot.position.set(0, -0.25, 0.05);
            rLeg.add(rFoot);

            const sword = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
            blade.position.y = 0.3;
            const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            hilt.position.y = 0;
            sword.add(blade);
            sword.add(hilt);
            sword.rotation.x = Math.PI / 2;
            sword.position.set(0, -0.1, 0.1);
            rHand.add(sword);

            group.add(body);

        } else if (['goblin', 'orc', 'zombie', 'skeleton', 'kobold', 'shaman', 'ogre', 'ghost'].includes(type)) {
            let scale = 1;
            if (type === 'ogre') scale = 1.5;
            if (type === 'kobold' || type === 'goblin') scale = 0.7;

            let bodyMat = mat;
            if (type === 'skeleton' && ribTex) {
                bodyMat = new THREE.MeshStandardMaterial({ map: ribTex });
            } else if (type === 'ghost') {
                bodyMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 });
            } else if (type === 'shaman') {
                bodyMat = new THREE.MeshStandardMaterial({ color: 0x440044 });
            }

            let bodyGeo: THREE.BufferGeometry = new THREE.BoxGeometry(0.4 * scale, 0.5 * scale, 0.2 * scale);
            if (type === 'shaman') {
                bodyGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 0.6 * scale, 8);
            }

            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.5 * scale;
            body.name = 'body';

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.25 * scale, 0.25 * scale), faceMaterials);
            head.position.y = 0.4 * scale;
            if (type === 'shaman') head.position.y = 0.35 * scale;
            body.add(head);

            if (type === 'goblin') {
                const earGeo = new THREE.ConeGeometry(0.05 * scale, 0.2 * scale, 4);
                const lEar = new THREE.Mesh(earGeo, skinMat);
                lEar.rotation.z = Math.PI / 2;
                lEar.position.set(-0.15 * scale, 0, 0);
                head.add(lEar);
                const rEar = new THREE.Mesh(earGeo, skinMat);
                rEar.rotation.z = -Math.PI / 2;
                rEar.position.set(0.15 * scale, 0, 0);
                head.add(rEar);
            } else if (type === 'orc') {
                const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.26 * scale, 0.1 * scale, 0.1 * scale), new THREE.MeshStandardMaterial({ color: 0x556655 }));
                jaw.position.set(0, -0.1 * scale, 0.1 * scale);
                head.add(jaw);
                const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.02 * scale, 0.1 * scale, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                tusk.position.set(-0.08 * scale, 0.05 * scale, 0.08 * scale);
                jaw.add(tusk);
                const tusk2 = tusk.clone();
                tusk2.position.set(0.08 * scale, 0.05 * scale, 0.08 * scale);
                jaw.add(tusk2);
            } else if (type === 'kobold') {
                const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.15 * scale), skinMat);
                snout.position.set(0, -0.05 * scale, 0.15 * scale);
                head.add(snout);
            }

            const armGeo = new THREE.BoxGeometry(0.1 * scale, 0.4 * scale, 0.1 * scale);
            const lArm = new THREE.Mesh(armGeo, skinMat);
            lArm.position.set(-0.3 * scale, 0, 0);
            body.add(lArm);
            const rArm = new THREE.Mesh(armGeo, skinMat);
            rArm.position.set(0.3 * scale, 0, 0);
            body.add(rArm);

            if (type === 'zombie') {
                lArm.rotation.x = -Math.PI / 2;
                rArm.rotation.x = -Math.PI / 2;
            }

            group.add(body);

        } else if (type === 'spider') {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            body.position.y = 0.3;
            body.name = 'body';

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x440000 }));
            head.position.set(0, 0, 0.3);
            body.add(head);

            const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

            for (let i = 0; i < 4; i++) {
                const lLeg = new THREE.Mesh(legGeo, legMat);
                lLeg.position.set(-0.2, 0, 0.1 - i * 0.1);
                lLeg.rotation.z = Math.PI / 3;
                lLeg.rotation.y = (i - 1.5) * 0.5;
                body.add(lLeg);

                const rLeg = new THREE.Mesh(legGeo, legMat);
                rLeg.position.set(0.2, 0, 0.1 - i * 0.1);
                rLeg.rotation.z = -Math.PI / 3;
                rLeg.rotation.y = -(i - 1.5) * 0.5;
                body.add(rLeg);
            }
            group.add(body);

        } else if (type === 'rat' || type === 'bat') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), mat);
            body.position.y = 0.2;
            body.name = 'body';
            group.add(body);
            if (type === 'bat') {
                const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
                wing.rotation.x = Math.PI / 2;
                wing.position.y = 0.1;
                body.add(wing);
                body.position.y = 0.8;
            }
        } else {
            const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.25;
            mesh.name = 'body';
            group.add(mesh);
        }

        const hpGroup = new THREE.Group();
        hpGroup.name = 'healthBar';
        hpGroup.position.set(0, 1.2, 0);
        const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.08), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        fill.name = 'healthBarFill';
        fill.position.z = 0.01;
        fill.position.x = -0.01;
        hpGroup.add(bg);
        hpGroup.add(fill);
        hpGroup.visible = false;
        group.add(hpGroup);

        return group;
    }

    hideEntity(entity: any) {
        const mesh = this.entityMeshes.get(entity);
        if (mesh) mesh.visible = false;
    }

    removeEntity(entity: any) {
        const mesh = this.entityMeshes.get(entity);
        if (mesh) {
            this.scene.remove(mesh);
            this.entityMeshes.delete(entity);
        }
    }

    drawLighting(player: any, map: MapData) {
        let pLight = this.dynamicLights.get('player');
        if (!pLight) {
            pLight = new THREE.PointLight(0xffaa00, 1.5, 8);
            pLight.castShadow = true;
            this.scene.add(pLight);
            this.dynamicLights.set('player', pLight);
        }
        pLight.position.set(player.x, 1.5, player.y);

        const tKey = `${player.x},${player.y}`;
        if (map.tiles[player.y] && map.tiles[player.y][player.x] === 'floor') {
            // Add logic if needed
        }

        map.props.forEach((prop, i) => {
            if (prop.type === 'torch') {
                const key = `torch_${i}`;
                let light = this.dynamicLights.get(key);
                if (!light) {
                    light = new THREE.PointLight(0xff5500, 1.0, 6);
                    this.scene.add(light);
                    this.dynamicLights.set(key, light);
                }
                light.position.set(prop.x, 1.0, prop.y + 0.5);
            }
        });
    }

    drawMinimap(map: MapData, player: any, exploredTiles: Set<string>) {
        // Not implemented in 3D view
    }

    clear() {
        // Cleanup if needed
    }

    drawMap() { }
    drawEffects() { }

    playAnimation(entity: any, type: string) {
        this.animations.push({
            entity,
            type,
            startTime: Date.now(),
            duration: 300
        });
    }

    triggerEffect(x: number, y: number, type: string) {
        if (type === 'hit') {
            const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            for (let i = 0; i < 5; i++) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, 0.5, y);
                const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.2, (Math.random() - 0.5) * 0.2);
                this.scene.add(mesh);
                this.particles.push({ mesh, velocity, life: 30, maxLife: 30 });
            }
        }
    }

    createFloatingText(x: number, y: number, text: string, color: string) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        ctx.font = 'Bold 20px Arial';
        ctx.fillStyle = color;
        ctx.fillText(text, 0, 20);
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(x, 1.5, y);
        sprite.scale.set(1, 0.5, 1);
        this.scene.add(sprite);
        this.floatingTexts.push({ sprite, velocity: new THREE.Vector3(0, 0.02, 0), life: 60, maxLife: 60 });
    }
}
