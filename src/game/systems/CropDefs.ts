export type CropId = keyof typeof CROP_DEFS;

export type CropAmounts = Record<CropId, number>;

type CropPreloadDef = {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
};

type GrowableCropDef = {
    kind: "growable";
    label: string;
    icon: string;
    amountKey: string;
    preload: CropPreloadDef;
    idleFrame: number;
    growthFrames: {
        start: number;
        end: number;
    };
    growthDuration: number;
    scale: number;
    y: number;
};

type GrassCropDef = {
    kind: "grass";
    label: string;
    icon: string;
    amountKey: string;
    preload: CropPreloadDef;
    scale: number;
    y: number;
    commonFrames: number[];
    rareFrames: Array<{
        frame: number;
        chance: number;
        reward: number;
    }>;
    trunkFrame: number;
    trunkHealth: number;
    trunkReward: number;
};

export type CropDef = GrowableCropDef | GrassCropDef;

export const CROP_DEFS = {
    grass: {
        kind: "grass",
        label: "Grass",
        icon: "\u{1F331}",
        amountKey: "grass",
        preload: {
            key: "grass-item",
            path: "grass.png",
            frameWidth: 100,
            frameHeight: 100
        },
        scale: 1.2,
        y: 50,
        commonFrames: [0, 1, 2, 3, 4, 5],
        rareFrames: [
            { frame: 6, chance: 0.05, reward: 5 },
            { frame: 7, chance: 0.05, reward: 10 },
            { frame: 8, chance: 0.05, reward: 20 },
            { frame: 9, chance: 0.05, reward: 25 }
        ],
        trunkFrame: 9,
        trunkHealth: 10,
        trunkReward: 25
    },
    wheat: {
        kind: "growable",
        label: "Wheat",
        icon: "\u{1F33E}",
        amountKey: "wheat",
        preload: {
            key: "wheat-sheet",
            path: "wheat.png",
            frameWidth: 110,
            frameHeight: 180
        },
        idleFrame: 0,
        growthFrames: {
            start: 0,
            end: 4
        },
        growthDuration: 500,
        scale: 1,
        y: 50
    },
    carrot: {
        kind: "growable",
        label: "Carrot",
        icon: "\u{1F955}",
        amountKey: "carrots",
        preload: {
            key: "carrot-sheet",
            path: "carrot.png",
            frameWidth: 320,
            frameHeight: 640
        },
        idleFrame: 2,
        growthFrames: {
            start: 3,
            end: 7
        },
        growthDuration: 1000,
        scale: 0.5,
        y: 0
    }
} as const satisfies Record<string, CropDef>;

export const CROP_IDS = Object.keys(CROP_DEFS) as CropId[];
export const DEFAULT_CROP_ID: CropId = "carrot";

export function getCropDef(cropId: CropId): CropDef {
    return CROP_DEFS[cropId];
}

export function createEmptyCropAmounts(): CropAmounts {
    return CROP_IDS.reduce((amounts, cropId) => {
        amounts[cropId] = 0;
        return amounts;
    }, {} as CropAmounts);
}
