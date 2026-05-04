import type { CropId } from "./CropDefs";

export type UpgradeType = "speed" | "tile" | "crop";

export interface UpgradeDef {
    section: string;
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
        icon: "\u{1F33E}",
        section: "crops"
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
        icon: "\u{1F955}",
        section: "crops"
    },
    speed_wheat: {
        id: "speed_wheat",
        name: "Wheat fertilizer",
        description: "Reduces the growth time of wheat.",
        cost: 1000,
        costCrop: "grass",
        requires: ["crop_wheat"],
        type: "speed",
        value: 200,
        targetCrop: "wheat",
        icon: "\u{1F331}",
        section: "upgrades"
    },
    speed_2_wheat: {
        id: "speed_2_wheat",
        name: "Wheat instant fertilizer",
        description: "Make wheat grow in an instant.",
        cost: 1000,
        costCrop: "wheat",
        requires: ["speed_wheat"],
        type: "speed",
        value: 250,
        targetCrop: "wheat",
        icon: "\u{2728}",
        section: "upgrades"
    },
    speed_carrot: {
        id: "speed_carrot",
        name: "Carrot fertilizer",
        description: "Reduces the growth time of carrot.",
        cost: 1000,
        costCrop: "wheat",
        requires: ["crop_carrot"],
        type: "speed",
        value: 200,
        targetCrop: "carrot",
        icon: "\u{1F331}",
        section: "upgrades"
    },
    speed_2_carrot: {
        id: "speed_2_carrot",
        name: "Carrot deluxe fertilizer",
        description: "Reduces the growth time of carrot even more.",
        cost: 1000,
        costCrop: "carrot",
        requires: ["speed_carrot"],
        type: "speed",
        value: 250,
        targetCrop: "carrot",
        icon: "\u{1F331}",
        section: "upgrades"
    },
    speed_3_carrot: {
        id: "speed_3_carrot",
        name: "Carrot instant fertilizer",
        description: "Make carrot grow in an instant.",
        cost: 2500,
        costCrop: "carrot",
        requires: ["speed_2_carrot"],
        type: "speed",
        value: 500,
        targetCrop: "carrot",
        icon: "\u{2728}",
        section: "upgrades"
    },
};
