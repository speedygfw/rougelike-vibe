import ThreeRenderer from './ThreeRenderer.js';
import MapGenerator, { MapData, Room } from './MapGenerator.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import NPC from '../entities/NPC.js';
import Entity from '../entities/Entity.js';
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
    Key,
    Item
} from '../entities/Item.js';
import { Weapon, Armor } from '../entities/Equipment.js';
import FOV from './FOV.js';
import AudioSystem from './AudioSystem.js';
import InputHandler from './InputHandler.js';
import CombatSystem from './CombatSystem.js';
import { UIManager } from './UIManager.js';

export default class Game {
    renderer: ThreeRenderer;
    audio: AudioSystem;
    inputHandler: InputHandler;
    combatSystem: CombatSystem;
    ui: UIManager;
    mapGenerator: MapGenerator;
    map: MapData | null;
    player: Player | null;
    enemies: Enemy[];
    items: Item[];
    npcs: NPC[];
    isPlayerTurn: boolean;
    extraTurns: number;
    turnCount: number;
    visibleTiles: Set<string>;
    exploredTiles: Set<string>;
    fovRadius: number;
    gameState: 'PLAYING' | 'GAMEOVER' | 'VICTORY';
    fov: FOV | null;
    playerClass: string;
    minimapCanvas: HTMLCanvasElement | null;
    minimapCtx: CanvasRenderingContext2D | null;
    constructor(playerClass: string = 'warrior') {
        this.renderer = new ThreeRenderer();
        this.audio = new AudioSystem();
        this.inputHandler = new InputHandler();
        this.combatSystem = new CombatSystem(this);
        this.ui = new UIManager();
        this.mapGenerator = new MapGenerator(60, 40);
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
        this.fov = null;
        this.playerClass = playerClass;
        this.minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        // UI Event Listeners
        window.addEventListener('useItem', (e: any) => {
            this.useItem(e.detail.index);
        });
        window.addEventListener('castSpell', (e: any) => {
            this.castSpell(e.detail.index);
        });
    }

    log(message: string, type?: string) {
        this.ui.log(message, type);
    }

    createSaveControls() {
        // Save controls removed to fix UI layout issues
    }

    saveGame() {
        if (!this.player || !this.map) return;

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
        this.ui.log("Game Saved!", 'success');
    }

    loadGame() {
        const json = localStorage.getItem('roguelike_save');
        if (!json) {
            this.ui.log("No save game found.", 'warning');
            return;
        }

        const data = JSON.parse(json);

        // Restore Map
        this.map = data.map;
        if (this.map) {
            this.mapGenerator.width = this.map.width;
            this.mapGenerator.height = this.map.height;
        }

        // Restore Player
        this.player = new Player(data.player.x, data.player.y, 'warrior'); // Default class, overwritten below
        Object.assign(this.player, data.player);
        this.player.inventory = data.player.inventory.map((i: any) => this.hydrateItem(i));
        if (this.player.equipment.weapon) this.player.equipment.weapon = this.hydrateItem(this.player.equipment.weapon) as Weapon;
        if (this.player.equipment.armor) this.player.equipment.armor = this.hydrateItem(this.player.equipment.armor) as Armor;

        // Restore Enemies
        this.enemies = data.enemies.map((e: any) => {
            const enemy = new Enemy(e.x, e.y, e.type);
            enemy.hp = e.hp;
            return enemy;
        });

        // Restore Items
        this.items = data.items.map((i: any) => this.hydrateItem(i)).filter((i: any) => i !== null) as Item[];

        // Restore FOV
        this.exploredTiles = new Set(data.exploredTiles);
        if (this.map) {
            this.fov = new FOV(this.map);
            this.updateFOV();
        }

        this.ui.log("Game Loaded!", 'success');
        this.update();
    }

    hydrateItem(data: any) {
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
        return null;
    }

