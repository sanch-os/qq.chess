/* ================================================
   multiplayer.js — Firebase Realtime Multiplayer
   for qq.chess "Play with Friend" mode
   ================================================ */

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

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

window.Multiplayer = (function () {
    let _roomCode = null;
    let _role = null; // 'host' or 'guest'
    let _callbacks = {};
    let _listeners = [];

    function _on(ref, event, cb) {
        ref.on(event, cb);
        _listeners.push({ ref, event, cb });
    }

    function createRoom(callbacks) {
        _callbacks = callbacks || {};
        _role = 'host';
        _roomCode = generateRoomCode();
        const roomRef = db.ref(`rooms/${_roomCode}`);

        // Auto-cleanup on disconnect
        roomRef.onDisconnect().remove();

        // Write fresh room state — clears any stale data from previous sessions
        roomRef.set({ status: 'waiting', host: { online: true }, guest: { online: false } });

        // Listen for guest joining
        _on(db.ref(`rooms/${_roomCode}/guest/online`), 'value', (snap) => {
            if (snap.val() === true && _callbacks.onOpponentReady) {
                _callbacks.onOpponentReady();
            }
        });

        // Listen for colors assignment (host writes, but listener is here for symmetry)
        _on(db.ref(`rooms/${_roomCode}/colors`), 'value', (snap) => {
            if (snap.val() && _callbacks.onColorsAssigned) {
                _callbacks.onColorsAssigned(snap.val());
            }
        });

        // Listen for opponent moves
        _on(db.ref(`rooms/${_roomCode}/moves`), 'child_added', (snap) => {
            const data = snap.val();
            if (data && data.from !== _role && _callbacks.onOpponentMove) {
                _callbacks.onOpponentMove(data);
            }
        });

        // Listen for guest setup
        _on(db.ref(`rooms/${_roomCode}/guest/setup`), 'value', (snap) => {
            if (snap.val() && _callbacks.onSetupSubmitted) {
                _callbacks.onSetupSubmitted('guest', snap.val());
            }
        });

        // Listen for lobby ready state (both players must click 'Готов к расстановке')
        function _checkLobbyReady() {
            db.ref(`rooms/${_roomCode}/host/lobby_ready`).once('value').then(hostSnap => {
                db.ref(`rooms/${_roomCode}/guest/lobby_ready`).once('value').then(guestSnap => {
                    if (hostSnap.val() && guestSnap.val() && _callbacks.onBothLobbyReady) {
                        _callbacks.onBothLobbyReady();
                    }
                });
            });
        }
        _on(db.ref(`rooms/${_roomCode}/host/lobby_ready`), 'value', () => _checkLobbyReady());
        _on(db.ref(`rooms/${_roomCode}/guest/lobby_ready`), 'value', () => _checkLobbyReady());

        return _roomCode;
    }

    function joinRoom(code, callbacks) {
        _callbacks = callbacks || {};
        _role = 'guest';
        _roomCode = code.toUpperCase().trim();
        const roomRef = db.ref(`rooms/${_roomCode}`);

        roomRef.once('value').then((snap) => {
            if (!snap.exists()) {
                if (_callbacks.onError) _callbacks.onError('Комната не найдена');
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
                        if (hostSnap.val() && guestSnap.val() && _callbacks.onBothLobbyReady) {
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
                if (_callbacks.onError) _callbacks.onError('Ошибка сети: ' + err.message);
            });
            roomRef.onDisconnect().update({ 'guest/online': false });

            if (_callbacks.onOpponentReady) _callbacks.onOpponentReady();
        }).catch((error) => {
            if (_callbacks.onError) _callbacks.onError('Ошибка подключения: ' + error.message);
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

    function cleanup() {
        _listeners.forEach(({ ref, event, cb }) => ref.off(event, cb));
        _listeners = [];
        _roomCode = null;
        _role = null;
        _callbacks = {};
    }

    function getRoomCode() { return _roomCode; }
    function getRole() { return _role; }

    return { createRoom, joinRoom, sendSetup, sendColors, sendLobbyReady, sendMove, sendEquip, cleanup, getRoomCode, getRole };
})();
