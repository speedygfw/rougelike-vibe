export default class InputHandler {
    command: any;

    constructor() {
        this.command = null;
    }

    handleKey(e: KeyboardEvent) {
        this.command = null;

        if (e.key === 'ArrowUp' || e.key === 'w') return { type: 'move', dx: 0, dy: -1 };
        if (e.key === 'ArrowDown' || e.key === 's') return { type: 'move', dx: 0, dy: 1 };
        if (e.key === 'ArrowLeft' || e.key === 'a') return { type: 'move', dx: -1, dy: 0 };
        if (e.key === 'ArrowRight' || e.key === 'd') return { type: 'move', dx: 1, dy: 0 };

        if (e.key === 'Enter' || e.key === ' ') return { type: 'interact' };
        if (e.key === 'g') return { type: 'pickup' };
        if (e.key === 'i') return { type: 'inventory' };
        if (e.key === 'b') return { type: 'spellbook' };
        if (e.key === 'r') return { type: 'restart' };

        // Spell Casting
        if (e.key >= '1' && e.key <= '9') {
            return { type: 'cast', spellIndex: parseInt(e.key) - 1 };
        }

        return null;
    }
}
