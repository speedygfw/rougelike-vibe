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
    showDialogue(name: string, text: string, image?: string) {
        let overlay = document.getElementById('dialogue-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'dialogue-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'end'; // Bottom of screen
            overlay.style.zIndex = '1000';

            const box = document.createElement('div');
            box.id = 'dialogue-box';
            box.style.width = '80%';
            box.style.height = '180px'; // Increased height for image
            box.style.backgroundColor = '#222';
            box.style.border = '2px solid #fff';
            box.style.padding = '20px';
            box.style.marginBottom = '50px';
            box.style.color = '#fff';
            box.style.fontFamily = 'monospace';
            box.style.fontSize = '18px';
            box.style.display = 'flex';
            box.style.flexDirection = 'row'; // Row layout for image + text
            box.style.gap = '20px';

            const portrait = document.createElement('img');
            portrait.id = 'dialogue-portrait';
            portrait.style.width = '140px';
            portrait.style.height = '140px';
            portrait.style.objectFit = 'cover';
            portrait.style.border = '2px solid #ffd700';
            portrait.style.display = 'none'; // Hidden by default
            box.appendChild(portrait);

            const textContainer = document.createElement('div');
            textContainer.style.display = 'flex';
            textContainer.style.flexDirection = 'column';
            textContainer.style.flex = '1';

            const title = document.createElement('div');
            title.id = 'dialogue-title';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '10px';
            title.style.color = '#ffd700';

            const content = document.createElement('div');
            content.id = 'dialogue-content';

            const closeBtn = document.createElement('button');
            closeBtn.innerText = 'Close (Space)';
            closeBtn.style.marginTop = 'auto';
            closeBtn.style.alignSelf = 'flex-end';
            closeBtn.onclick = () => { overlay!.style.display = 'none'; };

            textContainer.appendChild(title);
            textContainer.appendChild(content);
            textContainer.appendChild(closeBtn);
            box.appendChild(textContainer);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        const title = document.getElementById('dialogue-title');
        const content = document.getElementById('dialogue-content');
        const portrait = document.getElementById('dialogue-portrait') as HTMLImageElement;

        if (title) title.innerText = name;
        if (content) content.innerText = text;

        if (portrait) {
            if (image) {
                portrait.src = image;
                portrait.style.display = 'block';
            } else {
                portrait.style.display = 'none';
            }
        }

        overlay.style.display = 'flex';
    }

    hideDialogue() {
        const overlay = document.getElementById('dialogue-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    isDialogueOpen(): boolean {
        const overlay = document.getElementById('dialogue-overlay');
        return overlay ? overlay.style.display !== 'none' : false;
    }
}
