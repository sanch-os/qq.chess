/**
 * tutorial.js — Step-by-step interactive tutorial overlay for the chess roguelike
 * Highlights elements with a spotlight and shows contextual tooltips.
 */

(function() {
    'use strict';

    // ─── Tutorial steps ────────────────────────────────────────────────────────
    // Each step: { key (for i18n), targetId (element to highlight), position (tooltip dir) }
    const STEPS = [
        // Menu steps
        { key: 'tut.welcome',       targetId: null,                    position: 'center' },
        { key: 'tut.roguelike',     targetId: 'btn-new-run',           position: 'bottom' },
        { key: 'tut.mirror',        targetId: 'btn-mirror-match',      position: 'bottom' },
        { key: 'tut.creative',      targetId: 'btn-creative',          position: 'bottom' },
        { key: 'tut.difficulty',    targetId: 'diff-description',      position: 'top' },
        { key: 'tut.click_start',   targetId: 'btn-new-run',           position: 'bottom' },

        // Setup screen steps
        { key: 'tut.setup_intro',   targetId: null,                    position: 'center', screen: 'setup' },
        { key: 'tut.inventory',     targetId: 'inventory',             position: 'right', screen: 'setup' },
        { key: 'tut.stash',        targetId: 'player-stash-setup',    position: 'right', screen: 'setup' },
        { key: 'tut.board_place',   targetId: 'board-setup',          position: 'left',  screen: 'setup' },
        { key: 'tut.start_btn',     targetId: 'btn-start',             position: 'top',   screen: 'setup' },

        // Game screen steps
        { key: 'tut.game_intro',    targetId: null,                    position: 'center', screen: 'game' },
        { key: 'tut.game_move',     targetId: 'board-game',            position: 'left',  screen: 'game' },
        { key: 'tut.game_history',  targetId: 'move-history',          position: 'left',  screen: 'game' },
        { key: 'tut.game_status',   targetId: 'game-status',           position: 'bottom', screen: 'game' },
        { key: 'tut.done',          targetId: null,                    position: 'center' },
    ];

    // ─── i18n strings ──────────────────────────────────────────────────────────
    const TUT_TEXT = {
        ru: {
            'tut.welcome':      { title: '👋 Добро пожаловать!', text: 'Это обучение расскажет тебе об основах игры. Ты сможешь пропустить его в любой момент.' },
            'tut.roguelike':    { title: '🗺️ Режим Roguelike', text: 'Начни приключение! Побеждай противников, зарабатывай золото, покупай предметы и усиливай свои фигуры.' },
            'tut.mirror':       { title: '🪞 Зеркальный бой', text: 'Оба игрока ставят одинаковые наборы фигур. Честный поединок на тактику!' },
            'tut.creative':     { title: '🎨 Творческий режим', text: 'Бесконечный инвентарь и предметы. Экспериментируй без ограничений — играй против бота или друга.' },
            'tut.difficulty':   { title: '🎚️ Сложность ИИ', text: 'Выбери насколько умным будет твой противник — от случайных ходов до серьёзного расчёта на 4 хода.' },
            'tut.click_start':  { title: '👉 Твой ход', text: 'Кликни «Start Run (Roguelike)», чтобы перейти к расстановке. Обучение продолжится там!' },
            'tut.setup_intro':  { title: '♟️ Расстановка', text: 'Перед каждым боем ты расставляешь свои фигуры. Это твоя главная стратегия!' },
            'tut.inventory':    { title: '⚔️ Твоя Армия', text: 'Отсюда перетаскивай фигуры на доску. В Roguelike режиме ты набираешь армию постепенно.' },
            'tut.stash':        { title: '📦 Сундук предметов', text: 'Перетащи предмет на фигуру или кликни на фигуру, чтобы открыть её инвентарь и экипировать предметы туда.' },
            'tut.board_place':  { title: '🏰 Доска', text: 'Расставляй фигуры только на своей половине поля (нижние 4 ряда). Хотя бы один Король обязателен!' },
            'tut.start_btn':    { title: '⚔️ В бой!', text: 'Нажми эту кнопку, когда расстановка готова. Помни: без Короля начать нельзя.' },
            'tut.game_intro':   { title: '🎮 Игра началась!', text: 'Теперь ты в бою. Ход белых всегда первый. Кликай на фигуру, чтобы увидеть возможные ходы.' },
            'tut.game_move':    { title: '♟️ Как ходить', text: 'Кликни на свою фигуру — появятся точки допустимых ходов. Кликни на точку — фигура переместится. Можно также перетащить!' },
            'tut.game_history': { title: '📜 История ходов', text: 'Все сделанные ходы записываются в алгебраическую нотацию. Удобно для анализа партии.' },
            'tut.game_status':  { title: '🔔 Статус игры', text: 'Здесь отображается чей сейчас ход, шах, или победитель. Следи за этой строкой!' },
            'tut.done':         { title: '🎉 Всё готово!', text: 'Ты знаешь основы. Теперь иди и побеждай! Обучение всегда можно запустить заново через ⚙️ Настройки.' },
            'tut.next':         '▶ Далее',
            'tut.prev':         '◀ Назад',
            'tut.skip':         '✕ Пропустить',
            'tut.finish':       '🎉 Начать игру!',
        },
        en: {
            'tut.welcome':      { title: '👋 Welcome!', text: 'This tutorial will walk you through the basics. You can skip it at any time.' },
            'tut.roguelike':    { title: '🗺️ Roguelike Mode', text: 'Start an adventure! Defeat enemies, earn gold, buy items and upgrade your pieces.' },
            'tut.mirror':       { title: '🪞 Mirror Match', text: 'Both players place identical piece sets. A fair test of pure tactics!' },
            'tut.creative':     { title: '🎨 Creative Mode', text: 'Unlimited inventory and items. Experiment freely — play vs bot or a friend.' },
            'tut.difficulty':   { title: '🎚️ AI Difficulty', text: 'Choose how smart your opponent is — from random moves to deep 4-move calculation.' },
            'tut.click_start':  { title: '👉 Your Turn', text: 'Click "Start Run (Roguelike)" to go to the setup phase. The tutorial will resume there!' },
            'tut.setup_intro':  { title: '♟️ Setup Phase', text: 'Before each battle you place your pieces on the board. This is your core strategy!' },
            'tut.inventory':    { title: '⚔️ Your Army', text: 'Drag pieces from here onto the board. In Roguelike mode you build your army gradually.' },
            'tut.stash':        { title: '📦 Item Stash', text: 'Drag an item onto a piece, or click a piece to open its inventory and equip items there.' },
            'tut.board_place':  { title: '🏰 The Board', text: 'Place pieces only on your half (bottom 4 rows). At least one King is required!' },
            'tut.start_btn':    { title: '⚔️ To Battle!', text: 'Click this when your placement is ready. Remember: no King = no start.' },
            'tut.game_intro':   { title: '🎮 Game On!', text: 'You\'re in battle now. White always goes first. Click a piece to see its legal moves.' },
            'tut.game_move':    { title: '♟️ How to Move', text: 'Click your piece — dots show legal moves. Click a dot to move. You can also drag!' },
            'tut.game_history': { title: '📜 Move History', text: 'Every move is recorded in algebraic notation — handy for game review.' },
            'tut.game_status':  { title: '🔔 Game Status', text: 'Shows whose turn it is, check, or the winner. Keep an eye on this bar!' },
            'tut.done':         { title: '🎉 You\'re ready!', text: 'Now you know the basics. Go and win! You can replay the tutorial anytime via ⚙️ Settings.' },
            'tut.next':         '▶ Next',
            'tut.prev':         '◀ Back',
            'tut.skip':         '✕ Skip',
            'tut.finish':       '🎉 Start Playing!',
        },
        es: {
            'tut.welcome':      { title: '👋 ¡Bienvenido!', text: 'Este tutorial te guiará por lo básico. Puedes saltarlo en cualquier momento.' },
            'tut.roguelike':    { title: '🗺️ Modo Roguelike', text: '¡Empieza una aventura! Derrota enemigos, gana oro, compra objetos y mejora tus piezas.' },
            'tut.mirror':       { title: '🪞 Partida Espejo', text: 'Ambos jugadores colocan piezas idénticas. ¡Una prueba justa de táctica pura!' },
            'tut.creative':     { title: '🎨 Modo Creativo', text: 'Inventario ilimitado y objetos sin fin. Experimenta libremente — juega vs bot o amigo.' },
            'tut.difficulty':   { title: '🎚️ Dificultad IA', text: 'Elige cuán inteligente es tu oponente — desde movimientos aleatorios hasta cálculo a 4 jugadas.' },
            'tut.click_start':  { title: '👉 Tu Turno', text: 'Haz clic en "Iniciar Carrera (Roguelike)" para ir a la configuración. ¡El tutorial continuará allí!' },
            'tut.setup_intro':  { title: '♟️ Fase de Setup', text: '¡Antes de cada batalla colocas tus piezas en el tablero. ¡Esta es tu estrategia principal!' },
            'tut.inventory':    { title: '⚔️ Tu Ejército', text: 'Arrastra piezas desde aquí al tablero. En modo Roguelike construyes tu ejército gradualmente.' },
            'tut.stash':        { title: '📦 Alijo de Objetos', text: 'Arrastra un objeto a una pieza, o haz clic en una pieza para abrir su inventario y equipar.' },
            'tut.board_place':  { title: '🏰 El Tablero', text: 'Coloca piezas solo en tu mitad (4 filas inferiores). ¡Al menos un Rey es obligatorio!' },
            'tut.start_btn':    { title: '⚔️ ¡A la Batalla!', text: 'Haz clic cuando tu colocación esté lista. Recuerda: sin Rey no se puede empezar.' },
            'tut.game_intro':   { title: '🎮 ¡Juego Iniciado!', text: 'Estás en batalla. Las blancas siempre van primero. Haz clic en una pieza para ver movimientos.' },
            'tut.game_move':    { title: '♟️ Cómo Mover', text: 'Haz clic en tu pieza — los puntos muestran movimientos legales. ¡También puedes arrastrar!' },
            'tut.game_history': { title: '📜 Historial', text: 'Todos los movimientos se registran en notación algebraica — útil para revisar la partida.' },
            'tut.game_status':  { title: '🔔 Estado del Juego', text: 'Muestra de quién es el turno, jaque o el ganador. ¡Mantén el ojo aquí!' },
            'tut.done':         { title: '🎉 ¡Listo!', text: 'Ya conoces lo básico. ¡Ve y gana! Puedes repetir el tutorial desde ⚙️ Ajustes.' },
            'tut.next':         '▶ Siguiente',
            'tut.prev':         '◀ Atrás',
            'tut.skip':         '✕ Saltar',
            'tut.finish':       '🎉 ¡Empezar!',
        },
    };

    function tut(key) {
        const lang = localStorage.getItem('chess_lang') || 'ru';
        return (TUT_TEXT[lang] && TUT_TEXT[lang][key]) ||
               (TUT_TEXT['ru'] && TUT_TEXT['ru'][key]) ||
               key;
    }

    // ─── State ─────────────────────────────────────────────────────────────────
    let currentStep = 0;
    let isActive = false;
    let currentAppScreen = 'menu';
    let isWaitingForScreen = false;
    let overlay, spotlight, tooltip, tooltipTitle, tooltipText, btnPrev, btnNext, btnSkip, stepCounter;

    // ─── Create DOM ────────────────────────────────────────────────────────────
    function buildDOM() {
        if (document.getElementById('tut-overlay')) return;

        overlay = document.createElement('div');
        overlay.id = 'tut-overlay';
        overlay.innerHTML = `
            <div id="tut-spotlight"></div>
            <div id="tut-tooltip" class="tut-tooltip">
                <h3 id="tut-title"></h3>
                <p id="tut-text"></p>
                <div class="tut-footer">
                    <span id="tut-counter" class="tut-counter"></span>
                    <div class="tut-btns">
                        <button id="tut-skip" class="tut-btn tut-btn-skip"></button>
                        <button id="tut-prev" class="tut-btn tut-btn-secondary"></button>
                        <button id="tut-next" class="tut-btn tut-btn-primary"></button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        spotlight    = document.getElementById('tut-spotlight');
        tooltip      = document.getElementById('tut-tooltip');
        tooltipTitle = document.getElementById('tut-title');
        tooltipText  = document.getElementById('tut-text');
        btnPrev      = document.getElementById('tut-prev');
        btnNext      = document.getElementById('tut-next');
        btnSkip      = document.getElementById('tut-skip');
        stepCounter  = document.getElementById('tut-counter');

        btnNext.addEventListener('click', nextStep);
        btnPrev.addEventListener('click', prevStep);
        btnSkip.addEventListener('click', finish);

        // Allow Esc to skip
        document.addEventListener('keydown', function onEsc(e) {
            if (e.key === 'Escape' && isActive) finish();
        });
    }

    // ─── Spotlight positioning ──────────────────────────────────────────────────
    function positionSpotlight(el) {
        if (!el) {
            spotlight.style.cssText = 'display:none;';
            return;
        }

        const rect = el.getBoundingClientRect();
        const pad = 10;
        spotlight.style.cssText = `
            display: block;
            top: ${rect.top - pad}px;
            left: ${rect.left - pad}px;
            width: ${rect.width + pad * 2}px;
            height: ${rect.height + pad * 2}px;
            border-radius: 12px;
        `;
    }

    // ─── Tooltip positioning ────────────────────────────────────────────────────
    function positionTooltip(el, position) {
        tooltip.className = 'tut-tooltip';
        tooltip.classList.add('tut-pos-' + (position || 'center'));

        const W = Math.min(320, window.innerWidth - 24);
        tooltip.style.cssText = `position: fixed; width: ${W}px;`;

        if (!el || position === 'center') {
            const H = tooltip.offsetHeight || 180;
            tooltip.style.top = Math.max(12, (window.innerHeight / 2 - H / 2)) + 'px';
            tooltip.style.left = (window.innerWidth / 2 - W / 2) + 'px';
            return;
        }

        const rect = el.getBoundingClientRect();
        const gap = 18;

        let top, left;
        switch (position) {
            case 'bottom':
                top  = rect.bottom + gap;
                left = rect.left + rect.width / 2 - W / 2;
                break;
            case 'top':
                top  = rect.top - gap - 180; // approx tooltip height
                left = rect.left + rect.width / 2 - W / 2;
                break;
            case 'right':
                top  = rect.top + rect.height / 2 - 90;
                left = rect.right + gap;
                break;
            case 'left':
                top  = rect.top + rect.height / 2 - 90;
                left = rect.left - W - gap;
                break;
        }

        // Clamp to viewport
        left = Math.max(12, Math.min(left, window.innerWidth - W - 12));
        top  = Math.max(12, Math.min(top, window.innerHeight - 200));

        tooltip.style.cssText = `
            position: fixed;
            top: ${top}px;
            left: ${left}px;
            width: ${W}px;
            transform: none;
        `;
    }

    // ─── Render step ───────────────────────────────────────────────────────────
    function renderStep(idx) {
        const step = STEPS[idx];
        if (!step) { finish(); return; }

        if (step.screen && step.screen !== currentAppScreen) {
            isWaitingForScreen = true;
            overlay.classList.remove('active');
            return;
        }

        isWaitingForScreen = false;
        overlay.classList.add('active');

        const strings = tut(step.key);
        const title   = strings.title || '';
        const text    = strings.text  || '';
        const lang    = localStorage.getItem('chess_lang') || 'ru';
        const tt      = TUT_TEXT[lang] || TUT_TEXT['ru'];
        const isLast  = idx === STEPS.length - 1;

        tooltipTitle.textContent = title;
        tooltipText.textContent  = text;
        btnSkip.textContent = tt['tut.skip'];
        btnPrev.textContent = tt['tut.prev'];
        btnNext.textContent = isLast ? tt['tut.finish'] : tt['tut.next'];
        btnPrev.style.display = idx === 0 ? 'none' : '';
        stepCounter.textContent = `${idx + 1} / ${STEPS.length}`;

        const targetEl = step.targetId ? document.getElementById(step.targetId) : null;
        positionSpotlight(targetEl);
        positionTooltip(targetEl, step.position);

        // Pulse animation on tooltip
        tooltip.classList.remove('tut-animate-in');
        void tooltip.offsetWidth; // reflow
        tooltip.classList.add('tut-animate-in');

        // Scroll target into view
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // ─── Navigation ────────────────────────────────────────────────────────────
    function nextStep() {
        currentStep++;
        if (currentStep >= STEPS.length) { finish(); return; }
        renderStep(currentStep);
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            renderStep(currentStep);
        }
    }

    // ─── Public API ────────────────────────────────────────────────────────────
    function start() {
        buildDOM();
        currentStep = 0;
        isActive = true;
        overlay.classList.add('active');
        renderStep(0);
    }

    function finish() {
        isActive = false;
        isWaitingForScreen = false;
        if (overlay) overlay.classList.remove('active');
        localStorage.setItem('chess_tut_done', '1');
    }

    function reset() {
        localStorage.removeItem('chess_tut_done');
    }

    function onScreenChange(name) {
        currentAppScreen = name;
        if (isActive && isWaitingForScreen && STEPS[currentStep]) {
            const expected = STEPS[currentStep].screen;
            if (!expected || expected === name) {
                renderStep(currentStep);
            }
        }
    }

    // Expose globally
    window.Tutorial = { start, finish, reset, onScreenChange };

    // ─── Auto-start on first visit ─────────────────────────────────────────────
    // Wait for app to finish init, then check
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!localStorage.getItem('chess_tut_done')) {
                start();
            }
        }, 600);
    });
})();
