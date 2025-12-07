import * as THREE from 'three';

export class ModelLoader {
    textures: { [key: string]: THREE.Texture } = {};

    constructor() {
        this.loadTextures();
    }

    loadTextures() {
        this.textures['floor_stone'] = this.generateTexture('floor', new THREE.Color(0x888888));
        this.textures['floor_stone_cracked'] = this.generateTexture('floor_cracked', new THREE.Color(0x888888));
        this.textures['floor_dirt'] = this.generateTexture('dirt', new THREE.Color(0x5d4037));

        this.textures['wall_stone'] = this.generateTexture('wall', new THREE.Color(0xaaaaaa));
        this.textures['wall_mossy'] = this.generateTexture('wall_mossy', new THREE.Color(0x88aa88));
        this.textures['wall_cracked'] = this.generateTexture('wall_cracked', new THREE.Color(0x999999));

        this.textures['grass'] = this.generateTexture('grass', new THREE.Color(0x88cc88));
        this.textures['dirt'] = this.generateTexture('dirt', new THREE.Color(0x8B4513));
        this.textures['wood_wall'] = this.generateTexture('wood', new THREE.Color(0x8B4513));
        this.textures['water'] = this.generateTexture('water', new THREE.Color(0x0088ff));
        this.textures['lava'] = this.generateTexture('lava', new THREE.Color(0xff4400));

        // Door Textures
        this.textures['door'] = this.generateTexture('door', new THREE.Color(0x5D4037));
    }

