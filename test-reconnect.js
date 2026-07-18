/* ============================================================================
   test-reconnect.js — Phase 2, Step 1 (host/guest reconnect)
   ============================================================================
   multiplayer.js talks to Firebase directly (db = firebase.database()) with
   no dependency-injection seam, so these tests fake the minimal `firebase`
   surface the module touches (transaction/on/once/set/update/remove/off) as
   an in-memory tree, rather than trying to load the real SDK. This exercises
   the module's OWN logic (event routing, disconnect/reconnect detection,
   forfeit, lazy tombstone reclaim) without needing a live database.

   IMPORTANT: createRoom()/joinRoom() resolve their transaction/read chains
   as MICROTASKS in this fake (same as the real SDK) — every test awaits
   `settle()` after calling them (and after any simulated event that itself
   triggers async work) before asserting, or listeners/writes racing ahead
   of the promise chain produce false failures.
   ========================================================================= */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
    cond ? pass++ : fail++;
    console.log((cond ? '✓' : '✗ FAIL'), name, cond ? '' : '\n    ' + extra);
};

/** Flushes pending microtasks (a couple ticks is enough for our fake's
 *  Promise.resolve()-based chains — nothing here does real I/O). */
function settle(n = 3) {
    let p = Promise.resolve();
    for (let i = 0; i < n; i++) p = p.then(() => new Promise(r => setTimeout(r, 0)));
    return p;
}

const SERVER_TS_SENTINEL = '__SERVER_TS__';

function makeFakeFirebase() {
    let tree = {};
    let clock = 1000;
    const listeners = {};
    const disconnectHandlers = {};

    function getAt(p) {
        return p.split('/').filter(Boolean).reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, tree);
    }
    function setAt(p, val) {
        const parts = p.split('/').filter(Boolean);
        if (parts.length === 0) { tree = val; return; }
        let obj = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            if (typeof obj[parts[i]] !== 'object' || obj[parts[i]] === null) obj[parts[i]] = {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = val;
    }
    function deleteAt(p) {
        const parts = p.split('/').filter(Boolean);
        if (parts.length === 0) { tree = {}; return; }
        let obj = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) return;
            obj = obj[parts[i]];
        }
        delete obj[parts[parts.length - 1]];
    }
    function resolveTimestamps(val) {
        if (val === SERVER_TS_SENTINEL) return clock;
        if (Array.isArray(val)) return val.map(resolveTimestamps);
        if (val && typeof val === 'object') {
            const out = {};
            for (const k of Object.keys(val)) out[k] = resolveTimestamps(val[k]);
            return out;
        }
        return val;
    }
    function fireListeners(changedPath) {
        let p = changedPath;
        while (true) {
            const evs = listeners[p];
            if (evs && evs.value) {
                const val = getAt(p);
                evs.value.slice().forEach(cb => cb({ val: () => val, exists: () => val !== undefined }));
            }
            if (p === '') break;
            p = p.split('/').slice(0, -1).join('/');
        }
    }

    function makeRef(p) {
        return {
            _path: p,
            child(seg) { return makeRef(p + '/' + seg); },
            on(event, cb) {
                listeners[p] = listeners[p] || {};
                listeners[p][event] = listeners[p][event] || [];
                listeners[p][event].push(cb);
                if (event === 'value') cb({ val: () => getAt(p), exists: () => getAt(p) !== undefined });
            },
            off(event, cb) {
                if (listeners[p] && listeners[p][event]) {
                    listeners[p][event] = listeners[p][event].filter(f => f !== cb);
                }
            },
            once() {
                return Promise.resolve({ val: () => getAt(p), exists: () => getAt(p) !== undefined });
            },
            set(val) {
                setAt(p, resolveTimestamps(val));
                fireListeners(p);
                return Promise.resolve();
            },
            update(val) {
                // Real RTDB semantics: each key may be a slash-separated
                // RELATIVE PATH (multi-location update) — exactly how
                // multiplayer.js writes {'host/online': false, ...}.
                for (const [k, v] of Object.entries(val)) {
                    setAt(p + '/' + k, resolveTimestamps(v));
                    fireListeners(p + '/' + k);
                }
                return Promise.resolve();
            },
            remove() {
                deleteAt(p);
                fireListeners(p);
                return Promise.resolve();
            },
            push(val) {
                const cur = getAt(p) || {};
                const key = 'k' + Object.keys(cur).length;
                setAt(p + '/' + key, resolveTimestamps(val));
                fireListeners(p);
                return Promise.resolve();
            },
            transaction(updateFn) {
                const cur = getAt(p);
                const result = updateFn(cur === undefined ? null : cur);
                if (result === undefined) return Promise.resolve({ committed: false, snapshot: { val: () => cur } });
                setAt(p, resolveTimestamps(result));
                fireListeners(p);
                return Promise.resolve({ committed: true, snapshot: { val: () => getAt(p) } });
            },
            onDisconnect() {
                return {
                    update: (patch) => { disconnectHandlers[p] = { type: 'update', patch }; return Promise.resolve(); },
                    remove: () => { disconnectHandlers[p] = { type: 'remove' }; return Promise.resolve(); },
                };
            },
        };
    }

    return {
        apps: [1],
        initializeApp: () => {},
        database: Object.assign(() => ({ ref: (p) => makeRef(p || '') }), {
            ServerValue: { TIMESTAMP: SERVER_TS_SENTINEL },
        }),
        _tree: () => tree,
        _advanceClock(ms) { clock += ms; },
        _simulateDisconnect(roomPath) {
            const h = disconnectHandlers[roomPath];
            if (!h) return;
            if (h.type === 'remove') { deleteAt(roomPath); fireListeners(roomPath); return; }
            for (const [k, v] of Object.entries(h.patch)) {
                setAt(roomPath + '/' + k, resolveTimestamps(v));
                fireListeners(roomPath + '/' + k);
            }
        },
    };
}

