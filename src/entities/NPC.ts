import Entity from './Entity.js';

export default class NPC extends Entity {
    name: string;
    dialogue: string[];
    faction: string;

    constructor(x: number, y: number, name: string, dialogue: string[]) {
        super(x, y, '@', '#00ffff'); // Cyan color for NPCs
        this.name = name;
        this.dialogue = dialogue || ["Hello there!"];
        this.faction = 'neutral';
    }

    interact(): string {
        const line = this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
        return line;
    }
}
