export class UIManager {
    constructor() { }

    log(message: string, type: string = 'info') {
        const logEl = document.getElementById('log');
        if (!logEl) return;
        const entry = document.createElement('div');
        entry.classList.add('log-entry');
        if (type) entry.classList.add(type);
        entry.innerText = message;
        logEl.prepend(entry);
        if (logEl.children.length > 50) {
            if (logEl.lastChild) {
                logEl.removeChild(logEl.lastChild);
            }
        }
    }

    updateUI(player: any) {
        if (!player) return;
        const hpEl = document.getElementById('hp');
        if (hpEl) hpEl.textContent = `HP: ${player.hp}/${player.maxHp}`;

        const levelEl = document.getElementById('level');
        if (levelEl) levelEl.textContent = `Level: ${player.level}`;

        const xpEl = document.getElementById('xp');
        if (xpEl) xpEl.textContent = `XP: ${player.xp}/${player.nextLevelXp}`;

        const dungeonLevelEl = document.getElementById('dungeon-level');
        if (dungeonLevelEl) dungeonLevelEl.textContent = `Dungeon Level: ${player.level}`;

        const manaEl = document.getElementById('mana');
        if (manaEl) manaEl.textContent = `Mana: ${player.mana}/${player.maxMana}`;
    }

    toggleInventory(player: any) {
        const invEl = document.getElementById('inventory');
        if (!invEl) return;
        if (invEl.style.display === 'none' || invEl.style.display === '') {
            invEl.style.display = 'block';
            this.renderInventory(player);
        } else {
            invEl.style.display = 'none';
        }
    }

    renderInventory(player: any) {
        const list = document.getElementById('inventory-list');
        if (!list) return;
        list.innerHTML = '';

        player.inventory.forEach((item: any, index: number) => {
            const li = document.createElement('li');
            li.innerText = `${item.name} (Tier ${item.tier || 1})`;
            li.onclick = () => {
                // This will need a callback or event to handle item usage
                // For now, we'll dispatch a custom event
                const event = new CustomEvent('useItem', { detail: { index } });
                window.dispatchEvent(event);
            };
            list.appendChild(li);
        });
    }

    toggleSpellBook(player: any) {
        const spellBookEl = document.getElementById('spellbook');
        if (!spellBookEl) return;
        if (spellBookEl.style.display === 'none' || spellBookEl.style.display === '') {
            spellBookEl.style.display = 'block';
            this.renderSpellBook(player);
        } else {
            spellBookEl.style.display = 'none';
        }
    }

    renderSpellBook(player: any) {
        const list = document.getElementById('spell-list');
        if (!list) return;
        list.innerHTML = '';

        player.spells.forEach((spell: any, index: number) => {
            const li = document.createElement('li');
            li.innerText = `${spell.name} (${spell.cost} Mana)`;
            li.onclick = () => {
                const event = new CustomEvent('castSpell', { detail: { index } });
                window.dispatchEvent(event);
            };
            list.appendChild(li);
        });
    }

    showGameOver() {
        const el = document.getElementById('game-over');
        if (el) el.style.display = 'flex';
    }

    showVictory() {
        const el = document.getElementById('victory');
        if (el) el.style.display = 'flex';
    }
    dialogueOverlay: HTMLElement | null = null;
    dialogueTitle: HTMLElement | null = null;
    dialogueContent: HTMLElement | null = null;
    dialoguePortrait: HTMLImageElement | null = null;

    initDialogueDOM() {
        if (this.dialogueOverlay) return;

        this.dialogueOverlay = document.createElement('div');
        this.dialogueOverlay.id = 'dialogue-overlay';
        this.dialogueOverlay.style.position = 'absolute';
        this.dialogueOverlay.style.top = '0';
        this.dialogueOverlay.style.left = '0';
        this.dialogueOverlay.style.width = '100%';
        this.dialogueOverlay.style.height = '100%';
        this.dialogueOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.dialogueOverlay.style.display = 'none'; // Start hidden
        this.dialogueOverlay.style.justifyContent = 'center';
        this.dialogueOverlay.style.alignItems = 'flex-end'; // Bottom of screen
        this.dialogueOverlay.style.zIndex = '1000';

        const box = document.createElement('div');
        box.id = 'dialogue-box';
        box.style.width = '80%';
        box.style.height = '180px';
        box.style.backgroundColor = '#222';
        box.style.border = '2px solid #fff';
        box.style.padding = '20px';
        box.style.marginBottom = '50px';
        box.style.color = '#fff';
        box.style.fontFamily = 'monospace';
        box.style.fontSize = '18px';
        box.style.display = 'flex';
        box.style.flexDirection = 'row';
        box.style.gap = '20px';

        this.dialoguePortrait = document.createElement('img');
        this.dialoguePortrait.id = 'dialogue-portrait';
        this.dialoguePortrait.style.width = '140px';
        this.dialoguePortrait.style.height = '140px';
        this.dialoguePortrait.style.objectFit = 'cover';
        this.dialoguePortrait.style.border = '2px solid #ffd700';
        this.dialoguePortrait.style.display = 'none';
        box.appendChild(this.dialoguePortrait);

        const textContainer = document.createElement('div');
        textContainer.style.display = 'flex';
        textContainer.style.flexDirection = 'column';
        textContainer.style.flex = '1';

        this.dialogueTitle = document.createElement('div');
        this.dialogueTitle.id = 'dialogue-title';
        this.dialogueTitle.style.fontWeight = 'bold';
        this.dialogueTitle.style.marginBottom = '10px';
        this.dialogueTitle.style.color = '#ffd700';

        this.dialogueContent = document.createElement('div');
        this.dialogueContent.id = 'dialogue-content';

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close (Space)';
        closeBtn.style.marginTop = 'auto';
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.onclick = () => { this.hideDialogue(); };

        textContainer.appendChild(this.dialogueTitle);
        textContainer.appendChild(this.dialogueContent);
        textContainer.appendChild(closeBtn);
        box.appendChild(textContainer);
        this.dialogueOverlay.appendChild(box);
        document.body.appendChild(this.dialogueOverlay);
    }

    showDialogue(name: string, text: string, image?: string) {
        if (!this.dialogueOverlay) this.initDialogueDOM();
        console.log('DEBUG: UIManager.showDialogue', { name, text, image, overlayExists: !!this.dialogueOverlay });

        if (this.dialogueTitle) this.dialogueTitle.innerText = name;
        if (this.dialogueContent) this.dialogueContent.innerText = text;

        if (this.dialoguePortrait) {
            if (image) {
                this.dialoguePortrait.src = image;
                this.dialoguePortrait.style.display = 'block';
            } else {
                this.dialoguePortrait.style.display = 'none';
            }
        }

        if (this.dialogueOverlay) this.dialogueOverlay.style.display = 'flex';
    }

    hideDialogue() {
        console.log('DEBUG: UIManager.hideDialogue');
        if (this.dialogueOverlay) this.dialogueOverlay.style.display = 'none';
    }

    isDialogueOpen(): boolean {
        // console.log('DEBUG: isDialogueOpen check', this.dialogueOverlay ? this.dialogueOverlay.style.display : 'no overlay');
        return this.dialogueOverlay ? this.dialogueOverlay.style.display !== 'none' : false;
    }
}
