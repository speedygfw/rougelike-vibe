import Entity from './Entity.js';

export default class NPC extends Entity {
    name: string;
    type: string;
    dialogue: string[];
    image?: string;
    faction: string;

    constructor(x: number, y: number, name: string, dialogue: string[], image?: string) {
        super(x, y, '@', '#00ffff'); // Cyan color for NPCs
        this.name = name;
        this.type = 'npc';
        this.dialogue = dialogue || ["Hello there!"];
        this.faction = 'neutral';
        this.image = image;
    }

    interact(): { text: string, image?: string } {
        const line = this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
        return { text: line, image: this.image };
    }

    takeTurn(map: any, entities: Entity[]) {
        // 40% chance to move randomly
        if (Math.random() < 0.4) {
            const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

            if (dx === 0 && dy === 0) return;

            const targetX = this.x + dx;
            const targetY = this.y + dy;

            // Bounds check
            if (targetX < 0 || targetX >= map.width || targetY < 0 || targetY >= map.height) return;

            // Collision checks
            if (map.tiles[targetY][targetX] === 'wall' || map.tiles[targetY][targetX] === 'water' || map.tiles[targetY][targetX] === 'wall_wood') return;

            // Entity collision
            const blocked = entities.find(e => e.x === targetX && e.y === targetY);
            if (blocked) return;

            // Map prop collision
            const propBlocked = map.props.find((p: any) => p.x === targetX && p.y === targetY);
            if (propBlocked) return;


            this.x = targetX;
            this.y = targetY;
            this.drawX = targetX;
            this.drawY = targetY;
        }
    }
}
