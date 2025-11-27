import Entity from './Entity.js';
import Player from './Player.js';
import { MapData } from '../engine/MapGenerator.js';

export default class Enemy extends Entity {
    type: string;
    hp: number;
    faction: string;
    frozen: number;
    xpValue?: number;

    constructor(x: number, y: number, type: string = 'goblin') {
        let char = 'g';
        let color = '#ff4444';
        let hp = 20;
        let faction = 'monster';

        if (type === 'bat') {
            char = 'b';
            color = '#a8a8a8';
            hp = 10;
            faction = 'beast';
        } else if (type === 'rat') {
            char = 'r';
            color = '#8B4513';
            hp = 8;
            faction = 'beast';
        } else if (type === 'spider') {
            char = '🕷️';
            color = '#000000';
            hp = 12;
            faction = 'beast';
        } else if (type === 'kobold') {
            char = 'k';
            color = '#d2691e';
            hp = 15;
            faction = 'monster';
        } else if (type === 'orc') {
            char = 'O';
            color = '#00aa00';
            hp = 40;
            faction = 'monster';
        } else if (type === 'shaman') {
            char = 'S';
            color = '#aa00aa';
            hp = 15;
            faction = 'monster';
        } else if (type === 'skeleton') {
            char = '💀';
            color = '#dddddd';
            hp = 12;
            faction = 'undead';
        } else if (type === 'zombie') {
            char = 'Z';
            color = '#6aa84f';
            hp = 25;
            faction = 'undead';
        } else if (type === 'ghost') {
            char = '👻';
            color = '#e0e0e0';
            hp = 15;
            faction = 'undead';
        } else if (type === 'ogre') {
            char = '👹';
            color = '#006600';
            hp = 60;
            faction = 'monster';
        } else if (type === 'dragon') {
            char = '🌌'; // Galaxy/Void symbol for Dissonance
            color = '#800080'; // Purple
            hp = 150;
            faction = 'dragon';
        }

        super(x, y, char, color);
        this.type = type;
        this.hp = hp;
        this.faction = faction;
        this.frozen = 0;
    }

    getAttack() {
        if (this.type === 'bat') return 2;
        if (this.type === 'rat') return 2;
        if (this.type === 'spider') return 4;
        if (this.type === 'kobold') return 3;
        if (this.type === 'goblin') return 5;
        if (this.type === 'shaman') return 4;
        if (this.type === 'orc') return 8;
        if (this.type === 'skeleton') return 4;
        if (this.type === 'zombie') return 6;
        if (this.type === 'ghost') return 5;
        if (this.type === 'ogre') return 12;
        if (this.type === 'dragon') return 20;
        return 3;
    }

    getDefense() {
        if (this.type === 'bat') return 0;
        if (this.type === 'rat') return 0;
        if (this.type === 'spider') return 1;
        if (this.type === 'kobold') return 1;
        if (this.type === 'goblin') return 1;
        if (this.type === 'shaman') return 1;
        if (this.type === 'orc') return 3;
        if (this.type === 'skeleton') return 1;
        if (this.type === 'zombie') return 2;
        if (this.type === 'ghost') return 5; // High defense (ethereal)
        if (this.type === 'ogre') return 4;
        if (this.type === 'dragon') return 8;
        return 0;
    }

    isHostile(otherFaction: string) {
        if (this.faction === otherFaction) return false;
        return true;
    }

    takeTurn(player: Player, map: MapData, enemies: Enemy[], onAttack: (type: string, target: Entity) => void) {
        if (this.frozen > 0) {
            this.frozen--;
            return; // Skip turn
        }

        const target = this.findTarget(player, enemies);
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.abs(dx) + Math.abs(dy);

        if (this.type === 'bat') {
            // Bat moves twice or randomly
            for (let i = 0; i < 2; i++) {
                if (Math.random() < 0.3) {
                    const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    const move = moves[Math.floor(Math.random() * moves.length)];
                    this.tryMove(move[0], move[1], map, target, onAttack);
                } else {
                    this.moveTowards(target, map, onAttack);
                }
                // Stop if adjacent to target to attack once
                if (Math.abs(target.x - this.x) + Math.abs(target.y - this.y) <= 1) break;
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
                    this.tryMove(moveX, moveY, map, target, null); // Don't bump attack when fleeing
                } else {
                    // Ranged Attack (Magic)
                    if (onAttack) onAttack('magic', target);
                }
            } else {
                this.moveTowards(target, map, onAttack);
            }
        } else if (this.type === 'dragon') {
            // Dragon logic: Breath attack if aligned and within range 5
            if ((dx === 0 || dy === 0) && dist <= 5) {
                if (onAttack) onAttack('firebreath', target);
            } else {
                this.moveTowards(target, map, onAttack);
            }
        } else if (this.type === 'ogre') {
            // Move every other turn? For now just standard chase but high stats
            this.moveTowards(target, map, onAttack);
        } else {
            // Standard chase
            this.moveTowards(target, map, onAttack);
        }
    }

    findTarget(player: Player, enemies: Enemy[]) {
        let targets: Entity[] = [];

        // Player is always a potential target (assume player faction is 'player')
        // Check if player is invisible
        const playerInvisible = player.hasBuff && player.hasBuff('invisibility');
        if (this.isHostile('player') && !playerInvisible) {
            targets.push(player);
        }

        // Check other enemies
        if (enemies) {
            enemies.forEach(e => {
                if (e !== this && e.hp > 0 && this.isHostile(e.faction)) {
                    targets.push(e);
                }
            });
        }

        if (targets.length === 0) return null;

        // Find nearest
        let nearest: Entity | null = null;
        let minDist = Infinity;

        targets.forEach(t => {
            const dist = Math.abs(t.x - this.x) + Math.abs(t.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = t;
            }
        });

        return nearest;
    }

    moveTowards(target: Entity, map: MapData, onAttack: ((type: string, target: Entity) => void) | null) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;

        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }

        this.tryMove(moveX, moveY, map, target, onAttack);
    }

    tryMove(dx: number, dy: number, map: MapData, target: Entity, onAttack: ((type: string, target: Entity) => void) | null) {
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        if (targetX === target.x && targetY === target.y) {
            if (onAttack) onAttack('melee', target);
            return;
        }

        // Simple collision check with other enemies could be added here
        // For now, if blocked by another enemy, just stay put or attack if hostile?
        // The Game.js loop handles player collision, but for enemy-enemy collision we need to check the map or entity list.
        // Since we don't have easy access to entity list here for collision checking without passing it in, 
        // we might overlap. But let's assume Game.js handles movement validation or we just overlap for now (soft collision).
        // Better: Check if tile is occupied by another enemy.

        this.move(dx, dy, map);
    }
}
