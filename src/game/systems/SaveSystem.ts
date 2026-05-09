import { GameState } from "./GameState";
import { CROP_IDS, STARTING_CROP_IDS, getCropDef, type CropAmounts, type CropId } from "./CropDefs";

const SAVE_KEY = "clicker-save";

type SaveData = {
    cropAmounts?: Partial<CropAmounts>;
    purchasedUpgrades?: string[];
    unlockedCrops?: CropId[];
    cowCount?: number;
    bunnyCount?: number;
} & Record<string, unknown>;

export class SaveSystem {
    static save() {
        const data = {
            cropAmounts: GameState.instance.getCropAmounts(),
            purchasedUpgrades: GameState.instance.purchasedUpgrades,
            unlockedCrops: GameState.instance.unlockedCrops,
            cowCount: GameState.instance.getCowCount(),
            bunnyCount: GameState.instance.getBunnyCount(),
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    static load() {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) return;

        const data = JSON.parse(raw) as SaveData;

        CROP_IDS.forEach(cropId => {
            const legacyAmount = getCropDef(cropId).amountKeys
                .map(amountKey => data.cropAmounts?.[amountKey as CropId] ?? data[amountKey])
                .find(amount => typeof amount === "number");
            const amount = data.cropAmounts?.[cropId] ?? (typeof legacyAmount === "number" ? legacyAmount : 0);
            GameState.instance.setCropAmount(cropId, amount);
        });

        GameState.instance.purchasedUpgrades = data.purchasedUpgrades ?? [];
        GameState.instance.unlockedCrops = data.unlockedCrops?.filter(cropId => CROP_IDS.includes(cropId)) ?? [...STARTING_CROP_IDS];
        GameState.instance.restoreCowCount(
            typeof data.cowCount === "number"
                ? data.cowCount
                : GameState.instance.purchasedUpgrades.includes("cow") ? 1 : 0
        );
        GameState.instance.restoreBunnyCount(
            typeof data.bunnyCount === "number"
                ? data.bunnyCount
                : GameState.instance.purchasedUpgrades.includes("bunny") ? 1 : 0
        );

        GameState.instance.purchasedUpgrades.forEach(upgradeId => {
            if (upgradeId === "crop_wheat") GameState.instance.unlockCrop("wheat");
            if (upgradeId === "crop_carrot") GameState.instance.unlockCrop("carrot");
        });

        GameState.instance.emit("scoreChanged", GameState.instance.getCropAmounts());
        GameState.instance.emit("upgradesChanged");
    }

}
