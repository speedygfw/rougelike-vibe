export default class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    resolveAttack(attacker, defender) {
        // Simple hit chance
        if (Math.random() > 0.8) {
            return {
                hit: false,
                damage: 0,
                killed: false,
                attacker: attacker,
                defender: defender
            };
        }

        const attack = attacker.getAttack();
        const defense = defender.getDefense ? defender.getDefense() : 0;
        const damage = Math.max(1, attack - defense);

        defender.hp -= damage;

        const result = {
            hit: true,
            damage: damage,
            killed: defender.hp <= 0,
            attacker: attacker,
            defender: defender
        };

        return result;
    }
}
