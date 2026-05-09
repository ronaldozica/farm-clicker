import { COW_FRAME_HEIGHT, COW_FRAME_WIDTH } from "./Cow";
import { FARMER_FRAME_HEIGHT, FARMER_FRAME_WIDTH } from "./Farmer";

export type AutoClickerId = "bunny" | "cow" | "farmer";

export type AutoClickerDef = {
    kind: string;
    label: string;
    icon: string;
    amountKeys: string[];
    preload: {
        key: string;
        path: string;
        frameWidth: number;
        frameHeight: number;
    };
    scale: number;
    y: number;
};

export const AUTO_CLICKER_DEFS: Record<string, AutoClickerDef> = {
    bunny: {
        kind: "bunny",
        label: "Bunny",
        icon: "\u{1F430}",
        amountKeys: ["bunny"],
        preload: {
            key: "bunny-item",
            path: "bunny.png",
            frameWidth: 425,
            frameHeight: 300
        },
        scale: 1.0,
        y: 75,
    },
    cow: {
        kind: "cow",
        label: "Cow",
        icon: "\u{1F404}",
        amountKeys: ["cow"],
        preload: {
            key: "cow",
            path: "cow.png",
            frameWidth: COW_FRAME_WIDTH,
            frameHeight: COW_FRAME_HEIGHT
        },
        scale: 1.0,
        y: 75,
    },
    farmer: {
        kind: "farmer",
        label: "Farmer",
        icon: "\u{1F9D1}\u200D\u{1F33E}",
        amountKeys: ["farmer"],
        preload: {
            key: "farmer",
            path: "farmer.png",
            frameWidth: FARMER_FRAME_WIDTH,
            frameHeight: FARMER_FRAME_HEIGHT
        },
        scale: 1.0,
        y: 75,
    },
} as const satisfies Record<string, AutoClickerDef>;
