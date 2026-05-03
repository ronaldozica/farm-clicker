import Phaser from "phaser";
import { CROP_IDS, createEmptyCropAmounts, type CropId, type CropAmounts } from './CropDefs';
import { UPGRADES, type UpgradeDef } from './UpgradeDefs';

export class GameState extends Phaser.Events.EventEmitter {
    private static _instance: GameState;
    public purchasedUpgrades: string[] = [];
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
        return this.getCropAmount('grass');
    }

    set grass(amount: number) {
        this.setCropAmount('grass', amount);
    }

    get wheat(): number {
        return this.getCropAmount('wheat');
    }

    set wheat(amount: number) {
        this.setCropAmount('wheat', amount);
    }

    get carrots(): number {
        return this.getCropAmount('carrot');
    }

    set carrots(amount: number) {
        this.setCropAmount('carrot', amount);
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

    addClick(cropType: CropId, reward?: number) {
        const finalReward = reward ?? 1;

        this.totalClicks++;
        this.setCropAmount(cropType, this.getCropAmount(cropType) + finalReward);

        this.emit('scoreChanged', this.getCropAmounts());
        this.emit('statsChanged', this.totalClicks);
    }

    public buyUpgrade(upgradeId: string): boolean {
        const upgrade = UPGRADES[upgradeId];

        if (!upgrade) return false;
        if (this.purchasedUpgrades.includes(upgradeId)) return false;
        
        if (this.carrots < upgrade.cost) return false;

        const hasRequirements = upgrade.requires.every(req => this.purchasedUpgrades.includes(req));
        if (!hasRequirements) return false;

        this.carrots -= upgrade.cost;
        this.purchasedUpgrades.push(upgradeId);

        this.applyUpgradeEffect(upgrade);

        this.emit("scoreChanged", this.getCropAmounts());
        this.emit("upgradesChanged");
        return true;
    }

    public getGlobalSpeedReduction(): number {
        let totalReduction = 0;
        for (const id of this.purchasedUpgrades) {
            const up = UPGRADES[id];
            if (up.type === 'speed') {
                totalReduction += up.value as number;
            }
        }
        return totalReduction;
    }

    private applyUpgradeEffect(upgrade: UpgradeDef) {
        if (upgrade.type === 'crop') {
            // todo: Lógica para adicionar o crop na lista de disponíveis do jogador
        } else if (upgrade.type === 'tile') {
            // todo: Lógica para desbloquear o tile no TileGrid
        }
    }
}
