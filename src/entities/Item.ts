import Entity from './Entity.js';
import Player from './Player.js';
import Game from '../engine/Game.js';

export class Item extends Entity {
    name: string;

    constructor(x: number, y: number, name: string, char: string, color: string) {
        super(x, y, char, color);
        this.name = name;
    }

    use(player: Player, game: Game): boolean {
        return false;
    }
}

export class Potion extends Item {
    healAmount: number;

    constructor(x: number, y: number) {
        super(x, y, 'Health Potion', '!', '#ff00ff');
        this.healAmount = 20;
    }

    use(player: Player, game: Game): boolean {
        if (player.hp >= player.maxHp) {
            return false; // Don't use if full health
        }
        player.hp = Math.min(player.hp + this.healAmount, player.maxHp);
        return true;
    }
}

export class Scroll extends Item {
    effectType: string;

    constructor(x: number, y: number, name: string, color: string, effectType: string) {
        super(x, y, name, '📜', color);
        this.effectType = effectType;
    }

    use(player: Player, game: Game): boolean {
        // Scrolls might need access to the game state (map, enemies)
        // We'll pass 'game' as a second argument to use() in Game.js
        return this.activate(player, game);
    }

    activate(player: Player, game: Game): boolean {
        return false;
    }
}

export class ScrollOfFireball extends Scroll {
    damage: number;
    range: number;

    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Fireball', '#ff4400', 'fireball');
        this.damage = 20;
        this.range = 5;
    }

    activate(player: Player, game: Game): boolean {
        // Simple implementation: Damage all enemies in range
        let hitCount = 0;
        game.enemies.forEach(enemy => {
            const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
            if (dist <= this.range) {
                enemy.hp -= this.damage;
                game.log(`Fireball burns ${enemy.type} for ${this.damage} dmg!`, 'combat');
                game.renderer.triggerEffect(enemy.x, enemy.y, 'hit');
                hitCount++;
            }
        });

        if (hitCount > 0) {
            // Cleanup dead enemies
            game.enemies = game.enemies.filter(e => {
                if (e.hp <= 0) {
                    game.log(`${e.type} is incinerated! +${e.xpValue || 10} XP`, 'success');
                    player.gainXp(e.xpValue || 10);
                    return false;
                }
                return true;
            });
            return true;
        } else {
            game.log("No enemies in range to burn.", 'warning');
            return false;
        }
    }
}

export class ScrollOfTeleport extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Teleport', '#00ffff', 'teleport');
    }

    activate(player: Player, game: Game): boolean {
        let tx, ty;
        let tries = 0;
        if (!game.map) return false;
        do {
            tx = Math.floor(Math.random() * game.map.width);
            ty = Math.floor(Math.random() * game.map.height);
            tries++;
        } while ((game.map.tiles[ty][tx] === 'wall' || (tx === player.x && ty === player.y)) && tries < 100);

        if (game.map.tiles[ty][tx] !== 'wall') {
            player.x = tx;
            player.y = ty;
            game.log("You teleport to a new location!", 'magic');
            game.updateFOV();
            return true;
        }
        return false;
    }
}

export class ScrollOfFrostNova extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Frost Nova', '#00ccff', 'freeze');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Frost Nova', cost: 25, damage: 5, type: 'freeze', range: 3 })) {
            game.log("You learned Frost Nova!", 'success');
            return true;
        }
        game.log("You already know Frost Nova.", 'warning');
        return false;
    }
}

export class ScrollOfChainLightning extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Chain Lightning', '#ffff00', 'chain_lightning');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Chain Lightning', cost: 30, damage: 20, type: 'chain_lightning', range: 6 })) {
            game.log("You learned Chain Lightning!", 'success');
            return true;
        }
        game.log("You already know Chain Lightning.", 'warning');
        return false;
    }
}

export class ScrollOfDrainLife extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Drain Life', '#880088', 'drain');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Drain Life', cost: 20, damage: 15, type: 'drain', range: 4 })) {
            game.log("You learned Drain Life!", 'success');
            return true;
        }
        game.log("You already know Drain Life.", 'warning');
        return false;
    }
}

export class ScrollOfStoneSkin extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Stone Skin', '#888888', 'buff');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Stone Skin', cost: 20, duration: 10, defense: 5, type: 'buff' })) {
            game.log("You learned Stone Skin!", 'success');
            return true;
        }
        game.log("You already know Stone Skin.", 'warning');
        return false;
    }
}

export class ScrollOfShadowCloak extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Shadow Cloak', '#333333', 'invisibility');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Shadow Cloak', cost: 20, duration: 5, type: 'invisibility' })) {
            game.log("You learned Shadow Cloak!", 'success');
            return true;
        }
        game.log("You already know Shadow Cloak.", 'warning');
        return false;
    }
}

export class ScrollOfTimeWarp extends Scroll {
    constructor(x: number, y: number) {
        super(x, y, 'Scroll of Time Warp', '#ff00ff', 'time_warp');
    }
    activate(player: Player, game: Game): boolean {
        if (player.learnSpell({ name: 'Time Warp', cost: 50, turns: 3, type: 'time_warp' })) {
            game.log("You learned Time Warp!", 'success');
            return true;
        }
        game.log("You already know Time Warp.", 'warning');
        return false;
    }
}

export class HarmonicCore extends Item {
    constructor(x: number, y: number) {
        super(x, y, 'Harmonic Core', '💠', '#00ffff');
    }

    use(player: Player, game: Game): boolean {
        // Picking up/Using the Core triggers victory
        return true; // Logic handled in Game.js pickup or use
    }
}

export class Key extends Item {
    constructor(x: number, y: number) {
        super(x, y, 'Golden Key', '🔑', '#ffd700');
    }

    use(player: Player, game: Game): boolean {
        game.log("This key can open locked doors.", 'info');
        return false; // Not usable directly, used on interaction
    }
}
