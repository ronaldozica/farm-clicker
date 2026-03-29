import { GameState } from "./GameState";

const SAVE_KEY = "clicker-save";

export class SaveSystem {
    static save() {
        const data = {
            clicks: GameState.instance.clicks
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    static load() {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) return;

        const data = JSON.parse(raw);

        GameState.instance.clicks = data.clicks ?? 0;
    }

}