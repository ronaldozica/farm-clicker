import { GameState } from "./GameState";
import { CROP_IDS, getCropDef, type CropAmounts } from "./CropDefs";

const SAVE_KEY = "clicker-save";

type SaveData = {
    cropAmounts?: Partial<CropAmounts>;
    purchasedUpgrades?: string[];
} & Record<string, unknown>;

export class SaveSystem {
    static save() {
        const data = {
            cropAmounts: GameState.instance.getCropAmounts(),
            purchasedUpgrades: GameState.instance.purchasedUpgrades,
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    static load() {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) return;

        const data = JSON.parse(raw) as SaveData;

        CROP_IDS.forEach(cropId => {
            const legacyAmount = data[getCropDef(cropId).amountKey];
            const amount = data.cropAmounts?.[cropId] ?? (typeof legacyAmount === "number" ? legacyAmount : 0);
            GameState.instance.setCropAmount(cropId, amount);
        });

        GameState.instance.purchasedUpgrades = data.purchasedUpgrades ?? [];

        GameState.instance.emit("scoreChanged", GameState.instance.getCropAmounts());
        GameState.instance.emit("upgradesChanged");
    }

}
