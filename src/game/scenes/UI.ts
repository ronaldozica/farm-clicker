import { UPGRADES, type UpgradeDef } from '../systems/UpgradeDefs';
import { getCropDef } from '../systems/CropDefs';
import { GameState } from '../systems/GameState';
import { MAX_COWS } from '../systems/Cow';
import { MAX_BUNNIES } from '../systems/Bunny';

const SECTIONS: { id: string; label: string; icon: string }[] = [
    { id: 'crops', label: 'Crops', icon: '🌱' },
    { id: 'upgrades', label: 'Fertilizers', icon: '🧪' },
    { id: 'pets', label: 'Pets', icon: '🐾' },
];

export class ShopUI {
    private modal: HTMLElement;

    constructor() {
        this.modal = document.getElementById('upgrade-modal')!;

        GameState.instance.on("upgradesChanged", () => this.render());
        GameState.instance.on("scoreChanged", () => this.render());
    }

    public open() {
        this.modal.classList.add('open');
        this.render();
    }

    public close() {
        this.modal.classList.remove('open');
    }

    private render() {
        const previousTree = document.getElementById('upgrade-tree');
        const previousScrollTop = previousTree?.scrollTop ?? 0;

        const purchased = GameState.instance.purchasedUpgrades;
        this.modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">🌾 Upgrade Shop</h2>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div id="resource-chips"></div>
                    <button id="close-shop">✕</button>
                </div>
            </div>
            <div id="upgrade-tree"></div>
        `;

        document.getElementById('close-shop')!
            .addEventListener('click', () => this.close());

        const chipsEl = document.getElementById('resource-chips')!;
        const shownCrops = new Set<string>();
        Object.values(UPGRADES).forEach(u => {
            if (!shownCrops.has(u.costCrop)) {
                shownCrops.add(u.costCrop);
                const cropDef = getCropDef(u.costCrop);
                const amount = GameState.instance.getCropAmount(u.costCrop);
                const chip = document.createElement('div');
                chip.className = 'resource-chip';
                chip.innerHTML = `${cropDef.icon} ${amount}`;
                chipsEl.appendChild(chip);
            }
        });

        const treeEl = document.getElementById('upgrade-tree')!;

        SECTIONS.forEach(section => {
            const upgrades = Object.values(UPGRADES).filter(
                u => (u.section ?? 'crops') === section.id
            );

            if (upgrades.length === 0) return;

            const purchasedCount = upgrades.filter(upgrade => this.isUpgradeComplete(upgrade, purchased)).length;

            const sectionEl = document.createElement('div');
            sectionEl.className = 'upgrade-section';
            sectionEl.innerHTML = `
                <div class="section-header">
                    <span class="section-icon">${section.icon}</span>
                    <h3 class="section-title">${section.label}</h3>
                    <span class="section-count">${purchasedCount}/${upgrades.length}</span>
                </div>
            `;

            upgrades.forEach(upgrade => {
                sectionEl.appendChild(this.buildNode(upgrade));
            });

            treeEl.appendChild(sectionEl);
        });

        const knownSectionIds = new Set(SECTIONS.map(s => s.id));
        const orphans = Object.values(UPGRADES).filter(
            u => !knownSectionIds.has(u.section ?? 'crops')
        );
        if (orphans.length > 0) {
            const fallbackSection = document.createElement('div');
            fallbackSection.className = 'upgrade-section';
            fallbackSection.innerHTML = `
                <div class="section-header">
                    <span class="section-icon">📦</span>
                    <h3 class="section-title">Others</h3>
                </div>
            `;
            orphans.forEach(u => fallbackSection.appendChild(this.buildNode(u)));
            treeEl.appendChild(fallbackSection);
        }

        treeEl.scrollTop = previousScrollTop;
    }

    private buildNode(upgrade: UpgradeDef): HTMLElement {
        const purchased = GameState.instance.purchasedUpgrades;
        const petProgress = this.getRepeatablePetProgress(upgrade);
        const isPurchased = this.isUpgradeComplete(upgrade, purchased);
        const hasRequirements = upgrade.requires.every(req => purchased.includes(req));
        const canAfford = GameState.instance.getCropAmount(upgrade.costCrop) >= upgrade.cost;
        const costCrop = getCropDef(upgrade.costCrop);
        const description = petProgress
            ? `${upgrade.description} (${petProgress.count}/${petProgress.max})`
            : upgrade.description;
        const purchasedBadge = petProgress
            ? `Max ${petProgress.count}/${petProgress.max}`
            : 'Purchased';
        const buyLabel = petProgress
            ? `Buy (${petProgress.count}/${petProgress.max}) (${upgrade.cost} ${costCrop.icon})`
            : `Buy (${upgrade.cost} ${costCrop.icon})`;

        let statusClass = 'available';
        if (isPurchased) statusClass = 'purchased';
        else if (!hasRequirements) statusClass = 'locked';

        const node = document.createElement('div');
        node.className = `upgrade-node ${statusClass}`;

        node.innerHTML = `
            <span class="upgrade-icon">${upgrade.icon}</span>
            <div class="upgrade-info">
                <strong class="upgrade-name">${upgrade.name}</strong>
                <small class="upgrade-desc">${description}</small>
            </div>
            ${isPurchased
        ? `<div class="purchased-badge">${purchasedBadge}</div>`
        : `<button
                        id="btn-${upgrade.id}"
                        ${(!hasRequirements || !canAfford) ? 'disabled' : ''}>
                        ${!hasRequirements ? '\u{1F512} Locked' : buyLabel}
                   </button>`
}
        `;

        if (!isPurchased && hasRequirements && canAfford) {
            node.querySelector(`#btn-${upgrade.id}`)!
                .addEventListener('click', () => {
                    GameState.instance.buyUpgrade(upgrade.id);
                });
        }

        return node;
    }

    private isUpgradeComplete(upgrade: UpgradeDef, purchased: string[]): boolean {
        const petProgress = this.getRepeatablePetProgress(upgrade);
        if (petProgress) {
            return petProgress.count >= petProgress.max;
        }

        return purchased.includes(upgrade.id);
    }

    private getRepeatablePetProgress(upgrade: UpgradeDef): { count: number; max: number } | undefined {
        if (upgrade.type !== "pet") return undefined;

        if (upgrade.value === "cow") {
            return { count: GameState.instance.getCowCount(), max: MAX_COWS };
        }

        if (upgrade.value === "bunny") {
            return { count: GameState.instance.getBunnyCount(), max: MAX_BUNNIES };
        }

        return undefined;
    }
}
