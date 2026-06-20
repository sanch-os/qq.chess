
with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\editor.js', 'r', encoding='utf-8') as f:
    content = f.read()

OLD = "    // Initial select\n    if (itemsData.length > 0) loadItemIntoForm(itemsData[0]);\n}"

NEW = r"""    // Initial select
    if (itemsData.length > 0) loadItemIntoForm(itemsData[0]);

    // Init templates panel
    renderTemplates();
}

// ============================================================
// TEMPLATES
// ============================================================

const ITEM_TEMPLATES = {
    pawn: [
        { label: '\u{1F519} \u041e\u0442\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u0435', data: { name: '\u041e\u0442\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u0435', icon: '\u{1F519}', rarity: 'common', category: 'movement', cost: 30, allowedPieces: ['pawn'], modifiers: { pawnCanRetreat: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u0445\u043e\u0434\u0438\u0442 \u043d\u0430\u0437\u0430\u0434 \u043d\u0430 1 \u043a\u043b\u0435\u0442\u043a\u0443.' } },
        { label: '\u{1F3AF} \u0410\u0442\u0430\u043a\u0430 \u0432\u043f\u0435\u0440\u0451\u0434', data: { name: '\u0410\u0442\u0430\u043a\u0430 \u0432\u043f\u0435\u0440\u0451\u0434', icon: '\u{1F3AF}', rarity: 'rare', category: 'offense', cost: 70, allowedPieces: ['pawn'], modifiers: { pawnCanCaptureForward: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u0431\u0435\u0440\u0451\u0442 \u0444\u0438\u0433\u0443\u0440\u044b \u043f\u0440\u044f\u043c\u043e \u0432\u043f\u0435\u0440\u0451\u0434.' } },
        { label: '\u{1F4DC} \u0420\u0430\u043d\u043d\u0435\u0435 \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435', data: { name: '\u0421\u0432\u0438\u0442\u043e\u043a \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u044f', icon: '\u{1F4DC}', rarity: 'rare', category: 'offense', cost: 90, allowedPieces: ['pawn'], modifiers: { earlyPromotion: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044f \u043d\u0430 6-\u043c \u0440\u044f\u0434\u0443.' } },
        { label: '\u{1F52D} \u0414\u0430\u043b\u044c\u043d\u0435\u0435 \u0432\u0437\u044f\u0442\u0438\u0435', data: { name: '\u0421\u043d\u0430\u0439\u043f\u0435\u0440\u0441\u043a\u0438\u0439 \u043f\u0440\u0438\u0446\u0435\u043b', icon: '\u{1F52D}', rarity: 'rare', category: 'offense', cost: 65, allowedPieces: ['pawn'], modifiers: { pawnCaptureRange: 2 }, extraDirections: [], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u0431\u0435\u0440\u0451\u0442 \u043d\u0430 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0438 2 \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u044c\u043d\u043e.' } },
        { label: '\u{1FAA7} \u0410\u0442\u0430\u043a\u0430 \u043d\u0430\u0437\u0430\u0434', data: { name: '\u041f\u0440\u043e\u043a\u043b\u044f\u0442\u043e\u0435 \u0437\u0435\u0440\u043a\u0430\u043b\u043e', icon: '\u{1FAA7}', rarity: 'common', category: 'offense', cost: 35, allowedPieces: ['pawn'], modifiers: { pawnCanCaptureBackward: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u0430\u0442\u0430\u043a\u0443\u0435\u0442 \u043d\u0430\u0437\u0430\u0434 \u043f\u043e \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u0438.' } },
        { label: '\u2b06 \u0414\u043e\u043f. \u0448\u0430\u0433 \u0432\u043f\u0435\u0440\u0451\u0434', data: { name: '\u041c\u0430\u0440\u0448-\u0431\u0440\u043e\u0441\u043e\u043a', icon: '\u26a1', rarity: 'common', category: 'movement', cost: 25, allowedPieces: ['pawn'], modifiers: {}, extraDirections: [[-1, 0]], extraKnightOffsets: [], description: '\u041f\u0435\u0448\u043a\u0430 \u0445\u043e\u0434\u0438\u0442 \u0435\u0449\u0451 \u043d\u0430 1 \u0432\u043f\u0435\u0440\u0451\u0434.' } },
    ],
    rook: [
        { label: '\u{1F4A0} \u0414\u0438\u0430\u0433. \u0441\u043a\u043e\u043b\u044c\u0436\u0435\u043d\u0438\u0435', data: { name: '\u0414\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0435 \u0441\u043a\u043e\u043b\u044c\u0436\u0435\u043d\u0438\u0435', icon: '\u{1F4A0}', rarity: 'common', category: 'movement', cost: 35, allowedPieces: ['rook'], modifiers: {}, extraDirections: [[-1,-1],[-1,1],[1,-1],[1,1]], extraKnightOffsets: [], description: '\u041b\u0430\u0434\u044c\u044f \u0445\u043e\u0434\u0438\u0442 \u043d\u0430 1 \u043a\u043b\u0435\u0442\u043a\u0443 \u043f\u043e \u0434\u0438\u0430\u0433\u043e\u043d\u0430\u043b\u0438.' } },
        { label: '\u{1F462} +1 \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', data: { name: '\u0421\u0430\u043f\u043e\u0433\u0438 \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438', icon: '\u{1F462}', rarity: 'common', category: 'movement', cost: 40, allowedPieces: ['rook'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 \u043a \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0445\u043e\u0434\u0430.' } },
        { label: '\u2694\ufe0f +1 \u0432\u0437\u044f\u0442\u0438\u0435', data: { name: '\u041e\u0441\u0442\u0440\u044b\u0439 \u043a\u043b\u0438\u043d\u043e\u043a', icon: '\u2694\ufe0f', rarity: 'common', category: 'offense', cost: 45, allowedPieces: ['rook'], modifiers: { extraCaptureRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 \u043a \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0432\u0437\u044f\u0442\u0438\u044f.' } },
        { label: '\u{1FABD} \u041f\u0440\u044b\u0436\u043e\u043a', data: { name: '\u041a\u0440\u044b\u043b\u044c\u044f', icon: '\u{1FABD}', rarity: 'epic', category: 'movement', cost: 120, allowedPieces: ['rook'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041b\u0430\u0434\u044c\u044f \u043f\u0440\u044b\u0433\u0430\u0435\u0442 \u0447\u0435\u0440\u0435\u0437 \u0444\u0438\u0433\u0443\u0440\u044b.' } },
    ],
    bishop: [
        { label: '\u{1F9ED} \u041f\u0440\u044f\u043c\u043e\u0439 \u0445\u043e\u0434', data: { name: '\u041a\u043e\u043c\u043f\u0430\u0441', icon: '\u{1F9ED}', rarity: 'common', category: 'movement', cost: 35, allowedPieces: ['bishop'], modifiers: {}, extraDirections: [[-1,0],[1,0],[0,-1],[0,1]], extraKnightOffsets: [], description: '\u0421\u043b\u043e\u043d \u0445\u043e\u0434\u0438\u0442 \u043d\u0430 1 \u043f\u043e \u043f\u0440\u044f\u043c\u043e\u0439.' } },
        { label: '\u{1F462} +1 \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', data: { name: '\u0421\u0430\u043f\u043e\u0433\u0438 \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438', icon: '\u{1F462}', rarity: 'common', category: 'movement', cost: 40, allowedPieces: ['bishop'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 \u043a \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0445\u043e\u0434\u0430.' } },
        { label: '\u{1FABD} \u041f\u0440\u044b\u0436\u043e\u043a', data: { name: '\u041a\u0440\u044b\u043b\u044c\u044f', icon: '\u{1FABD}', rarity: 'epic', category: 'movement', cost: 120, allowedPieces: ['bishop'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: '\u0421\u043b\u043e\u043d \u043f\u0440\u044b\u0433\u0430\u0435\u0442 \u0447\u0435\u0440\u0435\u0437 \u0444\u0438\u0433\u0443\u0440\u044b.' } },
    ],
    queen: [
        { label: '\u{1F462} +1 \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c', data: { name: '\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u043d\u044b\u0439 \u0444\u0435\u0440\u0437\u044c', icon: '\u{1F462}', rarity: 'rare', category: 'movement', cost: 60, allowedPieces: ['queen'], modifiers: { extraRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 \u043a \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0445\u043e\u0434\u0430 \u0444\u0435\u0440\u0437\u044f.' } },
        { label: '\u2694\ufe0f +1 \u0432\u0437\u044f\u0442\u0438\u0435', data: { name: '\u0413\u0440\u043e\u0437\u043d\u044b\u0439 \u0444\u0435\u0440\u0437\u044c', icon: '\u2694\ufe0f', rarity: 'rare', category: 'offense', cost: 70, allowedPieces: ['queen'], modifiers: { extraCaptureRange: 1 }, extraDirections: [], extraKnightOffsets: [], description: '+1 \u043a \u0434\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438 \u0432\u0437\u044f\u0442\u0438\u044f \u0444\u0435\u0440\u0437\u044f.' } },
        { label: '\u{1FABD} \u041f\u0440\u044b\u0436\u043e\u043a', data: { name: '\u041f\u0430\u0440\u044f\u0449\u0438\u0439 \u0444\u0435\u0440\u0437\u044c', icon: '\u{1FABD}', rarity: 'epic', category: 'movement', cost: 130, allowedPieces: ['queen'], modifiers: { canJump: true }, extraDirections: [], extraKnightOffsets: [], description: '\u0424\u0435\u0440\u0437\u044c \u043f\u0440\u044b\u0433\u0430\u0435\u0442 \u0447\u0435\u0440\u0435\u0437 \u0444\u0438\u0433\u0443\u0440\u044b.' } },
    ],
    knight: [
        { label: '\u{1F434} \u0414\u043b\u0438\u043d\u043d\u044b\u0439 \u043f\u0440\u044b\u0436\u043e\u043a', data: { name: '\u041f\u043e\u0434\u043a\u043e\u0432\u0430', icon: '\u{1F434}', rarity: 'rare', category: 'movement', cost: 70, allowedPieces: ['knight'], modifiers: {}, extraDirections: [], extraKnightOffsets: [[-3,-1],[-3,1],[3,-1],[3,1],[-1,-3],[-1,3],[1,-3],[1,3]], description: '\u041a\u043e\u043d\u044c \u043f\u0440\u044b\u0433\u0430\u0435\u0442 3x1.' } },
        { label: '\u{1F311} \u041f\u0440\u044f\u043c\u043e\u0439 \u0448\u0430\u0433 2', data: { name: '\u0428\u0430\u0433 \u0442\u0435\u043d\u0438', icon: '\u{1F311}', rarity: 'rare', category: 'movement', cost: 55, allowedPieces: ['knight'], modifiers: {}, extraDirections: [], extraKnightOffsets: [[-2,0],[2,0],[0,-2],[0,2]], description: '\u041a\u043e\u043d\u044c \u0448\u0430\u0433\u0430\u0435\u0442 \u043d\u0430 2 \u043f\u043e \u043f\u0440\u044f\u043c\u043e\u0439.' } },
        { label: '\u2728 \u0428\u0430\u0433\u0438 \u0432\u043e \u0432\u0441\u0435 \u0441\u0442\u043e\u0440\u043e\u043d\u044b', data: { name: '\u041c\u0430\u0433\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0441\u0430\u043f\u043e\u0433\u0438', icon: '\u2728', rarity: 'rare', category: 'movement', cost: 60, allowedPieces: ['knight'], modifiers: {}, extraDirections: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]], extraKnightOffsets: [], description: '\u041a\u043e\u043d\u044c \u0445\u043e\u0434\u0438\u0442 \u043a\u0430\u043a \u043a\u043e\u0440\u043e\u043b\u044c \u043d\u0430 1.' } },
    ],
    king: [
        { label: '\u{1F451} \u0425\u043e\u0434\u0438\u0442 \u043a\u0430\u043a \u0444\u0435\u0440\u0437\u044c', data: { name: '\u041a\u043e\u0440\u043e\u043d\u0430 \u043a\u043e\u0440\u043e\u043b\u044f', icon: '\u{1F451}', rarity: 'epic', category: 'movement', cost: 150, allowedPieces: ['king'], modifiers: { moveAsQueen: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041a\u043e\u0440\u043e\u043b\u044c \u0445\u043e\u0434\u0438\u0442 \u043a\u0430\u043a \u0444\u0435\u0440\u0437\u044c!' } },
    ],
    all: [
        { label: '\u{1F6E1} \u0429\u0438\u0442 (1)', data: { name: '\u0414\u0435\u0440\u0435\u0432\u044f\u043d\u043d\u044b\u0439 \u0449\u0438\u0442', icon: '\u{1F6E1}\ufe0f', rarity: 'common', category: 'defense', cost: 50, allowedPieces: ['all'], modifiers: { shield: 1 }, extraDirections: [], extraKnightOffsets: [], description: '\u0412\u044b\u0436\u0438\u0432\u0430\u0435\u0442 \u043f\u043e\u0441\u043b\u0435 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0432\u0437\u044f\u0442\u0438\u044f.' } },
        { label: '\u{1F530} \u0429\u0438\u0442 (2)', data: { name: '\u0421\u0442\u0430\u043b\u044c\u043d\u043e\u0439 \u0449\u0438\u0442', icon: '\u{1F530}', rarity: 'epic', category: 'defense', cost: 110, allowedPieces: ['all'], modifiers: { shield: 2 }, extraDirections: [], extraKnightOffsets: [], description: '\u0412\u044b\u0436\u0438\u0432\u0430\u0435\u0442 \u043f\u043e\u0441\u043b\u0435 \u0434\u0432\u0443\u0445 \u0432\u0437\u044f\u0442\u0438\u0439.' } },
        { label: '\u{1F9B7} +15 \u0437\u043e\u043b\u043e\u0442\u0430', data: { name: '\u0417\u043e\u043b\u043e\u0442\u043e\u0439 \u0437\u0443\u0431', icon: '\u{1F9B7}', rarity: 'common', category: 'offense', cost: 40, allowedPieces: ['all'], modifiers: { goldPerCapture: 15 }, extraDirections: [], extraKnightOffsets: [], description: '+15 \u0437\u043e\u043b\u043e\u0442\u0430 \u0437\u0430 \u0432\u0437\u044f\u0442\u0438\u0435.' } },
        { label: '\u{1F340} +100 \u0437\u0430 \u043f\u043e\u0431\u0435\u0434\u0443', data: { name: '\u0421\u0447\u0430\u0441\u0442\u043b\u0438\u0432\u0430\u044f \u043c\u043e\u043d\u0435\u0442\u0430', icon: '\u{1F340}', rarity: 'rare', category: 'utility', cost: 75, allowedPieces: ['all'], modifiers: { goldOnWin: 100 }, extraDirections: [], extraKnightOffsets: [], description: '+100 \u0437\u043e\u043b\u043e\u0442\u0430 \u0437\u0430 \u043f\u043e\u0431\u0435\u0434\u0443.' } },
        { label: '\u{1FA96} \u0418\u043c\u043c\u0443\u043d\u0438\u0442\u0435\u0442 \u043a \u043f\u0435\u0448\u043a\u0430\u043c', data: { name: '\u0416\u0435\u043b\u0435\u0437\u043d\u0430\u044f \u0431\u0440\u043e\u043d\u044f', icon: '\u{1FA96}', rarity: 'rare', category: 'defense', cost: 75, allowedPieces: ['all'], modifiers: { immuneToPawns: true }, extraDirections: [], extraKnightOffsets: [], description: '\u041d\u0435\u043b\u044c\u0437\u044f \u0432\u0437\u044f\u0442\u044c \u043f\u0435\u0448\u043a\u043e\u0439.' } },
        { label: '\u{1F47B} 35% \u0443\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435', data: { name: '\u041f\u043b\u0430\u0449 \u043f\u0440\u0438\u0437\u0440\u0430\u043a\u0430', icon: '\u{1F47B}', rarity: 'epic', category: 'defense', cost: 130, allowedPieces: ['all'], modifiers: { dodgeChance: 0.35 }, extraDirections: [], extraKnightOffsets: [], description: '35% \u0448\u0430\u043d\u0441 \u0443\u043a\u043b\u043e\u043d\u0438\u0442\u044c\u0441\u044f.' } },
    ],
};

function renderTemplates() {
    var sel = document.getElementById('tpl-piece-select');
    var piece = sel ? sel.value : 'pawn';
    var container = document.getElementById('tpl-buttons');
    if (!container) return;
    container.innerHTML = '';
    var templates = ITEM_TEMPLATES[piece] || [];
    if (!templates.length) {
        container.innerHTML = '<span style="color:var(--text-dim); font-size:0.85em;">\u041d\u0435\u0442 \u0448\u0430\u0431\u043b\u043e\u043d\u043e\u0432</span>';
        return;
    }
    templates.forEach(function(tpl) {
        var btn = document.createElement('button');
        btn.textContent = tpl.label;
        btn.title = tpl.data.description;
        btn.style.cssText = 'background:rgba(240,192,72,0.12); border-color:rgba(240,192,72,0.4); color:#f0c048; font-size:0.82em; padding:6px 12px; white-space:nowrap;';
        btn.onmouseover = function() { btn.style.background = 'rgba(240,192,72,0.25)'; };
        btn.onmouseout  = function() { btn.style.background = 'rgba(240,192,72,0.12)'; };
        btn.onclick = function() { applyTemplate(tpl.data); };
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
    var baseId = (data.name || 'item').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    document.getElementById('item-id').value = baseId + '_' + Date.now().toString().slice(-4);
    document.querySelectorAll('#item-allowed-pieces input').forEach(function(cb) {
        cb.checked = (data.allowedPieces || ['all']).indexOf(cb.value) !== -1;
    });
    var modContainer = document.getElementById('modifiers-container');
    modContainer.innerHTML = '';
    if (data.modifiers) {
        Object.keys(data.modifiers).forEach(function(k) { addModifierField(k, data.modifiers[k]); });
    }
    document.querySelectorAll('.direction-grid .grid-cell').forEach(function(c) { c.classList.remove('active'); });
    (data.extraDirections || []).forEach(function(d) {
        var cell = document.querySelector('.direction-grid .grid-cell[data-dr="' + d[0] + '"][data-dc="' + d[1] + '"]');
        if (cell) cell.classList.add('active');
    });
    document.querySelectorAll('.knight-grid .grid-cell').forEach(function(c) { c.classList.remove('active'); });
    (data.extraKnightOffsets || []).forEach(function(d) {
        var cell = document.querySelector('.knight-grid .grid-cell[data-dr="' + d[0] + '"][data-dc="' + d[1] + '"]');
        if (cell) cell.classList.add('active');
    });
    showToast('\u0428\u0430\u0431\u043b\u043e\u043d \u043f\u0440\u0438\u043c\u0435\u043d\u0451\u043d \u2014 \u0438\u0437\u043c\u0435\u043d\u0438 ID \u0438 \u043d\u0430\u0436\u043c\u0438 \u00ab\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c\u00bb!');
}

// ============================================================
// EFFECTS REFERENCE
// ============================================================

var effectsRefVisible = false;

function toggleEffectsRef() {
    effectsRefVisible = !effectsRefVisible;
    var panel = document.getElementById('effects-ref-panel');
    var btn = document.getElementById('btn-toggle-effects');
    panel.classList.toggle('hidden', !effectsRefVisible);
    btn.textContent = effectsRefVisible ? '\u{1F53C} \u0421\u043a\u0440\u044b\u0442\u044c \u044d\u0444\u0444\u0435\u043a\u0442\u044b' : '\u{1F4CB} \u0412\u0441\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u044b \u0438\u0437 \u0438\u0433\u0440\u044b';
    if (effectsRefVisible) renderEffectsRef();
}

function renderEffectsRef() {
    var container = document.getElementById('effects-ref-list');
    if (!container) return;
    container.innerHTML = '';
    var sourceItems = (typeof ITEMS_DB !== 'undefined') ? Object.values(ITEMS_DB) : itemsData;
    var rc_map = { common: '#9a95b0', rare: '#4488ff', epic: '#9d93fa', legendary: '#f0c048' };

    sourceItems.forEach(function(item) {
        var rc = rc_map[item.rarity] || '#9a95b0';
        var card = document.createElement('div');
        card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid ' + rc + '44; border-radius:6px; padding:10px; cursor:pointer; transition:background 0.15s;';
        card.title = '\u041d\u0430\u0436\u043c\u0438 \u2014 \u044d\u0444\u0444\u0435\u043a\u0442\u044b \u0434\u043e\u0431\u0430\u0432\u044f\u0442\u0441\u044f \u0432 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u044b \u0432\u044b\u0448\u0435';
        var mods = item.modifiers || {};
        var modLines = Object.keys(mods).map(function(k) {
            return '<code style="color:' + rc + '; font-size:0.78em; display:block;">' + k + ': ' + mods[k] + '</code>';
        }).join('');
        var dirs = (item.extraDirections && item.extraDirections.length) ? '<div style="font-size:0.73em; color:#a0a0b0; margin-top:2px;">\u{1F4D0} ' + item.extraDirections.length + ' \u0434\u043e\u043f. \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0439</div>' : '';
        var knts = (item.extraKnightOffsets && item.extraKnightOffsets.length) ? '<div style="font-size:0.73em; color:#a0a0b0;">\u{1F434} ' + item.extraKnightOffsets.length + ' \u043f\u0440\u044b\u0436\u043a\u043e\u0432 \u043a\u043e\u043d\u044f</div>' : '';
        card.innerHTML =
            '<div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">' +
            '<span style="font-size:1.3em; line-height:1;">' + (item.icon || '\u{1F4E6}') + '</span>' +
            '<div><div style="font-weight:600; font-size:0.87em;">' + item.name + '</div>' +
            '<div style="font-size:0.73em; color:' + rc + ';">' + item.rarity + ' \u00b7 ' + (item.allowedPieces || ['all']).join(', ') + '</div></div></div>' +
            modLines + dirs + knts +
            (!modLines && !dirs && !knts ? '<span style="font-size:0.73em; color:#a0a0b0;">\u043d\u0435\u0442 \u043c\u043e\u0434\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440\u043e\u0432</span>' : '');

        card.onmouseover = function() { card.style.background = 'rgba(255,255,255,0.09)'; };
        card.onmouseout  = function() { card.style.background = 'rgba(255,255,255,0.04)'; };
        card.onclick = function() {
            Object.keys(mods).forEach(function(k) { addModifierField(k, mods[k]); });
            (item.extraDirections || []).forEach(function(d) {
                var c = document.querySelector('.direction-grid .grid-cell[data-dr="' + d[0] + '"][data-dc="' + d[1] + '"]');
                if (c) c.classList.add('active');
            });
            (item.extraKnightOffsets || []).forEach(function(d) {
                var c = document.querySelector('.knight-grid .grid-cell[data-dr="' + d[0] + '"][data-dc="' + d[1] + '"]');
                if (c) c.classList.add('active');
            });
            showToast('\u042d\u0444\u0444\u0435\u043a\u0442\u044b \u0438\u0437 \u00ab' + item.name + '\u00bb \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b!');
        };
        container.appendChild(card);
    });
}
"""

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open(r'C:\Users\sanyo\.gemini\antigravity\scratch\chess-game\editor.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: file patched, length=" + str(len(content)))
else:
    print("ERROR: target string not found")
    # Debug: show where the init function ends
    idx = content.find("if (itemsData.length")
    print("Found loadItemIntoForm at index:", idx)
    print("Context:", repr(content[max(0,idx-20):idx+80]))
