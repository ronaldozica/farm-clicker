import Phaser from "phaser";
import { CROP_IDS, DEFAULT_CROP_ID, getCropDef, type CropAmounts, type CropId } from "../systems/CropDefs";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";
import { ShopUI } from "./UI";
import { BunnyPet } from "../systems/Bunny";

function drawWoodPanel(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number = 10,
    opts: {
        baseColor?: number;
        grainColor?: number;
        borderColor?: number;
        borderWidth?: number;
    } = {}
) {
    const {
        baseColor = 0x8b5e3c,
        grainColor = 0x7a5230,
        borderColor = 0x3e2000,
        borderWidth = 3,
    } = opts;

    // Drop shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(x + 3, y + 5, w, h, radius);

    // Base wood fill
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(x, y, w, h, radius);

    // Grain stripes (two subtle horizontal bands)
    g.fillStyle(grainColor, 0.18);
    g.fillRoundedRect(x + 4, y + h * 0.28, w - 8, h * 0.14, 3);
    g.fillStyle(grainColor, 0.12);
    g.fillRoundedRect(x + 4, y + h * 0.62, w - 8, h * 0.10, 3);

    // Top bevel highlight
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(x + 2, y + 2, w - 4, h * 0.22, { tl: radius, tr: radius, bl: 0, br: 0 });

    // Bottom carved shadow
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(x + 2, y + h - h * 0.18, w - 4, h * 0.16, { tl: 0, tr: 0, bl: radius, br: radius });

    // Border
    g.lineStyle(borderWidth, borderColor, 1);
    g.strokeRoundedRect(x, y, w, h, radius);
}

function drawActionWoodPanel(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number
) {
    drawWoodPanel(g, x, y, w, h, 12, {
        baseColor: 0x6b8e23,   // olive-green wood tint for the action button
        grainColor: 0x556b2f,
        borderColor: 0x2d4a0e,
        borderWidth: 4,
    });
}

// ─── Scene ───────────────────────────────────────────────────────────────────

export class ClickerScene extends Phaser.Scene {
    private counterText!: Phaser.GameObjects.Text;
    private counterIcons: Phaser.GameObjects.Image[] = [];
    private cropSprite!: Phaser.GameObjects.Sprite;
    private progressBar!: Phaser.GameObjects.Graphics;
    private bg!: Phaser.GameObjects.TileSprite;
    private farmContainer!: Phaser.GameObjects.Container;
    private dirtPatch!: Phaser.GameObjects.TileSprite;
    private dirtFrame!: Phaser.GameObjects.Graphics;

    // Action button (Plant / Cut / Break) — drawn on Graphics
    private actionBtnGfx!: Phaser.GameObjects.Graphics;
    private actionBtnHitbox!: Phaser.GameObjects.Rectangle;
    private actionBtnText!: Phaser.GameObjects.Text;
    private actionBtnShadow!: Phaser.GameObjects.Rectangle;
    private readonly ACTION_BTN_W = 210;
    private readonly ACTION_BTN_H = 68;

    // Counter panel
    private counterBg!: Phaser.GameObjects.Graphics;

    // Crop selector
    private carouselGfx!: Phaser.GameObjects.Graphics;
    private carouselHitbox!: Phaser.GameObjects.Rectangle;   // invisible; just for sizing ref
    private carouselIcon!: Phaser.GameObjects.Image;
    private carouselLabel!: Phaser.GameObjects.Text;
    private btnPrev!: Phaser.GameObjects.Text;
    private btnNext!: Phaser.GameObjects.Text;
    private dotGraphics!: Phaser.GameObjects.Graphics;

    // Shop button — drawn on Graphics
    private shopBtnGfx!: Phaser.GameObjects.Graphics;
    private shopBtnHitbox!: Phaser.GameObjects.Rectangle;
    private shopBtnIcon!: Phaser.GameObjects.Image;          // shop icon PNG (falls back to text)
    private shopBtnIconText!: Phaser.GameObjects.Text;       // fallback text icon

    private bunnyPet!: BunnyPet;

    private isBusy: boolean = false;
    private trunkHealth: number = 10;
    private cropFullyGrown: boolean = false;
    private growthTween?: Phaser.Tweens.Tween;

    private readonly crops = CROP_IDS;
    private availableCrops: CropId[] = [...CROP_IDS];
    private selectedCrop: CropId = DEFAULT_CROP_ID;
    private selectedCropIndex: number = Math.max(0, CROP_IDS.indexOf(DEFAULT_CROP_ID));
    private readonly smallScreenMaxWidth = 520;
    private readonly shopRightMarginRatio = 0.1;

