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

        roomRef.set({ status: 'waiting', host: { online: true }, guest: { online: false } });

        // Listen for guest joining
        _on(db.ref(`rooms/${_roomCode}/guest/online`), 'value', (snap) => {
            if (snap.val() === true && _callbacks.onOpponentReady) {
                _callbacks.onOpponentReady();
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

            // Mark guest as online
            db.ref(`rooms/${_roomCode}/guest/online`).set(true);
            roomRef.onDisconnect().update({ 'guest/online': false });

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

            if (_callbacks.onOpponentReady) _callbacks.onOpponentReady();
        });
    }

    function sendSetup(setupData) {
        if (!_roomCode || !_role) return;
        db.ref(`rooms/${_roomCode}/${_role}/setup`).set(setupData);
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

    return { createRoom, joinRoom, sendSetup, sendMove, sendEquip, cleanup, getRoomCode, getRole };
})();
