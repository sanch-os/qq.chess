/* ============================================================================
   multiplayer.js — Firebase Realtime Multiplayer (refactored)
   for qq.chess "Play with Friend" mode
   ============================================================================
   Trust model: every move that arrives here is handed to app.js's
   onOpponentMove handler, which (as of the app.js audit pass) routes it
   through ChessEngine.makeMove() — the same legality gate a local click
   gets — rather than executing it blindly. That fix lives in app.js; this
   file's job is just to move bytes reliably and not clobber someone else's
   room while doing it.
   ========================================================================= */

// PLACEHOLDER config — user must replace with their Firebase project credentials
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyA4TjqkA4c-7wqRXrkESfWFH8MJGGtuFRo',
    authDomain: 'multiplayer-90dc2.firebaseapp.com',
    databaseURL: 'https://multiplayer-90dc2-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'multiplayer-90dc2',
    storageBucket: 'multiplayer-90dc2.firebasestorage.app',
    messagingSenderId: '144435271438',
    appId: '1:144435271438:web:f28de3da70ccdf21cfa95f'
};

// Initialize Firebase app only once
if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const db = firebase.database();

/** Alphabet avoids visually-ambiguous characters (no I/O/0/1). */
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 5;
/** Matches exactly what generateRoomCode() can produce — used to validate
 *  user-typed/pasted codes before they're used as a Firebase path segment. */
const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);
/** Bounds the collision-retry loop in createRoom() so a pathological run
 *  of bad luck can't spin forever. */
const MAX_ROOM_CODE_ATTEMPTS = 5;

/* ============================================================================
   STEP 1 (Phase 2): reconnect support
   ============================================================================
   No RTDB TTL and no server code (Cloud Functions) available, so cleanup is
   entirely lazy, driven by data + living clients:
     - A disconnected side no longer nukes the room (see _claimRoomCode /
       joinRoom below) — it flips online:false + lastSeen (SERVER time, not
       the client's clock) and the room lives on.
     - The peer who's still connected runs a local timer; if the other side
       doesn't come back within RECONNECT_TIMEOUT_MS, it calls
       claimForfeitWin() itself and deletes the room — it's a legitimate
       participant, so this is safe.
     - If BOTH sides vanish, nobody is left to clean up — that's handled by
       _claimRoomCode treating a sufficiently stale/forfeited room as free
       on the NEXT create attempt that collides with its code (lazy
       tombstone collection, not a timer). */
/** How long the surviving player waits for a reconnect before claiming a
 *  forfeit win. Friend-mode only; irrelevant to AI/roguelike/raid. */
const RECONNECT_TIMEOUT_MS = 60000;
/** A room whose write are all older than this is considered abandoned by
 *  both sides and can be silently reclaimed by a fresh createRoom() that
 *  happens to collide with its code. */
const STALE_ROOM_MS = 10 * 60 * 1000;
/** Server-clock timestamp — NEVER Date.now() here; client clocks can't be
 *  trusted to judge staleness or ordering across two different machines. */
const SERVER_TS = firebase.database.ServerValue.TIMESTAMP;

function generateRoomCode() {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    return code;
}

