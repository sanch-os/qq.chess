/* ============================================
   Developer Editor Logic
   ============================================ */

let currentTab = 'items';
let itemsData = [];
let mapsData = [];
let currentEditingId = null;

const STORAGE_KEY_ITEMS = 'chess_roguelike_items';
const STORAGE_KEY_MAPS = 'chess_roguelike_encounters';

// --- Initialization ---

function init() {
    buildKnightGrid();
    loadDataFromStorage();
    
    // Fallback if empty (for new users)
    if (itemsData.length === 0) {
        if (typeof ITEMS_DB !== 'undefined') {
            // Import all existing items
            itemsData = Object.values(ITEMS_DB);
        } else {
            itemsData = [
                {
                    id: "example_sword",
                    name: "Пример меча",
                    description: "+1 дальность взятия",
                    icon: "⚔️",
                    rarity: "common",
                    category: "offense",
                    cost: 50,
                    allowedPieces: ["all"],
                    modifiers: { extraCaptureRange: 1 },
                    extraDirections: [],
                    extraKnightOffsets: []
                }
            ];
        }
    }
    if (mapsData.length === 0) {
        mapsData = [
            {
                id: "round_1",
                name: "Раунд 1",
                description: "Первый враг",
                difficulty: 1,
                aiDepth: 2,
                goldReward: 60,
                enemySetup: "standard",
                enemyItems: [],
                isBoss: false
            }
        ];
    }

    renderSidebar();
    
    // Bind boss toggle
    document.getElementById('map-is-boss').addEventListener('change', (e) => {
        document.getElementById('boss-fields').classList.toggle('hidden', !e.target.checked);
    });

    // Bind direction grid
    document.querySelectorAll('.direction-grid .grid-cell:not(.center)').forEach(cell => {
        cell.addEventListener('click', () => cell.classList.toggle('active'));
    });

    // Create new
    document.getElementById('btn-create-new').addEventListener('click', () => {
        if (currentTab === 'items') {
            currentEditingId = null;
            clearItemForm();
            document.getElementById('item-id').value = 'new_item_' + Date.now();
        } else {
            currentEditingId = null;
            clearMapForm();
            document.getElementById('map-id').value = 'round_' + (mapsData.length + 1);
        }
        renderSidebar();
    });

    // Initial select
    if (itemsData.length > 0) loadItemIntoForm(itemsData[0]);

    // Init templates panel
    renderTemplates();
}

function buildKnightGrid() {
    const grid = document.getElementById('knight-grid');
    grid.innerHTML = '';
    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            if (r === 0 && c === 0) {
                cell.classList.add('center');
                cell.textContent = '♞';
            } else {
                cell.dataset.dr = r;
                cell.dataset.dc = c;
                cell.addEventListener('click', () => cell.classList.toggle('active'));
            }
            grid.appendChild(cell);
        }
    }
}

// Update center icon of direction grid when piece selector changes
function updateDirGridCenter() {
    const sel = document.getElementById('dir-piece-select');
    if (!sel) return;
    const center = document.getElementById('dir-grid-center');
    if (center) center.textContent = sel.value;
}

// ============================================================
// TEMPLATES — ready-made presets per piece type
// ============================================================