function loadMultiplayer(fb) {
    const win = {};
    const src = fs.readFileSync(path.join(__dirname, '..', 'multiplayer.js'), 'utf8');
    new Function('firebase', 'window', src)(fb, win);
    return win.Multiplayer;
}

async function run() {
    /* ── 1. Host disconnect no longer removes the room (soft update) ── */
    {
        const fb = makeFakeFirebase();
        const host = loadMultiplayer(fb);
        const code = host.createRoom({});
        await settle();
        fb._simulateDisconnect(`rooms/${code}`);
        const room = fb._tree().rooms[code];
        check('хост-дисконнект: комната НЕ удалена', !!room, 'room missing');
        check('хост-дисконнект: host.online = false', !!room && room.host.online === false);
        check('хост-дисконнект: host.lastSeen проставлен', !!room && typeof room.host.lastSeen === 'number');
    }

    /* ── 2. onOpponentDisconnected / onOpponentReconnected (host side) ── */
    {
        const fb = makeFakeFirebase();
        let disconnected = 0, reconnected = 0, ready = 0;
        const host = loadMultiplayer(fb);
        const code = host.createRoom({
            onOpponentReady: () => ready++,
            onOpponentDisconnected: () => disconnected++,
            onOpponentReconnected: () => reconnected++,
        });
        await settle();

        fb.database().ref(`rooms/${code}/guest/online`).set(true);
        check('guest online=true (первый раз) -> onOpponentReady', ready === 1 && disconnected === 0);

        fb.database().ref(`rooms/${code}/guest/online`).set(false);
        check('guest online=false (после ready) -> onOpponentDisconnected', disconnected === 1);

        fb.database().ref(`rooms/${code}/guest/online`).set(true);
        check('guest online=true (после disconnect) -> onOpponentReconnected', reconnected === 1);
        check('onOpponentReady не срабатывает повторно при реконнекте', ready === 1);
    }

    /* ── 3. Guest side sees host disconnect/reconnect (previously: no listener existed at all) ── */
    {
        const fb = makeFakeFirebase();
        const host = loadMultiplayer(fb);
        const code = host.createRoom({});
        await settle();

        let disconnected = 0, reconnected = 0;
        const guest = loadMultiplayer(fb);
        guest.joinRoom(code, {
            onOpponentDisconnected: () => disconnected++,
            onOpponentReconnected: () => reconnected++,
        });
        await settle();

        fb.database().ref(`rooms/${code}/host/online`).set(false);
        check('host online=false -> guest получает onOpponentDisconnected (раньше — ничего)', disconnected === 1);

        fb.database().ref(`rooms/${code}/host/online`).set(true);
        check('host online=true после дисконнекта -> onOpponentReconnected', reconnected === 1);
    }

    /* ── 4. claimForfeitWin marks status then removes the room ── */
    {
        const fb = makeFakeFirebase();
        const host = loadMultiplayer(fb);
        const code = host.createRoom({});
        await settle();

        host.claimForfeitWin('host');
        await settle();

        check('claimForfeitWin: комната удалена из дерева', fb._tree().rooms[code] === undefined,
              JSON.stringify(fb._tree().rooms[code]));
    }

    /* ── 5. Lazy tombstone reclaim: a truly stale room's code gets reused ── */
    {
        const fb = makeFakeFirebase();
        const realRandom = Math.random;
        Math.random = () => 0.0; // makes generateRoomCode() deterministic
        const mp1 = loadMultiplayer(fb);
        const code = mp1.createRoom({});
        await settle();

        await fb.database().ref(`rooms/${code}/host/lastSeen`).set(1000);
        await fb.database().ref(`rooms/${code}/guest/lastSeen`).set(1000);
        await fb.database().ref(`rooms/${code}/host/online`).set(false);
        fb._advanceClock(11 * 60 * 1000); // > STALE_ROOM_MS (10 min)

        let errored = false;
        const mp2 = loadMultiplayer(fb);
        const code2 = mp2.createRoom({ onError: () => { errored = true; } });
        await settle();

        Math.random = realRandom;
        check('стале-комната (>10 мин, оба lastSeen старые) переиспользуется без onError',
              code2 === code && !errored, `code2=${code2} vs code=${code}, errored=${errored}`);
        check('после переиспользования комната свежая (host.online=true)',
              fb._tree().rooms[code] && fb._tree().rooms[code].host.online === true);
    }

    /* ── 6. A FRESH (non-stale) occupied code is NOT overwritten ── */
    {
        const fb = makeFakeFirebase();
        const realRandom = Math.random;
        Math.random = () => 0.0;
        const mp1 = loadMultiplayer(fb);
        const code = mp1.createRoom({});
        await settle();

        let errored = false;
        const mp2 = loadMultiplayer(fb);
        mp2.createRoom({ onError: () => { errored = true; } });
        await settle();

        Math.random = realRandom;
        check('свежая занятая комната НЕ перезаписывается (коллизия эскалирует в onError)', errored === true);
    }

    /* ── 7. A room explicitly marked 'forfeited' is reclaimable immediately (no staleness wait) ── */
    {
        const fb = makeFakeFirebase();
        const realRandom = Math.random;
        Math.random = () => 0.0;
        const mp1 = loadMultiplayer(fb);
        const code = mp1.createRoom({});
        await settle();

        await fb.database().ref(`rooms/${code}`).set({
            status: 'forfeited', host: { online: false, lastSeen: 1000 }, guest: { online: false, lastSeen: 1000 },
        });

        let errored = false;
        const mp2 = loadMultiplayer(fb);
        const code2 = mp2.createRoom({ onError: () => { errored = true; } });
        await settle();

        Math.random = realRandom;
        check("status:'forfeited' переиспользуется сразу, без ожидания STALE_ROOM_MS",
              code2 === code && !errored);
    }

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
}

run();
