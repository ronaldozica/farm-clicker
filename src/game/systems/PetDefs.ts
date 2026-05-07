import { COW_FRAME_HEIGHT, COW_FRAME_WIDTH } from "./Cow";

export type PetId = "bunny" | "cow";

export type PetDef = {
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

export const PET_DEFS: Record<string, PetDef> = {
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
} as const satisfies Record<string, PetDef>;
