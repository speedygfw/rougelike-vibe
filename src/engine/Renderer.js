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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMap(map, visibleTiles, exploredTiles) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const key = `${x},${y}`;
                const isVisible = visibleTiles.has(key);
                const isExplored = exploredTiles.has(key);

                if (!isExplored && !isVisible) continue;

                const tile = map.tiles[y][x];
                const posX = x * this.tileSize;
                const posY = y * this.tileSize;

                this.ctx.globalAlpha = isVisible ? 1.0 : 0.3;

                this.ctx.font = `${this.tileSize}px monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                if (tile === 'wall') {
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#666';
                    this.ctx.fillText('🧱', posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile === 'floor') {
                    this.ctx.fillStyle = '#222';
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillText('·', posX + this.tileSize / 2, posY + this.tileSize / 2);
                } else if (tile === 'stairs') {
                    this.ctx.fillStyle = '#222';
                    this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.fillText('🪜', posX + this.tileSize / 2, posY + this.tileSize / 2);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawEntity(entity, visibleTiles) {
        // console.log('Drawing entity:', entity, visibleTiles);
        if (!visibleTiles) {
            console.error("visibleTiles is undefined in drawEntity");
            return;
        }
        if (!visibleTiles.has(`${entity.x},${entity.y}`)) return;

        const tileSize = this.tileSize;
        this.ctx.font = `${tileSize * 0.8}px sans-serif`; // Slightly smaller for emojis
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

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillText(char, entity.x * tileSize + tileSize / 2 + 2, entity.y * tileSize + tileSize / 2 + 2);

        this.ctx.fillStyle = entity.color || '#fff'; // Default to white if no color
        // Reset color for emojis as they have their own colors, but keeping it for fallback
        this.ctx.fillText(char, entity.x * tileSize + tileSize / 2, entity.y * tileSize + tileSize / 2);
    }

    triggerEffect(x, y, type) {
        this.effects.push({ x, y, type, life: 20 }); // life in frames
    }

    drawEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const posX = effect.x * this.tileSize;
            const posY = effect.y * this.tileSize;

            if (effect.type === 'hit') {
                this.ctx.fillStyle = `rgba(255, 0, 0, ${effect.life / 20})`;
                this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
            }

            effect.life--;
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
}
