/* ============================================
   Item Stats Tracker — Winrate & Usage
   ============================================ */

const ITEM_STATS_KEY = 'chess_item_stats';

const ItemStats = {
    // Load stats from localStorage
    load() {
        try {
            const raw = localStorage.getItem(ITEM_STATS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    },

    // Save stats to localStorage
    save(stats) {
        try {
            localStorage.setItem(ITEM_STATS_KEY, JSON.stringify(stats));
        } catch (e) {}
    },

    // Record that an item was used (equipped) in a run
    recordUsed(itemId) {
        const stats = this.load();
        if (!stats[itemId]) stats[itemId] = { used: 0, wins: 0, losses: 0 };
        stats[itemId].used++;
        this.save(stats);
    },

    // Record a win — give credit to all items equipped on winning pieces
    recordWin(equippedItemIds = []) {
        const stats = this.load();
        equippedItemIds.forEach(itemId => {
            if (!itemId) return;
            if (!stats[itemId]) stats[itemId] = { used: 0, wins: 0, losses: 0 };
            stats[itemId].wins++;
        });
        this.save(stats);
    },

    // Record a loss — give credit to all items that were equipped
    recordLoss(equippedItemIds = []) {
        const stats = this.load();
        equippedItemIds.forEach(itemId => {
            if (!itemId) return;
            if (!stats[itemId]) stats[itemId] = { used: 0, wins: 0, losses: 0 };
            stats[itemId].losses++;
        });
        this.save(stats);
    },

    // Get winrate for a specific item (0–100%)
    getWinrate(itemId) {
        const stats = this.load();
        const s = stats[itemId];
        if (!s || s.used === 0) return null;
        const games = s.wins + s.losses;
        if (games === 0) return null;
        return Math.round((s.wins / games) * 100);
    },

    // Get all stats, sorted by usage
    getAll() {
        const stats = this.load();
        return Object.entries(stats)
            .map(([id, s]) => {
                const games = s.wins + s.losses;
                return {
                    id,
                    used: s.used,
                    wins: s.wins,
                    losses: s.losses,
                    games,
                    winrate: games > 0 ? Math.round((s.wins / games) * 100) : null,
                };
            })
            .sort((a, b) => b.used - a.used);
    },

    // Format winrate for display: "67%" or "—" if no data
    format(itemId) {
        const wr = this.getWinrate(itemId);
        return wr !== null ? `${wr}%` : '—';
    },

    // Reset all stats
    reset() {
        localStorage.removeItem(ITEM_STATS_KEY);
    },
};
