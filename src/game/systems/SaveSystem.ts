import { GameState } from "./GameState";

const SAVE_KEY = "clicker-save";

export class SaveSystem {
    static save() {
        const data = {
            wheat: GameState.instance.wheat,
            carrots: GameState.instance.carrots,
            purchasedUpgrades: GameState.instance.purchasedUpgrades,
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    static load() {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) return;

        const data = JSON.parse(raw);

        GameState.instance.wheat = data.wheat ?? 0;
        GameState.instance.carrots = data.carrots ?? 0;
        GameState.instance.purchasedUpgrades = data.purchasedUpgrades ?? [];

        GameState.instance.emit("scoreChanged", GameState.instance.carrots);
        GameState.instance.emit("upgradesChanged");
    }

}