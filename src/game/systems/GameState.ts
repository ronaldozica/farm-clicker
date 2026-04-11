import Phaser from "phaser";

export interface BuildingDef {
    id: string;
    name: string;
    baseCost: number;       
    baseCps: number;        
    costGrowth: number;     
}

export interface OwnedBuilding {
    def: BuildingDef;
    owned: number;
}

export interface UpgradeDef {
    id: string;
    name: string;
    description: string;
    cost: number;
    apply: (state: GameState) => void;
    unlockCondition: (state: GameState) => boolean;
}

export const BUILDING_DEFS: BuildingDef[] = [
    { id: "scarecrow",   name: "Espantalho",  baseCost: 15,     baseCps: 0.1,  costGrowth: 1.15 },
    { id: "chicken",     name: "Galinha",     baseCost: 100,    baseCps: 0.5,  costGrowth: 1.15 },
    { id: "watermill",   name: "Moinho",      baseCost: 500,    baseCps: 2,    costGrowth: 1.15 },
    { id: "tractor",     name: "Trator",      baseCost: 2_000,  baseCps: 8,    costGrowth: 1.15 },
    { id: "greenhouse",  name: "Estufa",      baseCost: 8_000,  baseCps: 25,   costGrowth: 1.15 },
    { id: "silo",        name: "Silo",        baseCost: 25_000, baseCps: 75,   costGrowth: 1.15 },
];

export class GameState extends Phaser.Events.EventEmitter {
    private static _instance: GameState;

    carrots: number = 0;            
    totalCarrotsEver: number = 0;   
    carrotsPerClick: number = 1;    

    private _cps: number = 0;     
    private _cpsMultiplier: number = 1;

    buildings: Map<string, OwnedBuilding> = new Map(
        BUILDING_DEFS.map(def => [def.id, { def, owned: 0 }])
    );

    availableUpgrades: UpgradeDef[] = [];
    purchasedUpgrades: Set<string> = new Set();

    totalClicks: number = 0;

    private constructor() {
        super();
    }

    static get instance(): GameState {
        if (!this._instance) this._instance = new GameState();
        return this._instance;
    }

    get cps(): number {
        return this._cps * this._cpsMultiplier;
    }

    recalculateCps() {
        let raw = 0;
        for (const { def, owned } of this.buildings.values()) {
            raw += def.baseCps * owned;
        }
        this._cps = raw;
        this.emit("cpsChanged", this.cps);
    }

    addClick() {
        const earned = this.carrotsPerClick;
        this.carrots += earned;
        this.totalCarrotsEver += earned;
        this.totalClicks++;
        this.emit("scoreChanged", this.carrots);
        this.emit("clickFeedback", earned);
    }

    tick(deltaMs: number) {
        if (this.cps <= 0) return;
        const earned = this.cps * (deltaMs / 1000);
        this.carrots += earned;
        this.totalCarrotsEver += earned;
        this.emit("scoreChanged", this.carrots);
    }

    getBuildingCost(id: string): number {
        const b = this.buildings.get(id);
        if (!b) return Infinity;
        return Math.floor(b.def.baseCost * Math.pow(b.def.costGrowth, b.owned));
    }

    canAfford(cost: number): boolean {
        return this.carrots >= cost;
    }

    buyBuilding(id: string): boolean {
        const b = this.buildings.get(id);
        if (!b) return false;

        const cost = this.getBuildingCost(id);
        if (!this.canAfford(cost)) return false;

        this.carrots -= cost;
        b.owned++;
        this.recalculateCps();
        this.emit("buildingPurchased", id, b.owned);
        this.emit("scoreChanged", this.carrots);
        return true;
    }

    registerUpgrade(upgrade: UpgradeDef) {
        if (this.purchasedUpgrades.has(upgrade.id)) return;
        if (!this.availableUpgrades.find(u => u.id === upgrade.id)) {
            this.availableUpgrades.push(upgrade);
        }
    }

    buyUpgrade(id: string): boolean {
        const idx = this.availableUpgrades.findIndex(u => u.id === id);
        if (idx === -1) return false;

        const upgrade = this.availableUpgrades[idx];
        if (!this.canAfford(upgrade.cost)) return false;

        this.carrots -= upgrade.cost;
        upgrade.apply(this);
        this.purchasedUpgrades.add(id);
        this.availableUpgrades.splice(idx, 1);

        this.recalculateCps();
        this.emit("upgradePurchased", id);
        this.emit("scoreChanged", this.carrots);
        return true;
    }

    checkUpgradeUnlocks(allUpgrades: UpgradeDef[]) {
        for (const upgrade of allUpgrades) {
            if (this.purchasedUpgrades.has(upgrade.id)) continue;
            if (this.availableUpgrades.find(u => u.id === upgrade.id)) continue;
            if (upgrade.unlockCondition(this)) {
                this.registerUpgrade(upgrade);
                this.emit("upgradeUnlocked", upgrade);
            }
        }
    }

    serialize(): SerializedState {
        const buildingsData: Record<string, number> = {};
        for (const [id, { owned }] of this.buildings.entries()) {
            buildingsData[id] = owned;
        }

        return {
            version: 1,
            carrots: this.carrots,
            totalCarrotsEver: this.totalCarrotsEver,
            totalClicks: this.totalClicks,
            carrotsPerClick: this.carrotsPerClick,
            cpsMultiplier: this._cpsMultiplier,
            buildings: buildingsData,
            purchasedUpgrades: [...this.purchasedUpgrades],
        };
    }

    deserialize(data: SerializedState) {
        this.carrots = data.carrots ?? 0;
        this.totalCarrotsEver = data.totalCarrotsEver ?? 0;
        this.totalClicks = data.totalClicks ?? 0;
        this.carrotsPerClick = data.carrotsPerClick ?? 1;
        this._cpsMultiplier = data.cpsMultiplier ?? 1;

        for (const [id, owned] of Object.entries(data.buildings ?? {})) {
            const b = this.buildings.get(id);
            if (b) b.owned = owned;
        }

        this.purchasedUpgrades = new Set(data.purchasedUpgrades ?? []);
        this.recalculateCps();
        this.emit("scoreChanged", this.carrots);
    }
}

export interface SerializedState {
    version: number;
    carrots: number;
    totalCarrotsEver: number;
    totalClicks: number;
    carrotsPerClick: number;
    cpsMultiplier: number;
    buildings: Record<string, number>;
    purchasedUpgrades: string[];
}