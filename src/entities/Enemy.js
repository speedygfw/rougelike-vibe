import Entity from './Entity.js';

export default class Enemy extends Entity {
    constructor(x, y, type = 'goblin') {
        let char = 'g';
        let color = '#ff4444';
        let hp = 20;

        if (type === 'bat') {
            char = 'b';
            color = '#a8a8a8';
            hp = 10;
        } else if (type === 'orc') {
            char = 'O';
            color = '#00aa00';
            hp = 40;
        } else if (type === 'shaman') {
            char = 'S';
            color = '#aa00aa';
            hp = 15;
        } else if (type === 'skeleton') {
            char = '💀';
            color = '#dddddd';
            hp = 12;
        } else if (type === 'ogre') {
            char = '👹';
            color = '#006600';
            hp = 60;
        } else if (type === 'dragon') {
            char = '🐉';
            color = '#ff0000';
            hp = 150;
        }

        super(x, y, char, color);
        this.type = type;
        this.hp = hp;
    }

    getAttack() {
        if (this.type === 'bat') return 2;
        if (this.type === 'goblin') return 5;
        if (this.type === 'shaman') return 4;
        if (this.type === 'orc') return 8;
        if (this.type === 'skeleton') return 4;
        if (this.type === 'ogre') return 12;
        if (this.type === 'dragon') return 20;
        return 3;
    }

    getDefense() {
        if (this.type === 'bat') return 0;
        if (this.type === 'goblin') return 1;
        if (this.type === 'shaman') return 1;
        if (this.type === 'orc') return 3;
        if (this.type === 'skeleton') return 1;
        if (this.type === 'ogre') return 4;
        if (this.type === 'dragon') return 8;
        return 0;
    }

    takeTurn(player, map, onAttack) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.abs(dx) + Math.abs(dy);

        if (this.type === 'bat') {
            // Bat moves twice or randomly
            for (let i = 0; i < 2; i++) {
                if (Math.random() < 0.3) {
                    const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    const move = moves[Math.floor(Math.random() * moves.length)];
                    this.tryMove(move[0], move[1], map, player, onAttack);
                } else {
                    this.moveTowards(player, map, onAttack);
                }
                // Stop if adjacent to player to attack once
                if (Math.abs(player.x - this.x) + Math.abs(player.y - this.y) <= 1) break;
            }
        } else if (this.type === 'shaman') {
            // Ranged attack if within range 4, else flee if too close, else approach
            if (dist <= 4) {
                if (dist <= 2) {
                    // Flee logic (inverted move towards)
                    let moveX = 0;
                    let moveY = 0;
                    if (dx !== 0) moveX = dx > 0 ? -1 : 1;
                    if (dy !== 0) moveY = dy > 0 ? -1 : 1;
                    this.tryMove(moveX, moveY, map, player, null); // Don't bump attack when fleeing
                } else {
                    // Ranged Attack (Magic)
                    if (onAttack) onAttack('magic');
                }
            } else {
                this.moveTowards(player, map, onAttack);
            }
        } else if (this.type === 'dragon') {
            // Dragon logic: Breath attack if aligned and within range 5
            if ((dx === 0 || dy === 0) && dist <= 5) {
                if (onAttack) onAttack('firebreath');
            } else {
                this.moveTowards(player, map, onAttack);
            }
        } else if (this.type === 'ogre') {
            // Move every other turn? For now just standard chase but high stats
            this.moveTowards(player, map, onAttack);
        } else {
            // Standard chase
            this.moveTowards(player, map, onAttack);
        }
    }

    moveTowards(player, map, onAttack) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;

        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }

        this.tryMove(moveX, moveY, map, player, onAttack);
    }

    tryMove(dx, dy, map, player, onAttack) {
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        if (targetX === player.x && targetY === player.y) {
            if (onAttack) onAttack('melee');
            return;
        }

        // Simple collision check with other enemies could be added here

        this.move(dx, dy, map);
    }
}