    init() {
        try {
            console.log("Game.init() called");
            // Disable controls initially to prevent UI interference
            if (this.renderer.controls) this.renderer.controls.enabled = false;

            // Initialize Audio Context (must be after user interaction)
            document.addEventListener('click', () => {
                this.audio.init();
                this.audio.playTheme('start');
            }, { once: true });

            const selectionDiv = document.getElementById('class-selection');
            const cards = document.querySelectorAll('.class-card');
            console.log("Found selectionDiv:", selectionDiv);
            console.log("Found cards:", cards.length);

            // Add Keyboard Listener
            window.addEventListener('keydown', (e) => this.handleInput(e));
            console.log("Event listener attached");

            // Story Intro Handler
            const storyIntro = document.getElementById('story-intro');
            if (storyIntro) {
                console.log("Story intro found, attaching listener");
                storyIntro.style.cursor = 'pointer'; // Ensure it looks clickable
                storyIntro.addEventListener('click', () => {
                    console.log("Story intro clicked");
                    storyIntro.style.display = 'none';
                    if (selectionDiv) selectionDiv.style.display = 'flex';
                });
            } else {
                // Fallback if story intro is missing for some reason
                if (selectionDiv) selectionDiv.style.display = 'flex';
            }

            // Event Delegation for Class Selection
            if (selectionDiv) {
                selectionDiv.onclick = (e: MouseEvent) => {
                    const target = e.target as HTMLElement;
                    const card = target.closest('.class-card');
                    if (card) {
                        try {
                            console.log("Card clicked:", card.getAttribute('data-class'));
                            const classType = card.getAttribute('data-class');
                            if (classType) {
                                selectionDiv.style.display = 'none';
                                this.startGame(classType);
                            }
                        } catch (err: any) {
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

            this.setupMobileControls();

            this.minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
            if (this.minimapCanvas) {
                this.minimapCtx = this.minimapCanvas.getContext('2d');
            }

        } catch (e) {
            console.error("Error in Game.init:", e);
        }
    }

    setupMobileControls() {
        const bindBtn = (id: string, command: any) => {
            const btn = document.getElementById(id);
            if (btn) {
                const handlePress = (e: TouchEvent) => {
                    if (e.cancelable) e.preventDefault(); // Prevent ghost clicks if possible

                    // Haptic Feedback
                    try {
                        if (navigator && navigator.vibrate) {
                            navigator.vibrate(10); // Short tick
                        }
                    } catch (err) {
                        // Ignore vibration errors
                    }

                    this.processCommand(command);
                };

                btn.addEventListener('touchstart', handlePress, { passive: false });
                btn.addEventListener('click', () => {
                    // Fallback for non-touch click (e.g. mouse on desktop testing)
                    this.processCommand(command);
                });
            }
        };

        bindBtn('btn-up', { type: 'move', dx: 0, dy: -1 });
        bindBtn('btn-down', { type: 'move', dx: 0, dy: 1 });
        bindBtn('btn-left', { type: 'move', dx: -1, dy: 0 });
        bindBtn('btn-right', { type: 'move', dx: 1, dy: 0 });
        bindBtn('btn-wait', { type: 'wait' });

        bindBtn('btn-interact', { type: 'interact' });
        bindBtn('btn-pickup', { type: 'pickup' });
        bindBtn('btn-inv', { type: 'inventory' });
    }

    startGame(classType: string) {
        try {
            console.log("Starting game with class:", classType);
            this.playerClass = classType;
            this.generateLevel();

            // Enable controls
            if (this.renderer.controls) this.renderer.controls.enabled = true;

            this.update();
            this.loop();
        } catch (e: any) {
            console.error("Error in startGame:", e);
            alert("Critical Game Error: " + e.message);
        }
    }

    generateLevel() {
        // Generate Map
        let map: MapData;
        if (!this.player || this.player.level === 0) {
            map = this.mapGenerator.generateVillage();
            this.map = map;

            // Initialize player if not exists
            if (!this.player) {
                // Use map.startX/Y if available, otherwise fallback to center
                const startX = map.startX ?? Math.floor(map.width / 2);
                const startY = map.startY ?? Math.floor(map.height / 2);
                this.player = new Player(startX, startY, this.playerClass);
            } else {
                // Reset player position for existing player entering village
                if (map.startX && map.startY) {
                    this.player.x = map.startX;
                    this.player.y = map.startY;
                }
            }

            this.ui.log("Welcome to the Village of Oakhaven.", 'important');
        } else {
            map = this.mapGenerator.generate();
            this.map = map;
            // Spawn Enemies and Items in other rooms
            this.enemies = [];
            this.items = [];
            this.npcs = [];

            if (map.rooms.length > 0) {
                if (this.player?.level === 0) {
                    // Village NPCs
                    // Player position is already set by map.startX/Y at the top of this function


                    // Load NPCs from Map Data
                    if (this.map.npcs) {
                        this.map.npcs.forEach(npcData => {
                            this.npcs.push(new NPC(npcData.x, npcData.y, npcData.name, npcData.dialogues));
                        });
                    }

                    // Fallback if no NPCs in map (e.g. old map data or procedural fallback)
                    if (this.npcs.length === 0) {
                        const npcData = [
                            { name: "Elder Aethel", text: ["The Dissonance is growing stronger...", "Please, save our world.", "The dungeon lies to the north."] },
                            { name: "Blacksmith Gorr", text: ["Need a weapon? Too bad, I'm out of stock.", "Sharp blades are key.", "Don't let the rust get you."] },
                            { name: "Mystic Mara", text: ["I sense a great power within you.", "The Harmonic Core... it calls to me.", "Beware the shadows."] },
                            { name: "Villager", text: ["Nice weather today, isn't it?", "I saw a goblin yesterday!", "My sheep are missing."] }
                        ];

                        for (let i = 0; i < 5; i++) {
                            const room = map.rooms[Math.floor(Math.random() * map.rooms.length)];
                            const pos = this.mapGenerator.getCenter(room);
                            const data = npcData[Math.floor(Math.random() * npcData.length)];
                            this.npcs.push(new NPC(pos.x, pos.y, data.name, data.text));
                        }
                    }
                } else if (this.player?.level === 20) {
                    // Boss Level
                    const center = this.mapGenerator.getCenter(map.rooms[map.rooms.length - 1]);
                    this.enemies.push(new Enemy(center.x, center.y, 'dragon')); // The Dissonance

                    // Place Harmonic Core
                    const amuletPos = this.mapGenerator.getCenter(map.rooms[Math.floor(map.rooms.length / 2)]);
                    this.items.push(new HarmonicCore(amuletPos.x, amuletPos.y));

                    this.ui.log('You feel a distortion in time... The Dissonance awaits!', 'important');
                } else {
                    for (let i = 1; i < map.rooms.length; i++) {
                        const room = map.rooms[i];


                        // Spawn 1-3 enemies per room
                        const enemyCount = Math.floor(Math.random() * 3) + 1;
                        for (let j = 0; j < enemyCount; j++) {
                            if (Math.random() < 0.9) {
                                const roll = Math.random();
                                let type = 'goblin';

                                // Weighted spawn pool - More variety
                                if (roll < 0.15) type = 'rat';
                                else if (roll < 0.25) type = 'bat';
                                else if (roll < 0.35) type = 'spider';
                                else if (roll < 0.50) type = 'kobold';
                                else if (roll < 0.65) type = 'goblin';
                                else if (roll < 0.75) type = 'skeleton';
                                else if (roll < 0.82) type = 'zombie';
                                else if (roll < 0.88) type = 'orc';
                                else if (roll < 0.94) type = 'shaman';
                                else if (roll < 0.98) type = 'ghost';
                                else type = 'ogre';

                                // Random position in room
                                const ex = Math.floor(Math.random() * room.w) + room.x;
                                const ey = Math.floor(Math.random() * room.h) + room.y;

                                if (map.tiles[ey][ex] === 'floor') {
                                    this.enemies.push(new Enemy(ex, ey, type));
                                }
                            }
                        }

                        // Chance to spawn item
                        if (Math.random() < 0.6) {
                            const ix = Math.floor(Math.random() * room.w) + room.x;
                            const iy = Math.floor(Math.random() * room.h) + room.y;
                            if (map.tiles[iy][ix] === 'floor') {
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
                        if (Math.random() < 0.4) {
                            const kx = Math.floor(Math.random() * room.w) + room.x;
                            const ky = Math.floor(Math.random() * room.h) + room.y;
                            if (map.tiles[ky][kx] === 'floor') {
                                this.items.push(new Key(kx, ky));
                            }
                        }

                        // Chance to spawn NPC
                        if (Math.random() < 0.5) {
                            const nx = Math.floor(Math.random() * room.w) + room.x;
                            const ny = Math.floor(Math.random() * room.h) + room.y;
                            if (map.tiles[ny][nx] === 'floor') {
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

                    // Guaranteed Key Spawning to prevent soft-locks
                    const spawnKey = (r: Room) => {
                        const kx = Math.floor(Math.random() * r.w) + r.x;
                        const ky = Math.floor(Math.random() * r.h) + r.y;
                        if (map.tiles[ky][kx] === 'floor') {
                            this.items.push(new Key(kx, ky));
                        }
                    };

                    for (let i = 0; i < map.rooms.length; i++) {
                        const room = map.rooms[i];
                        let hasDoor = false;

                        // Check Top/Bottom
                        for (let x = room.x; x < room.x + room.w; x++) {
                            if (this.map.tiles[room.y - 1] && this.map.tiles[room.y - 1][x] === 'door_closed') hasDoor = true;
                            if (this.map.tiles[room.y + room.h] && this.map.tiles[room.y + room.h][x] === 'door_closed') hasDoor = true;
                        }
                        // Check Left/Right
                        for (let y = room.y; y < room.y + room.h; y++) {
                            if (this.map.tiles[y][room.x - 1] === 'door_closed') hasDoor = true;
                            if (this.map.tiles[y][room.x + room.w] === 'door_closed') hasDoor = true;
                        }

                        if (hasDoor) {
                            if (i > 0) spawnKey(this.map.rooms[i - 1]);
                            spawnKey(room);
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

                // Spawn Enemies (Cave)
                const totalEnemies = 15 + Math.floor(Math.random() * 6); // 15-20 enemies
                for (let i = 0; i < totalEnemies; i++) {
                    let ex, ey;
                    do {
                        ex = Math.floor(Math.random() * this.map.width);
                        ey = Math.floor(Math.random() * this.map.height);
                    } while (this.map.tiles[ey][ex] === 'wall' || (ex === px && ey === py));

                    const roll = Math.random();
                    let type = 'goblin';

                    if (roll < 0.15) type = 'rat';
                    else if (roll < 0.25) type = 'bat';
                    else if (roll < 0.35) type = 'spider';
                    else if (roll < 0.50) type = 'kobold';
                    else if (roll < 0.65) type = 'goblin';
                    else if (roll < 0.75) type = 'skeleton';
                    else if (roll < 0.82) type = 'zombie';
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
        }

        // Common Initialization for all levels
        this.renderer.initMap(this.map);
        this.fov = new FOV(this.map);
        this.updateFOV();

        // Load NPCs from Map Data
        this.npcs = [];
        if (this.map.npcs) {
            this.map.npcs.forEach(npcData => {
                this.npcs.push(new NPC(npcData.x, npcData.y, npcData.name, npcData.dialogues, npcData.image));
            });
        }


        // Fallback for Village NPCs if missing
        if (this.player?.level === 0 && this.npcs.length === 0) {
            const npcData = [
                { name: "Elder Aethel", text: ["The Dissonance is growing stronger...", "Please, save our world.", "The dungeon lies to the north."], image: "assets/elder.svg" },
                { name: "Blacksmith Gorr", text: ["Need a weapon? Too bad, I'm out of stock.", "Sharp blades are key.", "Don't let the rust get you."] },
                { name: "Mystic Mara", text: ["I sense a great power within you.", "The Harmonic Core... it calls to me.", "Beware the shadows."] },
                { name: "Villager", text: ["Nice weather today, isn't it?", "I saw a goblin yesterday!", "My sheep are missing."] }
            ];

            for (let i = 0; i < 5; i++) {
                const room = this.map.rooms[Math.floor(Math.random() * this.map.rooms.length)];
                const pos = this.mapGenerator.getCenter(room);
                const data = npcData[Math.floor(Math.random() * npcData.length)];
                // @ts-ignore
                this.npcs.push(new NPC(pos.x, pos.y, data.name, data.text, data.image));
            }
        }

        if (this.player?.level === 0) {
            this.ui.log("Welcome to the Village of Oakhaven.", 'important');
        } else {
            this.ui.log(`Entered Level ${this.player.level}`, 'important');
        }

        // Update Music based on Level and Combat State
        this.updateMusic();
    }

    updateMusic() {
        if (!this.player || !this.map) return;

        // Check for nearby enemies (Combat State)
        let inCombat = false;
        if (this.player.level !== 20) { // Boss has its own theme
            for (const enemy of this.enemies) {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 6 && enemy.hp > 0) { // Combat range
                    inCombat = true;
                    break;
                }
            }
        }

        if (this.player!.level === 20) {
            this.audio.playTheme('boss');
        } else if (this.player!.level === 0) {
            this.audio.playTheme('village');
        } else if (inCombat) {
            this.audio.playCombatTheme();
        } else {
            this.audio.playProceduralTheme(this.player!.level);
        }
    }

    updateFOV() {
        if (!this.player || !this.fov) return;
        this.visibleTiles = this.fov.compute(this.player.x, this.player.y, this.fovRadius);
        this.visibleTiles.forEach(key => {
            this.exploredTiles.add(key);
        });
    }

    handleInput(e: KeyboardEvent) {
        if (this.ui.isDialogueOpen()) {
            console.log('DEBUG: Dialogue is open, handling UI input');
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
                this.ui.hideDialogue();
            }
            return;
        }

        if (this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') {
            if (e.key === 'Enter' || e.key === 'r') {
                this.restart();
            }
            return;
        }

        if (!this.isPlayerTurn) return;

        const cmd = this.inputHandler.handleKey(e);
        if (cmd) {
            if (cmd.type === 'move') {
                // Adjust for camera rotation
                const rotation = this.renderer.getViewRotation(); // 0, 1, 2, 3
                let dx = cmd.dx as number;
                let dy = cmd.dy as number;

                // Rotate vector (dx, dy) by 90 degrees * rotation
                for (let i = 0; i < rotation; i++) {
                    const temp = dx;
                    dx = dy;
                    dy = -temp;
                }

                this.processCommand({ ...cmd, dx, dy });
            } else {
                this.processCommand(cmd);
            }
        }
    }

    processCommand(command: any) {
        console.log('DEBUG: processCommand called', command);
        if (!this.isPlayerTurn || !this.player || !this.map) {
            console.log('DEBUG: processCommand early return', this.isPlayerTurn, !!this.player, !!this.map);
            return;
        }

        if (command.type === 'move') {
            const targetX = this.player.x + command.dx;
            const targetY = this.player.y + command.dy;
            console.log('DEBUG: Target pos', targetX, targetY);

            // Check for enemy
            const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
            if (enemy) {
                console.log('DEBUG: Enemy found');
                this.attackEnemy(enemy);
                this.renderer.playAnimation(this.player, 'attack'); // Trigger animation
                this.isPlayerTurn = false;
                this.update();
                setTimeout(() => this.enemyTurn(), 250); // Increased delay for animation
            } else {
                console.log('DEBUG: No enemy found, checking NPC/Door/Move');
                // Check for NPC
                const npc = this.npcs.find(n => n.x === targetX && n.y === targetY);
                console.log(`DEBUG: Checking for NPC at ${targetX},${targetY}. Found? ${!!npc}. Total NPCs: ${this.npcs.length}`);
                if (npc) {
                    console.log('DEBUG: NPC found');
                    const interaction = npc.interact();
                    this.ui.showDialogue(npc.name, interaction.text, interaction.image);
                    // this.ui.log(`${npc.name}: "${message}"`, 'info');
                    this.update();
                    return;
                }

                const tile = this.map.tiles[targetY][targetX];
                console.log('DEBUG: Checking tile type:', tile);
                if (tile === 'door_closed') {
                    console.log('DEBUG: Door found');
                    const keyIndex = this.player.inventory.findIndex(i => i.name === 'Golden Key');
                    if (keyIndex !== -1) {
                        this.ui.log("You unlock the door with your key.", 'success');
                        this.map.tiles[targetY][targetX] = 'door_open';
                        this.player.inventory.splice(keyIndex, 1);
                        this.ui.updateUI(this.player);
                        this.audio.playSound('pickup'); // Reuse sound for now
                        this.isPlayerTurn = false;
                        this.update();
                        setTimeout(() => this.enemyTurn(), 100);
                    } else {
                        this.ui.log("The door is locked. You need a key.", 'warning');
                    }
                } else {
                    const moved = this.player.move(command.dx, command.dy, this.map);
                    if (moved) {
                        this.audio.playSound('step');
                        this.updateFOV();

                        if (this.extraTurns > 0) {
                            this.extraTurns--;
                            this.ui.log(`Extra turn! (${this.extraTurns} remaining)`, 'magic');
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
            // Check for adjacent NPCs
            let interacted = false;
            if (this.player) {
                const neighbors = [
                    { x: this.player.x + 1, y: this.player.y },
                    { x: this.player.x - 1, y: this.player.y },
                    { x: this.player.x, y: this.player.y + 1 },
                    { x: this.player.x, y: this.player.y - 1 }
                ];

                for (const pos of neighbors) {
                    const npc = this.npcs.find(n => n.x === pos.x && n.y === pos.y);
                    if (npc) {
                        const interaction = npc.interact();
                        this.ui.showDialogue(npc.name, interaction.text, interaction.image);
                        interacted = true;
                        break;
                    }
                }
            }

            if (!interacted) {
                this.checkStairs();
            }
        } else if (command.type === 'pickup') {
            this.pickupItem();
        } else if (command.type === 'inventory') {
            this.ui.toggleInventory(this.player);
        } else if (command.type === 'spellbook') {
            this.ui.toggleSpellBook(this.player);
        } else if (command.type === 'cast') {
            if (command.spellIndex < this.player.spells.length) {
                this.castSpell(command.spellIndex);
            }
        } else if (command.type === 'wait') {
            this.ui.log("You wait...", 'info');
            this.isPlayerTurn = false;
            this.update();
            setTimeout(() => this.enemyTurn(), 100);
        }
    }

    castSpell(index: number) {
        if (!this.player || !this.map) return;
        const spell = this.player.spells[index];
        if (this.player.mana < spell.cost) {
            this.ui.log(`Not enough mana for ${spell.name}!`, 'warning');
            return;
        }

        let cast = false;
        let targets: Enemy[] = [];

        // Helper to find targets
        const getEnemiesInRange = (range: number) => {
            if (!this.player) return [];
            return this.enemies.filter(e => {
                if (!this.player) return false;
                const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
                return dist <= range;
            });
        };

        const getNearestEnemy = (range: number): Enemy | null => {
            if (!this.player) return null;
            let target: Enemy | null = null;
            let minDist = range + 1;
            this.enemies.forEach(e => {
                if (!this.player) return;
                const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
                if (dist <= range && dist < minDist) {
                    minDist = dist;
                    target = e;
                }
            });
            return target;
        };

        if (spell.type === 'heal' && spell.heal) {
            if (this.player.hp < this.player.maxHp) {
                this.player.hp = Math.min(this.player.hp + spell.heal, this.player.maxHp);
                this.ui.log(`You cast ${spell.name} and heal for ${spell.heal} HP.`, 'magic');
                this.renderer.triggerEffect(this.player.x, this.player.y, 'heal');
                this.audio.playSound('magic');
                cast = true;
            } else {
                this.ui.log("You are already at full health.", 'warning');
            }
        } else if (spell.type === 'damage' && spell.damage && spell.range) {
            const target = getNearestEnemy(spell.range);
            if (target) {
                target.hp -= spell.damage;
                this.ui.log(`You cast ${spell.name} at ${target.char} for ${spell.damage} dmg!`, 'magic');
                this.renderer.triggerEffect(target.x, target.y, 'hit');
                this.renderer.playAnimation(target, 'hit');
                this.audio.playSound('magic');
                if (target.hp <= 0) targets.push(target); // Mark for cleanup
                cast = true;
            } else {
                this.ui.log("No enemy in range.", 'warning');
            }
        } else if (spell.type === 'freeze' && spell.range) {
            const enemies = getEnemiesInRange(spell.range);
            if (enemies.length > 0) {
                enemies.forEach(e => {
                    e.frozen = 3;
                    this.ui.log(`${e.type} is frozen!`, 'magic');
                    this.renderer.triggerEffect(e.x, e.y, 'freeze');
                });
                this.audio.playSound('magic');
                cast = true;
            } else {
                this.ui.log("No enemies in range to freeze.", 'warning');
            }
        } else if (spell.type === 'chain_lightning' && spell.damage && spell.range) {
            let currentTarget = getNearestEnemy(spell.range);
            if (currentTarget) {
                let bounces = 3;
                let damage = spell.damage;
                let hitEnemies = new Set<Enemy>();

                while (bounces > 0 && currentTarget) {
                    currentTarget.hp -= damage;
                    this.ui.log(`Lightning hits ${currentTarget.type} for ${damage} dmg!`, 'magic');
                    this.renderer.triggerEffect(currentTarget.x, currentTarget.y, 'hit');
                    this.renderer.playAnimation(currentTarget, 'hit');
                    hitEnemies.add(currentTarget);
                    if (currentTarget.hp <= 0) targets.push(currentTarget);

                    bounces--;
                    damage = Math.floor(damage * 0.7);

                    // Find next nearest to currentTarget
                    let nextTarget: Enemy | null = null;
                    let minD = spell.range + 1;
                    this.enemies.forEach(e => {
                        if (currentTarget && !hitEnemies.has(e) && e !== currentTarget && e.hp > 0) {
                            const d = Math.abs(e.x - currentTarget.x) + Math.abs(e.y - currentTarget.y);
                            if (d <= 4 && d < minD) { // Bounce range 4
                                minD = d;
                                nextTarget = e;
                            }
                        }
                    });
                    currentTarget = nextTarget;
                }
                this.audio.playSound('magic');
                cast = true;
            } else {
                this.ui.log("No enemy in range.", 'warning');
            }
        } else if (spell.type === 'drain' && spell.damage && spell.range) {
            const target = getNearestEnemy(spell.range);
            if (target) {
                target.hp -= spell.damage;
                const heal = Math.floor(spell.damage / 2);
                this.player.hp = Math.min(this.player.hp + heal, this.player.maxHp);
                this.ui.log(`Drained ${spell.damage} HP from ${target.type}, healed ${heal}!`, 'magic');
                this.renderer.triggerEffect(target.x, target.y, 'hit');
                this.renderer.playAnimation(target, 'hit');
                if (target.hp <= 0) targets.push(target);
                this.audio.playSound('magic');
                cast = true;
            } else {
                this.ui.log("No enemy in range.", 'warning');
            }
        } else if ((spell.type === 'buff' || spell.type === 'invisibility') && spell.duration) {
            this.player.addBuff({ type: spell.type, duration: spell.duration, amount: spell.defense });
            this.ui.log(`You cast ${spell.name}!`, 'magic');
            this.audio.playSound('magic');
            cast = true;
        } else if (spell.type === 'time_warp' && spell.turns) {
            this.extraTurns += spell.turns;
            this.ui.log(`Time warps! You gain ${spell.turns} extra turns.`, 'magic');
            this.audio.playSound('magic');
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
                this.ui.log("You vanish into the shadows!", 'magic');
                this.updateFOV();
                this.audio.playSound('magic');
                cast = true;
            }
        }

        // Cleanup dead enemies
        if (targets.length > 0) {
            targets.forEach(t => {
                if (this.enemies.includes(t) && this.player) { // Check if still in list (duplicates from chain lightning)
                    this.ui.log(`${t.type} is destroyed! +${t.xpValue || 10} XP`, 'success');
                    this.player.gainXp(t.xpValue || 10);
                    this.renderer.removeEntity(t); // Remove mesh
                }
            });
            this.enemies = this.enemies.filter(e => e.hp > 0);
        }

        if (cast) {
            this.player.mana -= spell.cost;
            this.ui.updateUI(this.player);

            if (this.extraTurns > 0) {
                this.extraTurns--;
                this.ui.log(`Extra turn! (${this.extraTurns} remaining)`, 'magic');
                // Do not end turn
            } else {
                this.isPlayerTurn = false;
                this.update();
                setTimeout(() => this.enemyTurn(), 100);
            }
        }
    }

    pickupItem() {
        if (!this.player) return;
        console.log(`Attempting pickup at ${this.player.x}, ${this.player.y}`);
        console.log(`Items available:`, this.items.map(i => `${i.name} at ${i.x},${i.y}`));
        const itemIndex = this.items.findIndex(i => this.player && i.x === this.player.x && i.y === this.player.y);
        if (itemIndex !== -1) {
            const item = this.items[itemIndex];
            this.player.inventory.push(item);
            this.items.splice(itemIndex, 1);
            this.renderer.removeEntity(item); // Remove mesh
            this.ui.log(`Picked up ${item.name}`, 'pickup');
            this.audio.playSound('pickup');
            this.ui.updateUI(this.player);
        } else {
            this.ui.log("Nothing to pick up here.", 'warning');
        }
    }



    useItem(index: number) {
        if (!this.player) return;
        const item = this.player.inventory[index];

        if (item instanceof HarmonicCore) {
            this.gameState = 'VICTORY';
            const vicScreen = document.getElementById('victory-screen');
            if (vicScreen) vicScreen.style.display = 'flex';
            this.audio.playSound('level_up');
            return;
        }

        if (item) {
            let used = false;
            if (item.use(this.player, this)) {
                used = true;
            }

            if (used) {
                this.ui.log(`Used/Equipped ${item.name}`, 'action');
                // Only remove if it's NOT equipment (Equipment.use returns true but stays in inventory usually, logic depends on Equipment.ts)
                // Wait, Equipment.use calls player.equip which returns true.
                // We shouldn't remove equipment from inventory when equipping.
                // But Potion.use returns true and should be removed.

                if (!(item instanceof Weapon) && !(item instanceof Armor)) {
                    this.player.inventory.splice(index, 1);
                }

                this.ui.renderInventory(this.player);
                this.ui.updateUI(this.player);
                this.isPlayerTurn = false;
                setTimeout(() => this.enemyTurn(), 100);
                this.audio.playSound('pickup');
            } else {
                this.ui.log(`Cannot use ${item.name} right now.`, 'warning');
            }
        }
    }



    checkStairs() {
        if (!this.player || !this.map) return;
        if (this.map.tiles[this.player.y][this.player.x] === 'stairs') {
            this.player.level++;
            this.generateLevel();
            this.update();
        } else {
            this.ui.log("There are no stairs here.", 'warning');
        }
    }

    enemyTurn() {
        if (this.extraTurns > 0) {
            this.isPlayerTurn = true;
            return;
        }

        if (!this.player || !this.map) return;

        this.player.updateBuffs();

        this.enemies.forEach(enemy => {
            if (!this.player || !this.map) return;
            enemy.takeTurn(this.player, this.map, this.enemies, (attackType: string, target: any) => {
                if (!this.player) return;

                if (target === this.player) {
                    if (attackType === 'magic') {
                        const damage = 10; // Magic damage
                        this.ui.log(`${enemy.char} casts a spell on you for ${damage} dmg!`, 'danger');
                        this.player.hp -= damage;
                        this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                        this.renderer.createFloatingText(this.player.x, this.player.y, `-${damage}`, '#ff0000');
                    } else if (attackType === 'firebreath') {
                        const damage = 25;
                        this.ui.log(`${enemy.char} breathes FIRE on you for ${damage} dmg!`, 'danger');
                        this.player.hp -= damage;
                        this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                        this.renderer.createFloatingText(this.player.x, this.player.y, `-${damage}`, '#ff4400');
                    } else {
                        const result = this.combatSystem.resolveAttack(enemy, this.player);
                        if (result.hit) {
                            this.ui.log(`${enemy.char} hits you for ${result.damage} dmg!`, 'danger');
                            this.renderer.triggerEffect(this.player.x, this.player.y, 'hit');
                            this.renderer.createFloatingText(this.player.x, this.player.y, `-${result.damage}`, '#ff0000');
                        } else {
                            this.ui.log(`${enemy.char} misses you!`, 'info');
                            this.renderer.createFloatingText(this.player.x, this.player.y, "Miss", '#aaa');
                        }
                    }
                } else {
                    // Enemy vs Enemy
                    // target is likely Enemy or Player, but here it's Enemy vs Enemy so target is Enemy
                    const enemyTarget = target as Enemy;
                    if (attackType === 'magic') {
                        const damage = 10;
                        enemyTarget.hp -= damage;
                        if (this.visibleTiles.has(`${enemyTarget.x},${enemyTarget.y}`)) {
                            this.ui.log(`${enemy.char} blasts ${enemyTarget.char} for ${damage} dmg!`, 'warning');
                            this.renderer.triggerEffect(enemyTarget.x, enemyTarget.y, 'hit');
                            this.renderer.createFloatingText(enemyTarget.x, enemyTarget.y, `-${damage}`, '#ff9100');
                        }
                    } else if (attackType === 'firebreath') {
                        const damage = 25;
                        enemyTarget.hp -= damage;
                        if (this.visibleTiles.has(`${enemyTarget.x},${enemyTarget.y}`)) {
                            this.ui.log(`${enemy.char} burns ${enemyTarget.char} for ${damage} dmg!`, 'warning');
                            this.renderer.triggerEffect(enemyTarget.x, enemyTarget.y, 'hit');
                            this.renderer.createFloatingText(enemyTarget.x, enemyTarget.y, `-${damage}`, '#ff4400');
                        }
                    } else {
                        const result = this.combatSystem.resolveAttack(enemy, enemyTarget);
                        if (this.visibleTiles.has(`${enemyTarget.x},${enemyTarget.y}`)) {
                            if (result.hit) {
                                this.ui.log(`${enemy.char} hits ${enemyTarget.char} for ${result.damage} dmg!`, 'warning');
                                this.renderer.triggerEffect(enemyTarget.x, enemyTarget.y, 'hit');
                                this.renderer.createFloatingText(enemyTarget.x, enemyTarget.y, `-${result.damage}`, '#ff9100');
                            } else {
                                // Optional: log misses between enemies?
                            }
                        }
                    }

                    if (enemyTarget.hp <= 0) {
                        if (this.visibleTiles.has(`${enemyTarget.x},${enemyTarget.y}`)) {
                            this.ui.log(`${enemyTarget.char} is killed by ${enemy.char}!`, 'success');
                        }
                        this.renderer.removeEntity(enemyTarget); // Remove mesh
                        this.enemies = this.enemies.filter(e => e !== enemyTarget);
                    }
                }
            });
        });

        // Mana Regen
        if (this.player.mana < this.player.maxMana) {
            this.player.mana = Math.min(this.player.mana + 1, this.player.maxMana);
        }

        // Update NPCs
        const allEntities: Entity[] = [...this.enemies, ...this.npcs];
        if (this.player) allEntities.push(this.player);

        this.npcs.forEach(npc => {
            npc.takeTurn(this.map, allEntities);
        });

        this.isPlayerTurn = true;
        this.update();
    }

    attackEnemy(enemy: Enemy) {
        if (!this.player) return;
        const result = this.combatSystem.resolveAttack(this.player, enemy);

        if (result.hit) {
            this.ui.log(`You hit ${enemy.char} for ${result.damage} dmg!`, 'combat');
            this.audio.playSound('hit');
            this.renderer.triggerEffect(enemy.x, enemy.y, 'hit');
            this.renderer.createFloatingText(enemy.x, enemy.y, `-${result.damage}`, '#ff4444');

            if (result.killed) {
                this.ui.log(`${enemy.char} dies! +10 XP`, 'success');
                this.player.gainXp(10);
                // Remove enemy
                this.renderer.removeEntity(enemy); // Remove mesh
                this.enemies = this.enemies.filter(e => e !== enemy);
            }
        } else {
            this.ui.log(`You miss ${enemy.char}!`, 'info');
            this.renderer.createFloatingText(enemy.x, enemy.y, "Miss", '#aaa');
        }
    }

    update() {
        if (this.player && this.map && this.fov) {
            // this.renderer.updateCamera(this.player, this.map); // Handled by ThreeRenderer.render
            this.visibleTiles = this.fov.compute(this.player.x, this.player.y, 8);

            // Update explored tiles
            this.visibleTiles.forEach(key => {
                this.exploredTiles.add(key);
            });
        }

        this.draw();
        this.ui.updateUI(this.player);

        // Check music state occasionally (every 30 frames or so would be better, but per update is fine for now as playTheme checks currentTheme)
        this.updateMusic();

        if (this.player && this.player.hp <= 0 && this.gameState !== 'GAMEOVER') {
            this.gameState = 'GAMEOVER';
            const gameOver = document.getElementById('game-over');
            if (gameOver) gameOver.style.display = 'flex';
            this.ui.log("You have died...", 'important');
        }
    }



    loop() {
        requestAnimationFrame(() => this.loop());

        // Smooth Movement Interpolation
        const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
        const speed = 0.2;

        if (this.player) {
            this.player.drawX = lerp(this.player.drawX, this.player.x, speed);
            this.player.drawY = lerp(this.player.drawY, this.player.y, speed);
        }

        this.enemies.forEach(e => {
            e.drawX = lerp(e.drawX || e.x, e.x, speed);
            e.drawY = lerp(e.drawY || e.y, e.y, speed);
        });

        this.draw();
    }

    draw() {
        this.renderer.clear();

        // Render 3D Scene
        this.renderer.render(this);

        this.items.forEach(item => {
            if (this.visibleTiles.has(`${item.x},${item.y}`)) {
                this.renderer.drawEntity(item);
            } else {
                this.renderer.hideEntity(item);
            }
        });

        this.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                if (this.visibleTiles.has(`${enemy.x},${enemy.y}`)) {
                    this.renderer.drawEntity(enemy);
                } else {
                    this.renderer.hideEntity(enemy);
                }
            }
        });

        this.npcs.forEach(npc => {
            if (this.visibleTiles.has(`${npc.x},${npc.y}`)) {
                // console.log(`DEBUG: Drawing NPC ${npc.name} at ${npc.x},${npc.y}`);
                this.renderer.drawEntity(npc);
            } else {
                // console.log(`DEBUG: Hiding NPC ${npc.name} at ${npc.x},${npc.y} (Not visible)`);
                this.renderer.hideEntity(npc);
            }
        });

        if (this.player) {
            this.renderer.drawEntity(this.player);

            // Draw Lighting Overlay (Handled by Three.js lights now)
            if (this.map) {
                // this.renderer.drawLighting(); 
            }

            // Draw Minimap
            if (this.map) {
                this.drawMinimap();
            }
        }

        this.renderer.drawEffects();
        this.ui.updateUI(this.player);
    }



    restart() {
        location.reload();
    }

    drawMinimap() {
        if (!this.minimapCtx || !this.minimapCanvas || !this.map || !this.player) return;

        const ctx = this.minimapCtx;
        const canvas = this.minimapCanvas;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const tileSize = 5; // Pixels per tile
        const viewRange = Math.floor(canvas.width / tileSize / 2); // Tiles in each direction

        const startX = this.player.x - viewRange;
        const startY = this.player.y - viewRange;

        for (let y = 0; y < canvas.height / tileSize; y++) {
            for (let x = 0; x < canvas.width / tileSize; x++) {
                const mapX = startX + x;
                const mapY = startY + y;

                if (mapX >= 0 && mapX < this.map.width && mapY >= 0 && mapY < this.map.height) {
                    const key = `${mapX},${mapY}`;
                    if (this.exploredTiles.has(key)) { // Fog of War applies to village too
                        const tile = this.map.tiles[mapY][mapX];
                        if (tile.startsWith('wall') || tile === 'door_closed') {
                            ctx.fillStyle = '#555';
                        } else if (tile === 'stairs') {
                            ctx.fillStyle = '#ffff00';
                        } else {
                            ctx.fillStyle = '#222';
                        }

                        if (mapX === this.player.x && mapY === this.player.y) {
                            ctx.fillStyle = '#00ff00';
                        } else if (this.visibleTiles.has(key)) {
                            // Show enemies if visible
                            const enemy = this.enemies.find(e => e.x === mapX && e.y === mapY);
                            if (enemy) ctx.fillStyle = '#ff0000';
                            const npc = this.npcs.find(n => n.x === mapX && n.y === mapY);
                            if (npc) ctx.fillStyle = '#00ffff';
                        }

                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }
            }
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
}
