export type UpgradeType = 'speed' | 'tile' | 'crop';

export interface UpgradeDef {
    id: string;
    name: string;
    description: string;
    cost: number;
    requires: string[];
    type: UpgradeType;
    value: number | string;
    icon: string;
}

export const UPGRADES: Record<string, UpgradeDef> = {
    'speed_1': {
        id: 'speed_1',
        name: 'Efficient watering can',
        description: 'Reduces growth time by 200ms.',
        cost: 50,
        requires: [],
        type: 'speed',
        value: 200,
        icon: '💧'
    },
    'speed_2': {
        id: 'speed_2',
        name: 'Premium Fertilizer',
        description: 'Reduces growth time by an additional 300ms.',
        cost: 150,
        requires: ['speed_1'],
        type: 'speed',
        value: 300,
        icon: '✨'
    },

    'crop_potato': {
        id: 'crop_potato',
        name: 'Potato Seeds',
        description: 'Unlocks potato planting.',
        cost: 100,
        requires: [],
        type: 'crop',
        value: 'potato',
        icon: '🥔'
    },
    'crop_pumpkin': {
        id: 'crop_pumpkin',
        name: 'Pumpkin Seeds',
        description: 'Unlocks pumpkin planting.',
        cost: 300,
        requires: ['crop_potato'],
        type: 'crop',
        value: 'pumpkin',
        icon: '🎃'
    }
};