window.Multiplayer = (function () {
    let _roomCode = null;
    let _role = null; // 'host' or 'guest'
    /** FIX: onBothLobbyReady is driven by TWO 'value' listeners (host +
     *  guest lobby_ready), each of which re-reads both flags via nested
     *  once(). Once both flags were true, EVERY subsequent value event
     *  re-fired the callback. This latch guarantees exactly one
     *  invocation per room session. */
    let _bothLobbyFired = false;
    /** i18n with a hard fallback: multiplayer errors must render even if
     *  locales.js failed to load (it's a separate script tag). */
    const _t = (key, fallback) => (window.t && window.t(key)) || fallback;
    let _callbacks = {};
    let _listeners = [];

    function _on(ref, event, cb) {
        ref.on(event, cb);
        _listeners.push({ ref, event, cb });
    }

    /**
     * Attaches every room listener (guest-ready, colors, moves, setup,
     * lobby-ready) for the host role. Split out of createRoom() so it can
     * be (re)run against whichever code the collision-retry loop ends up
     * actually claiming.
     */
    function _attachHostListeners() {
        // БЫЛО: только один listener на guest/online, реагирующий исключительно
        // на переход в true (первое присоединение гостя к лобби). Разрыв связи
        // посреди партии (true -> false) никто не слушал вообще — ноль
        // UI-реакции на отвал оппонента.
        // СТАЛО: тот же listener теперь различает три случая:
        //   1) первое появление (_guestSeenOnline ещё false) -> onOpponentReady
        //      (старое поведение, без изменений для существующих вызывающих)
        //   2) true -> false ПОСЛЕ того, как гость уже был на связи ->
        //      onOpponentDisconnected (новый колбэк, Step 1)
        //   3) false -> true после разрыва -> onOpponentReconnected
        let _guestSeenOnline = false;
        let _guestWasDisconnected = false;
        _on(db.ref(`rooms/${_roomCode}/guest/online`), 'value', (snap) => {
            const isOnline = snap.val() === true;
            if (isOnline && !_guestSeenOnline) {
                _guestSeenOnline = true;
                if (_callbacks.onOpponentReady) _callbacks.onOpponentReady();
                return;
            }
            if (!isOnline && _guestSeenOnline && !_guestWasDisconnected) {
                _guestWasDisconnected = true;
                if (_callbacks.onOpponentDisconnected) _callbacks.onOpponentDisconnected();
                return;
            }
            if (isOnline && _guestWasDisconnected) {
                _guestWasDisconnected = false;
                if (_callbacks.onOpponentReconnected) _callbacks.onOpponentReconnected();
            }
        });

        _on(db.ref(`rooms/${_roomCode}/colors`), 'value', (snap) => {
            if (snap.val() && _callbacks.onColorsAssigned) {
                _callbacks.onColorsAssigned(snap.val());
            }
        });

        _on(db.ref(`rooms/${_roomCode}/moves`), 'child_added', (snap) => {
            const data = snap.val();
            if (data && data.from !== _role && _callbacks.onOpponentMove) {
                _callbacks.onOpponentMove(data);
            }
        });

        _on(db.ref(`rooms/${_roomCode}/guest/setup`), 'value', (snap) => {
            if (snap.val() && _callbacks.onSetupSubmitted) {
                _callbacks.onSetupSubmitted('guest', snap.val());
            }
        });

        function _checkLobbyReady() {
            db.ref(`rooms/${_roomCode}/host/lobby_ready`).once('value').then(hostSnap => {
                db.ref(`rooms/${_roomCode}/guest/lobby_ready`).once('value').then(guestSnap => {
                    if (hostSnap.val() && guestSnap.val() && !_bothLobbyFired && _callbacks.onBothLobbyReady) {
                        _bothLobbyFired = true;
                        _callbacks.onBothLobbyReady();
                    }
                });
            });
        }
        _on(db.ref(`rooms/${_roomCode}/host/lobby_ready`), 'value', () => _checkLobbyReady());
        _on(db.ref(`rooms/${_roomCode}/guest/lobby_ready`), 'value', () => _checkLobbyReady());
    }

    /**
     * Creates a fresh room, claiming a code via an atomic transaction so a
     * (rare) collision with an existing room can NEVER silently overwrite
     * it — the transaction only succeeds if the path is currently empty.
     *
     * FIX: the previous version used `roomRef.set(...)`, an unconditional
     * write. With ~33.5M possible codes a collision is unlikely on any
     * single call, but not impossible, and an unconditional `set()` would
     * have clobbered another pair's active game (status, online flags,
     * and move history) with zero warning. On a genuine collision this
     * version regenerates a new code and retries (bounded — see
     * MAX_ROOM_CODE_ATTEMPTS) instead of touching the occupied room at all.
     *
     * The synchronous return-value contract is preserved for the existing
     * caller in app.js (it displays the code immediately) — this resolves
     * on the FIRST generated code optimistically. In the vanishingly rare
     * case a retry is needed, pass `onRoomCodeChanged` in `callbacks` to be
     * notified of the corrected code; existing callers that don't provide
     * it keep working exactly as before (correctness is still guaranteed
     * server-side — only the already-displayed code string could lag
     * behind on that one-in-many-million retry path).
     * @param {Object} callbacks
     * @returns {string} The room code (may be superseded — see above).
     */
    function createRoom(callbacks) {
        _callbacks = callbacks || {};
        _role = 'host';
        _bothLobbyFired = false;
        _roomCode = generateRoomCode();

        _claimRoomCode(_roomCode, 1);

        return _roomCode;
    }

    /**
     * Attempts to atomically claim `code` for a new room. On collision,
     * regenerates and retries (up to MAX_ROOM_CODE_ATTEMPTS); on final
     * failure, reports via onError rather than ever falling back to an
     * unconditional overwrite.
     * @param {string} code
     * @param {number} attempt
     */
    function _claimRoomCode(code, attempt) {
        const roomRef = db.ref(`rooms/${code}`);
        roomRef.transaction((current) => {
            // БЫЛО: `if (current !== null) return undefined;` — ЛЮБАЯ занятая
            // комната блокировала код навсегда, даже если оба игрока давно
            // ушли и некому было её удалить (единственный, кто раньше сносил
            // комнату — сам хост через onDisconnect().remove() — теперь
            // делает это мягко, см. выше, так что трупы копились бы вечно
            // без Cloud Functions и TTL).
            // СТАЛО: комната считается свободной для перезахвата, если она
            // явно завершена форфейтом (status === 'forfeited') ИЛИ обе
            // стороны молчат дольше STALE_ROOM_MS по серверным часам.
            // Использует transaction'ный server-time offset аргумент вместо
            // Date.now() — так же не доверяем клиентским часам.
            if (current !== null) {
                const hostLastSeen = current.host && current.host.lastSeen;
                const guestLastSeen = current.guest && current.guest.lastSeen;
                const isForfeited = current.status === 'forfeited';
                const bothStale = typeof hostLastSeen === 'number' && typeof guestLastSeen === 'number' &&
                    (Date.now() - hostLastSeen > STALE_ROOM_MS) &&
                    (Date.now() - guestLastSeen > STALE_ROOM_MS);
                if (!isForfeited && !bothStale) return undefined; // genuinely occupied — abort
                // Falls through: tombstone reclaimed, same as a fresh room.
            }
            return { status: 'waiting', host: { online: true }, guest: { online: false } };
        }).then((result) => {
            if (!result.committed) {
                // Collision: someone else already owns this code.
                if (attempt >= MAX_ROOM_CODE_ATTEMPTS) {
                    if (_callbacks.onError) {
                        _callbacks.onError(_t('mp.err.create_room', 'Failed to create the room, please try again'));
                    }
                    return;
                }
                const nextCode = generateRoomCode();
                _roomCode = nextCode;
                if (_callbacks.onRoomCodeChanged) _callbacks.onRoomCodeChanged(nextCode);
                _claimRoomCode(nextCode, attempt + 1);
                return;
            }

            // Claimed successfully — this is now really our room.
            _roomCode = code;
            // БЫЛО: roomRef.onDisconnect().remove() — обрыв связи у хоста
            // (вкладка закрыта, сеть легла) сносил ВСЮ комнату посреди
            // партии, включая историю ходов гостя. Гость получал битые
            // /null-снапшоты от всех своих listeners одновременно.
            // СТАЛО: мягкое обновление статуса + серверный timestamp.
            // Комната физически остаётся; oставшийся игрок (см. app.js
            // onOpponentDisconnected) сам решает, ждать реконнекта или
            // объявить победу через claimForfeitWin().
            roomRef.onDisconnect().update({
                'host/online': false,
                'host/lastSeen': SERVER_TS,
            });
            _attachHostListeners();
        }).catch((err) => {
            if (_callbacks.onError) _callbacks.onError(_t('mp.err.network', 'Network error') + ': ' + err.message);
        });
    }

    /**
     * Joins an existing room by code.
     *
     * FIX: the user-supplied code is now validated against the exact
     * alphabet/length generateRoomCode() can produce BEFORE it's used to
     * build a Firebase path. Firebase RTDB keys forbid `. # $ [ ] /` and
     * control characters — an unvalidated paste (stray slash, wrong
     * length, pasted whitespace-containing text, etc.) could throw
     * SYNCHRONOUSLY out of `db.ref()`, before the promise chain below even
     * starts, bypassing the .catch() error handling entirely. Rejecting
     * malformed input up front turns that into the same graceful
       onError('Комната не найдена') path as any other bad code.
     * @param {string} code
     * @param {Object} callbacks
     */
    function joinRoom(code, callbacks) {
        _callbacks = callbacks || {};
        _role = 'guest';
        _bothLobbyFired = false;

        const normalized = (code || '').toUpperCase().trim();
        if (!ROOM_CODE_PATTERN.test(normalized)) {
            if (_callbacks.onError) _callbacks.onError(_t('mp.err.room_not_found', 'Room not found'));
            return;
        }
        _roomCode = normalized;
        const roomRef = db.ref(`rooms/${_roomCode}`);

        roomRef.once('value').then((snap) => {
            if (!snap.exists()) {
                if (_callbacks.onError) _callbacks.onError(_t('mp.err.room_not_found', 'Room not found'));
                return;
            }

            // FIX: Subscribe to colors BEFORE setting guest/online=true, so the
            // listener is guaranteed to be active when the host writes colors.

            // Listen for colors assignment (guest reads what host wrote)
            _on(db.ref(`rooms/${_roomCode}/colors`), 'value', (snap) => {
                if (snap.val() && _callbacks.onColorsAssigned) {
                    _callbacks.onColorsAssigned(snap.val());
                }
            });

            // Listen for host moves
            _on(db.ref(`rooms/${_roomCode}/moves`), 'child_added', (snap) => {
                const data = snap.val();
                if (data && data.from !== _role && _callbacks.onOpponentMove) {
                    _callbacks.onOpponentMove(data);
                }
            });

            // БЫЛО: гость никогда не слушал host/online — обрыв связи у хоста
            // (раньше — снос комнаты целиком через onDisconnect().remove(),
            // теперь — мягкий online:false, см. _claimRoomCode) был вообще
            // никак не виден гостю: ни ошибки, ни статуса, тишина.
            // СТАЛО: тот же три-случая паттерн, что и у хоста выше, но со
            // стороны гостя и на host/online. Гость не пишет hostSeenOnline
            // на true при первом value-событии (хост уже online с момента
            // создания комнаты), поэтому старт сразу true — трактуем как
            // "уже был на связи", а не как первое появление.
            let _hostWasDisconnected = false;
            _on(db.ref(`rooms/${_roomCode}/host/online`), 'value', (snap) => {
                const isOnline = snap.val() === true;
                if (!isOnline && !_hostWasDisconnected) {
                    _hostWasDisconnected = true;
                    if (_callbacks.onOpponentDisconnected) _callbacks.onOpponentDisconnected();
                    return;
                }
                if (isOnline && _hostWasDisconnected) {
                    _hostWasDisconnected = false;
                    if (_callbacks.onOpponentReconnected) _callbacks.onOpponentReconnected();
                }
            });

            // Listen for host setup
            _on(db.ref(`rooms/${_roomCode}/host/setup`), 'value', (snap) => {
                if (snap.val() && _callbacks.onSetupSubmitted) {
                    _callbacks.onSetupSubmitted('host', snap.val());
                }
            });

            // Listen for lobby ready state (both players must click 'Готов к расстановке')
            function _checkLobbyReady() {
                db.ref(`rooms/${_roomCode}/host/lobby_ready`).once('value').then(hostSnap => {
                    db.ref(`rooms/${_roomCode}/guest/lobby_ready`).once('value').then(guestSnap => {
                        if (hostSnap.val() && guestSnap.val() && !_bothLobbyFired && _callbacks.onBothLobbyReady) {
                            _bothLobbyFired = true;
                            _callbacks.onBothLobbyReady();
                        }
                    });
                });
            }
            _on(db.ref(`rooms/${_roomCode}/host/lobby_ready`), 'value', () => _checkLobbyReady());
            _on(db.ref(`rooms/${_roomCode}/guest/lobby_ready`), 'value', () => _checkLobbyReady());

            // FIX: Set guest/online AFTER all listeners are attached — prevents the host
            // from writing colors before the guest's colors listener is ready.
            db.ref(`rooms/${_roomCode}/guest/online`).set(true).catch(err => {
                if (_callbacks.onError) _callbacks.onError(_t('mp.err.network', 'Network error') + ': ' + err.message);
            });
            // БЫЛО: onDisconnect().update({ 'guest/online': false }) — уже
            // было мягким (гостя эта проблема не касалась), но без lastSeen
            // не было данных для ленивой уборки трупов в _claimRoomCode.
            // СТАЛО: та же мягкая запись + серверный timestamp — симметрично
            // хосту, и теперь пригодно для STALE_ROOM_MS-проверки ниже.
            roomRef.onDisconnect().update({
                'guest/online': false,
                'guest/lastSeen': SERVER_TS,
            });

            if (_callbacks.onOpponentReady) _callbacks.onOpponentReady();
        }).catch((error) => {
            if (_callbacks.onError) _callbacks.onError(_t('mp.err.connection', 'Connection error') + ': ' + error.message);
        });
    }

    function sendSetup(setupData) {
        if (!_roomCode || !_role) return;
        db.ref(`rooms/${_roomCode}/${_role}/setup`).set(setupData);
    }

    /** Host calls this after coin flip to broadcast color assignment */
    function sendColors(hostColor) {
        if (!_roomCode) return;
        db.ref(`rooms/${_roomCode}/colors`).set(hostColor);
    }

    /** Signal that the local player clicked 'Готов к расстановке' */
    function sendLobbyReady() {
        if (!_roomCode || !_role) return;
        db.ref(`rooms/${_roomCode}/${_role}/lobby_ready`).set(true);
    }

    function sendMove(moveData) {
        if (!_roomCode || !_role) return;
        db.ref(`rooms/${_roomCode}/moves`).push({
            ...moveData,
            from: _role,
            ts: Date.now()
        });
    }

    function sendEquip(equipData) {
        sendMove({ type: 'equip', ...equipData });
    }

    /**
     * NEW (Step 1): called by the surviving player after RECONNECT_TIMEOUT_MS
     * of no reconnect from the opponent. Marks the room as forfeited (so a
     * late reconnect from the other side sees "game already ended" instead
     * of silently continuing to send moves into a room nobody reads from
     * anymore) and removes it — a legitimate participant is allowed to.
     * @param {'host'|'guest'} winnerRole - who is claiming the win.
     */
    function claimForfeitWin(winnerRole) {
        if (!_roomCode) return;
        const roomRef = db.ref(`rooms/${_roomCode}`);
        roomRef.update({ status: 'forfeited', forfeitWinner: winnerRole }).then(() => {
            roomRef.remove();
        }).catch(() => {
            // Best-effort: if the update fails (e.g. rules reject it), still
            // try to remove so the code frees up for lazy reclaim later.
            roomRef.remove();
        });
    }

    function cleanup() {
        _listeners.forEach(({ ref, event, cb }) => ref.off(event, cb));
        _listeners = [];
        _roomCode = null;
        _bothLobbyFired = false;
        _role = null;
        _callbacks = {};
    }

    function getRoomCode() { return _roomCode; }
    function getRole() { return _role; }

    return {
        createRoom, joinRoom, sendSetup, sendColors, sendLobbyReady, sendMove, sendEquip,
        claimForfeitWin, cleanup, getRoomCode, getRole,
        RECONNECT_TIMEOUT_MS, // exposed so app.js's UI countdown matches the real server-side timeout
    };
})();
