export type PetId = "bunny";

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
} as const satisfies Record<string, PetDef>;
