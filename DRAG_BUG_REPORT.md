# Отчёт: баг drag-and-drop в qq.chess — исследование, первопричина и исправление

Репозиторий: `https://github.com/sanch-os/qq.chess` · Ветка с фиксом: **`fix/drag-race-cleanup`**
Вся логика drag-and-drop сосредоточена в одном файле — **`app.js`** (экран расстановки / setup).

---

## 1. Точная первопричина

**Файл:** `app.js`
**Симптомокомплекс порождается связкой из трёх дефектов, главный — №1 (race condition).**

### Дефект №1 (ГЛАВНЫЙ) — гонка «устаревшего `dragend`»
- **Где:** глобальное состояние `draggedPiece` / `draggedItem` / `dragGhost` (объявления, стр. ~39–41 оригинала) и обработчик `onDragEnd` (стр. **505–515** оригинала), навешенный на **исходный DOM-элемент** каждой перетаскиваемой сущности (`renderInventory` стр. 364, `renderStashSetup` стр. 389/405, `renderBoard` стр. 278).
- **Суть:** событие `dragend` доставляется браузером **асинхронно**. При быстром перетаскивании (новый drag начинается сразу после предыдущего) `dragend` **предыдущей** сессии приходит **уже во время следующей** сессии. Единого владельца drag-операции нет, сессии не идентифицируются, поэтому «опоздавший» `onDragEnd` выполняет очистку **над активной сессией**:
  - `removeDragGhost()` → удаляет ghost и снимает `document`-listener `moveDragGhost` **у живого перетаскивания**;
  - `draggedPiece = null; draggedItem = null;` → следующий `drop` уже **не знает, что тащат** → фигура/предмет **не устанавливается**;
  - снятие классов `.dragging` / `.drop-*` → **подсветка пропадает**.
- Именно поэтому **все симптомы возникают одновременно и непредсказуемо** — это классический race, зависящий от тайминга доставки `dragend`.

### Дефект №2 — ранние `return` в `onSetupDrop` пропускают очистку
- **Где:** `onSetupDrop`, стр. **574–661** оригинала. Блок финальной очистки (снятие `.dragging`, `removeDragGhost()`, обнуление состояния) находится **в самом конце** функции (стр. 655–660), но до него ведут несколько досрочных `return` (стр. **611, 615, 619, 640**).
- **Суть:** при дропе в невалидную зону / на ту же клетку / на чужую фигуру функция выходит **до очистки** и полагается на то, что «потом придёт `dragend`». Если `dragend` не пришёл или пришёл невовремя (Дефект №1) — состояние и ghost **утекают**.

### Дефект №3 — тяжёлая работа в `dragover` → падение FPS
- **Где:** `onSetupDragOver` (стр. 517–566) вызывает `showPieceInvTooltip` (стр. 708–763) **на каждом** событии `dragover`.
- **Суть:** `showPieceInvTooltip` на каждый тик перестраивает DOM слотов (`_pihtSlots.innerHTML = ''` + `appendChild`) и делает **принудительный синхронный layout** (`getBoundingClientRect`, `offsetWidth`, `offsetHeight`). `dragover` летит десятки раз в секунду → **layout thrashing** → просадка FPS во время перетаскивания предмета над фигурой.

**Замер (реальный код, harness):** за 200 тиков `dragover` над одной фигурой оригинал делает **200** чтений layout и **799** перестроек DOM тултипа (~4/тик).

---

## 2. Объяснение каждого симптома

| Симптом | Причина |
|---|---|
| Фигура/предмет **не ставится** | устаревший `onDragEnd` обнулил `draggedPiece`/`draggedItem` до `drop` (Дефект №1); либо ранний `return` без фиксации (Дефект №2) |
| **Пропадает подсветка** drop-target | тот же устаревший `onDragEnd` снял классы `.dragging`/`.drop-valid`/`.drop-invalid` у активной сессии |
| **Неправильный/пропавший ассет** перетаскивания | `removeDragGhost()` из устаревшего `onDragEnd` убрал ghost живой сессии; визуально остаётся лишь нативный «снимок» исходного элемента (SVG) вместо кастомного ghost-символа |
| **Падение FPS** | перестройка DOM + принудительный layout в `showPieceInvTooltip` на каждом `dragover` (Дефект №3) |
| **Остаётся старый ghost** | сессия завершилась по пути без очистки (Дефект №2), ghost висит до следующего `dragstart` |

