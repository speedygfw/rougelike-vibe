import Entity from './Entity.js';

export class Item extends Entity {
    constructor(x, y, name, char, color) {
        super(x, y, char, color);
        this.name = name;
    }
}

export class Potion extends Item {
    constructor(x, y) {
        super(x, y, 'Health Potion', '!', '#ff00ff');
        this.healAmount = 20;
    }

    use(player) {
        if (player.hp >= player.maxHp) {
            return false; // Don't use if full health
        }
        player.hp = Math.min(player.hp + this.healAmount, player.maxHp);
        return true;
    }
}

export class Scroll extends Item {
    constructor(x, y, name, color, effectType) {
        super(x, y, name, '📜', color);
        this.effectType = effectType;
    }

    use(player, game) {
        // Scrolls might need access to the game state (map, enemies)
        // We'll pass 'game' as a second argument to use() in Game.js
        return this.activate(player, game);
    }

    activate(player, game) {
        return false;
    }
}

export class ScrollOfFireball extends Scroll {
    constructor(x, y) {
        super(x, y, 'Scroll of Fireball', '#ff4400', 'fireball');
        this.damage = 20;
        this.range = 5;
    }

    activate(player, game) {
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
    constructor(x, y) {
        super(x, y, 'Scroll of Teleport', '#00ffff', 'teleport');
    }

    activate(player, game) {
        let tx, ty;
        let tries = 0;
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

export class AmuletOfYendor extends Item {
    constructor(x, y) {
        super(x, y, 'Amulet of Yendor', '📿', '#ffd700');
    }

    use(player, game) {
        // Picking up/Using the Amulet triggers victory
        return true; // Logic handled in Game.js pickup or use
    }
}
