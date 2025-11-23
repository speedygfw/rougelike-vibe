import Entity from './Entity.js';

export default class NPC extends Entity {
    constructor(x, y, name, dialogue) {
        super(x, y, '@', '#00ffff'); // Cyan color for NPCs
        this.name = name;
        this.dialogue = dialogue || ["Hello there!"];
        this.faction = 'neutral';
    }

    interact() {
        const line = this.dialogue[Math.floor(Math.random() * this.dialogue.length)];
        return line;
    }
}