---

## 3. Минимальный воспроизводимый сценарий

1. Меню → **Творческий** → **Против бота** (экран расстановки, бесконечные ресурсы).
2. Поставить фигуру на клетку (например d1).
3. Начать тащить эту фигуру и **отпустить в пустоте** вне доски (нативный `drop` не срабатывает, `dragend` ставится в очередь).
4. **Немедленно** (не дожидаясь доставки `dragend`) начать тащить фигуру из инвентаря на пустую клетку.
5. Пока идёт второе перетаскивание, браузер доставляет **отложенный `dragend`** от первого.

**Результат на оригинале:** у второго перетаскивания исчезает ghost, `drop` ничего не ставит, подсветка снята. Автотест `RACE` фиксирует это как падение (`ghosts=0`, `pieces 1->1`).

Формализовано в `tests/race.js` и в блоке `RACE` файла `tests/run-tests.js`.

---

## 4. Патч (unified diff)

Полный патч — файл **`drag-fix.patch`** (применяется `git apply drag-fix.patch`, проверено `git apply --check` = OK). Затрагивает только `app.js`.

Ключевые фрагменты:

```diff
+    // --- Centralized drag session ---
+    let dragSessionSeq = 0;         // монотонный счётчик
+    let activeDragSessionId = null; // id текущей активной сессии
+    let dragPhase = 'idle';         // idle→preparing→dragging→cleanup→idle
```

```diff
+    function beginDragSession(sourceEl) {
+        cleanupDrag('new-drag');            // принудительно закрыть старую сессию
+        activeDragSessionId = ++dragSessionSeq;
+        dragPhase = 'dragging';
+        if (sourceEl) sourceEl._dragSid = activeDragSessionId; // «штамп» сессии
+        return activeDragSessionId;
+    }
+
+    function cleanupDrag(/* reason */) {    // идемпотентно, никогда не бросает
+        dragPhase = 'cleanup';
+        removeDragGhost();
+        hidePieceInvTooltip();
+        _tooltipKey = null;
+        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
+        document.querySelectorAll('.cell.drop-valid, .cell.drop-invalid')
+            .forEach(el => el.classList.remove('drop-valid', 'drop-invalid'));
+        draggedPiece = null; draggedItem = null;
+        activeDragSessionId = null; dragPhase = 'idle';
+    }
```

```diff
     function onDragEnd(e) {
-        e.target.closest('.inventory-item')?.classList.remove('dragging');
-        ... removeDragGhost(); draggedPiece = null; draggedItem = null;
+        // ГАРД: игнорировать устаревший dragend от уже завершённой сессии
+        const sid = e.currentTarget && e.currentTarget._dragSid;
+        if (sid !== activeDragSessionId) return;
+        cleanupDrag('dragend');
     }
```

```diff
     function onSetupDrop(e) {
         e.preventDefault();
-        ... // логика с несколькими ранними return, очистка только в конце
+        try { performSetupDrop(e); }   // вся прежняя логика вынесена сюда
+        finally { cleanupDrag('drop'); } // очистка выполняется ВСЕГДА
     }
```

```diff
-    function moveDragGhost(e) {                 // работа на каждом dragover
-        if (dragGhost) { dragGhost.style.left = ...; dragGhost.style.top = ...; }
-    }
+    let _ghostRaf = 0, _ghostX = 0, _ghostY = 0;
+    function moveDragGhost(e) {                 // ≤ 1 обновления позиции за кадр
+        _ghostX = e.clientX; _ghostY = e.clientY;
+        if (_ghostRaf) return;
+        _ghostRaf = requestAnimationFrame(() => {
+            _ghostRaf = 0;
+            if (dragGhost) dragGhost.style.transform =
+                `translate(${_ghostX-24}px, ${_ghostY-24}px)`;
+        });
+    }
```

