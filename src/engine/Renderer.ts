import { MapData, Prop } from './MapGenerator.js';
import Entity from '../entities/Entity.js';

interface Effect {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    type: string;
    size?: number;
    color: string;
    text?: string;
}

export default class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    tileSize: number;
    effects: Effect[];
    cameraX: number;
    cameraY: number;
    textures: { [key: string]: HTMLImageElement };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false; // Pixel art look
        this.tileSize = 32; // Represents half-width of the iso tile
        this.effects = [];
        this.cameraX = 0;
        this.cameraY = 0;

        this.textures = {};
        this.loadTextures();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    loadTextures() {
        if (typeof Image === 'undefined') return; // Skip in test environment
        const names = [
            'floor_stone', 'wall_stone', 'wall_stone_top',
            'floor_moss', 'wall_cracked',
            'prop_torch', 'prop_banner'
        ];
        names.forEach(name => {
            const img = new Image();
            img.src = `${import.meta.env.BASE_URL}textures/${name}.png`;
            img.onload = () => {
                console.log(`Texture loaded: ${name}`);
                this.textures[name] = img; // Store image directly
            };
            img.onerror = (e) => {
                console.error(`Failed to load texture: ${name}`, e);
            };
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false; // Re-apply after resize

        // Adjust tile size for mobile
        if (window.innerWidth < 768) {
            this.tileSize = 24;
        } else {
            this.tileSize = 32;
        }
    }

    toIso(x: number, y: number) {
        return {
            x: (x - y) * this.tileSize,
            y: (x + y) * (this.tileSize / 2)
        };
    }

    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateCamera(player: Entity, map: MapData) {
        const iso = this.toIso(player.x, player.y);

        // Center camera on player
        this.cameraX = iso.x - this.canvas.width / 2;
        this.cameraY = iso.y - this.canvas.height / 2;
    }

    drawMap(map: MapData, visibleTiles: Set<string>, exploredTiles: Set<string>) {
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const theme = map.theme || {
            colors: { floor: '#222', wall: '#444', wallTop: '#555' },
        };

        // Render order: back to front (top-left to bottom-right)
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const key = `${x},${y}`;
                const isVisible = visibleTiles.has(key);
                const isExplored = exploredTiles.has(key);

                if (!isExplored && !isVisible) continue;

                const tile = map.tiles[y][x];
                const iso = this.toIso(x, y);
                const drawX = iso.x - this.cameraX;
                const drawY = iso.y - this.cameraY;

                // Lighting
                let alpha = 0.4;
                if (isVisible) alpha = 1.0;
                this.ctx.globalAlpha = alpha;

                // Draw Floor
                let floorTex = this.textures.floor_stone;
                if (tile === 'floor_moss') floorTex = this.textures.floor_moss;

                // Always draw floor for floor tiles
                if (tile.startsWith('floor') || tile === 'stairs' || tile.startsWith('door')) {
                    this.drawIsoTile(drawX, drawY, theme.colors.floor, floorTex);
                }

                // Draw Walls / Objects
                if (tile.startsWith('wall')) {
                    let wallTex = this.textures.wall_stone;
                    if (tile === 'wall_cracked') wallTex = this.textures.wall_cracked;

                    this.drawIsoBlock(drawX, drawY, theme.colors.wall, theme.colors.wallTop, 20, wallTex, this.textures.wall_stone_top);
                } else if (tile === 'stairs') {
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.fillText('🪜', drawX, drawY - 10);
                } else if (tile === 'door_closed') {
                    this.drawIsoBlock(drawX, drawY, '#8d6e63', '#a1887f', 20);
                } else if (tile === 'door_open') {
                    this.ctx.fillStyle = '#8d6e63';
                    this.ctx.fillText('🚪', drawX, drawY - 5);
                }

                // Props
                if (map.props) {
                    const propsHere = map.props.filter(p => p.x === x && p.y === y);
                    propsHere.forEach(prop => {
                        if (prop.type === 'torch') {
                            if (this.textures.prop_torch) {
                                // Flicker effect
                                const flicker = 0.8 + Math.sin(Date.now() * 0.01 + x * y) * 0.2;
                                this.ctx.globalAlpha = alpha * flicker;
                                // Draw torch on wall (lifted up), scaled to tile size
                                this.ctx.drawImage(this.textures.prop_torch, drawX - this.tileSize / 2, drawY - this.tileSize * 1.5, this.tileSize, this.tileSize);

                                // Glow
                                if (isVisible) {
                                    this.ctx.globalCompositeOperation = 'screen';
                                    this.ctx.fillStyle = `rgba(255, 100, 0, ${0.3 * flicker})`;
                                    this.ctx.beginPath();
                                    this.ctx.arc(drawX, drawY - 20, 30, 0, Math.PI * 2);
                                    this.ctx.fill();
                                    this.ctx.globalCompositeOperation = 'source-over';
                                }
                                this.ctx.globalAlpha = alpha;
                            } else {
                                this.ctx.fillText(prop.char, drawX, drawY - 20);
                            }
                        } else if (prop.type === 'banner') {
                            if (this.textures.prop_banner) {
                                // Draw banner, scaled to tile size
                                this.ctx.drawImage(this.textures.prop_banner, drawX - this.tileSize / 2, drawY - this.tileSize * 1.5, this.tileSize, this.tileSize);
                            } else {
                                this.ctx.fillText(prop.char, drawX, drawY - 20);
                            }
                        } else {
                            this.ctx.font = `${this.tileSize}px sans-serif`;
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(prop.char, drawX, drawY - 10);
                        }
                    });
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawIsoTile(x: number, y: number, color: string, texture?: HTMLImageElement) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - this.tileSize / 2);
        this.ctx.lineTo(x + this.tileSize, y);
        this.ctx.lineTo(x, y + this.tileSize / 2);
        this.ctx.lineTo(x - this.tileSize, y);
        this.ctx.closePath();

        if (texture && texture instanceof Image) {
            this.ctx.save();
            // Use coordinates as seed for deterministic variation
            this.drawIsoImage(texture, x, y, this.tileSize * 2, this.tileSize, 'floor', x + y * 1000);

            // Tint with floor color using soft-light for better visibility
            this.ctx.globalCompositeOperation = 'soft-light';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - this.tileSize / 2);
            this.ctx.lineTo(x + this.tileSize, y);
            this.ctx.lineTo(x, y + this.tileSize / 2);
            this.ctx.lineTo(x - this.tileSize, y);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.stroke();
    }

    drawIsoImage(img: HTMLImageElement, x: number, y: number, width: number, height: number, type: string, seed = 0) {
        if (!img.naturalWidth || !img.naturalHeight) return;

        this.ctx.save();
        this.ctx.translate(x, y);

        // Slight overscale to prevent seams
        const overlap = 1.02;

        // Deterministic random based on seed
        const rand = Math.sin(seed) * 10000;
        const randomValue = rand - Math.floor(rand);

        let flipX = false;
        let flipY = false;

        if (type === 'floor') {
            // Randomly flip floor tiles on both axes
            if (randomValue > 0.5) flipX = true;
            if (randomValue > 0.25 && randomValue < 0.75) flipY = true;

            this.ctx.translate(0, -this.tileSize / 2);

            // Standard scaling (always positive)
            const scaleX = (this.tileSize / img.naturalWidth) * overlap;
            const scaleY = (this.tileSize / img.naturalHeight) * overlap;

            this.ctx.scale(scaleX, scaleY);
            this.ctx.transform(1, 0.5, -1, 0.5, 0, 0);

            // Apply flip AFTER transform
            if (flipX) {
                this.ctx.translate(img.naturalWidth, 0);
                this.ctx.scale(-1, 1);
            }
            if (flipY) {
                this.ctx.translate(0, img.naturalHeight);
                this.ctx.scale(1, -1);
            }

            this.ctx.drawImage(img, 0, 0);

        } else if (type === 'left') {
            // Only flip walls horizontally to keep brick alignment
            if (randomValue > 0.5) flipX = true;

            this.ctx.translate(-this.tileSize, -height);
            this.ctx.transform(1, 0.5, 0, 1, 0, 0);

            const scaleX = (this.tileSize / img.naturalWidth) * overlap;
            const scaleY = (height / img.naturalHeight) * overlap;

            this.ctx.scale(scaleX, scaleY);

            if (flipX) {
                this.ctx.translate(img.naturalWidth, 0);
                this.ctx.scale(-1, 1);
            }

            this.ctx.drawImage(img, 0, 0);

        } else if (type === 'right') {
            // Only flip walls horizontally
            if (randomValue > 0.5) flipX = true;

            this.ctx.translate(0, this.tileSize / 2 - height);
            this.ctx.transform(1, -0.5, 0, 1, 0, 0);

            const scaleX = (this.tileSize / img.naturalWidth) * overlap;
            const scaleY = (height / img.naturalHeight) * overlap;

            this.ctx.scale(scaleX, scaleY);

            if (flipX) {
                this.ctx.translate(img.naturalWidth, 0);
                this.ctx.scale(-1, 1);
            }

            this.ctx.drawImage(img, 0, 0);
        }

        this.ctx.restore();
    }

    drawIsoBlock(x: number, y: number, colorSide: string, colorTop: string, height: number, textureSide?: HTMLImageElement, textureTop?: HTMLImageElement) {
        // Top Face
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - this.tileSize / 2 - height);
        this.ctx.lineTo(x + this.tileSize, y - height);
        this.ctx.lineTo(x, y + this.tileSize / 2 - height);
        this.ctx.lineTo(x - this.tileSize, y - height);
        this.ctx.closePath();

        if (textureTop && textureTop instanceof Image) {
            this.ctx.save();
            // Use same seed logic but offset for top face to distinguish from floor below
            this.drawIsoImage(textureTop, x, y - height, this.tileSize * 2, this.tileSize, 'floor', x + y * 1000 + 1);

            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = colorTop;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - this.tileSize / 2 - height);
            this.ctx.lineTo(x + this.tileSize, y - height);
            this.ctx.lineTo(x, y + this.tileSize / 2 - height);
            this.ctx.lineTo(x - this.tileSize, y - height);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = colorTop;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.stroke();

        // Right Face
        this.ctx.beginPath();
        this.ctx.moveTo(x + this.tileSize, y - height);
        this.ctx.lineTo(x + this.tileSize, y);
        this.ctx.lineTo(x, y + this.tileSize / 2);
        this.ctx.lineTo(x, y + this.tileSize / 2 - height);
        this.ctx.closePath();

        if (textureSide && textureSide instanceof Image) {
            this.ctx.save();
            this.drawIsoImage(textureSide, x, y, this.tileSize, height, 'right', x + y * 1000 + 2);

            this.ctx.globalCompositeOperation = 'soft-light';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = this.shadeColor(colorSide, -20);
            this.ctx.beginPath();
            this.ctx.moveTo(x + this.tileSize, y - height);
            this.ctx.lineTo(x + this.tileSize, y);
            this.ctx.lineTo(x, y + this.tileSize / 2);
            this.ctx.lineTo(x, y + this.tileSize / 2 - height);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = this.shadeColor(colorSide, -20);
            this.ctx.fill();
        }

        // Left Face
        this.ctx.beginPath();
        this.ctx.moveTo(x - this.tileSize, y - height);
        this.ctx.lineTo(x - this.tileSize, y);
        this.ctx.lineTo(x, y + this.tileSize / 2);
        this.ctx.lineTo(x, y + this.tileSize / 2 - height);
        this.ctx.closePath();

        if (textureSide && textureSide instanceof Image) {
            this.ctx.save();
            this.drawIsoImage(textureSide, x, y, this.tileSize, height, 'left', x + y * 1000 + 3);

            this.ctx.globalCompositeOperation = 'soft-light';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = colorSide;
            this.ctx.beginPath();
            this.ctx.moveTo(x - this.tileSize, y - height);
            this.ctx.lineTo(x - this.tileSize, y);
            this.ctx.lineTo(x, y + this.tileSize / 2);
            this.ctx.lineTo(x, y + this.tileSize / 2 - height);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = colorSide;
            this.ctx.fill();
        }
    }

    shadeColor(color: string, percent: number) {
        // Simple helper to darken/lighten hex color
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = Math.round(R * (100 + percent) / 100);
        G = Math.round(G * (100 + percent) / 100);
        B = Math.round(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }

    drawMinimap(map: MapData, player: Entity, exploredTiles: Set<string>) {
        if (!map || !player) return;
        const minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
        if (!minimapCanvas) return;

        // Force resolution
        if (minimapCanvas.width !== 150) minimapCanvas.width = 150;
        if (minimapCanvas.height !== 150) minimapCanvas.height = 150;

        const ctx = minimapCanvas.getContext('2d')!;
        const w = minimapCanvas.width;
        const h = minimapCanvas.height;

        // Clear
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.clearRect(0, 0, w, h);
        ctx.fillRect(0, 0, w, h);

        const tileW = w / map.width;
        const tileH = h / map.height;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const key = `${x},${y}`;
                if (exploredTiles.has(key)) {
                    const tile = map.tiles[y][x];
                    if (tile.startsWith('wall')) ctx.fillStyle = '#666';
                    else if (tile.startsWith('floor')) ctx.fillStyle = '#222';
                    else if (tile === 'stairs') ctx.fillStyle = '#ff0';
                    else ctx.fillStyle = '#444';

                    ctx.fillRect(x * tileW, y * tileH, tileW, tileH);
                }
            }
        }
        // Draw Player
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x * tileW, player.y * tileH, tileW, tileH);
    }

    drawEntity(entity: any, visibleTiles: Set<string>) {
        if (!visibleTiles) return;
        if (!visibleTiles.has(`${entity.x},${entity.y}`)) return;

        const iso = this.toIso(entity.x, entity.y);
        const x = iso.x - this.cameraX;
        let y = iso.y - this.cameraY - 15; // Lift up slightly to stand on tile

        this.ctx.font = `${this.tileSize * 1.5}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let char = entity.char;
        let isItem = false;

        // Robust check for player
        if (entity.constructor.name === 'Player' || entity.char === '🧙‍♂️') char = '🧙‍♂️';
        else if (entity.constructor.name === 'Potion') { char = '🍷'; isItem = true; }
        else if (entity.constructor.name === 'Weapon') { char = '🗡️'; isItem = true; }
        else if (entity.constructor.name === 'Armor') { char = '🛡️'; isItem = true; }
        else if (entity.type === 'bat') char = '🦇';
        else if (entity.type === 'orc') char = '👹';
        else if (entity.type === 'shaman') char = '👺';
        else if (entity.type === 'goblin') char = '👿';
        else if (entity.type === 'skeleton') char = '💀';
        else if (entity.type === 'ogre') char = '👹';
        else if (entity.constructor.name === 'NPC') char = '🗣️';

        // Bobbing animation for items
        if (isItem) {
            const bob = Math.sin(Date.now() * 0.005 + entity.x + entity.y) * 5;
            y += bob;
        }

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 15, this.tileSize / 2, this.tileSize / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = entity.color || '#fff';
        this.ctx.fillText(char, x, y);
    }

    createParticle(x: number, y: number, type: string) {
        const iso = this.toIso(x, y);
        const count = type === 'blood' ? 5 : 10;
        for (let i = 0; i < count; i++) {
            this.effects.push({
                x: iso.x,
                y: iso.y - 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30 + Math.random() * 20,
                type: type,
                size: Math.random() * 3 + 1,
                color: type === 'fire' ? `hsl(${Math.random() * 40 + 10}, 100%, 50%)` :
                    type === 'magic' ? `hsl(${Math.random() * 60 + 240}, 100%, 70%)` :
                        type === 'blood' ? '#8a0303' : '#fff'
            });
        }
    }

    createFloatingText(x: number, y: number, text: string, color: string) {
        const iso = this.toIso(x, y);
        this.effects.push({
            x: iso.x,
            y: iso.y - 30,
            vx: 0,
            vy: -1,
            life: 60,
            type: 'text',
            text: text,
            color: color
        });
    }

    triggerEffect(x: number, y: number, type: string) {
        if (type === 'hit') {
            this.createParticle(x, y, 'blood');
        } else if (type === 'heal') {
            this.createParticle(x, y, 'magic');
            this.createFloatingText(x, y, "+HP", "#00e676");
        } else if (type === 'freeze') {
            this.createParticle(x, y, 'magic');
        } else {
            this.createParticle(x, y, 'fire');
        }
    }

    drawEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const drawX = effect.x - this.cameraX;
            const drawY = effect.y - this.cameraY;

            if (effect.type === 'text') {
                this.ctx.font = 'bold 16px "Inter", sans-serif';
                this.ctx.fillStyle = effect.color;
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(effect.text!, drawX, drawY);
                this.ctx.fillText(effect.text!, drawX, drawY);

                effect.y += effect.vy;
            } else {
                this.ctx.fillStyle = effect.color;
                this.ctx.beginPath();
                this.ctx.arc(drawX, drawY, effect.size!, 0, Math.PI * 2);
                this.ctx.fill();

                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vy += 0.1; // Gravity
            }

            effect.life--;
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
}
