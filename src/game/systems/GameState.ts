import Phaser from "phaser";
import { CROP_IDS, STARTING_CROP_IDS, createEmptyCropAmounts, type CropAmounts, type CropId } from "./CropDefs";
import { UPGRADES, type UpgradeDef } from "./UpgradeDefs";

export class GameState extends Phaser.Events.EventEmitter {
    private static _instance: GameState;
    public purchasedUpgrades: string[] = [];
    public unlockedCrops: CropId[] = [...STARTING_CROP_IDS];
    public cropAmounts: CropAmounts = createEmptyCropAmounts();
    public totalClicks: number = 0;

    private constructor() {
        super();
    }

    static get instance(): GameState {
        if (!this._instance) {
            this._instance = new GameState();
        }
        return this._instance;
    }

    get grass(): number {
        return this.getCropAmount("grass");
    }

    set grass(amount: number) {
        this.setCropAmount("grass", amount);
    }

    get wheat(): number {
        return this.getCropAmount("wheat");
    }

    set wheat(amount: number) {
        this.setCropAmount("wheat", amount);
    }

    get carrots(): number {
        return this.getCropAmount("carrot");
    }

    set carrots(amount: number) {
        this.setCropAmount("carrot", amount);
    }

    getCropAmount(cropType: CropId): number {
        return this.cropAmounts[cropType] ?? 0;
    }

    setCropAmount(cropType: CropId, amount: number) {
        this.cropAmounts[cropType] = amount;
    }

    getCropAmounts(): CropAmounts {
        return CROP_IDS.reduce((amounts, cropId) => {
            amounts[cropId] = this.getCropAmount(cropId);
            return amounts;
        }, {} as CropAmounts);
    }

    isCropUnlocked(cropId: CropId): boolean {
        return this.unlockedCrops.includes(cropId);
    }

    unlockCrop(cropId: CropId) {
        if (!this.unlockedCrops.includes(cropId)) {
            this.unlockedCrops.push(cropId);
        }
    }

    addClick(cropType: CropId, reward?: number) {
        const finalReward = reward ?? 1;

        this.totalClicks++;
        this.setCropAmount(cropType, this.getCropAmount(cropType) + finalReward);

        this.emit("scoreChanged", this.getCropAmounts());
        this.emit("statsChanged", this.totalClicks);
    }

    public buyUpgrade(upgradeId: string): boolean {
        const upgrade = UPGRADES[upgradeId];

        if (!upgrade) return false;
        if (this.purchasedUpgrades.includes(upgradeId)) return false;

        const hasRequirements = upgrade.requires.every(req => this.purchasedUpgrades.includes(req));
        if (!hasRequirements) return false;
        if (this.getCropAmount(upgrade.costCrop) < upgrade.cost) return false;

        this.setCropAmount(upgrade.costCrop, this.getCropAmount(upgrade.costCrop) - upgrade.cost);
        this.purchasedUpgrades.push(upgradeId);

        this.applyUpgradeEffect(upgrade);

        this.emit("scoreChanged", this.getCropAmounts());
        this.emit("upgradesChanged");
        return true;
    }

    public getGrowthSpeedReduction(cropType: CropId): number {
        let totalReduction = 0;
        for (const id of this.purchasedUpgrades) {
            const upgrade = UPGRADES[id];
            if (upgrade?.type === "speed" && upgrade.targetCrop === cropType) {
                totalReduction += upgrade.value as number;
            }
        }
        return totalReduction;
    }

    private applyUpgradeEffect(upgrade: UpgradeDef) {
        if (upgrade.type === "crop") {
            this.unlockCrop(upgrade.value as CropId);
        }
    }
}
