import Renderer from './Renderer.js';
import MapGenerator from './MapGenerator.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import NPC from '../entities/NPC.js';
import {
    Potion,
    ScrollOfFireball,
    ScrollOfTeleport,
    ScrollOfFrostNova,
    ScrollOfChainLightning,
    ScrollOfDrainLife,
    ScrollOfStoneSkin,
    ScrollOfShadowCloak,
    ScrollOfTimeWarp,
    HarmonicCore,
    Key
} from '../entities/Item.js';
import { Weapon, Armor } from '../entities/Equipment.js';
import FOV from './FOV.js';
import Audio from './Audio.js';
import InputHandler from './InputHandler.js';
import CombatSystem from './CombatSystem.js';

export default class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.audio = new Audio();
        this.inputHandler = new InputHandler();
        this.combatSystem = new CombatSystem(this);
        this.mapGenerator = new MapGenerator(50, 30);
        this.createSaveControls();
        this.map = null;
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.npcs = [];
        this.isPlayerTurn = true;
        this.extraTurns = 0;
        this.turnCount = 0;
        this.visibleTiles = new Set();
        this.exploredTiles = new Set();
        this.fovRadius = 8;
        this.gameState = 'PLAYING';
    }

    createSaveControls() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '100';

        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save';
        saveBtn.onclick = () => this.saveGame();

        const loadBtn = document.createElement('button');
        loadBtn.innerText = 'Load';
        loadBtn.onclick = () => this.loadGame();

        container.appendChild(saveBtn);
        container.appendChild(loadBtn);
        document.body.appendChild(container);
    }

    saveGame() {
        const data = {
            map: this.map,
            player: {
                x: this.player.x,
                y: this.player.y,
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                level: this.player.level,
                xp: this.player.xp,
                xpToNextLevel: this.player.xpToNextLevel,
                inventory: this.player.inventory,
                equipment: this.player.equipment
            },
            enemies: this.enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, type: e.type })),
            items: this.items,
            level: this.player.level,
            exploredTiles: Array.from(this.exploredTiles)
        };
        localStorage.setItem('roguelike_save', JSON.stringify(data));
        this.log("Game Saved!", 'success');
    }

    loadGame() {
        const json = localStorage.getItem('roguelike_save');
        if (!json) {
            this.log("No save game found.", 'warning');
            return;
        }

        const data = JSON.parse(json);

        // Restore Map
        this.map = data.map;
        this.mapGenerator.width = this.map.width;
        this.mapGenerator.height = this.map.height;

        // Restore Player
        this.player = new Player(data.player.x, data.player.y);
        Object.assign(this.player, data.player);
        this.player.inventory = data.player.inventory.map(i => this.hydrateItem(i));
        if (this.player.equipment.weapon) this.player.equipment.weapon = this.hydrateItem(this.player.equipment.weapon);
        if (this.player.equipment.armor) this.player.equipment.armor = this.hydrateItem(this.player.equipment.armor);

        // Restore Enemies
        this.enemies = data.enemies.map(e => {
            const enemy = new Enemy(e.x, e.y, e.type);
            enemy.hp = e.hp;
            return enemy;
        });

        // Restore Items
        this.items = data.items.map(i => this.hydrateItem(i));

        // Restore FOV
        this.exploredTiles = new Set(data.exploredTiles);
        this.fov = new FOV(this.map);
        this.updateFOV();

        this.log("Game Loaded!", 'success');
        this.update();
    }

    hydrateItem(data) {
        if (!data) return null;
        if (data.slot) {
            if (data.slot === 'weapon') return new Weapon(data.x, data.y, data.bonus < 5 ? 1 : (data.bonus < 8 ? 2 : 3));
            if (data.slot === 'armor') return new Armor(data.x, data.y, data.bonus < 3 ? 1 : (data.bonus < 6 ? 2 : 3));
        }
        if (data.name.includes('Potion')) return new Potion(data.x, data.y);
        if (data.name.includes('Fireball')) return new ScrollOfFireball(data.x, data.y);
        if (data.name.includes('Teleport')) return new ScrollOfTeleport(data.x, data.y);
        if (data.name.includes('Frost Nova')) return new ScrollOfFrostNova(data.x, data.y);
        if (data.name.includes('Chain Lightning')) return new ScrollOfChainLightning(data.x, data.y);
        if (data.name.includes('Drain Life')) return new ScrollOfDrainLife(data.x, data.y);
        if (data.name.includes('Stone Skin')) return new ScrollOfStoneSkin(data.x, data.y);
        if (data.name.includes('Shadow Cloak')) return new ScrollOfShadowCloak(data.x, data.y);
        if (data.name.includes('Time Warp')) return new ScrollOfTimeWarp(data.x, data.y);
        this.update();
        this.loop();
    }

    init() {
        try {
            console.log("Game.init() called");
            const selectionDiv = document.getElementById('class-selection');
            const cards = document.querySelectorAll('.class-card');
            console.log("Found selectionDiv:", selectionDiv);
            console.log("Found cards:", cards.length);

            // Add Keyboard Listener
            window.addEventListener('keydown', (e) => this.handleInput(e));
            console.log("Event listener attached");

            // Event Delegation for Class Selection
            if (selectionDiv) {
                selectionDiv.onclick = (e) => {
                    const card = e.target.closest('.class-card');
                    if (card) {
                        try {
                            console.log("Card clicked:", card.getAttribute('data-class'));
                            const classType = card.getAttribute('data-class');
                            selectionDiv.style.display = 'none';
                            this.startGame(classType);
                        } catch (err) {
                            console.error("Error handling card click:", err);
                            alert("Error starting game: " + err.message);
                        }
                    }
                };
            } else {
                console.error("Critical Error: class-selection element not found!");
            }

            // Restart Buttons
            const btnGo = document.getElementById('restart-btn-go');
            const btnVic = document.getElementById('restart-btn-vic');
            if (btnGo) btnGo.onclick = () => this.restart();
            if (btnVic) btnVic.onclick = () => this.restart();

        } catch (e) {
            console.error("Error in Game.init:", e);
        }
    }

    startGame(classType) {
        try {
            console.log("Starting game with class:", classType);
            this.playerClass = classType;
            this.generateLevel();
            this.update();
            this.loop();
        } catch (e) {
            console.error("Error in startGame:", e);
            alert("Critical Game Error: " + e.message);
        }
    }

    generateLevel() {
        // Generate Map
        this.map = this.mapGenerator.generate();
        this.fov = new FOV(this.map);
        this.exploredTiles.clear();

        // Spawn Player in the first room
        if (this.map.rooms && this.map.rooms.length > 0) {
            const firstRoom = this.map.rooms[0];
            const center = this.mapGenerator.getCenter(firstRoom);

            if (!this.player) {
                this.player = new Player(center.x, center.y, this.playerClass);
            } else {
                this.player.x = center.x;
                this.player.y = center.y;
            }

            // Spawn Enemies and Items in other rooms
            this.enemies = [];
            this.items = [];
            this.npcs = [];

            if (this.player.level === 10) {
                // Boss Level
                const center = this.mapGenerator.getCenter(this.map.rooms[this.map.rooms.length - 1]);
                this.enemies.push(new Enemy(center.x, center.y, 'dragon')); // The Dissonance

                // Place Harmonic Core
                const amuletPos = this.mapGenerator.getCenter(this.map.rooms[Math.floor(this.map.rooms.length / 2)]);
                this.items.push(new HarmonicCore(amuletPos.x, amuletPos.y));

                this.log('You feel a distortion in time... The Dissonance awaits!', 'important');
            } else {
                for (let i = 1; i < this.map.rooms.length; i++) {
                    const room = this.map.rooms[i];
                    const center = this.mapGenerator.getCenter(room);

                    // Chance to spawn enemy
                    if (Math.random() < 0.7) {
                        const roll = Math.random();
                        let type = 'goblin';

                        // Weighted spawn pool
                        if (roll < 0.10) type = 'rat';
                        else if (roll < 0.20) type = 'bat';
                        else if (roll < 0.30) type = 'spider';
                        else if (roll < 0.45) type = 'kobold';
                        else if (roll < 0.60) type = 'goblin';
                        else if (roll < 0.70) type = 'skeleton';
                        else if (roll < 0.80) type = 'zombie';
                        else if (roll < 0.88) type = 'orc';
                        else if (roll < 0.94) type = 'shaman';
                        else if (roll < 0.98) type = 'ghost';
                        else type = 'ogre';

                        this.enemies.push(new Enemy(center.x, center.y, type));
                    }

                    // Chance to spawn item
                    if (Math.random() < 0.6) {
                        const ix = Math.floor(Math.random() * room.w) + room.x;
                        const iy = Math.floor(Math.random() * room.h) + room.y;
                        if (this.map.tiles[iy][ix] === 'floor') {
                            const roll = Math.random();
                            if (roll < 0.4) {
                                this.items.push(new Potion(ix, iy));
                            } else if (roll < 0.5) {
                                this.items.push(new ScrollOfFireball(ix, iy));
                            } else if (roll < 0.6) {
                                this.items.push(new ScrollOfTeleport(ix, iy));
                            } else if (roll < 0.45) this.items.push(new ScrollOfFrostNova(ix, iy));
                            else if (roll < 0.55) this.items.push(new ScrollOfChainLightning(ix, iy));
                            else if (roll < 0.65) this.items.push(new ScrollOfDrainLife(ix, iy));
                            else if (roll < 0.75) this.items.push(new ScrollOfStoneSkin(ix, iy));
                            else if (roll < 0.85) this.items.push(new ScrollOfShadowCloak(ix, iy));
                            else this.items.push(new ScrollOfTimeWarp(ix, iy));
                        }
                    }

                    // Chance to spawn Key
                    if (Math.random() < 0.4) {
                        const kx = Math.floor(Math.random() * room.w) + room.x;
                        const ky = Math.floor(Math.random() * room.h) + room.y;
                        if (this.map.tiles[ky][kx] === 'floor') {
                            this.items.push(new Key(kx, ky));
                        }
                    }

                    // Chance to spawn NPC
                    if (Math.random() < 0.15) {
                        const nx = Math.floor(Math.random() * room.w) + room.x;
                        const ny = Math.floor(Math.random() * room.h) + room.y;
                        if (this.map.tiles[ny][nx] === 'floor') {
                            const names = ["Old Man", "Lost Adventurer", "Mysterious Merchant", "Ghostly Guide"];
                            const dialogues = [
                                "The time fracture is growing...",
                                "The Dissonance feeds on our memories.",
                                "Seek the Harmonic Core to restore balance.",
                                "Beware the shadows of the past...",
                                "Aethelgard was once beautiful..."
                            ];
                            const name = names[Math.floor(Math.random() * names.length)];
                            this.npcs.push(new NPC(nx, ny, name, dialogues));
                        }
                    }
                }

                while (this.enemies.length < 3) {
                    let ex, ey;
                    do {
                        ex = Math.floor(Math.random() * this.map.width);
                        ey = Math.floor(Math.random() * this.map.height);
                    } while (this.map.tiles[ey][ex] === 'wall');
                    this.enemies.push(new Enemy(ex, ey));
                }
            }

        } else {
            // Cave Level Spawning
            let px, py;
            do {
                px = Math.floor(Math.random() * this.map.width);
                py = Math.floor(Math.random() * this.map.height);
            } while (this.map.tiles[py][px] === 'wall');

            if (!this.player) {
                this.player = new Player(px, py, this.playerClass);
            } else {
                this.player.x = px;
                this.player.y = py;
            }
            this.enemies = [];
            this.items = [];
            this.npcs = [];

            // Spawn Enemies
            for (let i = 0; i < 6; i++) {
                let ex, ey;
                do {
                    ex = Math.floor(Math.random() * this.map.width);
                    ey = Math.floor(Math.random() * this.map.height);
                } while (this.map.tiles[ey][ex] === 'wall' || (ex === px && ey === py));

                const roll = Math.random();
                let type = 'goblin';

                if (roll < 0.10) type = 'rat';
                else if (roll < 0.20) type = 'bat';
                else if (roll < 0.30) type = 'spider';
                else if (roll < 0.45) type = 'kobold';
                else if (roll < 0.60) type = 'goblin';
                else if (roll < 0.70) type = 'skeleton';
                else if (roll < 0.80) type = 'zombie';
                else if (roll < 0.88) type = 'orc';
                else if (roll < 0.94) type = 'shaman';
                else if (roll < 0.98) type = 'ghost';
                else type = 'ogre';

                this.enemies.push(new Enemy(ex, ey, type));
            }

            // Spawn Items
            for (let i = 0; i < 4; i++) {
                let ix, iy;
                do {
                    ix = Math.floor(Math.random() * this.map.width);
                    iy = Math.floor(Math.random() * this.map.height);
                } while (this.map.tiles[iy][ix] === 'wall');

                const roll = Math.random();
                if (roll < 0.4) {
                    this.items.push(new Potion(ix, iy));
                } else if (roll < 0.5) {
                    this.items.push(new ScrollOfFireball(ix, iy));
                } else if (roll < 0.6) {
                    this.items.push(new ScrollOfTeleport(ix, iy));
                } else if (roll < 0.8) {
                    const tier = Math.min(4, Math.floor(this.player.level / 2) + 1);
                    this.items.push(new Weapon(ix, iy, tier));
                } else {
                    const tier = Math.min(4, Math.floor(this.player.level / 2) + 1);
                    this.items.push(new Armor(ix, iy, tier));
                }
            }
        }

        this.updateFOV();
        this.log(`Entered Level ${this.player.level}`, 'important');
    }

    updateFOV() {
        this.visibleTiles = this.fov.compute(this.player.x, this.player.y, this.fovRadius);
        this.visibleTiles.forEach(key => {
            this.exploredTiles.add(key);
        });
    }

    handleInput(e) {
        if (this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') {
            if (e.key === 'Enter' || e.key === 'r') {
                this.restart();
            }
            return;
        }

        if (!this.isPlayerTurn) return;

        const command = this.inputHandler.handleKey(e);
        if (!command) return;

        if (command.type === 'move') {
            const targetX = this.player.x + command.dx;
            const targetY = this.player.y + command.dy;

            // Check for enemy
            const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
            if (enemy) {
                this.attackEnemy(enemy);
                this.isPlayerTurn = false;
                this.update();
                setTimeout(() => this.enemyTurn(), 100);
            } else {
                // Check for NPC
                const npc = this.npcs.find(n => n.x === targetX && n.y === targetY);
                if (npc) {
                    const message = npc.interact();
                    this.log(`${npc.name}: "${message}"`, 'info');
                    this.update();
                    return;
                }

                const tile = this.map.tiles[targetY][targetX];
                if (tile === 'door_closed') {
                    const keyIndex = this.player.inventory.findIndex(i => i.name === 'Golden Key');
                    if (keyIndex !== -1) {
                        this.log("You unlock the door with your key.", 'success');
                        this.map.tiles[targetY][targetX] = 'door_open';
                        this.player.inventory.splice(keyIndex, 1);
                        this.updateUI();
                        this.audio.playPickup(); // Reuse sound for now
                        this.isPlayerTurn = false;
                        this.update();
                        setTimeout(() => this.enemyTurn(), 100);
                    } else {
                        this.log("The door is locked. You need a key.", 'warning');
                    }
                } else {
                    const moved = this.player.move(command.dx, command.dy, this.map);
                    if (moved) {
                        this.audio.playFootstep();
                        this.updateFOV();

                        if (this.extraTurns > 0) {
                            this.extraTurns--;
                            this.log(`Extra turn! (${this.extraTurns} remaining)`, 'magic');
                            this.update();
                        } else {
                            this.isPlayerTurn = false;
                            this.update();
                            setTimeout(() => this.enemyTurn(), 100);
                        }
                    }
                }
            }
        } else if (command.type === 'interact') {
            this.checkStairs();
        } else if (command.type === 'pickup') {
            this.pickupItem();
        } else if (command.type === 'inventory') {
            this.toggleInventory();
        } else if (command.type === 'restart') {
            // Handle restart if needed
        }

        // Spell Casting (Keys 1-9)
        if (e.key >= '1' && e.key <= '9') {
            const spellIndex = parseInt(e.key) - 1;
            if (spellIndex < this.player.spells.length) {
                this.castSpell(spellIndex);
            }
        }
    }

    castSpell(index) {
        const spell = this.player.spells[index];
        if (this.player.mana < spell.cost) {
            this.log(`Not enough mana for ${spell.name}!`, 'warning');
            return;
        }

        let cast = false;
        let targets = [];

        // Helper to find targets
        const getEnemiesInRange = (range) => {
            return this.enemies.filter(e => {
                const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
                return dist <= range;
            });
        };

        const getNearestEnemy = (range) => {
            let target = null;
            let minDist = range + 1;
            this.enemies.forEach(e => {
                const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
                if (dist <= range && dist < minDist) {
                    minDist = dist;
                    target = e;
                }
            });
            return target;
        };

        if (spell.type === 'heal') {
            if (this.player.hp < this.player.maxHp) {
                this.player.hp = Math.min(this.player.hp + spell.heal, this.player.maxHp);
                this.log(`You cast ${spell.name} and heal for ${spell.heal} HP.`, 'magic');
                this.renderer.triggerEffect(this.player.x, this.player.y, 'heal');
                cast = true;
            } else {
                this.log("You are already at full health.", 'warning');
            }
        } else if (spell.type === 'damage') {
            const target = getNearestEnemy(spell.range);
            if (target) {
                target.hp -= spell.damage;
                this.log(`You cast ${spell.name} at ${target.char} for ${spell.damage} dmg!`, 'magic');
                this.renderer.triggerEffect(target.x, target.y, 'hit');
                if (target.hp <= 0) targets.push(target); // Mark for cleanup
                cast = true;
            } else {
                this.log("No enemy in range.", 'warning');
            }
        } else if (spell.type === 'freeze') {
            const enemies = getEnemiesInRange(spell.range);
            if (enemies.length > 0) {
                enemies.forEach(e => {
                    e.frozen = 3;
                    this.log(`${e.type} is frozen!`, 'magic');
                    this.renderer.triggerEffect(e.x, e.y, 'freeze'); // Need freeze effect or generic magic
                });
                cast = true;
            } else {
                this.log("No enemies in range to freeze.", 'warning');
            }
        } else if (spell.type === 'chain_lightning') {
            let currentTarget = getNearestEnemy(spell.range);
            if (currentTarget) {
                let bounces = 3;
                let damage = spell.damage;
                let hitEnemies = new Set();

                while (bounces > 0 && currentTarget) {
                    currentTarget.hp -= damage;
                    this.log(`Lightning hits ${currentTarget.type} for ${damage} dmg!`, 'magic');
                    this.renderer.triggerEffect(currentTarget.x, currentTarget.y, 'hit');
                    hitEnemies.add(currentTarget);
                    if (currentTarget.hp <= 0) targets.push(currentTarget);

                    bounces--;
                    damage = Math.floor(damage * 0.7);

                    // Find next nearest to currentTarget
                    let nextTarget = null;
                    let minD = spell.range + 1;
                    this.enemies.forEach(e => {
                        if (!hitEnemies.has(e) && e !== currentTarget && e.hp > 0) {
                            const d = Math.abs(e.x - currentTarget.x) + Math.abs(e.y - currentTarget.y);
                            if (d <= 4 && d < minD) { // Bounce range 4
                                minD = d;
                                nextTarget = e;
                            }
                        }
                    });
                    currentTarget = nextTarget;
                }
                cast = true;
            } else {
                this.log("No enemy in range.", 'warning');
            }
        } else if (spell.type === 'drain') {
            const target = getNearestEnemy(spell.range);
            if (target) {
                target.hp -= spell.damage;
                const heal = Math.floor(spell.damage / 2);
                this.player.hp = Math.min(this.player.hp + heal, this.player.maxHp);
                this.log(`Drained ${spell.damage} HP from ${target.type}, healed ${heal}!`, 'magic');
                this.renderer.triggerEffect(target.x, target.y, 'hit');
                if (target.hp <= 0) targets.push(target);
                cast = true;
            } else {
                this.log("No enemy in range.", 'warning');
            }
        } else if (spell.type === 'buff' || spell.type === 'invisibility') {
            this.player.addBuff({ type: spell.type, duration: spell.duration, amount: spell.defense });
            this.log(`You cast ${spell.name}!`, 'magic');
            cast = true;
        } else if (spell.type === 'time_warp') {
            this.extraTurns += spell.turns;
            this.log(`Time warps! You gain ${spell.turns} extra turns.`, 'magic');
            cast = true;
        } else if (spell.type === 'teleport') {
            let tx, ty;
            let tries = 0;
            do {
                tx = Math.floor(Math.random() * this.map.width);
                ty = Math.floor(Math.random() * this.map.height);
                tries++;
            } while ((this.map.tiles[ty][tx] === 'wall' || (tx === this.player.x && ty === this.player.y)) && tries < 100);

            if (this.map.tiles[ty][tx] !== 'wall') {
                this.player.x = tx;
                this.player.y = ty;
                this.log("You vanish into the shadows!", 'magic');
                this.updateFOV();
                cast = true;
            }
        }

        // Cleanup dead enemies
        if (targets.length > 0) {
            targets.forEach(t => {
                if (this.enemies.includes(t)) { // Check if still in list (duplicates from chain lightning)
                    this.log(`${t.type} is destroyed! +${t.xpValue || 10} XP`, 'success');
                    this.player.gainXp(t.xpValue || 10);
                }
            });
            this.enemies = this.enemies.filter(e => e.hp > 0);
        }

        if (cast) {
            this.player.mana -= spell.cost;
            this.updateUI();

            if (this.extraTurns > 0) {
                this.extraTurns--;
                this.log(`Extra turn! (${this.extraTurns} remaining)`, 'magic');
                // Do not end turn
            } else {
                this.isPlayerTurn = false;
                this.update();
                setTimeout(() => this.enemyTurn(), 100);
            }
        }
    }

    pickupItem() {
        console.log(`Attempting pickup at ${this.player.x}, ${this.player.y}`);
        console.log(`Items available:`, this.items.map(i => `${i.name} at ${i.x},${i.y}`));
        const itemIndex = this.items.findIndex(i => i.x === this.player.x && i.y === this.player.y);
        if (itemIndex !== -1) {
            const item = this.items[itemIndex];
            this.player.inventory.push(item);
            this.items.splice(itemIndex, 1);
            this.log(`Picked up ${item.name}`, 'pickup');
            this.audio.playPickup();
            this.updateUI();
        } else {
            this.log("Nothing to pick up here.", 'warning');
        }
    }

    toggleInventory() {
        const invEl = document.getElementById('inventory');
        if (invEl.style.display === 'none' || !invEl.style.display) {
            invEl.style.display = 'block';
            this.renderInventory();
        } else {
            invEl.style.display = 'none';
        }
    }

    renderInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        if (this.player.inventory.length === 0) {
            list.innerHTML = '<li>Empty</li>';
            return;
        }

        this.player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerText = `${index + 1}. ${item.name}`;
            li.onclick = () => this.useItem(index);
            list.appendChild(li);
        });
    }

    useItem(index) {
        const item = this.player.inventory[index];

        if (item instanceof HarmonicCore) {
            this.gameState = 'VICTORY';
            document.getElementById('victory-screen').style.display = 'flex';
            this.audio.playLevelUp();
            return;
        }

        if (item) {
            let used = false;
            if (item.use(this.player, this)) {
                used = true;
            }

            if (used) {
                this.log(`Used/Equipped ${item.name}`, 'action');
                this.player.inventory.splice(index, 1);
                this.renderInventory();
                this.updateUI();
                this.isPlayerTurn = false;
                setTimeout(() => this.enemyTurn(), 100);
            } else {
                this.log(`Cannot use ${item.name} right now.`, 'warning');
            }
        }
    }

    checkStairs() {
        if (this.map.tiles[this.player.y][this.player.x] === 'stairs') {
            this.player.level++;
            this.generateLevel();
            this.update();
        } else {
            this.log("There are no stairs here.", 'warning');
        }
    }

    enemyTurn() {
        if (this.extraTurns > 0) {
            this.isPlayerTurn = true;
            return;
        }

        this.player.updateBuffs();

        this.enemies.forEach(enemy => {
            enemy.takeTurn(this.player, this.map, this.enemies, (attackType, target) => {
                if (target === this.player) {
                    if (attackType === 'magic') {
                        const damage = 10; // Magic damage
                        this.log(`${enemy.char} casts a spell on you for ${damage} dmg!`, 'danger');
                        this.player.hp -= damage;
                        this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                    } else if (attackType === 'firebreath') {
                        const damage = 25;
                        this.log(`${enemy.char} breathes FIRE on you for ${damage} dmg!`, 'danger');
                        this.player.hp -= damage;
                        this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                    } else {
                        const result = this.combatSystem.resolveAttack(enemy, this.player);
                        if (result.hit) {
                            this.log(`${enemy.char} hits you for ${result.damage} dmg!`, 'danger');
                            this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                        } else {
                            this.log(`${enemy.char} misses you!`, 'info');
                            this.audio.playMiss();
                        }
                    }
                } else {
                    // Enemy vs Enemy
                    if (attackType === 'magic') {
                        const damage = 10;
                        target.hp -= damage;
                        if (this.visibleTiles.has(`${target.x},${target.y}`)) {
                            this.log(`${enemy.char} blasts ${target.char} for ${damage} dmg!`, 'warning');
                            this.renderer.triggerEffect(target.x, target.y, 'hit');
                        }
                    } else if (attackType === 'firebreath') {
                        const damage = 25;
                        target.hp -= damage;
                        if (this.visibleTiles.has(`${target.x},${target.y}`)) {
                            this.log(`${enemy.char} burns ${target.char} for ${damage} dmg!`, 'warning');
                            this.renderer.triggerEffect(target.x, target.y, 'hit');
                        }
                    } else {
                        const result = this.combatSystem.resolveAttack(enemy, target);
                        if (this.visibleTiles.has(`${target.x},${target.y}`)) {
                            if (result.hit) {
                                this.log(`${enemy.char} hits ${target.char} for ${result.damage} dmg!`, 'warning');
                                this.renderer.triggerEffect(target.x, target.y, 'hit');
                            } else {
                                // Optional: log misses between enemies? Might spam.
                            }
                        }
                    }

                    if (target.hp <= 0) {
                        if (this.visibleTiles.has(`${target.x},${target.y}`)) {
                            this.log(`${target.char} is killed by ${enemy.char}!`, 'success');
                        }
                        this.enemies = this.enemies.filter(e => e !== target);
                    }
                }
            });
        });


        // Mana Regen
        if (this.player.mana < this.player.maxMana) {
            this.player.mana = Math.min(this.player.mana + 1, this.player.maxMana);
        }

        this.isPlayerTurn = true;
        this.update();
    }

    attackEnemy(enemy) {
        const result = this.combatSystem.resolveAttack(this.player, enemy);

        if (result.hit) {
            this.log(`You hit ${enemy.char} for ${result.damage} dmg!`, 'combat');
            this.audio.playAttack();
            this.renderer.triggerEffect(enemy.x, enemy.y, 'hit');

            if (result.killed) {
                this.log(`${enemy.char} dies! +10 XP`, 'success');
                this.player.gainXp(10);
                this.audio.playHit();
                // Remove enemy
                this.enemies = this.enemies.filter(e => e !== enemy);
            }
        } else {
            this.log(`You miss ${enemy.char}!`, 'info');
            this.audio.playMiss();
        }
    }

    update() {
        this.draw();
        this.updateUI();

        if (this.player.hp <= 0 && this.gameState !== 'GAMEOVER') {
            this.gameState = 'GAMEOVER';
            document.getElementById('game-over').style.display = 'flex';
            this.log("You have died...", 'important');
        }
    }

    log(message, type = 'info') {
        const logEl = document.getElementById('log');
        const entry = document.createElement('div');
        entry.classList.add('log-entry');
        if (type) entry.classList.add(type);
        entry.innerText = message;
        logEl.prepend(entry);
        if (logEl.children.length > 50) {
            logEl.removeChild(logEl.lastChild);
        }
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        this.draw();
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawMap(this.map, this.visibleTiles, this.exploredTiles);

        this.items.forEach(item => {
            this.renderer.drawEntity(item, this.visibleTiles);
        });

        this.enemies.forEach(enemy => {
            this.renderer.drawEntity(enemy, this.visibleTiles);
        });

        this.npcs.forEach(npc => {
            this.renderer.drawEntity(npc, this.visibleTiles);
        });

        if (this.player) {
            this.renderer.drawEntity(this.player, this.visibleTiles);
        }
    }

    updateUI() {
        if (!this.player) return;

        const hpVal = document.getElementById('hp-val');
        if (hpVal) hpVal.innerText = `${this.player.hp}/${this.player.maxHp}`;

        const manaEl = document.getElementById('mana-val');
        if (manaEl) manaEl.innerText = `${this.player.mana}/${this.player.maxMana}`;

        const lvlVal = document.getElementById('lvl-val');
        if (lvlVal) lvlVal.innerText = this.player.level;

        const atkVal = document.getElementById('atk-val');
        if (atkVal) atkVal.innerText = this.player.getAttack();

        const defVal = document.getElementById('def-val');
        if (defVal) defVal.innerText = this.player.getDefense();

        const weaponVal = document.getElementById('weapon-val');
        if (weaponVal) weaponVal.innerText = this.player.equipment.weapon ? this.player.equipment.weapon.name : 'None';

        const armorVal = document.getElementById('armor-val');
        if (armorVal) armorVal.innerText = this.player.equipment.armor ? this.player.equipment.armor.name : 'None';

        // Update Spells List
        const spellsList = document.getElementById('spells-list');
        if (spellsList) {
            spellsList.innerHTML = '';
            this.player.spells.forEach((spell, i) => {
                const li = document.createElement('li');
                li.innerText = `${i + 1}. ${spell.name} (${spell.cost} MP)`;
                spellsList.appendChild(li);
            });
        }
    }

    restart() {
        location.reload();
    }
}