    createProp(type: string, x: number, y: number): THREE.Object3D | null {
        let mesh: THREE.Object3D | null = null;
        if (type === 'torch') {
            const group = new THREE.Group();
            const stick = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            group.add(stick);
            const flame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
            flame.position.y = 0.2;
            group.add(flame);
            group.position.set(x, 0.5, y + 0.5);
            mesh = group;
        } else if (type === 'banner') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0x880000 }));
            mesh.position.set(x, 0.6, y + 0.5);
        } else if (type === 'crate') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            mesh.position.set(x, 0.3, y);
        } else if (type === 'barrel') {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            mesh.position.set(x, 0.35, y);
        } else if (type === 'table') {
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
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'chair') {
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
            group.position.set(x, 0, y);
            group.rotation.y = Math.random() * Math.PI * 2;
            mesh = group;
        } else if (type === 'rubble') {
            const group = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.1), new THREE.MeshStandardMaterial({ color: 0x777777 }));
                rock.position.set((Math.random() - 0.5) * 0.5, 0.1, (Math.random() - 0.5) * 0.5);
                group.add(rock);
            }
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'web') {
            const web = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
            web.position.set(x, 0.5, y);
            web.rotation.y = Math.PI / 4;
            mesh = web;
        } else if (type === 'tree') {
            const group = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            trunk.position.y = 0.4;
            group.add(trunk);
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x228822 }));
            leaves.position.y = 1.2;
            group.add(leaves);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'well') {
            const group = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x777777, side: THREE.DoubleSide }));
            base.position.y = 0.25;
            group.add(base);
            const water = new THREE.Mesh(new THREE.CircleGeometry(0.55, 8), new THREE.MeshBasicMaterial({ color: 0x0044aa }));
            water.rotation.x = -Math.PI / 2;
            water.position.y = 0.4;
            group.add(water);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            roof.position.y = 1.2;
            group.add(roof);
            const pole1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            pole1.position.set(-0.4, 0.5, 0);
            group.add(pole1);
            const pole2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            pole2.position.set(0.4, 0.5, 0);
            group.add(pole2);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'wardrobe') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            mesh.position.set(x, 0.9, y);
        } else if (type === 'dresser') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            mesh.position.set(x, 0.4, y);
        } else if (type === 'fireplace') {
            const group = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.5), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            base.position.y = 0.5;
            group.add(base);
            const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
            fire.position.set(0, 0.2, 0.3);
            group.add(fire);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'dungeon_entrance') {
            const group = new THREE.Group();
            const pillarGeo = new THREE.BoxGeometry(0.4, 2, 0.4);
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const p1 = new THREE.Mesh(pillarGeo, pillarMat); p1.position.set(-0.6, 1, 0); group.add(p1);
            const p2 = new THREE.Mesh(pillarGeo, pillarMat); p2.position.set(0.6, 1, 0); group.add(p2);
            const topGeo = new THREE.BoxGeometry(1.8, 0.4, 0.5);
            const top = new THREE.Mesh(topGeo, pillarMat); top.position.set(0, 2.2, 0); group.add(top);
            const portalGeo = new THREE.PlaneGeometry(1.2, 2);
            const portalMat = new THREE.MeshBasicMaterial({ color: 0x330033, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const portal = new THREE.Mesh(portalGeo, portalMat);
            portal.position.set(0, 1, 0);
            group.add(portal);
            const t1 = this.createProp('torch', -0.8, 0);
            if (t1) { t1.position.set(-0.8, 0.5, 0.2); group.add(t1); }
            const t2 = this.createProp('torch', 0.8, 0);
            if (t2) { t2.position.set(0.8, 0.5, 0.2); group.add(t2); }
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'bed') {
            const group = new THREE.Group();
            // Frame
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            frame.position.y = 0.15;
            group.add(frame);
            // Mattress
            const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
            mattress.position.y = 0.35;
            group.add(mattress);
            // Pillow
            const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
            pillow.position.set(0, 0.45, -0.45);
            group.add(pillow);
            // Blanket (Half covered)
            const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.8), new THREE.MeshStandardMaterial({ color: 0x883333 }));
            blanket.position.set(0, 0.36, 0.3);
            group.add(blanket);

            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'bookshelf') {
            const group = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            body.position.y = 0.9;
            group.add(body);

            // Visual shelves (stripes)
            for (let i = 1; i < 4; i++) {
                const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.38), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
                shelf.position.y = i * 0.45;
                shelf.position.z = 0.02;
                group.add(shelf);

                // Random Books
                const numBooks = Math.floor(Math.random() * 5) + 3;
                let bx = -0.3;
                for (let b = 0; b < numBooks; b++) {
                    const h = 0.2 + Math.random() * 0.1;
                    const w = 0.05 + Math.random() * 0.05;
                    const book = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
                    book.position.set(bx + w / 2, i * 0.45 + 0.025 + h / 2, 0.05);
                    group.add(book);
                    bx += w + 0.01;
                }
            }
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'chest') {
            const group = new THREE.Group();
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            base.position.y = 0.25;
            group.add(base);
            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x6d4c41 }));
            lid.rotation.z = Math.PI / 2; // Cylinder default is up-down
            lid.rotation.x = -Math.PI / 2; // Rotate to lie flat? No, align with box
            // Cylinder along Y. Rotate Z 90 -> Cylinder along X.
            // Half cylinder.
            lid.position.y = 0.5;
            group.add(lid);
            // Lock
            const lock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.05), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
            lock.position.set(0, 0.4, 0.25);
            group.add(lock);

            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'tombstone') {
            const group = new THREE.Group();
            const stone = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: 0x888888 }));
            stone.position.y = 0.3;
            group.add(stone);
            const mound = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x3e2723 })); // Dirt
            group.add(mound);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'stall') {
            const group = new THREE.Group();
            // Table
            const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
            table.position.y = 0.25;
            group.add(table);
            // Poles
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            p1.position.set(-0.55, 0.75, 0.25); group.add(p1);
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            p2.position.set(0.55, 0.75, 0.25); group.add(p2);
            // Canopy
            const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.7), new THREE.MeshStandardMaterial({ color: 0xff0000 })); // Red canopy
            canopy.position.set(0, 1.5, 0.25);
            canopy.rotation.x = 0.1;
            group.add(canopy);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'anvil') {
            const group = new THREE.Group();
            const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            base2.position.y = 0.15;
            group.add(base2);
            const top2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.25), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            top2.position.set(0.1, 0.4, 0);
            group.add(top2);
            // Horn
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            horn.rotation.z = Math.PI / 2;
            horn.position.set(-0.3, 0.4, 0);
            group.add(horn);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'pier') {
            const group = new THREE.Group();
            const planks = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            planks.position.y = 0.05;
            group.add(planks);
            // Posts
            const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
            post1.position.set(-0.4, -0.2, -0.4); group.add(post1);
            const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
            post2.position.set(0.4, -0.2, -0.4); group.add(post2);
            const post3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
            post3.position.set(-0.4, -0.2, 0.4); group.add(post3);
            const post4 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
            post4.position.set(0.4, -0.2, 0.4); group.add(post4);
            group.position.set(x, 0, y);
            mesh = group;
        } else if (type === 'stairs') {
            const group = new THREE.Group();

            // Floor edges (rim)
            const rimGeo = new THREE.BoxGeometry(1, 0.1, 0.1);
            const rimMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const r1 = new THREE.Mesh(rimGeo, rimMat); r1.position.set(0, 0, -0.45); group.add(r1);
            const r2 = new THREE.Mesh(rimGeo, rimMat); r2.position.set(0, 0, 0.45); group.add(r2);

            const rimSideGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
            const r3 = new THREE.Mesh(rimSideGeo, rimMat); r3.position.set(-0.45, 0, 0); group.add(r3);
            const r4 = new THREE.Mesh(rimSideGeo, rimMat); r4.position.set(0.45, 0, 0); group.add(r4);

            // Steps descending
            const stepMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
            for (let i = 0; i < 4; i++) {
                // Steps go down
                const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.2), stepMat);
                step.position.set(0, -0.1 - (i * 0.15), -0.3 + (i * 0.2));
                group.add(step);
            }

            // Black void at bottom
            const voidMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            voidMesh.rotation.x = -Math.PI / 2;
            voidMesh.position.y = -0.8;
            group.add(voidMesh);

            group.position.set(x, 0, y);
            mesh = group;
        }

        if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        return mesh;
    }

    generateTexture(type: string, color: THREE.Color): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#' + color.getHexString();
        ctx.fillRect(0, 0, 64, 64);

        if (type !== 'lava') {
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
                const x = Math.random() * 64;
                const y = Math.random() * 64;
                const size = Math.random() * 2 + 1;
                ctx.fillRect(x, y, size, size);
            }
        }

        if (type === 'floor_cracked') {
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            let x = Math.random() * 64;
            let y = Math.random() * 64;
            ctx.moveTo(x, y);
            for (let i = 0; i < 6; i++) {
                x += (Math.random() - 0.5) * 30;
                y += (Math.random() - 0.5) * 30;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (type === 'wall_mossy') {
            ctx.fillStyle = 'rgba(50, 100, 50, 0.3)';
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * 64;
                const y = Math.random() * 64;
                const r = Math.random() * 8 + 3;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'lava') {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * 64;
                const y = Math.random() * 64;
                const r = Math.random() * 10 + 2;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'door') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(4, 4, 56, 56);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(8, 8, 20, 20);
            ctx.fillRect(36, 8, 20, 20);
        } else if (type.includes('wall') && !type.includes('wood')) {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 21); ctx.lineTo(64, 21);
            ctx.moveTo(0, 42); ctx.lineTo(64, 42);
            ctx.moveTo(32, 0); ctx.lineTo(32, 21);
            ctx.moveTo(10, 21); ctx.lineTo(10, 42);
            ctx.moveTo(52, 21); ctx.lineTo(52, 42);
            ctx.moveTo(32, 42); ctx.lineTo(32, 64);
            ctx.stroke();
        } else if (type === 'floor') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let y = 0; y < 64; y += 16) {
                for (let x = 0; x < 64; x += 16) {
                    ctx.strokeRect(x, y, 16, 16);
                    if (Math.random() > 0.5) ctx.fillRect(x + 4, y + 4, 8, 8);
                }
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        return tex;
    }

    createEntity(entity: any): THREE.Object3D {
        const group = new THREE.Group();
        const type = entity.type || entity.constructor.name.toLowerCase();
        const color = new THREE.Color(entity.color || 0xffffff);

        const bodyTex = this.generateTexture('armor', color);
        const headTex = this.generateTexture('face', color);
        const skinTex = this.generateTexture('skin', color);
        const ribTex = type === 'skeleton' ? this.generateTexture('ribs', color) : null;

        const mat = new THREE.MeshStandardMaterial({ map: bodyTex });
        const skinMat = new THREE.MeshStandardMaterial({ map: skinTex });
        const darkMat = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.5) });

        const faceMaterials = [
            skinMat, skinMat, skinMat, skinMat,
            new THREE.MeshStandardMaterial({ map: headTex }),
            skinMat
        ];

        if (entity.name === "Elder Aethel") {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            body.position.y = 0.3;
            body.name = 'body';
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), faceMaterials);
            head.position.y = 0.45;
            body.add(head);
            const beard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
            beard.position.set(0, -0.15, 0.1);
            head.add(beard);
            const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x654321 }));
            staff.position.set(0.3, 0.3, 0.2);
            body.add(staff);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
            tip.position.y = 0.6;
            staff.add(tip);
            group.add(body);
        } else if (type === 'skeleton') {
            const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.15), mat); // Ribs
            body.position.y = 0.5; body.name = 'body';
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.2), mat);
            head.position.y = 0.4; body.add(head);

            // Arms & Legs stick-like
            const limbGeo = new THREE.BoxGeometry(0.05, 0.4, 0.05);
            const lArm = new THREE.Mesh(limbGeo, mat); lArm.position.set(-0.2, 0, 0); body.add(lArm);
            const rArm = new THREE.Mesh(limbGeo, mat); rArm.position.set(0.2, 0, 0); body.add(rArm);
            const lLeg = new THREE.Mesh(limbGeo, mat); lLeg.position.set(-0.1, 0.2, 0); group.add(lLeg);
            const rLeg = new THREE.Mesh(limbGeo, mat); rLeg.position.set(0.1, 0.2, 0); group.add(rLeg);

            // Weapon
            const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x888888 }));
            weapon.rotation.x = Math.PI / 2; weapon.position.y = -0.2; rArm.add(weapon);

            group.add(body);
        } else if (type === 'slime') {
            const mat = new THREE.MeshPhysicalMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                transmission: 0.5,
                roughness: 0.2
            });
            const geo = new THREE.DodecahedronGeometry(0.3, 0);
            const body = new THREE.Mesh(geo, mat);
            body.position.y = 0.3;
            body.scale.y = 0.8; // Squish
            body.name = 'body';

            // Core
            const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.5) }));
            core.position.y = 0;
            body.add(core);

            group.add(body);
        } else if (type === 'bat') {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            body.position.y = 1.0;
            body.name = 'body';

            // Wings
            const wingGeo = new THREE.BufferGeometry();
            // Simple triangle wings vertices
            const vertices = new Float32Array([
                0, 0, 0, 0.5, 0.2, 0, 0.3, -0.3, 0, // Left Wing
                0, 0, 0, -0.5, 0.2, 0, -0.3, -0.3, 0  // Right Wing
            ]);
            wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            wingGeo.computeVertexNormals();
            const wing = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
            body.add(wing);
            group.add(body);
        } else if (entity.type === 'npc' && !entity.name.includes("Elder")) {
            const name = entity.name;
            let tunicColor = 0x4caf50;
            let hasRobes = false;
            let hasApron = false;
            let hasArmor = false;
            let weaponType = 'none';

            if (name.includes("Barin")) { tunicColor = 0x8d6e63; hasApron = true; weaponType = 'hammer'; }
            else if (name.includes("Mila")) { tunicColor = 0x4fc3f7; hasRobes = true; }
            else if (name.includes("Thorne")) { tunicColor = 0x757575; hasArmor = true; weaponType = 'sword_back'; }
            else if (name.includes("Rowan")) { tunicColor = 0x5d4037; }
            else if (name.includes("Elara")) { tunicColor = 0x9c27b0; }

            let bodyGeo;
            if (hasRobes) bodyGeo = new THREE.CylinderGeometry(0.15, 0.3, 0.6, 8);
            else bodyGeo = new THREE.BoxGeometry(0.4, 0.5, 0.2);

            const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: tunicColor }));
            body.position.y = hasRobes ? 0.3 : 0.5;
            body.name = 'body';

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), faceMaterials);
            head.position.y = hasRobes ? 0.45 : 0.4;
            body.add(head);

            const hairColor = name.includes("Mila") ? 0xffeb3b : (name.includes("Barin") ? 0x3e2723 : 0x5d4037);
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.27), new THREE.MeshStandardMaterial({ color: hairColor }));
            hair.position.y = 0.15;
            head.add(hair);

            const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
            const lArm = new THREE.Mesh(armGeo, skinMat);
            lArm.position.set(-0.3, 0, 0);
            if (hasRobes) lArm.position.set(-0.25, -0.1, 0);
            body.add(lArm);
            const rArm = new THREE.Mesh(armGeo, skinMat);
            rArm.position.set(0.3, 0, 0);
            if (hasRobes) rArm.position.set(0.25, -0.1, 0);
            body.add(rArm);

            const handGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const lHand = new THREE.Mesh(handGeo, skinMat); lHand.position.y = -0.25; lArm.add(lHand);
            const rHand = new THREE.Mesh(handGeo, skinMat); rHand.position.y = -0.25; rArm.add(rHand);

            if (!hasRobes) {
                const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
                const lLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
                lLeg.position.set(-0.1, 0.2, 0);
                group.add(lLeg);
                const rLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
                rLeg.position.set(0.1, 0.2, 0);
                group.add(rLeg);
            }
            if (hasApron) {
                const apron = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.05), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
                apron.position.set(0, -0.05, 0.12);
                body.add(apron);
            }
            if (hasArmor) {
                const pauldronGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
                const lPaul = new THREE.Mesh(pauldronGeo, new THREE.MeshStandardMaterial({ color: 0x555555 }));
                lPaul.position.set(0, 0.15, 0); lArm.add(lPaul);
                const rPaul = new THREE.Mesh(pauldronGeo, new THREE.MeshStandardMaterial({ color: 0x555555 }));
                rPaul.position.set(0, 0.15, 0); rArm.add(rPaul);
            }
            if (weaponType === 'hammer') {
                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
                handle.position.set(0.1, 0.1, -0.15); handle.rotation.z = Math.PI / 4; body.add(handle);
                const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.15), new THREE.MeshStandardMaterial({ color: 0x888888 }));
                head.position.y = 0.3; handle.add(head);
            }
            group.add(body);

        } else if (entity.type === 'player' || entity.constructor.name === 'Player') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), mat);
            body.position.y = 0.5; body.name = 'body';
            const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.15), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
            backpack.position.set(0, 0, -0.15); body.add(backpack);
            const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0xef5350 }));
            bedroll.rotation.z = Math.PI / 2; bedroll.position.y = 0.25; backpack.add(bedroll);
            const cape = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            cape.position.set(0, -0.1, -0.11); body.add(cape);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), faceMaterials);
            head.position.y = 0.4; body.add(head);
            const hat = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.27), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            hat.position.y = 0.15; head.add(hat);
            const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
            const lArm = new THREE.Mesh(armGeo, skinMat); lArm.position.set(-0.3, 0, 0); body.add(lArm);
            const rArm = new THREE.Mesh(armGeo, skinMat); rArm.position.set(0.3, 0, 0); body.add(rArm);
            const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
            const lHand = new THREE.Mesh(handGeo, skinMat); lHand.position.y = -0.25; lArm.add(lHand);
            const rHand = new THREE.Mesh(handGeo, skinMat); rHand.position.y = -0.25; rArm.add(rHand);
            const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
            const lLeg = new THREE.Mesh(legGeo, darkMat); lLeg.position.set(-0.1, 0.2, 0); group.add(lLeg);
            const rLeg = new THREE.Mesh(legGeo, darkMat); rLeg.position.set(0.1, 0.2, 0); group.add(rLeg);
            const footGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
            const lFoot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({ color: 0x331100 })); lFoot.position.set(0, -0.25, 0.05); lLeg.add(lFoot);
            const rFoot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({ color: 0x331100 })); rFoot.position.set(0, -0.25, 0.05); rLeg.add(rFoot);
            const sword = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })); blade.position.y = 0.3;
            const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x8B4513 })); hilt.position.y = 0;
            sword.add(blade); sword.add(hilt); sword.rotation.x = Math.PI / 2; sword.position.set(0, -0.1, 0.1); rHand.add(sword);
            group.add(body);
        } else {
            // Generic Enemeies
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
        fill.name = 'healthBarFill'; fill.position.z = 0.01; fill.position.x = -0.01;
        hpGroup.add(bg); hpGroup.add(fill); hpGroup.visible = false;
        group.add(hpGroup);

        return group;
    }

    createTileMeshes(map: any): THREE.InstancedMesh[] {
        const floorGeo = new THREE.PlaneGeometry(1, 1);
        floorGeo.rotateX(-Math.PI / 2);
        const wallGeo = new THREE.BoxGeometry(1, 1, 1);
        wallGeo.translate(0, 0.5, 0);

        // Door Geometry (Simple)
        const doorGeo = new THREE.BoxGeometry(1, 1, 0.2);
        doorGeo.translate(0, 0.5, 0);

        const floorMat = new THREE.MeshStandardMaterial({ map: this.textures['floor_stone'] });
        const wallMat = new THREE.MeshStandardMaterial({ map: this.textures['wall_stone'] });
        const grassMat = new THREE.MeshStandardMaterial({ map: this.textures['grass'] });
        const dirtMat = new THREE.MeshStandardMaterial({ map: this.textures['dirt'] });
        const woodWallMat = new THREE.MeshStandardMaterial({ map: this.textures['wood_wall'] });
        const waterMat = new THREE.MeshStandardMaterial({ map: this.textures['water'], transparent: true, opacity: 0.8 });
        const doorMat = new THREE.MeshStandardMaterial({ map: this.textures['door'] });
        const lavaMat = new THREE.MeshStandardMaterial({ map: this.textures['lava'], emissive: 0xff4400, emissiveIntensity: 0.5 });
        const wallMossyMat = new THREE.MeshStandardMaterial({ map: this.textures['wall_mossy'] });
        const wallCrackedMat = new THREE.MeshStandardMaterial({ map: this.textures['wall_cracked'] });

        let floorCount = 0;
        let wallCount = 0;
        let grassCount = 0;
        let dirtCount = 0;
        let woodWallCount = 0;
        let waterCount = 0;
        let doorCount = 0;
        let lavaCount = 0;
        let mossyCount = 0;
        let crackedCount = 0;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                // Render floor under transparent things
                if (tile === 'floor' || tile.startsWith('door') || tile === 'floor_moss') floorCount++;
                else if (tile === 'wall') wallCount++;
                else if (tile === 'wall_mossy') mossyCount++;
                else if (tile === 'wall_cracked') crackedCount++;
                else if (tile === 'floor_grass') grassCount++;
                else if (tile === 'floor_dirt') dirtCount++;
                else if (tile === 'floor_cracked') floorCount++; // Use basic floor for now
                else if (tile === 'wall_wood') woodWallCount++;
                else if (tile === 'water') waterCount++;
                else if (tile === 'lava') lavaCount++;

                if (tile.startsWith('door')) doorCount++;
            }
        }

        const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, floorCount);
        const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
        const mossyMesh = new THREE.InstancedMesh(wallGeo, wallMossyMat, mossyCount);
        const crackedMesh = new THREE.InstancedMesh(wallGeo, wallCrackedMat, crackedCount);
        const grassMesh = new THREE.InstancedMesh(floorGeo, grassMat, grassCount);
        const dirtMesh = new THREE.InstancedMesh(floorGeo, dirtMat, dirtCount);
        const woodWallMesh = new THREE.InstancedMesh(wallGeo, woodWallMat, woodWallCount);
        const waterMesh = new THREE.InstancedMesh(floorGeo, waterMat, waterCount);
        const lavaMesh = new THREE.InstancedMesh(floorGeo, lavaMat, lavaCount);
        const doorMesh = new THREE.InstancedMesh(doorGeo, doorMat, doorCount);

        floorMesh.receiveShadow = true;
        wallMesh.castShadow = true; wallMesh.receiveShadow = true;
        mossyMesh.castShadow = true; mossyMesh.receiveShadow = true;
        crackedMesh.castShadow = true; crackedMesh.receiveShadow = true;
        grassMesh.receiveShadow = true;
        dirtMesh.receiveShadow = true;
        woodWallMesh.castShadow = true; woodWallMesh.receiveShadow = true;
        doorMesh.castShadow = true; doorMesh.receiveShadow = true;

        let fIdx = 0, wIdx = 0, gIdx = 0, dIdx = 0, wwIdx = 0, waIdx = 0, doIdx = 0, lIdx = 0, mIdx = 0, cIdx = 0;
        const dummy = new THREE.Object3D();

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                dummy.position.set(x, 0, y);
                dummy.updateMatrix();

                // Logic: What renders a floor?
                if (tile === 'floor' || tile.startsWith('door') || tile === 'stairs' || tile === 'floor_cracked' || tile === 'floor_moss') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    floorMesh.setMatrixAt(fIdx++, dummy.matrix);
                }

                if (tile === 'wall') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    wallMesh.setMatrixAt(wIdx++, dummy.matrix);
                } else if (tile === 'wall_mossy') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    mossyMesh.setMatrixAt(mIdx++, dummy.matrix);
                } else if (tile === 'wall_cracked') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    crackedMesh.setMatrixAt(cIdx++, dummy.matrix);
                } else if (tile === 'floor_grass') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    grassMesh.setMatrixAt(gIdx++, dummy.matrix);
                } else if (tile === 'floor_dirt') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    dirtMesh.setMatrixAt(dIdx++, dummy.matrix);
                } else if (tile === 'wall_wood') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    woodWallMesh.setMatrixAt(wwIdx++, dummy.matrix);
                } else if (tile === 'water') {
                    dummy.position.y = -0.2;
                    dummy.updateMatrix();
                    waterMesh.setMatrixAt(waIdx++, dummy.matrix);
                } else if (tile === 'lava') {
                    dummy.position.y = 0;
                    dummy.updateMatrix();
                    lavaMesh.setMatrixAt(lIdx++, dummy.matrix);
                } else if (tile.startsWith('door')) {
                    // Draw Door Mesh
                    dummy.position.y = 0;
                    // Rotate if needed (check neighbors? For now just one way)
                    // If neighbors are walls on Left/Right, no rotation.
                    // If neighbors are walls on Top/Bot, rotate 90.
                    // Access map tiles safely
                    if (map.tiles[y] && map.tiles[y][x - 1] && map.tiles[y][x - 1].includes('wall')) {
                        // Horizontal walls, so door should be horizontal
                        dummy.rotation.y = 0;
                    } else {
                        dummy.rotation.y = Math.PI / 2;
                    }
                    dummy.updateMatrix();
                    doorMesh.setMatrixAt(doIdx++, dummy.matrix);
                    // Reset rotation for next
                    dummy.rotation.y = 0;
                }
            }
        }

        return [floorMesh, wallMesh, mossyMesh, crackedMesh, grassMesh, dirtMesh, woodWallMesh, waterMesh, lavaMesh, doorMesh];
    }
}
