# Карта архитектуры drag-and-drop (qq.chess, экран расстановки)

Технология: **нативный HTML5 Drag & Drop** (`draggable="true"` + `dragstart/dragover/dragleave/drop/dragend`) плюс **кастомный ghost-элемент**, следующий за курсором через `document`-listener `dragover`. Для тач-устройств подключён polyfill `mobile-drag-drop` (CDN). Второй, «pointer/mouse»-системы перетаскивания в коде **нет** — все совпадения `pointer*`/`touch*` не относятся к drag фигур.

## Источники перетаскивания (drag sources)
| Источник | Где создаётся | Обработчики |
|---|---|---|
| Фигура из инвентаря `.inventory-item` | `renderInventory` (стр. 344–367) | `dragstart=onInventoryDragStart`, `dragend=onDragEnd` |
| Предмет из стэша `.stash-item` | `renderStashSetup` (стр. 369–409) | `dragstart=onStashDragStart`, `dragend=onDragEnd` |
| Фигура на доске `.piece` | `renderBoard` (стр. 274–279) | `dragstart=onBoardPieceDragStart`, `dragend=onDragEnd` |

## Цели (drop targets)
Клетки `.cell` доски расстановки (`buildBoard`, mode='setup', стр. 205–207): `dragover=onSetupDragOver`, `drop=onSetupDrop`, `dragleave=onSetupDragLeave`.

## Поток одной drag-операции (оригинал)
1. **Начало** — `dragstart` на источнике: заполняется глобальное состояние `draggedPiece` **или** `draggedItem`; `createDragGhost(symbol)` создаёт `<div.drag-ghost>` и вешает `document`-listener `moveDragGhost`; на источник вешается класс `.dragging`; нативный drag-image прячется (`setDragImage(new Image())`).
2. **Состояние** — глобальные `draggedPiece` / `draggedItem` / `dragGhost` (стр. 39–41). Идентификатора сессии нет.
3. **Перемещаемый элемент** — кастомный `dragGhost` (эмодзи/иконка), позиционируется на каждом `dragover` (`moveDragGhost`). Исходный элемент остаётся на месте.
4. **Определение drop-target** — событие `dragover`/`drop` на конкретной `.cell`; координаты сущности берутся из `dataset.row/col`.
5. **Подсветка** — `onSetupDragOver` добавляет `.drop-valid`/`.drop-invalid`; для предмета над фигурой строит тултип `showPieceInvTooltip` (на каждом тике). `onSetupDragLeave` снимает подсветку с клетки.
6. **Дроп** — `onSetupDrop`: экипировка предмета (`equipItemToPiece` / клон из `ITEMS_DB`) либо перестановка/размещение фигуры (`engine.board[...]`, `PieceEntity`), затем `renderBoard/renderInventory/renderStashSetup`.
7. **Завершение/очистка** — в конце `onSetupDrop` (снятие классов, `removeDragGhost`, обнуление состояния) **и/или** `onDragEnd` на источнике.

## Пути завершения и их проблемы (оригинал)
| Путь | Что вызывает очистку | Проблема |
|---|---|---|
| Успешный дроп в валидную клетку | конец `onSetupDrop` | `renderBoard/Inventory` уничтожает источник → `dragend` может не прийти (но `drop` уже очистил) |
| Дроп по раннему `return` (невалидная зона, та же клетка, чужая фигура, нет ресурса) | **только** последующий `dragend` | если `dragend` не пришёл/опоздал — **утечка ghost и состояния** |
| Отпускание вне клетки (нет `drop`) | `dragend` | зависит от `dragend` |
| `pointercancel` / `blur` / скрытие вкладки | **не обрабатывались** | состояние могло зависнуть |
| Быстрый повторный drag | — | **устаревший `dragend` очищает уже НОВую сессию** ← первопричина |

## Что изменил фикс (ветка `fix/drag-race-cleanup`)
Единая drag-сессия с уникальным id и фазами `idle→preparing→dragging→cleanup→idle`; `beginDragSession` (принудительно закрывает старую), гард по `_dragSid` в `onDragEnd` (игнор устаревших), идемпотентная `cleanupDrag()` во всех путях (`drop` через `try/finally`, `pointercancel`, `blur`, `visibilitychange`, смена экрана); rAF-троттлинг ghost и де-дуп тултипа. Подробности — `DRAG_BUG_REPORT.md`.