const ITEM_TEMPLATES = {
    pawn: [
        { label: '🔙 Отступление', data: { name: 'Отступление', icon: '🔙', rarity: 'common', category: 'movement', cost: 30, allowedPieces: ['pawn'], modifiers: { pawnCanRetreat: true }, extraDirections: [], extraKnightOffsets: [], description: 'Пешка ходит назад на 1 клетку.' } },
        { label: '🎯 Атака вперёд', data: { name: 'Атака вперёд', icon: '🎯', rarity: 'rare', category: 'offense', cost: 70, allowedPieces: ['pawn'], modifiers: { pawnCanCaptureForward: true }, extraDirections: [], extraKnightOffsets: [], description: 'Пешка берёт фигуры прямо вперёд.' } },
        { label: '📜 Раннее превращение', data: { name: 'Свиток превращения', icon: '📜', rarity: 'rare', category: 'offense', cost: 90, allowedPieces: ['pawn'], modifiers: { earlyPromotion: true }, extraDirections: [], extraKnightOffsets: [], description: 'Пешка превращается на 6-м ряду.' } },
        { label: '🔭 Дальнее взятие x2', data: { name: 'Снайперский прицел', icon: '🔭', rarity: 'rare', category: 'offense', cost: 65, allowedPieces: ['pawn'], modifiers: { pawnCaptureRange: 2 }, extraDirections: [], extraKnightOffsets: [], description: 'Пешка берёт на расстоянии 2 диагонально.' } },
        { label: '🪞 Атака назад', data: { name: 'Проклятое зеркало', icon: '🪞', rarity: 'common', category: 'offense', cost: 35, allowedPieces: ['pawn'], modifiers: { pawnCanCaptureBackward: true }, extraDirections: [], extraKnightOffsets: [], description: 'Пешка атакует назад по диагонали.' } },
        { label: '⬆ Доп. шаг вперёд', data: { name: 'Марш-бросок', icon: '⚡', rarity: 'common', category: 'movement', cost: 25, allowedPieces: ['pawn'], modifiers: {}, extraDirections: [[-1, 0]], extraKnightOffsets: [], description: 'Пешка ходит ещё на 1 вперёд.' } },
    ],
    rook: [
        { label: '💠 Диаг. скольжение', data: { name: 'Диагональное скольжение', icon: '💠', rarity: 'common', category: 'movement', cost: 35, allowedPieces: ['rook'], modifiers: {}, extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]], extraKnightOffsets: [], description: 'Ладья ходит на 1 клетку по диагонали.' } },
        { label: '👢 +1 дальность', data: { name: 'Сапоги скорости', icon: '👢', rarity: 'common', category: 'movement', cost: 40, allowedPieces: ['rook'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 к дальности хода.' } },
        { label: '⚔️ +1 взятие', data: { name: 'Острый клинок', icon: '⚔️', rarity: 'common', category: 'offense', cost: 45, allowedPieces: ['rook'], modifiers: { extraCaptureRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 к дальности взятия.' } },
        { label: '🪽 Прыжок', data: { name: 'Крылья', icon: '🪽', rarity: 'epic', category: 'movement', cost: 120, allowedPieces: ['rook'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: 'Ладья прыгает через фигуры.' } },
    ],
    bishop: [
        { label: '🧭 Прямой ход', data: { name: 'Компас', icon: '🧭', rarity: 'common', category: 'movement', cost: 35, allowedPieces: ['bishop'], modifiers: {}, extraDirections: [[-1,0],[1,0],[0,-1],[0,1]], extraKnightOffsets: [], description: 'Слон ходит на 1 по прямой.' } },
        { label: '👢 +1 дальность', data: { name: 'Сапоги скорости', icon: '👢', rarity: 'common', category: 'movement', cost: 40, allowedPieces: ['bishop'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 к дальности хода.' } },
        { label: '🪽 Прыжок', data: { name: 'Крылья', icon: '🪽', rarity: 'epic', category: 'movement', cost: 120, allowedPieces: ['bishop'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: 'Слон прыгает через фигуры.' } },
    ],
    queen: [
        { label: '👢 +1 дальность', data: { name: 'Ускоренный ферзь', icon: '👢', rarity: 'rare', category: 'movement', cost: 60, allowedPieces: ['queen'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 к дальности хода ферзя.' } },
        { label: '⚔️ +1 взятие', data: { name: 'Грозный ферзь', icon: '⚔️', rarity: 'rare', category: 'offense', cost: 70, allowedPieces: ['queen'], modifiers: { extraCaptureRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 к дальности взятия ферзя.' } },
        { label: '🪽 Прыжок', data: { name: 'Парящий ферзь', icon: '🪽', rarity: 'epic', category: 'movement', cost: 130, allowedPieces: ['queen'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: 'Ферзь прыгает через фигуры.' } },
    ],
    knight: [
        { label: '🐴 Длинный прыжок 3×1', data: { name: 'Подкова', icon: '🐴', rarity: 'rare', category: 'movement', cost: 70, allowedPieces: ['knight'], modifiers: {}, extraDirections: [], extraKnightOffsets: [[-3,-1],[-3,1],[3,-1],[3,1],[-1,-3],[-1,3],[1,-3],[1,3]], description: 'Конь прыгает 3x1.' } },
        { label: '🌑 Прямой шаг ×2', data: { name: 'Шаг тени', icon: '🌑', rarity: 'rare', category: 'movement', cost: 55, allowedPieces: ['knight'], modifiers: {}, extraDirections: [], extraKnightOffsets: [[-2,0],[2,0],[0,-2],[0,2]], description: 'Конь шагает на 2 по прямой.' } },
        { label: '✨ Шаги как у короля', data: { name: 'Магические сапоги', icon: '✨', rarity: 'rare', category: 'movement', cost: 60, allowedPieces: ['knight'], modifiers: {}, extraDirections: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]], extraKnightOffsets: [], description: 'Конь ходит как король на 1.' } },
    ],
    king: [
        { label: '👑 Ходит как ферзь', data: { name: 'Корона короля', icon: '👑', rarity: 'epic', category: 'movement', cost: 150, allowedPieces: ['king'], modifiers: { moveAsQueen: true }, extraDirections: [], extraKnightOffsets: [], description: 'Король ходит как ферзь!' } },
    ],
    all: [
        { label: '🛡 Щит (1 заряд)', data: { name: 'Деревянный щит', icon: '🛡️', rarity: 'common', category: 'defense', cost: 50, allowedPieces: ['all'], modifiers: { shield: 1 }, extraDirections: [], extraKnightOffsets: [], description: 'Выживает после первого взятия.' } },
        { label: '🔰 Щит (2 заряда)', data: { name: 'Стальной щит', icon: '🔰', rarity: 'epic', category: 'defense', cost: 110, allowedPieces: ['all'], modifiers: { shield: 2 }, extraDirections: [], extraKnightOffsets: [], description: 'Выживает после двух взятий.' } },
        { label: '🦷 +15 золота/взятие', data: { name: 'Золотой зуб', icon: '🦷', rarity: 'common', category: 'offense', cost: 40, allowedPieces: ['all'], modifiers: { goldPerCapture: 15 }, extraDirections: [], extraKnightOffsets: [], description: '+15 золота за взятие.' } },
        { label: '🔥 +25 золота/взятие', data: { name: 'Огненный меч', icon: '🔥', rarity: 'rare', category: 'offense', cost: 80, allowedPieces: ['all'], modifiers: { goldPerCapture: 25 }, extraDirections: [], extraKnightOffsets: [], description: '+25 золота за взятие.' } },
        { label: '🍀 +100 за победу', data: { name: 'Счастливая монета', icon: '🍀', rarity: 'rare', category: 'utility', cost: 75, allowedPieces: ['all'], modifiers: { goldOnWin: 100 }, extraDirections: [], extraKnightOffsets: [], description: '+100 золота за победу.' } },
        { label: '🪖 Иммунитет к пешкам', data: { name: 'Железная броня', icon: '🪖', rarity: 'rare', category: 'defense', cost: 75, allowedPieces: ['all'], modifiers: { immuneToPawns: true }, extraDirections: [], extraKnightOffsets: [], description: 'Нельзя взять пешкой.' } },
        { label: '🌵 Иммунитет к коням', data: { name: 'Шипы', icon: '🌵', rarity: 'common', category: 'defense', cost: 40, allowedPieces: ['all'], modifiers: { immuneToKnights: true }, extraDirections: [], extraKnightOffsets: [], description: 'Нельзя взять конём.' } },
        { label: '🧥 20% уклонение', data: { name: 'Плащ уклонения', icon: '🧥', rarity: 'rare', category: 'defense', cost: 80, allowedPieces: ['all'], modifiers: { dodgeChance: 0.20 }, extraDirections: [], extraKnightOffsets: [], description: '20% шанс уклониться.' } },
        { label: '👻 35% уклонение', data: { name: 'Плащ призрака', icon: '👻', rarity: 'epic', category: 'defense', cost: 130, allowedPieces: ['all'], modifiers: { dodgeChance: 0.35 }, extraDirections: [], extraKnightOffsets: [], description: '35% шанс уклониться.' } },
    ],
};

function renderTemplates() {
    const sel = document.getElementById('tpl-piece-select');
    const piece = sel ? sel.value : 'pawn';
    const container = document.getElementById('tpl-buttons');
    if (!container) return;
    container.innerHTML = '';
    const templates = ITEM_TEMPLATES[piece] || [];
    if (!templates.length) {
        container.innerHTML = '<span style="color:var(--text-dim); font-size:0.85em;">Нет шаблонов для этой фигуры</span>';
        return;
    }
    templates.forEach(tpl => {
        const btn = document.createElement('button');
        btn.textContent = tpl.label;
        btn.title = tpl.data.description;
        btn.style.cssText = 'background:rgba(240,192,72,0.12); border-color:rgba(240,192,72,0.4); color:#f0c048; font-size:0.82em; padding:6px 12px; white-space:nowrap;';
        btn.onmouseover = () => btn.style.background = 'rgba(240,192,72,0.25)';
        btn.onmouseout  = () => btn.style.background = 'rgba(240,192,72,0.12)';
        btn.onclick = () => applyTemplate(tpl.data);
        container.appendChild(btn);
    });
}

function applyTemplate(data) {
    document.getElementById('item-name').value = data.name || '';
    document.getElementById('item-icon').value = data.icon || '';
    document.getElementById('item-desc').value = data.description || '';
    document.getElementById('item-rarity').value = data.rarity || 'common';
    document.getElementById('item-category').value = data.category || 'offense';
    document.getElementById('item-cost').value = data.cost || 50;
    const baseId = (data.name || 'item').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    document.getElementById('item-id').value = baseId + '_' + Date.now().toString().slice(-4);

    document.querySelectorAll('#item-allowed-pieces input').forEach(cb => {
        cb.checked = (data.allowedPieces || ['all']).includes(cb.value);
    });

    const modContainer = document.getElementById('modifiers-container');
    modContainer.innerHTML = '';
    if (data.modifiers) {
        for (const [k, v] of Object.entries(data.modifiers)) addModifierField(k, v);
    }

    document.querySelectorAll('.direction-grid .grid-cell').forEach(c => c.classList.remove('active'));
    (data.extraDirections || []).forEach(d => {
        const cell = document.querySelector(`.direction-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
        if (cell) cell.classList.add('active');
    });

    document.querySelectorAll('.knight-grid .grid-cell').forEach(c => c.classList.remove('active'));
    (data.extraKnightOffsets || []).forEach(d => {
        const cell = document.querySelector(`.knight-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
        if (cell) cell.classList.add('active');
    });

    showToast('Шаблон применён — измени ID и нажми «Сохранить»!');
}

// ============================================================
// EFFECTS REFERENCE — all items from ITEMS_DB
// ============================================================

let effectsRefVisible = false;

function toggleEffectsRef() {
    effectsRefVisible = !effectsRefVisible;
    const panel = document.getElementById('effects-ref-panel');
    const btn = document.getElementById('btn-toggle-effects');
    panel.classList.toggle('hidden', !effectsRefVisible);
    btn.textContent = effectsRefVisible ? '🔼 Скрыть предметы' : '📋 Все предметы из игры';
    if (effectsRefVisible) {
        // Reset filters
        const srch = document.getElementById('effects-search');
        const fp = document.getElementById('effects-filter-piece');
        const fc = document.getElementById('effects-filter-cat');
        if (srch) srch.value = '';
        if (fp) fp.value = 'all';
        if (fc) fc.value = '';
        renderEffectsRef('', 'all', '');
    }
}

function renderEffectsRef(filterText, filterPiece, filterCat) {
    const container = document.getElementById('effects-ref-list');
    if (!container) return;
    container.innerHTML = '';

    const sourceItems = (typeof ITEMS_DB !== 'undefined') ? Object.values(ITEMS_DB) : itemsData;
    const rcMap = { common: '#9a95b0', rare: '#4488ff', epic: '#9d93fa', legendary: '#f0c048' };
    const ft = (filterText || '').toLowerCase();
    const fp = filterPiece || 'all';
    const fc = filterCat || '';

    const filtered = sourceItems.filter(item => {
        if (ft && !item.name.toLowerCase().includes(ft) && !item.id.toLowerCase().includes(ft)) return false;
        if (fp && fp !== 'all') {
            const ap = item.allowedPieces || ['all'];
            if (!ap.includes('all') && !ap.includes(fp)) return false;
        }
        if (fc && item.category !== fc) return false;
        return true;
    });

    if (!filtered.length) {
        container.innerHTML = '<div style="color:var(--text-dim); font-size:0.85em; padding:12px;">Ничего не найдено</div>';
        return;
    }

    filtered.forEach(item => {
        const rc = rcMap[item.rarity] || '#9a95b0';
        const card = document.createElement('div');
        card.style.cssText = `background:rgba(255,255,255,0.04); border:1px solid ${rc}44; border-radius:8px; padding:10px 8px; cursor:pointer; transition:all 0.15s; display:flex; flex-direction:column; gap:4px;`;
        card.title = 'Кликни — модификаторы добавятся в форму выше';

        const mods = item.modifiers || {};
        const modCount = Object.keys(mods).length + (item.extraDirections?.length || 0) + (item.extraKnightOffsets?.length || 0);
        const ap = (item.allowedPieces || ['all']).join(', ');

        card.innerHTML = `
            <div style="font-size:1.6em; line-height:1; text-align:center;">${item.icon || '📦'}</div>
            <div style="font-weight:600; font-size:0.82em; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="font-size:0.72em; color:${rc}; text-align:center;">${item.rarity}</div>
            <div style="font-size:0.7em; color:var(--text-dim); text-align:center;">${modCount} параметр${modCount === 1 ? '' : modCount < 5 ? 'а' : 'ов'}</div>
        `;

        card.onmouseover = () => {
            card.style.background = `rgba(255,255,255,0.1)`;
            card.style.borderColor = rc;
            card.style.transform = 'translateY(-2px)';
        };
        card.onmouseout = () => {
            card.style.background = 'rgba(255,255,255,0.04)';
            card.style.borderColor = `${rc}44`;
            card.style.transform = 'none';
        };
        card.onclick = () => {
            for (const [k, v] of Object.entries(mods)) addModifierField(k, v);
            (item.extraDirections || []).forEach(d => {
                const c = document.querySelector(`.direction-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
                if (c) c.classList.add('active');
            });
            (item.extraKnightOffsets || []).forEach(d => {
                const c = document.querySelector(`.knight-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
                if (c) c.classList.add('active');
            });
            showToast(`✅ Эффекты из «${item.name}» добавлены!`);
        };

        container.appendChild(card);
    });

    // Update counter
    const countEl = document.getElementById('effects-ref-count');
    if (countEl) countEl.textContent = `${filtered.length} из ${sourceItems.length}`;

// --- Storage ---

function loadDataFromStorage() {
    try {
        const i = localStorage.getItem(STORAGE_KEY_ITEMS);
        if (i) itemsData = JSON.parse(i);
        const m = localStorage.getItem(STORAGE_KEY_MAPS);
        if (m) mapsData = JSON.parse(m);
    } catch(e) { console.error("Error loading storage", e); }
}

function saveDataToStorage() {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(itemsData));
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(mapsData));
}

// --- Tabs & Sidebar ---

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-items').classList.toggle('active', tab === 'items');
    document.getElementById('tab-maps').classList.toggle('active', tab === 'maps');
    document.getElementById('tab-ref').classList.toggle('active', tab === 'ref');

    document.getElementById('editor-items').classList.toggle('hidden', tab !== 'items');
    document.getElementById('editor-maps').classList.toggle('hidden', tab !== 'maps');

    const isRef = tab === 'ref';
    document.getElementById('sidebar-list').classList.toggle('hidden', isRef);
    document.getElementById('sidebar-ref').classList.toggle('hidden', !isRef);
    document.getElementById('sidebar-actions').classList.toggle('hidden', isRef);

    document.getElementById('editor-title').textContent =
        tab === 'items' ? 'Редактор предметов' :
        tab === 'maps'  ? 'Редактор раундов'   : 'Справка по модификаторам';

    if (tab !== 'ref') {
        renderSidebar();
        if (tab === 'items' && itemsData.length > 0) {
            loadItemIntoForm(itemsData[0]);
        } else if (tab === 'maps' && mapsData.length > 0) {
            loadMapIntoForm(mapsData[0]);
        } else {
            if (tab === 'items') clearItemForm();
            if (tab === 'maps') clearMapForm();
        }
    }
}

function renderSidebar() {
    const container = document.getElementById('sidebar-list');
    container.innerHTML = '';
    
    const data = currentTab === 'items' ? itemsData : mapsData;
    
    data.forEach(item => {
        const el = document.createElement('div');
        el.className = 'list-item';
        if (currentTab === 'items') {
            el.classList.add(`rarity-${item.rarity}`);
            el.innerHTML = `<span>${item.icon || '📦'}</span> <span>${item.name || item.id}</span>`;
        } else {
            el.textContent = `${item.id}: ${item.name}`;
        }
        
        if (item.id === currentEditingId) el.classList.add('active');
        
        el.addEventListener('click', () => {
            if (currentTab === 'items') loadItemIntoForm(item);
            else loadMapIntoForm(item);
        });
        
        container.appendChild(el);
    });
}

// --- Form Population ---

function loadItemIntoForm(item) {
    currentEditingId = item.id;
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-desc').value = item.description || '';
    document.getElementById('item-icon').value = item.icon || '';
    document.getElementById('item-rarity').value = item.rarity || 'common';
    document.getElementById('item-category').value = item.category || 'offense';
    document.getElementById('item-cost').value = item.cost || 50;

    const allowed = item.allowedPieces || ['all'];
    document.querySelectorAll('#item-allowed-pieces input').forEach(cb => {
        cb.checked = allowed.includes(cb.value);
    });

    const modContainer = document.getElementById('modifiers-container');
    modContainer.innerHTML = '';
    if (item.modifiers) {
        for (const [key, val] of Object.entries(item.modifiers)) {
            addModifierField(key, val);
        }
    }

    document.querySelectorAll('.direction-grid .grid-cell').forEach(c => c.classList.remove('active'));
    if (item.extraDirections) {
        item.extraDirections.forEach(d => {
            const cell = document.querySelector(`.direction-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
            if (cell) cell.classList.add('active');
        });
    }

    document.querySelectorAll('.knight-grid .grid-cell').forEach(c => c.classList.remove('active'));
    if (item.extraKnightOffsets) {
        item.extraKnightOffsets.forEach(d => {
            const cell = document.querySelector(`.knight-grid .grid-cell[data-dr="${d[0]}"][data-dc="${d[1]}"]`);
            if (cell) cell.classList.add('active');
        });
    }

    renderSidebar();
}

function clearItemForm() {
    document.getElementById('item-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-icon').value = '';
    document.getElementById('item-rarity').value = 'common';
    document.getElementById('item-category').value = 'offense';
    document.getElementById('item-cost').value = 50;
    document.querySelectorAll('#item-allowed-pieces input').forEach(cb => cb.checked = false);
    document.getElementById('modifiers-container').innerHTML = '';
    document.querySelectorAll('.direction-grid .grid-cell').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.knight-grid .grid-cell').forEach(c => c.classList.remove('active'));
}

function loadMapIntoForm(map) {
    currentEditingId = map.id;
    document.getElementById('map-id').value = map.id;
    document.getElementById('map-name').value = map.name || '';
    document.getElementById('map-desc').value = map.description || '';
    document.getElementById('map-diff').value = map.difficulty || 1;
    document.getElementById('map-ai').value = map.aiDepth || 2;
    document.getElementById('map-gold').value = map.goldReward || 60;
    
    document.getElementById('map-is-boss').checked = !!map.isBoss;
    document.getElementById('boss-fields').classList.toggle('hidden', !map.isBoss);
    document.getElementById('map-boss-name').value = map.bossName || '';
    document.getElementById('map-boss-desc').value = map.bossDescription || '';

    const eiContainer = document.getElementById('enemy-items-container');
    eiContainer.innerHTML = '';
    if (map.enemyItems) {
        map.enemyItems.forEach(ei => {
            addEnemyItemField(ei.pieceType, ei.pieceIndex, ei.itemId);
        });
    }

    renderSidebar();
}

function clearMapForm() {
    document.getElementById('map-id').value = '';
    document.getElementById('map-name').value = '';
    document.getElementById('map-desc').value = '';
    document.getElementById('map-diff').value = 1;
    document.getElementById('map-ai').value = 2;
    document.getElementById('map-gold').value = 60;
    document.getElementById('map-is-boss').checked = false;
    document.getElementById('boss-fields').classList.add('hidden');
    document.getElementById('map-boss-name').value = '';
    document.getElementById('map-boss-desc').value = '';
    document.getElementById('enemy-items-container').innerHTML = '';
}

// --- Dynamic Fields ---

function addModifierField(key = '', val = '') {
    const div = document.createElement('div');
    div.className = 'modifier-row';
    div.innerHTML = `
        <input type="text" class="mod-key" placeholder="extraRange" value="${key}">
        <input type="text" class="mod-val" placeholder="1 или true" value="${val}">
        <button class="danger" onclick="this.parentElement.remove()">X</button>
    `;
    document.getElementById('modifiers-container').appendChild(div);
}

function addEnemyItemField(type = 'queen', index = 0, itemId = '') {
    const div = document.createElement('div');
    div.className = 'enemy-item-row';
    
    let options = '';
    itemsData.forEach(item => {
        options += `<option value="${item.id}" ${item.id === itemId ? 'selected' : ''}>${item.name || item.id}</option>`;
    });

    div.innerHTML = `
        <select class="ei-type">
            <option value="king" ${type==='king'?'selected':''}>Король</option>
            <option value="queen" ${type==='queen'?'selected':''}>Ферзь</option>
            <option value="rook" ${type==='rook'?'selected':''}>Ладья</option>
            <option value="bishop" ${type==='bishop'?'selected':''}>Слон</option>
            <option value="knight" ${type==='knight'?'selected':''}>Конь</option>
            <option value="pawn" ${type==='pawn'?'selected':''}>Пешка</option>
        </select>
        <input type="number" class="ei-index" value="${index}" min="0" max="7" title="Индекс фигуры (0 - первая найденная, 1 - вторая)">
        <select class="ei-item">
            ${options}
        </select>
        <button class="danger" onclick="this.parentElement.remove()">X</button>
    `;
    document.getElementById('enemy-items-container').appendChild(div);
}

// --- Save & Delete ---

function saveCurrentItem() {
    if (currentTab === 'items') {
        const id = document.getElementById('item-id').value.trim();
        if (!id) return alert('Укажите ID!');

        const item = {
            id,
            name: document.getElementById('item-name').value,
            description: document.getElementById('item-desc').value,
            icon: document.getElementById('item-icon').value,
            rarity: document.getElementById('item-rarity').value,
            category: document.getElementById('item-category').value,
            cost: parseInt(document.getElementById('item-cost').value) || 0,
            allowedPieces: [],
            modifiers: {},
            extraDirections: [],
            extraKnightOffsets: []
        };

        document.querySelectorAll('#item-allowed-pieces input:checked').forEach(cb => {
            item.allowedPieces.push(cb.value);
        });
        if (item.allowedPieces.length === 0) item.allowedPieces = ['all'];

        document.querySelectorAll('.modifier-row').forEach(row => {
            const key = row.querySelector('.mod-key').value.trim();
            const valStr = row.querySelector('.mod-val').value.trim();
            if (key) {
                let val = valStr;
                if (valStr === 'true') val = true;
                else if (valStr === 'false') val = false;
                else if (!isNaN(valStr) && valStr !== '') val = Number(valStr);
                item.modifiers[key] = val;
            }
        });

        document.querySelectorAll('.direction-grid .grid-cell.active').forEach(c => {
            item.extraDirections.push([parseInt(c.dataset.dr), parseInt(c.dataset.dc)]);
        });

        document.querySelectorAll('.knight-grid .grid-cell.active').forEach(c => {
            item.extraKnightOffsets.push([parseInt(c.dataset.dr), parseInt(c.dataset.dc)]);
        });

        const idx = itemsData.findIndex(i => i.id === currentEditingId);
        if (idx >= 0 && currentEditingId === id) {
            itemsData[idx] = item;
        } else {
            if (itemsData.some(i => i.id === id)) {
                return alert('Предмет с таким ID уже существует!');
            }
            itemsData.push(item);
        }
        currentEditingId = id;

    } else {
        const id = document.getElementById('map-id').value.trim();
        if (!id) return alert('Укажите ID!');

        const map = {
            id,
            name: document.getElementById('map-name').value,
            description: document.getElementById('map-desc').value,
            difficulty: parseInt(document.getElementById('map-diff').value) || 1,
            aiDepth: parseInt(document.getElementById('map-ai').value) || 2,
            goldReward: parseInt(document.getElementById('map-gold').value) || 0,
            enemySetup: "standard",
            enemyItems: [],
            isBoss: document.getElementById('map-is-boss').checked,
        };

        if (map.isBoss) {
            map.bossName = document.getElementById('map-boss-name').value;
            map.bossDescription = document.getElementById('map-boss-desc').value;
        }

        document.querySelectorAll('.enemy-item-row').forEach(row => {
            map.enemyItems.push({
                pieceType: row.querySelector('.ei-type').value,
                pieceIndex: parseInt(row.querySelector('.ei-index').value) || 0,
                itemId: row.querySelector('.ei-item').value
            });
        });

        const idx = mapsData.findIndex(m => m.id === currentEditingId);
        if (idx >= 0 && currentEditingId === id) {
            mapsData[idx] = map;
        } else {
            if (mapsData.some(m => m.id === id)) {
                return alert('Раунд с таким ID уже существует!');
            }
            mapsData.push(map);
        }
        currentEditingId = id;
    }

    saveDataToStorage();
    renderSidebar();
    showToast('Сохранено');
}

function deleteCurrentItem() {
    if (!currentEditingId) return;
    if (!confirm('Точно удалить?')) return;

    if (currentTab === 'items') {
        itemsData = itemsData.filter(i => i.id !== currentEditingId);
        if (itemsData.length > 0) loadItemIntoForm(itemsData[0]);
        else clearItemForm();
    } else {
        mapsData = mapsData.filter(m => m.id !== currentEditingId);
        if (mapsData.length > 0) loadMapIntoForm(mapsData[0]);
        else clearMapForm();
    }
    
    saveDataToStorage();
    renderSidebar();
    showToast('Удалено');
}

// --- Import / Export ---

function exportData() {
    const data = currentTab === 'items' ? itemsData : mapsData;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        .then(() => showToast('JSON скопирован в буфер обмена'))
        .catch(e => {
            console.error('Failed to copy', e);
            alert('Не удалось скопировать (см. консоль)');
        });
}

function importData() {
    const jsonStr = prompt('Вставьте JSON-массив сюда:');
    if (!jsonStr) return;
    
    try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) throw new Error('Ожидается массив JSON');
        
        if (currentTab === 'items') {
            itemsData = parsed;
            if (itemsData.length > 0) loadItemIntoForm(itemsData[0]);
        } else {
            mapsData = parsed;
            if (mapsData.length > 0) loadMapIntoForm(mapsData[0]);
        }
        
        saveDataToStorage();
        renderSidebar();
        showToast('Импорт успешен');
    } catch(e) {
        alert('Ошибка парсинга JSON: ' + e.message);
    }
}

// --- Toast ---

function showToast(msg) {
    const toast = document.getElementById('status-toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
}

// --- Copy modifier key to clipboard ---
function copyKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => showToast(`📋 Скопировано: ${key}`))
        .catch(() => showToast(`Ключ: ${key}`));
}

// Init on load
document.addEventListener('DOMContentLoaded', init);
