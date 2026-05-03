import type { CropId } from "./CropDefs";

export type UpgradeType = "speed" | "tile" | "crop";

export interface UpgradeDef {
    id: string;
    name: string;
    description: string;
    cost: number;
    costCrop: CropId;
    requires: string[];
    type: UpgradeType;
    value: number | CropId;
    targetCrop?: CropId;
    icon: string;
}

export const UPGRADES: Record<string, UpgradeDef> = {
    crop_wheat: {
        id: "crop_wheat",
        name: "Buy wheat",
        description: "Unlocks the planting of wheat.",
        cost: 500,
        costCrop: "grass",
        requires: [],
        type: "crop",
        value: "wheat",
        icon: "\u{1F33D}"
    },
    crop_carrot: {
        id: "crop_carrot",
        name: "Buy carrot",
        description: "Unlocks the planting of carrot.",
        cost: 500,
        costCrop: "wheat",
        requires: ["crop_wheat"],
        type: "crop",
        value: "carrot",
        icon: "\u{1F955}"
    },
    speed_wheat: {
        id: "speed_wheat",
        name: "Wheat grows faster",
        description: "Reduces the growth time of wheat by 200ms.",
        cost: 1000,
        costCrop: "grass",
        requires: ["crop_wheat"],
        type: "speed",
        value: 200,
        targetCrop: "wheat",
        icon: "\u{1F4A7}"
    },
    speed_carrot: {
        id: "speed_carrot",
        name: "Carrot grows faster",
        description: "Reduces the growth time of carrot by 200ms.",
        cost: 1000,
        costCrop: "wheat",
        requires: ["crop_carrot"],
        type: "speed",
        value: 200,
        targetCrop: "carrot",
        icon: "\u{1F4A7}"
    }
};
