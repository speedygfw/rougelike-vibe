import Entity from './Entity.js';


export default class Player extends Entity {
    constructor(x, y, classType = 'warrior') {
        super(x, y, '@', '#fff');
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
                { name: 'Minor Heal', cost: 15, heal: 20, type: 'heal' }
            ];
        } else if (this.classType === 'rogue') {
            this.maxMana = 20;
            this.mana = 20;
            this.spells = [
                { name: 'Shadow Step', cost: 15, type: 'teleport', range: 4 }
            ];
        }
    }

    gainXp(amount) {
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

    equip(item) {
        if (item.slot === 'weapon') {
            if (this.equipment.weapon) {
                this.inventory.push(this.equipment.weapon); // Unequip old
            }
            this.equipment.weapon = item;
            return true;
        } else if (item.slot === 'armor') {
            if (this.equipment.armor) {
                this.inventory.push(this.equipment.armor);
            }
            this.equipment.armor = item;
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
        return defense;
    }
}
