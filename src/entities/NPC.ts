import Entity from './Entity.js';

export default class NPC extends Entity {
    name: string;
    dialogue: string[];
    image?: string;
    faction: string;

    constructor(x: number, y: number, name: string, dialogue: string[], image?: string) {
        super(x, y, '@', '#00ffff'); // Cyan color for NPCs
        this.name = name;
        this.dialogue = dialogue || ["Hello there!"];
        this.faction = 'neutral';
        this.image = image;
    }

    interact(): { text: string, image?: string } {
        const line = this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
        return { text: line, image: this.image };
    }
}