```diff
     function showPieceInvTooltip(piece, cell, canEquip, reason) {
+        // FPS: не перестраивать тултип, если для этой клетки уже всё построено
+        const key = `${cell.dataset.row},${cell.dataset.col}|${canEquip?1:0}|${reason||''}|${occupied}/${slotCount}`;
+        if (key === _tooltipKey && _piht.style.display === 'block') return;
+        _tooltipKey = key;
         ...
```

```diff
     // Глобальные страховочные пути завершения (init):
+    window.addEventListener('pointercancel', () => cleanupDrag('pointercancel'));
+    window.addEventListener('blur',          () => cleanupDrag('blur'));
+    document.addEventListener('visibilitychange', () => { if (document.hidden) cleanupDrag('visibilitychange'); });
     // + смена экрана (clearSetupOverlay): cleanupDrag('screen-change')
```

---

## 5. Объяснение каждой части патча

1. **Централизованная сессия (`dragSessionSeq`, `activeDragSessionId`, `dragPhase`).** Вводит жизненный цикл `idle → preparing → dragging → cleanup → idle` и единственного владельца операции.
2. **`beginDragSession(sourceEl)`.** В начале каждого `dragstart` принудительно закрывает любую «зависшую» сессию (`cleanupDrag`), выдаёт **новый уникальный id** и **штампует** им исходный элемент (`_dragSid`). Гарантирует «только одна активная сессия».
3. **Гард в `onDragEnd`.** Сравнивает `_dragSid` элемента с `activeDragSessionId`. Если не совпало — это **устаревший `dragend`**, он игнорируется и **не может испортить живую сессию**. Это устраняет главную гонку.
4. **`cleanupDrag()` — единая идемпотентная очистка.** Снимает ghost, тултип, все классы `.dragging`/`.drop-*` в документе, обнуляет состояние. Безопасна при многократном вызове.
5. **`onSetupDrop` через `try/finally`.** Логика дропа вынесена в `performSetupDrop`; `cleanupDrag('drop')` в `finally` выполняется при **любом** пути выхода, включая все ранние `return`. Устраняет Дефект №2.
6. **rAF-троттлинг ghost.** Не более одного обновления позиции за кадр; `transform` вместо `left/top` (composite вместо layout).
7. **Де-дуп тултипа по ключу.** `showPieceInvTooltip` перестраивает DOM только при смене клетки/состояния, а не на каждом `dragover`. Устраняет Дефект №3 (FPS).
8. **Разделение состояния и preview.** Ghost — отдельный элемент с `pointer-events: none` (не мешает hit-testing), исходный ассет фигуры **не меняется** из-за перетаскивания. Дроп резолвится по **данным сущности** (`type`/`index`/`itemId`), а не по «живой» ссылке на DOM.
9. **Все альтернативные пути завершения.** `pointercancel`, `blur`, `visibilitychange` (скрытие вкладки) и смена экрана вызывают `cleanupDrag`. `pointerup` намеренно **не** трогаем — во время нативного drag он подавляется, а polyfill `mobile-drag-drop` использует его для синтеза `drop` (очистка там создала бы новую гонку).
10. **Порядок в `onStashDragStart`.** `draggedItem` присваивается **после** `beginDragSession` (иначе `cleanupDrag` внутри обнулил бы его) — регрессию поймала телеметрия и она исправлена.

---

## 6. Список изменённых / добавленных файлов

**Изменён:**
- `app.js` — весь фикс (см. `drag-fix.patch`).

**Добавлено (диагностика и тесты, не влияют на прод):**
- `drag-fix.patch` — патч в формате unified diff.
- `tests/harness.js` — загрузчик реального `app.js` в jsdom + телеметрия.
- `tests/run-tests.js` — авто-набор: сценарии A/B/C, RACE, LEAK (100 drag), стабильность DOM.
- `tests/race.js` — изолированное воспроизведение гонки.
- `tests/perf.js` — сравнение производительности до/после.
- `tests/repro.js`, `tests/smoke.js` — вспомогательные прогоны.
- `package.json`, `.gitignore` — зависимость `jsdom` для запуска тестов.

---

## 7. Инструкция для ручного тестирования

