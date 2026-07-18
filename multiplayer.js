/* ============================================================================
   Item Stats Tracker — qq.chess winrate & usage analytics (refactored)
   ============================================================================
   Persists per-item usage/outcome counters to localStorage so the shop UI
   can show a "this item wins X% of the time" hint (ItemStats.format()).

   TWO SEPARATE COUNTERS, ONE SHARED PITFALL:
     • `used`         — how many times the item was equipped (popularity).
     • `wins`/`losses` — how many completed rounds it was equipped for.
   These are fed by DIFFERENT call sites (an equip action vs. a round
   ending), so they can legitimately drift apart, and — as found in this
   audit — one of them can simply never be wired up at all. Only wins/losses
   are used for the winrate shown to players; `used` is a separate,
   independent popularity signal and must never be required as a precondition
   for computing a winrate, or the whole feature quietly goes dark the moment
   nothing happens to call recordUsed(). See _computeWinrate() below.
   ========================================================================= */

const ITEM_STATS_KEY = 'chess_item_stats';

/** In-memory cache to avoid repeated JSON parse/serialize on every call. */
let _statsCache = null;

const ItemStats = {
    /**
     * Loads the stats blob (cached after the first call).
     *
     * NOTE: returns the LIVE cache object, not a defensive copy. Every
     * method in this module immediately follows a load() with a save() of
     * the same (mutated) object, which is safe. If external code ever
     * calls ItemStats.load() directly, it must treat the result as
     * read-only or call ItemStats.save() afterward — mutating it silently
     * bypasses the persistence path.
     * @returns {Object<string,{used:number,wins:number,losses:number}>}
     */
    load() {
        if (_statsCache) return _statsCache;
        try {
            const raw = localStorage.getItem(ITEM_STATS_KEY);
            _statsCache = raw ? JSON.parse(raw) : {};
        } catch (e) {
            _statsCache = {};
        }
        return _statsCache;
    },

    /**
     * Persists the stats blob and updates the in-memory cache.
     * @param {Object} stats
     */
    save(stats) {
        _statsCache = stats;
        try {
            localStorage.setItem(ITEM_STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            // Quota exceeded / storage disabled: stats simply won't persist
            // across sessions, but gameplay must not be interrupted by it.
        }
    },

    /**
     * Ensures a stats record exists for an item id.
     * @param {Object} stats
     * @param {string} itemId
     * @returns {{used:number,wins:number,losses:number}}
     */
    _ensure(stats, itemId) {
        if (!stats[itemId]) stats[itemId] = { used: 0, wins: 0, losses: 0 };
        return stats[itemId];
    },

    /**
     * Records that an item was equipped in a run (popularity counter).
     *
     * NOTE FOR INTEGRATORS: as of this audit, nothing in the codebase calls
     * this method — grepping every file that could plausibly equip an item
     * (app.js, editor.js, run-manager.js) found zero call sites. `used`
     * will read 0 for every item until an equip-time call is added
     * upstream (in whatever code path assigns an item to a piece). This is
     * independent from win/loss tracking below, which already works.
     * @param {string} itemId
     */
    recordUsed(itemId) {
        const stats = this.load();
        this._ensure(stats, itemId).used++;
        this.save(stats);
    },

    /**
     * Records a win — credits every item equipped on the winning side.
     * @param {string[]} [equippedItemIds]
     */
    recordWin(equippedItemIds = []) {
        const stats = this.load();
        equippedItemIds.forEach(itemId => {
            if (!itemId) return;
            this._ensure(stats, itemId).wins++;
        });
        this.save(stats);
    },

    /**
     * Records a loss — credits every item that was equipped.
     * @param {string[]} [equippedItemIds]
     */
    recordLoss(equippedItemIds = []) {
        const stats = this.load();
        equippedItemIds.forEach(itemId => {
            if (!itemId) return;
            this._ensure(stats, itemId).losses++;
        });
        this.save(stats);
    },

    /**
     * Shared winrate calculation used by both getWinrate() and getAll().
     *
     * FIX: the previous version had TWO DIFFERENT formulas for the same
     * statistic — getWinrate() divided by `used`, getAll() divided by
     * `wins + losses` — and, because nothing in the codebase ever calls
     * recordUsed(), `used` is always 0, which made getWinrate() (the one
     * actually wired into the shop UI via format()) return null 100% of
     * the time, for every item, permanently, even though wins/losses were
     * being recorded correctly the whole time. Standardizing on
     * `wins + losses` — the denominator that is ACTUALLY fed by real call
     * sites — fixes the shop display immediately and guarantees the two
     * public methods can never disagree with each other again.
     * @param {{wins:number,losses:number}|undefined} s
     * @returns {number|null} Rounded percentage, or null if no games recorded.
     */
    _computeWinrate(s) {
        if (!s) return null;
        const games = s.wins + s.losses;
        if (games === 0) return null;
        return Math.round((s.wins / games) * 100);
    },

    /**
     * Winrate for a specific item (0-100), or null if it has no recorded
     * wins/losses yet.
     * @param {string} itemId
     * @returns {number|null}
     */
    getWinrate(itemId) {
        const stats = this.load();
        return this._computeWinrate(stats[itemId]);
    },

    /**
     * All tracked items' stats, sorted by usage (most-equipped first).
     * @returns {Array<{id:string, used:number, wins:number, losses:number, games:number, winrate:?number}>}
     */
    getAll() {
        const stats = this.load();
        return Object.entries(stats)
            .map(([id, s]) => ({
                id,
                used: s.used,
                wins: s.wins,
                losses: s.losses,
                games: s.wins + s.losses,
                winrate: this._computeWinrate(s),
            }))
            .sort((a, b) => b.used - a.used);
    },

    /**
     * Display-ready winrate string for the shop UI.
     * @param {string} itemId
     * @returns {string} e.g. "67%", or "—" if no games are recorded yet.
     */
    format(itemId) {
        const wr = this.getWinrate(itemId);
        return wr !== null ? `${wr}%` : '—';
    },

    /** Clears all tracked stats (e.g. a "reset stats" settings option). */
    reset() {
        _statsCache = {};
        try {
            localStorage.removeItem(ITEM_STATS_KEY);
        } catch (e) {
            // Storage unavailable: the in-memory cache is still cleared
            // above, so the running session behaves as reset even if the
            // persisted blob couldn't be touched.
        }
    },
};
