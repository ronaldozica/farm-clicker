import { UPGRADES } from '../systems/UpgradeDefs';
import { GameState } from "../systems/GameState";

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
        this.modal.innerHTML = `
            <h2>Upgrade shop</h2>
            <button id="close-shop" style="position: absolute; right: 20px; top: 20px; cursor: pointer;">X</button>
            <div id="upgrade-tree"></div>
        `;

        const closeBtn = document.getElementById('close-shop');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const treeContainer = document.getElementById('upgrade-tree')!;

        Object.values(UPGRADES).forEach(upgrade => {
            const isPurchased = GameState.instance.purchasedUpgrades.includes(upgrade.id);
            const hasRequirements = upgrade.requires.every(req => GameState.instance.purchasedUpgrades.includes(req));
            const canAfford = GameState.instance.clicks >= upgrade.cost;

            let statusClass = 'available';
            if (isPurchased) statusClass = 'purchased';
            else if (!hasRequirements) statusClass = 'locked';

            const node = document.createElement('div');
            node.className = `upgrade-node ${statusClass}`;
            
            node.innerHTML = `
                <div style="font-size: 2rem;">${upgrade.icon}</div>
                <div>
                    <strong>${upgrade.name}</strong><br>
                    <small>${upgrade.description}</small>
                </div>
                ${!isPurchased ? 
        `<button 
                        ${(!hasRequirements || !canAfford) ? 'disabled' : ''} 
                        id="btn-${upgrade.id}">
                        Buy (${upgrade.cost})
                    </button>` 
        : '<span style="margin-left:auto; color: #4caf50; font-weight: bold;">Purchased ✓</span>'
}
            `;

            treeContainer.appendChild(node);

            if (!isPurchased && hasRequirements && canAfford) {
                document.getElementById(`btn-${upgrade.id}`)!.addEventListener('click', () => {
                    GameState.instance.buyUpgrade(upgrade.id);
                });
            }
        });
    }
}