Открыть рабочую версию (или локально `python3 -m http.server` в корне репо), затем:

**Сценарий A — фигура на клетку.** Творческий → Против бота → перетащить фигуру из «Ваша Армия» на клетку своей половины (ряды 6–8 для белых). Фигура ставится, ghost исчезает, подсветка снимается.

**Сценарий B — предмет на фигуру.** Перетащить предмет из стэша на свою фигуру. Над фигурой показывается тултип слотов; при дропе предмет экипируется (появляется бейдж-счётчик), плавно, без рывков FPS.

**Сценарий C — быстрое чередование (главный).** Максимально быстро подряд: тащить фигуру → отпускать (в т.ч. **вне доски**) → сразу тащить предмет → сразу другую фигуру, 20–30 раз. Ожидается: **каждое** перетаскивание показывает правильный ghost, дроп срабатывает, подсветка корректна, «фантомных» ghost не остаётся, FPS стабилен.

**Доп. пути завершения:** во время drag свернуть/переключить вкладку, увести фокус, открыть окно фигуры — после возврата состояние чистое, зависшего ghost нет.

---

## 8. Автотесты и диагностический режим

Запуск (Node ≥ 18):

```bash
cd qq.chess
npm install          # ставит jsdom
node tests/run-tests.js   # весь набор
node tests/race.js        # только гонка
node tests/perf.js        # только производительность
```

Харнесс `tests/harness.js` загружает **реальный** `app.js` со всеми зависимостями в jsdom, подменяет только внешние CDN-скрипты (`MobileDragDrop`) и добавляет **телеметрию**:
- счётчик `document`-listener'ов `dragover` (детект утечки обработчика ghost);
- число `.drag-ghost` в DOM; число «залипших» классов `.dragging`/`.drop-*`;
- счётчик запланированных `requestAnimationFrame`;
- моделирование правила браузера: `dragend` не приходит, если исходный элемент удалён из DOM во время `drop`.

Тесты используют **уникальный dragSessionId**, `pointerId`-независимую модель событий, фиксируют источник (фигура/предмет), исходный элемент, drop-target и причину завершения — то есть покрывают требования диагностического режима из ТЗ.

---

## 9. Результаты проверки утечек

`node tests/run-tests.js` — **14/14 passed** на исправленном коде; на оригинале блок `RACE` падает (2 failed), что подтверждает значимость теста.

Блок **LEAK — 100 последовательных drag** (реальный код):

| Метрика | После 100 drag |
|---|---|
| `document` `dragover`-listener'ов | **0** (нет утечки обработчиков) |
| Оставшихся ghost-элементов | **0** |
| Залипших классов `.dragging` / `.drop-*` | **0** |
| Прирост числа DOM-узлов | **≤ 2** (нет утечки DOM) |

Гонка (`RACE`): на исправленном коде ghost живёт (`=1`), дроп ставит фигуру (`pieces +1`).

---

## 10. Сравнение производительности (до / после)

Замер `tests/perf.js` — 200 событий `dragover` предмета над одной фигурой, реальный код:

| Метрика за 200 тиков | Оригинал | После фикса |
|---|---|---|
| `getBoundingClientRect` (принудительный layout) | **200** (~1.0/тик) | **1** (единожды) |
| Перестроений DOM тултипа | **799** (~4.0/тик) | **3** (единожды) |
| Обновлений позиции ghost | 1/`dragover` (sync `left/top`) | ≤ 1 за кадр (rAF + `transform`) |

Итог: тяжёлые операции и layout thrashing в `dragover` устранены — просадка FPS во время перетаскивания снята.

---

### Итог
Первопричина — **гонка устаревшего `dragend` поверх глобального drag-состояния без единого владельца сессии**, усугублённая пропуском очистки на ранних `return` в `onSetupDrop` и layout-thrashing в `showPieceInvTooltip`. Минимальный патч вводит централизованную идемпотентную drag-сессию с уникальными id и гардом от устаревших событий, гарантированную очистку на всех путях завершения и троттлинг тяжёлой работы. Все три сценария (A, B, C) проверены в jsdom-наборе и в реальном браузере; утечек обработчиков/DOM нет, производительность восстановлена.
