export default class InputHandler {
    constructor() {
        this.command = null;
    }

    handleKey(e) {
        this.command = null;

        if (e.key === 'ArrowUp' || e.key === 'w') return { type: 'move', dx: 0, dy: -1 };
        if (e.key === 'ArrowDown' || e.key === 's') return { type: 'move', dx: 0, dy: 1 };
        if (e.key === 'ArrowLeft' || e.key === 'a') return { type: 'move', dx: -1, dy: 0 };
        if (e.key === 'ArrowRight' || e.key === 'd') return { type: 'move', dx: 1, dy: 0 };

        if (e.key === 'Enter' || e.key === ' ') return { type: 'interact' };
        if (e.key === 'g') return { type: 'pickup' };
        if (e.key === 'i') return { type: 'inventory' };
        if (e.key === 'r') return { type: 'restart' };

        return null;
    }
}
