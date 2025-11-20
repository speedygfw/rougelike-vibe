import { Item } from './Item.js';

export class Equipment extends Item {
    constructor(x, y, name, char, color, slot, bonus) {
        super(x, y, name, char, color);
        this.slot = slot; // 'weapon' or 'armor'
        this.bonus = bonus; // Attack damage or Defense value
    }

    use(player) {
        return player.equip(this);
    }
}

export class Weapon extends Equipment {
    constructor(x, y, tier = 1) {
        const tiers = [
            { name: 'Rusty Dagger', bonus: 2, color: '#888' },
            { name: 'Iron Sword', bonus: 5, color: '#ddd' },
            { name: 'Steel Axe', bonus: 8, color: '#aaf' },
            { name: 'Mithril Blade', bonus: 12, color: '#0ff' }
        ];
        const data = tiers[Math.min(tier, tiers.length) - 1];
        super(x, y, data.name, '🗡️', data.color, 'weapon', data.bonus);
    }
}

export class Armor extends Equipment {
    constructor(x, y, tier = 1) {
        const tiers = [
            { name: 'Tattered Robe', bonus: 1, color: '#a88' },
            { name: 'Leather Armor', bonus: 3, color: '#a52' },
            { name: 'Chainmail', bonus: 6, color: '#aaa' },
            { name: 'Plate Armor', bonus: 10, color: '#eee' }
        ];
        const data = tiers[Math.min(tier, tiers.length) - 1];
        super(x, y, data.name, '🛡️', data.color, 'armor', data.bonus);
    }
}
