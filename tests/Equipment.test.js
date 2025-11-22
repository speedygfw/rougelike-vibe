import { describe, it, expect, vi } from 'vitest';
import { Weapon, Armor } from '../src/entities/Equipment';

describe('Equipment', () => {
    describe('Weapon', () => {
        it('should create a weapon with correct stats for tier 1', () => {
            const weapon = new Weapon(0, 0, 1);
            expect(weapon.name).toBe('Rusty Dagger');
            expect(weapon.bonus).toBe(2);
            expect(weapon.slot).toBe('weapon');
        });

        it('should create a weapon with correct stats for tier 4', () => {
            const weapon = new Weapon(0, 0, 4);
            expect(weapon.name).toBe('Mithril Blade');
            expect(weapon.bonus).toBe(12);
        });

        it('should cap tier at max available', () => {
            const weapon = new Weapon(0, 0, 10);
            expect(weapon.name).toBe('Mithril Blade');
        });
    });

    describe('Armor', () => {
        it('should create armor with correct stats for tier 1', () => {
            const armor = new Armor(0, 0, 1);
            expect(armor.name).toBe('Tattered Robe');
            expect(armor.bonus).toBe(1);
            expect(armor.slot).toBe('armor');
        });

        it('should create armor with correct stats for tier 4', () => {
            const armor = new Armor(0, 0, 4);
            expect(armor.name).toBe('Plate Armor');
            expect(armor.bonus).toBe(10);
        });
    });

    describe('Usage', () => {
        it('should equip to player', () => {
            const weapon = new Weapon(0, 0, 1);
            const player = {
                equip: vi.fn().mockReturnValue(true)
            };

            const result = weapon.use(player);
            expect(result).toBe(true);
            expect(player.equip).toHaveBeenCalledWith(weapon);
        });
    });
});
