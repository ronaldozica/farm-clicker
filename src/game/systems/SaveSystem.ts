import { GameState, type SerializedState } from "./GameState";

const SAVE_KEY    = "farm-clicker-save";
const BACKUP_KEY  = "farm-clicker-save-backup";

export class SaveSystem {
    private static _autoSaveInterval: ReturnType<typeof setInterval> | null = null;

    static save(): boolean {
        try {
            const payload = GameState.instance.serialize();
            const raw = JSON.stringify(payload);

            const existing = localStorage.getItem(SAVE_KEY);
            if (existing) localStorage.setItem(BACKUP_KEY, existing);

            localStorage.setItem(SAVE_KEY, raw);
            return true;
        } catch (e) {
            console.error("[SaveSystem] Falha ao salvar:", e);
            return false;
        }
    }

    static load(): boolean {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;

        return SaveSystem._applyRaw(raw, "principal");
    }

    static loadBackup(): boolean {
        const raw = localStorage.getItem(BACKUP_KEY);
        if (!raw) {
            console.warn("[SaveSystem] Nenhum backup encontrado.");
            return false;
        }
        return SaveSystem._applyRaw(raw, "backup");
    }

    private static _applyRaw(raw: string, label: string): boolean {
        try {
            const data: SerializedState = JSON.parse(raw);

            const migrated = SaveSystem._migrate(data);

            GameState.instance.deserialize(migrated);
            console.info(`[SaveSystem] Save ${label} carregado (v${migrated.version}).`);
            return true;
        } catch (e) {
            console.error(`[SaveSystem] Falha ao carregar save ${label}:`, e);
            return false;
        }
    }

    private static _migrate(data: Partial<SerializedState>): SerializedState {
        let d = { ...data } as any;

        if (!d.version) {
            d.version     = 1;
            d.carrots      = d.clicks ?? 0;
            d.totalCarrotsEver = d.clicks ?? 0;
            d.totalClicks  = d.clicks ?? 0;
            d.carrotsPerClick = 1;
            d.cpsMultiplier   = 1;
            d.buildings       = {};
            d.purchasedUpgrades = [];
            delete d.clicks;
            console.info("[SaveSystem] Migrado v0 → v1.");
        }

        return d as SerializedState;
    }

    static startAutoSave(intervalMs: number = 30_000) {
        SaveSystem.stopAutoSave();
        SaveSystem._autoSaveInterval = setInterval(() => {
            const ok = SaveSystem.save();
            if (ok) console.debug("[SaveSystem] Auto-save ok.");
        }, intervalMs);
        console.info(`[SaveSystem] Auto-save iniciado (${intervalMs / 1000}s).`);
    }

    static stopAutoSave() {
        if (SaveSystem._autoSaveInterval !== null) {
            clearInterval(SaveSystem._autoSaveInterval);
            SaveSystem._autoSaveInterval = null;
        }
    }

    static deleteSave() {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        console.info("[SaveSystem] Save deletado.");
    }

    static exportSave(): string {
        const raw = localStorage.getItem(SAVE_KEY) ?? "{}";
        return btoa(raw);
    }

    static importSave(encoded: string): boolean {
        try {
            const raw = atob(encoded);
            JSON.parse(raw);
            localStorage.setItem(SAVE_KEY, raw);
            return SaveSystem.load();
        } catch (e) {
            console.error("[SaveSystem] Save importado inválido:", e);
            return false;
        }
    }

    static getSaveSize(): number {
        return (localStorage.getItem(SAVE_KEY) ?? "").length;
    }
}