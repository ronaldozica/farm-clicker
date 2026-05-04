import { UPGRADES, type UpgradeDef } from '../systems/UpgradeDefs';
import { getCropDef } from '../systems/CropDefs';
import { GameState } from '../systems/GameState';

const SECTIONS: { id: string; label: string; icon: string }[] = [
    { id: 'crops', label: 'Crops', icon: '🌱' },
    { id: 'fertilizers', label: 'Fertilizers', icon: '🧪' },
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

            const purchasedCount = upgrades.filter(u => purchased.includes(u.id)).length;

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
    }

    private buildNode(upgrade: UpgradeDef): HTMLElement {
        const purchased = GameState.instance.purchasedUpgrades;
        const isPurchased = purchased.includes(upgrade.id);
        const hasRequirements = upgrade.requires.every(req => purchased.includes(req));
        const canAfford = GameState.instance.getCropAmount(upgrade.costCrop) >= upgrade.cost;
        const costCrop = getCropDef(upgrade.costCrop);

        let statusClass = 'available';
        if (isPurchased) statusClass = 'purchased';
        else if (!hasRequirements) statusClass = 'locked';

        const node = document.createElement('div');
        node.className = `upgrade-node ${statusClass}`;

        node.innerHTML = `
            <span class="upgrade-icon">${upgrade.icon}</span>
            <div class="upgrade-info">
                <strong class="upgrade-name">${upgrade.name}</strong>
                <small class="upgrade-desc">${upgrade.description}</small>
            </div>
            ${isPurchased
                ? `<div class="purchased-badge">Purchased</div>`
                : `<button
                        id="btn-${upgrade.id}"
                        ${(!hasRequirements || !canAfford) ? 'disabled' : ''}>
                        ${!hasRequirements ? '🔒 Locked' : `Buy (${upgrade.cost} ${costCrop.icon})`}
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
}
