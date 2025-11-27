export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 32;
        this.effects = [];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth || 320;
        this.canvas.height = window.innerHeight || 480;

        // Adjust tile size for mobile
        try {
            if (window.innerWidth && window.innerWidth < 768) {
                this.tileSize = 48; // Zoom in for mobile
            } else {
                this.tileSize = 32; // Standard size for desktop
            }
        } catch (e) {
            this.tileSize = 32;
        }
    }

    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMap(map, visibleTiles, exploredTiles) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const theme = map.theme || {
            colors: { floor: '#222', wall: '#444', wallText: '#666', floorText: '#333' },
            chars: { wall: '🧱', floor: '·', door_closed: '🚪', door_open: 'frame' }
        };

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const key = `${x},${y}`;
                const isVisible = visibleTiles.has(key);
                const isExplored = exploredTiles.has(key);

                if (!isExplored && !isVisible) continue;

                const tile = map.tiles[y][x];
                const posX = x * this.tileSize;
                const posY = y * this.tileSize;

                // Lighting Effect
                let alpha = 0.3;
                if (isVisible) alpha = 1.0;
                this.ctx.globalAlpha = alpha;

                this.ctx.font = `${this.tileSize}px monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                if (tile.startsWith('wall')) {
                    this.ctx.fillStyle = theme.colors.wall;
                    if (tile === 'wall_mossy') this.ctx.fillStyle = '#3e4a3e';
                    if (tile === 'wall_cracked') this.ctx.fillStyle = '#333';

                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = theme.colors.wallText;
                    this.ctx.fillText(theme.chars.wall, posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile.startsWith('floor')) {
                    this.ctx.fillStyle = theme.colors.floor;
                    if (tile === 'floor_mossy') this.ctx.fillStyle = '#1a261a';
                    if (tile === 'floor_cracked') this.ctx.fillStyle = '#1a1a1a';

                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = theme.colors.floorText;
                    this.ctx.fillText(theme.chars.floor, posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile === 'stairs') {
                    this.ctx.fillStyle = theme.colors.floor;
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.fillText('🪜', posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile === 'door_closed') {
                    this.ctx.fillStyle = theme.colors.floor;
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#8d6e63';
                    this.ctx.fillText(theme.chars.door_closed, posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile === 'door_open') {
                    this.ctx.fillStyle = theme.colors.floor;
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    if (theme.chars.door_open === 'frame') {
                        this.ctx.strokeStyle = '#8d6e63';
                        this.ctx.strokeRect(posX + 2, posY + 2, this.tileSize - 4, this.tileSize - 4);
                    } else {
                        this.ctx.fillStyle = '#8d6e63';
                        this.ctx.fillText(theme.chars.door_open, posX + this.tileSize / 2, posY + this.tileSize / 2);
                    }
                }
            }
        }

        // Draw Props
        if (map.props) {
            map.props.forEach(prop => {
                const key = `${prop.x},${prop.y}`;
                if (visibleTiles.has(key) || exploredTiles.has(key)) {
                    const posX = prop.x * this.tileSize;
                    const posY = prop.y * this.tileSize;
                    this.ctx.globalAlpha = visibleTiles.has(key) ? 1.0 : 0.3;

                    if (prop.type === 'torch') this.ctx.fillStyle = '#ff5722';
                    else if (prop.type === 'grass') this.ctx.fillStyle = '#4caf50';
                    else if (prop.type === 'rubble') this.ctx.fillStyle = '#8d6e63';
                    else if (prop.type === 'bones') this.ctx.fillStyle = '#e0e0e0';
                    else this.ctx.fillStyle = '#fff';

                    this.ctx.fillText(prop.char, posX + this.tileSize / 2, posY + this.tileSize / 2);
                }
            });
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawEntity(entity, visibleTiles) {
        if (!visibleTiles) return;
        if (!visibleTiles.has(`${entity.x},${entity.y}`)) return;

        const tileSize = this.tileSize;
        const x = (entity.drawX !== undefined ? entity.drawX : entity.x) * tileSize;
        const y = (entity.drawY !== undefined ? entity.drawY : entity.y) * tileSize;

        this.ctx.font = `${tileSize * 0.8}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let char = entity.char;
        if (entity.constructor.name === 'Player') char = '🧙‍♂️';
        else if (entity.constructor.name === 'Potion') char = '🍷';
        else if (entity.constructor.name === 'Weapon') char = '🗡️';
        else if (entity.constructor.name === 'Armor') char = '🛡️';
        else if (entity.type === 'bat') char = '🦇';
        else if (entity.type === 'orc') char = '👹';
        else if (entity.type === 'shaman') char = '👺';
        else if (entity.type === 'goblin') char = '👿';
        else if (entity.type === 'skeleton') char = '💀';
        else if (entity.type === 'ogre') char = '👹';
        else if (entity.constructor.name === 'NPC') char = '🗣️';

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillText(char, x + tileSize / 2 + 2, y + tileSize / 2 + 2);

        this.ctx.fillStyle = entity.color || '#fff';
        this.ctx.fillText(char, x + tileSize / 2, y + tileSize / 2);
    }

    createParticle(x, y, type) {
        const count = type === 'blood' ? 5 : 10;
        for (let i = 0; i < count; i++) {
            this.effects.push({
                x: x * this.tileSize + this.tileSize / 2,
                y: y * this.tileSize + this.tileSize / 2,
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

    createFloatingText(x, y, text, color) {
        this.effects.push({
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize,
            vx: 0,
            vy: -1,
            life: 60,
            type: 'text',
            text: text,
            color: color
        });
    }

    triggerEffect(x, y, type) {
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

            if (effect.type === 'text') {
                this.ctx.font = 'bold 16px "Inter", sans-serif';
                this.ctx.fillStyle = effect.color;
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(effect.text, effect.x, effect.y);
                this.ctx.fillText(effect.text, effect.x, effect.y);

                effect.y += effect.vy;
            } else {
                this.ctx.fillStyle = effect.color;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
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
