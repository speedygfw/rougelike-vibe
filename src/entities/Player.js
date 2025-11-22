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

        if (this.classType === 'warrior') {
            this.maxHp += 20;
            this.hp = this.maxHp;
        } else if (this.classType === 'mage') {
            this.maxHp -= 20;
            this.hp = this.maxHp;
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
