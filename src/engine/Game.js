import Renderer from './Renderer.js';
import MapGenerator from './MapGenerator.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import { Potion, ScrollOfFireball, ScrollOfTeleport, AmuletOfYendor, Key } from '../entities/Item.js';
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
        this.map = null;
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.isPlayerTurn = true;

        this.fov = null;
        this.visibleTiles = new Set();
        this.exploredTiles = new Set();
        this.fovRadius = 8;

        this.gameState = 'PLAYING';
        this.createSaveControls();
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

            if (!selectionDiv) {
                console.error("Critical Error: class-selection element not found!");
                return;
            }

            cards.forEach(card => {
                // Ensure clickable
                card.style.pointerEvents = 'auto';

                card.onclick = () => {
                    try {
                        console.log("Card clicked:", card.getAttribute('data-class'));
                        const classType = card.getAttribute('data-class');
                        if (selectionDiv) selectionDiv.style.display = 'none';
                        this.startGame(classType);
                    } catch (e) {
                        console.error("Error handling card click:", e);
                        alert("Error starting game: " + e.message);
                    }
                };
            });

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

            if (this.player.level === 10) {
                // Boss Level
                const center = this.mapGenerator.getCenter(this.map.rooms[this.map.rooms.length - 1]);
                this.enemies.push(new Enemy(center.x, center.y, 'dragon'));

                // Place Amulet
                const amuletPos = this.mapGenerator.getCenter(this.map.rooms[Math.floor(this.map.rooms.length / 2)]);
                this.items.push(new AmuletOfYendor(amuletPos.x, amuletPos.y));

                this.log('You feel an ominous presence... The Dragon awaits!', 'important');
            } else {
                for (let i = 1; i < this.map.rooms.length; i++) {
                    const room = this.map.rooms[i];
                    const center = this.mapGenerator.getCenter(room);

                    // Chance to spawn enemy
                    if (Math.random() < 0.7) {
                        const roll = Math.random();
                        let type = 'goblin';
                        if (roll < 0.2) type = 'bat';
                        else if (roll < 0.4) type = 'shaman';
                        else if (roll < 0.5) type = 'orc';
                        else if (roll < 0.65) type = 'skeleton';
                        else if (roll < 0.7) type = 'ogre';

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
                            } else if (roll < 0.8) {
                                const tier = Math.min(4, Math.floor(this.player.level / 2) + 1);
                                this.items.push(new Weapon(ix, iy, tier));
                            } else {
                                const tier = Math.min(4, Math.floor(this.player.level / 2) + 1);
                                this.items.push(new Armor(ix, iy, tier));
                            }
                        }
                    }

                    // Chance to spawn Key
                    if (Math.random() < 0.2) {
                        const kx = Math.floor(Math.random() * room.w) + room.x;
                        const ky = Math.floor(Math.random() * room.h) + room.y;
                        if (this.map.tiles[ky][kx] === 'floor') {
                            this.items.push(new Key(kx, ky));
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

            // Spawn Enemies
            for (let i = 0; i < 6; i++) {
                let ex, ey;
                do {
                    ex = Math.floor(Math.random() * this.map.width);
                    ey = Math.floor(Math.random() * this.map.height);
                } while (this.map.tiles[ey][ex] === 'wall' || (ex === px && ey === py));

                const roll = Math.random();
                let type = 'goblin';
                if (roll < 0.2) type = 'bat';
                else if (roll < 0.4) type = 'shaman';
                else if (roll < 0.5) type = 'orc';
                else if (roll < 0.65) type = 'skeleton';
                else if (roll < 0.7) type = 'ogre';

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
                        this.isPlayerTurn = false;
                        this.update();
                        setTimeout(() => this.enemyTurn(), 100);
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
    }

    pickupItem() {
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

        if (item instanceof AmuletOfYendor) {
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
        this.enemies.forEach(enemy => {
            enemy.takeTurn(this.player, this.map, (attackType) => {
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
            });
        });
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

        this.renderer.drawEntity(this.player, this.visibleTiles);
    }

    updateUI() {
        document.getElementById('hp-val').innerText = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('lvl-val').innerText = this.player.level;
        document.getElementById('atk-val').innerText = this.player.getAttack();
        document.getElementById('def-val').innerText = this.player.getDefense();
        document.getElementById('weapon-val').innerText = this.player.equipment.weapon ? this.player.equipment.weapon.name : 'None';
        document.getElementById('armor-val').innerText = this.player.equipment.armor ? this.player.equipment.armor.name : 'None';
    }

    restart() {
        location.reload();
    }
}
