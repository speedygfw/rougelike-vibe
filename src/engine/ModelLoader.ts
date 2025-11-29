import * as THREE from 'three';

export class ModelLoader {
    textures: { [key: string]: THREE.Texture } = {};

    constructor() {
        this.loadTextures();
    }

    loadTextures() {
        this.textures['floor_stone'] = this.generateTexture('floor', new THREE.Color(0x888888));
        this.textures['wall_stone'] = this.generateTexture('wall', new THREE.Color(0xaaaaaa));
        this.textures['grass'] = this.generateTexture('grass', new THREE.Color(0x88cc88));
        this.textures['dirt'] = this.generateTexture('dirt', new THREE.Color(0x8B4513));
        this.textures['wood_wall'] = this.generateTexture('wood', new THREE.Color(0x8B4513));
        this.textures['water'] = this.generateTexture('water', new THREE.Color(0x0088ff));
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
            // Stone Archway
            const pillarGeo = new THREE.BoxGeometry(0.4, 2, 0.4);
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const p1 = new THREE.Mesh(pillarGeo, pillarMat); p1.position.set(-0.6, 1, 0); group.add(p1);
            const p2 = new THREE.Mesh(pillarGeo, pillarMat); p2.position.set(0.6, 1, 0); group.add(p2);

            const topGeo = new THREE.BoxGeometry(1.8, 0.4, 0.5);
            const top = new THREE.Mesh(topGeo, pillarMat); top.position.set(0, 2.2, 0); group.add(top);

            // "Portal" effect
            const portalGeo = new THREE.PlaneGeometry(1.2, 2);
            const portalMat = new THREE.MeshBasicMaterial({ color: 0x330033, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const portal = new THREE.Mesh(portalGeo, portalMat);
            portal.position.set(0, 1, 0);
            group.add(portal);

            // Inviting Lights (Torches)
            const t1 = this.createProp('torch', -0.8, 0);
            if (t1) { t1.position.set(-0.8, 0.5, 0.2); group.add(t1); }
            const t2 = this.createProp('torch', 0.8, 0);
            if (t2) { t2.position.set(0.8, 0.5, 0.2); group.add(t2); }

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
        } else if (type === 'wood') {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(0, i * 16, 64, 2);
                ctx.fillRect(Math.random() * 64, i * 16, 2, 16);
            }
        } else if (type === 'wall') {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let y = 0; y < 64; y += 16) {
                ctx.fillRect(0, y, 64, 2);
                for (let x = 0; x < 64; x += 32) {
                    const offset = (y % 32 === 0) ? 0 : 16;
                    ctx.fillRect(x + offset, y, 2, 16);
                }
            }
        } else if (type === 'floor') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let y = 0; y < 64; y += 16) {
                for (let x = 0; x < 64; x += 16) {
                    ctx.strokeRect(x, y, 16, 16);
                    if (Math.random() > 0.5) ctx.fillRect(x + 4, y + 4, 8, 8);
                }
            }
        } else if (type === 'grass') {
            ctx.fillStyle = 'rgba(0,100,0,0.1)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 64;
                const y = Math.random() * 64;
                ctx.fillRect(x, y, 2, 6);
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
        // const headMat = new THREE.MeshStandardMaterial({ map: headTex }); // Unused
        const darkMat = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.5) });

        const faceMaterials = [
            skinMat, skinMat, skinMat, skinMat,
            new THREE.MeshStandardMaterial({ map: headTex }),
            skinMat
        ];

        if (entity.name === "Elder Aethel") {
            // Custom Elder Model
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x5c4033 })); // Robes
            body.position.y = 0.3;
            body.name = 'body';

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), faceMaterials);
            head.position.y = 0.45;
            body.add(head);

            // Beard
            const beard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
            beard.position.set(0, -0.15, 0.1);
            head.add(beard);

            // Staff
            const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x654321 }));
            staff.position.set(0.3, 0.3, 0.2);
            body.add(staff);

            // Gold Tip
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
            tip.position.y = 0.6;
            staff.add(tip);

            group.add(body);

        } else if (entity.type === 'player' || entity.constructor.name === 'Player') {
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
    createTileMeshes(map: any): THREE.InstancedMesh[] {
        const floorGeo = new THREE.PlaneGeometry(1, 1);
        floorGeo.rotateX(-Math.PI / 2);
        const wallGeo = new THREE.BoxGeometry(1, 1, 1);
        wallGeo.translate(0, 0.5, 0);

        const floorMat = new THREE.MeshStandardMaterial({ map: this.textures['floor_stone'] });
        const wallMat = new THREE.MeshStandardMaterial({ map: this.textures['wall_stone'] });
        const grassMat = new THREE.MeshStandardMaterial({ map: this.textures['grass'] });
        const dirtMat = new THREE.MeshStandardMaterial({ map: this.textures['dirt'] });
        const woodWallMat = new THREE.MeshStandardMaterial({ map: this.textures['wood_wall'] });
        const waterMat = new THREE.MeshStandardMaterial({ map: this.textures['water'], transparent: true, opacity: 0.8 });

        let floorCount = 0;
        let wallCount = 0;
        let grassCount = 0;
        let dirtCount = 0;
        let woodWallCount = 0;
        let waterCount = 0;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                if (tile === 'floor') floorCount++;
                else if (tile === 'wall') wallCount++;
                else if (tile === 'floor_grass') grassCount++;
                else if (tile === 'floor_dirt') dirtCount++;
                else if (tile === 'wall_wood') woodWallCount++;
                else if (tile === 'water') waterCount++;
            }
        }

        const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, floorCount);
        const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
        const grassMesh = new THREE.InstancedMesh(floorGeo, grassMat, grassCount);
        const dirtMesh = new THREE.InstancedMesh(floorGeo, dirtMat, dirtCount);
        const woodWallMesh = new THREE.InstancedMesh(wallGeo, woodWallMat, woodWallCount);
        const waterMesh = new THREE.InstancedMesh(floorGeo, waterMat, waterCount);

        floorMesh.receiveShadow = true;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        grassMesh.receiveShadow = true;
        dirtMesh.receiveShadow = true;
        woodWallMesh.castShadow = true;
        woodWallMesh.receiveShadow = true;
        waterMesh.receiveShadow = true;

        let fIdx = 0, wIdx = 0, gIdx = 0, dIdx = 0, wwIdx = 0, waIdx = 0;
        const dummy = new THREE.Object3D();

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                dummy.position.set(x, 0, y);
                dummy.updateMatrix();

                if (tile === 'floor') {
                    floorMesh.setMatrixAt(fIdx++, dummy.matrix);
                } else if (tile === 'wall') {
                    wallMesh.setMatrixAt(wIdx++, dummy.matrix);
                } else if (tile === 'floor_grass') {
                    grassMesh.setMatrixAt(gIdx++, dummy.matrix);
                } else if (tile === 'floor_dirt') {
                    dirtMesh.setMatrixAt(dIdx++, dummy.matrix);
                } else if (tile === 'wall_wood') {
                    woodWallMesh.setMatrixAt(wwIdx++, dummy.matrix);
                } else if (tile === 'water') {
                    waterMesh.setMatrixAt(waIdx++, dummy.matrix);
                }
            }
        }

        return [floorMesh, wallMesh, grassMesh, dirtMesh, woodWallMesh, waterMesh];
    }
}