    constructor() {
        super("clicker-scene");
    }

    // ─── Preload ──────────────────────────────────────────────────────────────

    preload() {
        this.load.image("grass-bg", "grass-bg.png");
        this.load.image("dirt", "dirt-bg.png");

        // Crop icon PNGs (replace emoji)
        this.load.image("icon-grass", "grassIcon.png");
        this.load.image("icon-carrot", "carrotIcon.png");
        this.load.image("icon-wheat", "wheatIcon.png");

        // Shop icon PNG (optional — falls back to text if absent)
        this.load.image("icon-shop", "shopIcon.png");

        this.crops.forEach(cropId => {
            const crop = getCropDef(cropId);
            this.load.spritesheet(crop.preload.key, crop.preload.path, {
                frameWidth: crop.preload.frameWidth,
                frameHeight: crop.preload.frameHeight
            });
        });

        this.load.spritesheet("bunny-item", "bunny.png", {
            frameWidth: 425,
            frameHeight: 300
        });
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    create() {
        SaveSystem.load();
        this.setupEventListeners();
        this.createAnimations();
        this.initializeUI();
        this.setupResizeHandler();

        this.bunnyPet = new BunnyPet(this);
        this.syncBunnyPetState();
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────

    private setupEventListeners() {
        GameState.instance.on("scoreChanged", (crops: CropAmounts) => {
            this.updateScoreText(crops);
            SaveSystem.save();
        });

        GameState.instance.on("upgradesChanged", () => {
            this.refreshAvailableCrops();
            this.syncBunnyPetState();
            SaveSystem.save();
        });
    }

    private syncBunnyPetState(): void {
        const hasBunny = GameState.instance.purchasedUpgrades.includes("bunny");
        if (hasBunny) {
            this.bunnyPet.activate();
        } else {
            this.bunnyPet.deactivate();
        }
    }

    // ─── Animations ───────────────────────────────────────────────────────────

    private createAnimations() {
        this.crops.forEach(cropId => {
            const crop = getCropDef(cropId);
            if (crop.kind !== "growable") return;

            this.anims.create({
                key: `${cropId}-idle`,
                frames: [{ key: crop.preload.key, frame: crop.idleFrame }],
                frameRate: 1,
                repeat: -1
            });
            this.anims.create({
                key: `${cropId}-growing`,
                frames: this.anims.generateFrameNumbers(crop.preload.key, crop.growthFrames),
                frameRate: 5,
                repeat: 0
            });
        });

        this.anims.create({
            key: "bunny-run",
            frames: this.anims.generateFrameNumbers("bunny-item", { start: 0, end: 9 }),
            frameRate: 12,
            repeat: -1
        });
    }

    // ─── Score Text ───────────────────────────────────────────────────────────

    /**
     * Returns the icon texture key for a given crop id.
     */
    private cropIconKey(cropId: CropId): string {
        return `icon-${cropId}`;
    }

    private formatScoreNumber(cropId: CropId, crops: CropAmounts): string {
        return `${crops[cropId] ?? 0}`;
    }

    private isSmallScreen() {
        return this.cameras.main.width <= this.smallScreenMaxWidth;
    }

    private getCounterY(height: number) {
        return height * 0.1;
    }

    /**
     * Rebuilds the counter display: one icon + number per available crop
     * (or just the selected crop on small screens).
     */
    private updateScoreText(crops: CropAmounts = GameState.instance.getCropAmounts()) {
        // Determine which crops to show
        const toShow = this.isSmallScreen()
            ? [this.selectedCrop]
            : this.availableCrops;

        const cx = this.counterText.x;
        const cy = this.counterText.y;
        const iconSize = 26;
        const iconGap = 6;
        const sectionGap = 18;

        // Build display strings and measure total width
        const sections = toShow.map(id => ({
            id,
            num: this.formatScoreNumber(id, crops)
        }));

        // Destroy old icon images
        this.counterIcons.forEach(img => img.destroy());
        this.counterIcons = [];

        // Measure text width for each number using temporary computation
        const numStyle = { fontSize: "22px", fontFamily: "'Georgia', serif", fontStyle: "900" };
        const tempText = this.add.text(0, -9999, "", numStyle);

        let totalWidth = 0;
        const measured = sections.map(s => {
            tempText.setText(s.num);
            const nw = tempText.width;
            totalWidth += iconSize + iconGap + nw;
            return { ...s, nw };
        });
        totalWidth += (sections.length - 1) * sectionGap;
        tempText.destroy();

        // Place icons and update main text
        let cursor = cx - totalWidth / 2;
        const parts: string[] = [];

        measured.forEach((s, i) => {
            // Icon image
            const icon = this.add.image(cursor + iconSize / 2, cy, this.cropIconKey(s.id))
                .setDisplaySize(iconSize, iconSize)
                .setOrigin(0.5)
                .setDepth(6);
            this.counterIcons.push(icon);

            cursor += iconSize + iconGap;

            // We'll position the text after measurement
            parts.push(s.num);

            cursor += s.nw;
            if (i < sections.length - 1) cursor += sectionGap;
        });

        // Rebuild text string with separators (icons placed separately)
        this.counterText.setText(
            parts.join("  ·  ")
        );

        // Reposition icons precisely now that text is set
        // (re-measure with final text to align properly)
        this.repositionCounterIcons(crops);
        this.updateCounterBackground();
    }

    /**
     * Re-places icon images precisely next to their number in the counter bar.
     */
    private repositionCounterIcons(crops: CropAmounts = GameState.instance.getCropAmounts()) {
        if (this.counterIcons.length === 0) return;

        const toShow = this.isSmallScreen()
            ? [this.selectedCrop]
            : this.availableCrops;

        const cx = this.counterText.x;
        const cy = this.counterText.y;
        const iconSize = 26;
        const iconGap = 5;
        const numGap = 16;   // gap between sections
        const fontSize = 22;

        // Approximate char width for the font (px per char at given fontSize)
        const charW = fontSize * 0.6;

        let cursor = cx - this.counterText.width / 2;

        toShow.forEach((id, i) => {
            const num = this.formatScoreNumber(id, crops);
            const numW = num.length * charW;

            const img = this.counterIcons[i];
            if (!img) return;

            // icon sits before the number
            img.setPosition(cursor + iconSize / 2, cy);
            cursor += iconSize + iconGap + numW;

            // separator " · " is ~3 chars
            if (i < toShow.length - 1) cursor += numGap + 3 * charW;
        });
    }

    private updateCounterBackground() {
        this.counterBg.clear();

        const paddingX = 28;
        const paddingY = 14;
        const cbw = this.counterText.width + paddingX * 2 + this.counterIcons.length * 32;
        const cbh = this.counterText.height + paddingY * 2;
        const cx = this.counterText.x;
        const cy = this.counterText.y;
        const x = cx - cbw / 2;
        const y = cy - cbh / 2;
        const r = cbh / 2;

        // Draw the counter as a wood plank
        drawWoodPanel(this.counterBg, x, y, cbw, cbh, r, {
            baseColor: 0x5c3d1e,
            grainColor: 0x4a2e10,
            borderColor: 0x2a1500,
            borderWidth: 3,
        });
    }

    // ─── UI Initialization ────────────────────────────────────────────────────

    private initializeUI() {
        this.refreshAvailableCrops();
        const fullH = this.cameras.main.height;
        const centerX = this.cameras.main.width / 2;
        const counterY = this.getCounterY(fullH);
        const buttonY = fullH - (fullH * 0.1);

        this.createBackground();
        this.createScoreUI(centerX, counterY);
        this.createFarm(centerX);

        this.progressBar = this.add.graphics();

        this.createCropSelector(centerX, buttonY);
        this.createActionButton(centerX, buttonY);
        this.createShopButton();
    }

    private createBackground() {
        const fullW = this.cameras.main.width;
        const fullH = this.cameras.main.height;

        this.bg = this.add.tileSprite(0, 0, fullW, fullH, "grass-bg")
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(0);
        this.updateBackgroundScale(fullW);
    }

    private updateBackgroundScale(width: number) {
        const bgScale = width >= 900 ? 1.6 : 1;
        this.bg.setTileScale(bgScale, bgScale);
    }

    private createScoreUI(centerX: number, counterY: number) {
        this.counterBg = this.add.graphics().setDepth(4);

        this.counterText = this.add.text(centerX, counterY, "", {
            fontSize: "22px",
            fontFamily: "'Georgia', serif",
            color: "#f5e6c8",
            fontStyle: "900",
            shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true }
        }).setOrigin(0.5).setDepth(6);

        this.updateScoreText();
    }

    // ─── Farm ─────────────────────────────────────────────────────────────────

    private createFarm(centerX: number) {
        const fullH = this.cameras.main.height;
        const cropOffset = 75;
        const cropY = fullH / 2 - cropOffset;
        const crop = getCropDef(this.selectedCrop);

        this.farmContainer = this.add.container(centerX, cropY);
        this.cropSprite = this.add.sprite(0, crop.y, crop.preload.key).setScale(crop.scale);
        this.applyCropSprite(this.selectedCrop);

        const baseSpriteW = 160;
        const baseSpriteH = 320;
        const padding = 24;
        const dirtW = Math.round(baseSpriteW + padding * 2);
        const dirtH = Math.round(baseSpriteH + padding * 2);
        const dirtOffset = 15;
        const newDirtH = Math.round(dirtH / 2);
        const originalBottom = cropY + dirtH / 2 - dirtOffset;
        const newCenterY = originalBottom - newDirtH / 2;
        const dirtLocalY = newCenterY - cropY;

        this.dirtPatch = this.add.tileSprite(0, dirtLocalY, dirtW, newDirtH, "dirt").setOrigin(0.5);
        this.dirtFrame = this.add.graphics();
        this.dirtFrame.lineStyle(4, 0x3e2723, 1);
        this.dirtFrame.strokeRoundedRect(-dirtW / 2, dirtLocalY - newDirtH / 2, dirtW, newDirtH, 8);

        this.farmContainer.add([this.dirtPatch, this.dirtFrame, this.cropSprite]);
        this.farmContainer.setDepth(1);
        this.cropSprite.setDepth(3);
    }

    // ─── Crop Selector ────────────────────────────────────────────────────────

    private createCropSelector(centerX: number, buttonY: number) {
        const selectorY = buttonY - 125;
        const cardW = 84;
        const cardH = 84;
        const arrowOffset = 62;

        // Wood panel graphics for the card
        this.carouselGfx = this.add.graphics().setDepth(5);

        // Invisible hitbox rectangle (for reference only)
        this.carouselHitbox = this.add.rectangle(centerX, selectorY, cardW, cardH)
            .setFillStyle(0x000000, 0)
            .setDepth(5);

        // Crop icon image inside the card
        this.carouselIcon = this.add.image(centerX, selectorY - 8, this.cropIconKey(this.selectedCrop))
            .setDisplaySize(40, 40)
            .setOrigin(0.5)
            .setDepth(7);

        // Crop label below icon
        this.carouselLabel = this.add.text(centerX, selectorY + 26, "", {
            fontSize: "11px",
            fontFamily: "'Georgia', serif",
            color: "#f5e6c8",
            fontStyle: "bold",
            shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
        }).setOrigin(0.5).setDepth(7);

        // Arrow buttons (stylised as wood-carved ‹ ›)
        const arrowStyle = {
            fontSize: "38px",
            fontFamily: "'Georgia', serif",
            color: "#f5e6c8",
            fontStyle: "bold",
            shadow: { offsetX: 1, offsetY: 2, color: "#1a0900", blur: 2, fill: true }
        };

        this.btnPrev = this.add.text(centerX - arrowOffset, selectorY, "‹", arrowStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);

        this.btnNext = this.add.text(centerX + arrowOffset, selectorY, "›", arrowStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);

        this.dotGraphics = this.add.graphics().setDepth(7);

        this.btnPrev.on("pointerdown", () => {
            this.selectedCropIndex = (this.selectedCropIndex - 1 + this.availableCrops.length) % this.availableCrops.length;
            this.switchCrop(this.availableCrops[this.selectedCropIndex]);
        });
        this.btnNext.on("pointerdown", () => {
            this.selectedCropIndex = (this.selectedCropIndex + 1) % this.availableCrops.length;
            this.switchCrop(this.availableCrops[this.selectedCropIndex]);
        });

        // Arrow hover tints
        [this.btnPrev, this.btnNext].forEach(btn => {
            btn.on("pointerover", () => btn.setColor("#ffd966"));
            btn.on("pointerout", () => btn.setColor("#f5e6c8"));
        });

        this.drawCarouselPanel(centerX, selectorY, cardW, cardH);
        this.updateCarouselVisuals(centerX, selectorY);
    }

    /**
     * Redraws the wood card behind the carousel icon.
     */
    private drawCarouselPanel(cx: number, cy: number, w: number, h: number) {
        this.carouselGfx.clear();
        drawWoodPanel(
            this.carouselGfx,
            cx - w / 2, cy - h / 2,
            w, h,
            10,
            { baseColor: 0x7a4f2a, grainColor: 0x623d1a, borderColor: 0x2a1500, borderWidth: 3 }
        );
    }

    private updateCarouselVisuals(centerX: number, selectorY: number) {
        const crop = getCropDef(this.selectedCrop);

        // Swap icon texture
        this.carouselIcon.setTexture(this.cropIconKey(this.selectedCrop));
        this.carouselLabel.setText(crop.label);

        // Dots
        this.dotGraphics.clear();
        const dotSpacing = 14;
        const total = this.availableCrops.length;
        const startX = centerX - ((total - 1) * dotSpacing) / 2;
        const dotsY = selectorY + 52;

        this.availableCrops.forEach((_, i) => {
            const color = i === this.selectedCropIndex ? 0xf5e6c8 : 0x7a5230;
            this.dotGraphics.fillStyle(color);
            this.dotGraphics.fillCircle(startX + i * dotSpacing, dotsY, i === this.selectedCropIndex ? 5 : 3.5);
        });
    }

    // ─── Action Button (Plant / Cut / Break) ──────────────────────────────────

    private createActionButton(x: number, y: number) {
        const bw = this.ACTION_BTN_W;
        const bh = this.ACTION_BTN_H;

        this.actionBtnGfx = this.add.graphics().setDepth(5);
        this.drawActionButton(x, y);

        // Invisible hit-area on top
        this.actionBtnHitbox = this.add.rectangle(x, y, bw, bh)
            .setFillStyle(0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .setDepth(6);

        this.actionBtnText = this.add.text(x, y, this.getButtonText(), {
            fontSize: "24px",
            fontFamily: "'Georgia', serif",
            color: "#f5e6c8",
            fontStyle: "900",
            stroke: "#1a3d00",
            strokeThickness: 3,
            shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 1, fill: true }
        }).setOrigin(0.5).setDepth(7);

        // Shadow element (cosmetic)
        this.actionBtnShadow = this.add.rectangle(x, y + bh / 2 + 4, bw - 10, 6, 0x000000, 0.22)
            .setOrigin(0.5)
            .setDepth(4);

        this.actionBtnHitbox
            .on("pointerdown", () => this.handlePlantAction())
            .on("pointerover", () => {
                this.actionBtnGfx.clear();
                const bx = this.actionBtnHitbox.x;
                const by = this.actionBtnHitbox.y;
                // Slightly brighter hover tint
                drawWoodPanel(this.actionBtnGfx, bx - bw / 2, by - bh / 2, bw, bh, 12, {
                    baseColor: 0x88b820, grainColor: 0x6b9118, borderColor: 0x2d4a0e, borderWidth: 4
                });
            })
            .on("pointerout", () => {
                this.redrawActionButton();
            });
    }

    private drawActionButton(x: number, y: number) {
        const bw = this.ACTION_BTN_W;
        const bh = this.ACTION_BTN_H;
        this.actionBtnGfx.clear();
        drawWoodPanel(this.actionBtnGfx, x - bw / 2, y - bh / 2, bw, bh, 12, {
            baseColor: 0x6b8e23,
            grainColor: 0x556b2f,
            borderColor: 0x2d4a0e,
            borderWidth: 4
        });
    }

    private redrawActionButton() {
        if (!this.actionBtnHitbox) return;
        const bw = this.ACTION_BTN_W;
        const bh = this.ACTION_BTN_H;
        const bx = this.actionBtnHitbox.x;
        const by = this.actionBtnHitbox.y;
        this.actionBtnGfx.clear();
        drawWoodPanel(this.actionBtnGfx, bx - bw / 2, by - bh / 2, bw, bh, 12, {
            baseColor: 0x6b8e23,
            grainColor: 0x556b2f,
            borderColor: 0x2d4a0e,
            borderWidth: 4
        });
    }

    // ─── Shop Button ──────────────────────────────────────────────────────────

    private createShopButton() {
        this.shopBtnGfx = this.add.graphics().setDepth(5);

        // Placeholder rectangle for positioning
        this.shopBtnHitbox = this.add.rectangle(0, 0, 60, 60)
            .setFillStyle(0x000000, 0)
            .setInteractive({ useHandCursor: true })
            .setDepth(6);

        // Try PNG icon first, fall back to text
        const hasShopIcon = this.textures.exists("icon-shop");
        if (hasShopIcon) {
            this.shopBtnIcon = this.add.image(0, 0, "icon-shop")
                .setDisplaySize(30, 30)
                .setOrigin(0.5)
                .setDepth(7);
            this.shopBtnIconText = this.add.text(0, -9999, "", {}).setDepth(7);
        } else {
            this.shopBtnIconText = this.add.text(0, 0, "🛒", { fontSize: "26px" })
                .setOrigin(0.5)
                .setDepth(7);
            this.shopBtnIcon = this.add.image(0, -9999, "__DEFAULT").setDepth(7);
        }

        const shop = new ShopUI();

        this.shopBtnHitbox
            .on("pointerdown", () => shop.open())
            .on("pointerover", () => this.drawShopButton(true))
            .on("pointerout", () => this.drawShopButton(false));

        const width = this.cameras.main.width;
        const counterY = this.getCounterY(this.cameras.main.height);
        this.layoutShopButton(width, counterY);
    }

    private drawShopButton(hover: boolean = false) {
        if (!this.shopBtnHitbox) return;
        this.shopBtnGfx.clear();
        const size = this.shopBtnHitbox.width;
        const x = this.shopBtnHitbox.x - size / 2;
        const y = this.shopBtnHitbox.y - size / 2;
        drawWoodPanel(this.shopBtnGfx, x, y, size, size, 10, {
            baseColor: hover ? 0xac7a48 : 0x8b5e3c,
            grainColor: hover ? 0x9a6836 : 0x7a5230,
            borderColor: 0x2a1500,
            borderWidth: 3
        });
    }

    private getShopButtonSize(width: number) {
        return width <= this.smallScreenMaxWidth ? 48 : 64;
    }

    private layoutShopButton(width: number, counterY: number) {
        const size = this.getShopButtonSize(width);
        const rightMargin = width * this.shopRightMarginRatio;
        const x = width - rightMargin - size / 2;

        this.shopBtnHitbox.setPosition(x, counterY);
        this.shopBtnHitbox.setSize(size, size);
        this.shopBtnHitbox.setDisplaySize(size, size);

        const iconSize = size * 0.48;

        if (this.shopBtnIcon) {
            this.shopBtnIcon.setPosition(x, counterY);
            this.shopBtnIcon.setDisplaySize(iconSize, iconSize);
        }
        if (this.shopBtnIconText) {
            this.shopBtnIconText.setPosition(x, counterY);
            this.shopBtnIconText.setFontSize(size * 0.42);
        }

        this.drawShopButton(false);
    }

    // ─── Resize ───────────────────────────────────────────────────────────────

    private setupResizeHandler() {
        this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
            const w = gameSize.width || this.cameras.main.width;
            const h = gameSize.height || this.cameras.main.height;
            const centerX = w / 2;
            const counterY = this.getCounterY(h);

            this.bg.setDisplaySize(w, h);
            this.updateBackgroundScale(w);

            this.farmContainer.x = centerX;

            this.counterText.x = centerX;
            this.counterText.y = counterY;
            this.updateScoreText();
            this.layoutShopButton(w, counterY);

            if (this.actionBtnHitbox && this.actionBtnText) {
                const btnY = h - h * 0.1;

                this.actionBtnHitbox.x = centerX;
                this.actionBtnHitbox.y = btnY;
                this.actionBtnText.setPosition(centerX, btnY);
                this.actionBtnShadow.setPosition(centerX, btnY + this.ACTION_BTN_H / 2 + 4);
                this.redrawActionButton();

                const selectorY = btnY - 125;
                this.carouselHitbox.setPosition(centerX, selectorY);
                this.carouselIcon.setPosition(centerX, selectorY - 8);
                this.carouselLabel.setPosition(centerX, selectorY + 26);
                this.btnPrev.setPosition(centerX - 62, selectorY);
                this.btnNext.setPosition(centerX + 62, selectorY);
                this.drawCarouselPanel(centerX, selectorY, 84, 84);
                this.updateCarouselVisuals(centerX, selectorY);
            }
        });
    }

    // ─── Crop Logic ───────────────────────────────────────────────────────────

    private switchCrop(crop: CropId) {
        if (this.isBusy || this.selectedCrop === crop) return;
        this.selectedCrop = crop;
        this.clearGrowthState();
        this.applyCropSprite(crop);

        const centerX = this.cameras.main.width / 2;
        const buttonY = this.cameras.main.height - (this.cameras.main.height * 0.1);

        this.updateCarouselVisuals(centerX, buttonY - 125);
        this.updateButtonText();
        this.updateScoreText();
    }

    private refreshAvailableCrops() {
        this.availableCrops = CROP_IDS.filter(cropId => GameState.instance.isCropUnlocked(cropId));
        if (!this.availableCrops.includes(this.selectedCrop)) {
            this.selectedCrop = this.availableCrops[0] ?? DEFAULT_CROP_ID;
            this.clearGrowthState();
            if (this.cropSprite) this.applyCropSprite(this.selectedCrop);
        }

        this.selectedCropIndex = Math.max(0, this.availableCrops.indexOf(this.selectedCrop));

        if (this.carouselGfx) {
            const centerX = this.cameras.main.width / 2;
            const buttonY = this.cameras.main.height - (this.cameras.main.height * 0.1);
            this.updateScoreText();
            this.updateCarouselVisuals(centerX, buttonY - 125);
            this.updateButtonText();
        }
    }

    private clearGrowthState() {
        this.growthTween?.stop();
        this.growthTween = undefined;
        this.isBusy = false;
        this.cropFullyGrown = false;
        this.drawProgressBar(0);
    }

    private applyCropSprite(cropId: CropId) {
        const crop = getCropDef(cropId);

        this.cropSprite.setTexture(crop.preload.key);
        this.cropSprite.setScale(crop.scale);
        this.cropSprite.y = crop.y;

        if (crop.kind === "grass") {
            this.cropSprite.anims.stop();
            this.cropSprite.setFrame(this.getNextGrassFrame());
            this.trunkHealth = crop.trunkHealth;
            return;
        }

        this.cropSprite.play(`${cropId}-idle`);
    }

    private updateButtonText() {
        const crop = getCropDef(this.selectedCrop);
        if (crop.kind !== "grass") {
            this.actionBtnText.setText("Plant");
            return;
        }
        const isTrunk = crop.trunkFrames.some(tf => Number(this.cropSprite.frame.name) === tf);
        this.actionBtnText.setText(isTrunk ? "Break" : "Cut");
    }

    private getButtonText() {
        const crop = getCropDef(this.selectedCrop);
        if (crop.kind !== "grass") return "Plant";
        const isTrunk = crop.trunkFrames.some(tf => Number(this.cropSprite.frame.name) === tf);
        return isTrunk ? "Break" : "Cut";
    }

    private getNextGrassFrame(): number {
        const crop = getCropDef("grass");
        if (crop.kind !== "grass") return 0;

        const rand = Math.random();
        let threshold = 0;
        const rareFrame = crop.rareFrames.find(fd => {
            threshold += fd.chance;
            return rand < threshold;
        });

        return rareFrame?.frame ?? crop.commonFrames[Math.floor(Math.random() * crop.commonFrames.length)];
    }

    // ─── Plant Action ─────────────────────────────────────────────────────────

    private handlePlantAction() {
        const crop = getCropDef(this.selectedCrop);

        this.playClickFeedback([this.actionBtnHitbox, this.actionBtnText]);

        if (crop.kind === "grass") {
            this.handleHarvest();
            return;
        }

        if (this.cropFullyGrown) {
            this.cropFullyGrown = false;
            this.handleHarvest(true);
            return;
        }

        if (this.isBusy) {
            GameState.instance.addClick(this.selectedCrop, 1);
            this.spawnFloatingText(1, false);
        }

        this.startGrowthTimer();
    }

    private startGrowthTimer() {
        const crop = getCropDef(this.selectedCrop);
        if (crop.kind !== "growable") return;

        this.growthTween?.stop();
        this.growthTween = undefined;
        this.isBusy = true;
        this.cropFullyGrown = false;
        this.drawProgressBar(0);

        const currentDuration = Math.max(50, crop.growthDuration - GameState.instance.getGrowthSpeedReduction(this.selectedCrop));
        const totalFrames = crop.growthFrames.end - crop.growthFrames.start + 1;
        const dynamicFrameRate = (totalFrames / currentDuration) * 1000;

        this.cropSprite.play({ key: `${this.selectedCrop}-growing`, frameRate: dynamicFrameRate });

        const progressTarget = { progress: 0 };
        this.growthTween = this.tweens.add({
            targets: progressTarget,
            progress: 1,
            duration: currentDuration,
            onUpdate: (_, target) => this.drawProgressBar(target.progress),
            onComplete: () => {
                this.growthTween = undefined;
                this.cropFullyGrown = true;
                this.isBusy = false;
                this.drawProgressBar(1);
            }
        });
    }

    private playClickFeedback(targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) {
        this.tweens.add({ targets, y: "+=4", duration: 50, yoyo: true });

        const crop = getCropDef(this.selectedCrop);
        const originalScale = crop.scale;

        this.tweens.add({
            targets: this.cropSprite,
            scaleX: originalScale * 0.88,
            scaleY: originalScale * 0.88,
            duration: 60,
            ease: "Power2",
            onComplete: () => {
                this.tweens.add({
                    targets: this.cropSprite,
                    scaleX: originalScale * 1.08,
                    scaleY: originalScale * 1.08,
                    duration: 80,
                    ease: "Back.easeOut",
                    onComplete: () => {
                        this.tweens.add({
                            targets: this.cropSprite,
                            scaleX: originalScale,
                            scaleY: originalScale,
                            duration: 60,
                            ease: "Power1"
                        });
                    }
                });
            }
        });
    }

    private handleHarvest(bonus: boolean = false) {
        const crop = getCropDef(this.selectedCrop);

        if (crop.kind === "grass") {
            this.drawProgressBar(0);
            const currentFrame = Number(this.cropSprite.frame.name);

            if (crop.trunkFrames.some(tf => currentFrame === tf)) {
                this.trunkHealth--;
                if (this.trunkHealth > 0) {
                    this.playClickFeedback(this.cropSprite);
                    this.isBusy = false;
                    return;
                }
                GameState.instance.addClick(this.selectedCrop, crop.trunkReward);
                this.spawnFloatingText(crop.trunkReward, false);
                this.trunkHealth = crop.trunkHealth;
            } else {
                const reward = crop.rareFrames.find(f => f.frame === currentFrame)?.reward ?? 1;
                GameState.instance.addClick(this.selectedCrop, reward);
                this.spawnFloatingText(reward, false);
            }

            this.cropSprite.setFrame(this.getNextGrassFrame());
        } else {
            if (bonus) {
                const bonusAmount = 25;
                GameState.instance.addClick(this.selectedCrop, bonusAmount);
                this.spawnFloatingText(bonusAmount, true);
                this.drawProgressBar(0);
                this.cropSprite.play(`${this.selectedCrop}-idle`);
            }
        }

        this.updateButtonText();
        this.isBusy = false;
    }

    // ─── Progress Bar ─────────────────────────────────────────────────────────

    private drawProgressBar(progress: number) {
        const width = 150;
        const x = this.cameras.main.width / 2 - width / 2;
        const fullH = this.cameras.main.height;
        const y = fullH / 2 + 110;

        this.progressBar.clear();
        if (progress <= 0) return;

        // Wood-style progress bar track
        this.progressBar.fillStyle(0x3e2000, 0.7);
        this.progressBar.fillRoundedRect(x - 2, y - 2, width + 4, 19, 6);

        this.progressBar.fillStyle(0x5c3d1e, 1);
        this.progressBar.fillRoundedRect(x, y, width, 15, 5);

        // Fill
        const fillColor = progress >= 1 ? 0x8bc34a : 0xd4a017;
        this.progressBar.fillStyle(fillColor, 1);
        this.progressBar.fillRoundedRect(x, y, width * progress, 15, 5);

        // Shine
        this.progressBar.fillStyle(0xffffff, 0.15);
        this.progressBar.fillRoundedRect(x + 2, y + 2, (width * progress) - 4, 5, 3);

        // Border
        this.progressBar.lineStyle(2, 0x2a1500, 1);
        this.progressBar.strokeRoundedRect(x, y, width, 15, 5);
    }

    // ─── Floating Text ────────────────────────────────────────────────────────

    private spawnFloatingText(amount: number, golden: boolean = false) {
        const x = this.cameras.main.width / 2 + Phaser.Math.Between(-30, 30);
        const y = this.cameras.main.height / 2 - 60;
        const crop = getCropDef(this.selectedCrop);

        // Use crop label instead of emoji
        const label = golden
            ? `✨ +${amount} ${crop.label}`
            : `+${amount} ${crop.label}`;

        const floatText = this.add.text(x, y, label, {
            fontSize: golden ? "30px" : "24px",
            fontFamily: "'Georgia', serif",
            color: golden ? "#FFD700" : "#f5e6c8",
            fontStyle: "900",
            stroke: golden ? "#7a5900" : "#2d4a0e",
            strokeThickness: golden ? 5 : 3,
            shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 3, fill: true }
        }).setOrigin(0.5).setDepth(10);

        this.tweens.add({
            targets: floatText,
            y: y - (golden ? 110 : 80),
            alpha: 0,
            scaleX: golden ? 1.1 : 0.6,
            scaleY: golden ? 1.1 : 0.6,
            duration: golden ? 1300 : 900,
            ease: golden ? "Back.easeOut" : "Power2",
            onComplete: () => floatText.destroy()
        });
    }
}