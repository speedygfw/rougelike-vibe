import Entity from './Entity.js';
import { Item } from './Item.js';
import { Weapon, Armor } from './Equipment.js';

export interface Spell {
    name: string;
    cost: number;
    damage?: number;
    heal?: number;
    type: string;
    range?: number;
    duration?: number;
    defense?: number;
    turns?: number;
}

export interface Buff {
    type: string;
    duration: number;
    amount?: number;
}

export default class Player extends Entity {
    classType: string;
    hp: number;
    maxHp: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    inventory: Item[];
    equipment: {
        weapon: Weapon | null;
        armor: Armor | null;
    };
    mana: number;
    maxMana: number;
    spells: Spell[];
    buffs: Buff[];

    type: string;

    constructor(x: number, y: number, classType: string = 'warrior') {
        super(x, y, '🧙‍♂️', '#fff');
        this.type = 'player';
        this.classType = classType;
        this.hp = 100;
        this.maxHp = 100;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null
        };
        this.mana = 0;
        this.maxMana = 0;
        this.spells = [];

        if (this.classType === 'warrior') {
            this.maxHp += 20;
            this.hp = this.maxHp;
        } else if (this.classType === 'mage') {
            this.maxHp -= 20;
            this.hp = this.maxHp;
            this.maxMana = 50;
            this.mana = 50;
            this.spells = [
                { name: 'Magic Missile', cost: 10, damage: 15, type: 'damage', range: 5 },
                { name: 'Minor Heal', cost: 15, heal: 20, type: 'heal' },
                { name: 'Frost Nova', cost: 25, damage: 5, type: 'freeze', range: 3 }
            ];
        } else if (this.classType === 'rogue') {
            this.maxMana = 20;
            this.mana = 20;
            this.spells = [
                { name: 'Shadow Step', cost: 15, type: 'teleport', range: 4 },
                { name: 'Shadow Cloak', cost: 20, duration: 5, type: 'invisibility' }
            ];
        }
        this.buffs = [];
    }

    addBuff(buff: Buff) {
        // Check if buff exists, refresh it
        const existing = this.buffs.find(b => b.type === buff.type);
        if (existing) {
            existing.duration = buff.duration;
            existing.amount = buff.amount; // Update amount if applicable
        } else {
            this.buffs.push(buff);
        }
    }

    updateBuffs() {
        this.buffs.forEach(b => b.duration--);
        this.buffs = this.buffs.filter(b => b.duration > 0);
    }

    hasBuff(type: string) {
        return this.buffs.find(b => b.type === type);
    }

    learnSpell(spell: Spell) {
        if (!this.spells.find(s => s.name === spell.name)) {
            this.spells.push(spell);
            return true;
        }
        return false;
    }

    gainXp(amount: number) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        this.maxHp += 20;
        this.hp = this.maxHp;
        if (this.maxMana > 0) {
            this.maxMana += 10;
            this.mana = this.maxMana;
        }
        // Return true or message to log? Handled by Game for now via check
    }

    equip(item: any): boolean {
        if (item.slot === 'weapon') {
            if (this.equipment.weapon) {
                this.inventory.push(this.equipment.weapon); // Unequip old
            }
            this.equipment.weapon = item as Weapon;
            return true;
        } else if (item.slot === 'armor') {
            if (this.equipment.armor) {
                this.inventory.push(this.equipment.armor);
            }
            this.equipment.armor = item as Armor;
            return true;
        }
        return false;
    }

    getAttack() {
        let damage = 5 + (this.level * 2); // Base damage
        if (this.equipment.weapon) {
            damage += this.equipment.weapon.bonus;
        }
        return damage;
    }

    getDefense() {
        let defense = 0;
        if (this.equipment.armor) {
            defense += this.equipment.armor.bonus;
        }
        const stoneSkin = this.hasBuff('buff'); // 'buff' type used for Stone Skin
        if (stoneSkin) {
            defense += stoneSkin.amount || 0;
        }
        return defense;
    }
}
