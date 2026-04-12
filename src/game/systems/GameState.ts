import Phaser from "phaser";
import { UPGRADES, type UpgradeDef } from './UpgradeDefs';

export class GameState extends Phaser.Events.EventEmitter {
    private static _instance: GameState;
    public purchasedUpgrades: string[] = [];
    
    public grass: number = 0; 
    public wheat: number = 0; 
    public carrots: number = 0;
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

    addClick(cropType: 'grass' | 'wheat' | 'carrot', reward?: number) {
        const finalReward = reward ?? 1;

        this.totalClicks++;
        
        if (cropType === 'carrot') {
            this.carrots += finalReward;
        } else if (cropType === 'wheat') {
            this.wheat += finalReward;
        } else if (cropType === 'grass') {
            this.grass += finalReward;
        }

        this.emit('scoreChanged', { grass: this.grass, wheat: this.wheat, carrots: this.carrots });
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

        this.emit("scoreChanged", { wheat: this.wheat, carrots: this.carrots });
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
