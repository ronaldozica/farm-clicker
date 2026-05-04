import Phaser from "phaser";
import { CROP_IDS, DEFAULT_CROP_ID, getCropDef, type CropAmounts, type CropId } from "../systems/CropDefs";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";
import { ShopUI } from "./UI";

export class ClickerScene extends Phaser.Scene {
    private counterText!: Phaser.GameObjects.Text;
    private cropSprite!: Phaser.GameObjects.Sprite;
    private progressBar!: Phaser.GameObjects.Graphics;
    private bg!: Phaser.GameObjects.TileSprite;
    private farmContainer!: Phaser.GameObjects.Container;
    private dirtPatch!: Phaser.GameObjects.TileSprite;
    private dirtFrame!: Phaser.GameObjects.Graphics;
    private buttonBg!: Phaser.GameObjects.Rectangle;
    private buttonText!: Phaser.GameObjects.Text;
    private counterBg!: Phaser.GameObjects.Graphics;
    private carouselBg!: Phaser.GameObjects.Rectangle;
    private carouselLabel!: Phaser.GameObjects.Text;
    private carouselIcon!: Phaser.GameObjects.Text;
    private btnPrev!: Phaser.GameObjects.Text;
    private btnNext!: Phaser.GameObjects.Text;
    private dotGraphics!: Phaser.GameObjects.Graphics;

    private isBusy: boolean = false;
    private trunkHealth: number = 10;
    private cropFullyGrown: boolean = false;
    private growthTween?: Phaser.Tweens.Tween;

    private readonly crops = CROP_IDS;
    private availableCrops: CropId[] = [...CROP_IDS];
    private selectedCrop: CropId = DEFAULT_CROP_ID;
    private selectedCropIndex: number = Math.max(0, CROP_IDS.indexOf(DEFAULT_CROP_ID));
    private readonly smallScreenMaxWidth = 520;

    constructor() {
        super("clicker-scene");
    }

    preload() {
        this.load.image("grass-bg", "grass-bg.png");
        this.load.image("dirt", "dirt-bg.png");

        this.crops.forEach(cropId => {
            const crop = getCropDef(cropId);
            this.load.spritesheet(crop.preload.key, crop.preload.path, {
                frameWidth: crop.preload.frameWidth,
                frameHeight: crop.preload.frameHeight
            });
        });
    }

    create() {
        SaveSystem.load();
        this.setupEventListeners();
        this.createAnimations();
        this.initializeUI();
        this.setupResizeHandler();
    }

    private setupEventListeners() {
        GameState.instance.on("scoreChanged", (crops: CropAmounts) => {
            this.updateScoreText(crops);
            SaveSystem.save();
        });

        GameState.instance.on("upgradesChanged", () => {
            this.refreshAvailableCrops();
            SaveSystem.save();
        });
    }

    private createAnimations() {
        this.crops.forEach(cropId => {
            const crop = getCropDef(cropId);
            if (crop.kind !== "growable") return;

            this.anims.create({
                key: `${cropId}-idle`,
                frames: [{ key: crop.preload.key, frame: crop.idleFrame }],
                frameRate: 1, repeat: -1
            });
            this.anims.create({
                key: `${cropId}-growing`,
                frames: this.anims.generateFrameNumbers(crop.preload.key, crop.growthFrames),
                frameRate: 5, repeat: 0
            });
        });
    }

    private formatScoreText(crops: CropAmounts) {
        if (this.isSmallScreen()) {
            return this.formatCropAmount(this.selectedCrop, crops);
        }

        return this.availableCrops
            .map(cropId => this.formatCropAmount(cropId, crops))
            .join(" | ");
    }

    private formatCropAmount(cropId: CropId, crops: CropAmounts) {
        return `${getCropDef(cropId).icon}: ${crops[cropId] ?? 0}`;
    }

    private isSmallScreen() {
        return this.cameras.main.width <= this.smallScreenMaxWidth;
    }

    private updateScoreText(crops: CropAmounts = GameState.instance.getCropAmounts()) {
        this.counterText.setText(this.formatScoreText(crops));
        this.updateCounterBackground();
    }

    private initializeUI() {
        this.refreshAvailableCrops();
        const fullH = this.cameras.main.height;
        const centerX = this.cameras.main.width / 2;
        const counterY = fullH * 0.1;
        const buttonY = fullH - (fullH * 0.1);
        const shopOffset = 30;

        this.createBackground();
        this.createScoreUI(centerX, counterY);
        this.createFarm(centerX);

        this.progressBar = this.add.graphics();

        this.createCropSelector(centerX, buttonY);
        this.createPlantButton(centerX, buttonY);
        this.createShopButton(centerX + shopOffset, buttonY);
    }

    private createBackground() {
        const fullW = this.cameras.main.width;
        const fullH = this.cameras.main.height;

        this.bg = this.add.tileSprite(0, 0, fullW, fullH, "grass-bg").setOrigin(0).setScrollFactor(0);
        this.bg.setDepth(0);
        this.updateBackgroundScale(fullW);
    }

    private updateBackgroundScale(width: number) {
        const bgScale = width >= 900 ? 1.6 : 1;
        this.bg.setTileScale(bgScale, bgScale);
    }

    private createScoreUI(centerX: number, counterY: number) {
        this.counterBg = this.add.graphics();
        this.counterText = this.add.text(centerX, counterY, this.formatScoreText(GameState.instance.getCropAmounts()), {
            fontSize: "32px",
            fontFamily: "'Inter', 'Nunito', sans-serif",
            color: "#4e342e",
            fontStyle: "900",
        }).setOrigin(0.5);

        this.counterText.setDepth(5);
        this.updateCounterBackground();
    }

    private updateCounterBackground() {
        this.counterBg.clear();
        const paddingX = 40;
        const paddingY = 20;
        const cbw = this.counterText.width + paddingX;
        const cbh = this.counterText.height + paddingY;
        const x = this.counterText.x - cbw / 2;
        const y = this.counterText.y - cbh / 2;
        const radius = cbh / 2;

        this.counterBg.fillStyle(0x000000, 0.15);
        this.counterBg.fillRoundedRect(x, y + 4, cbw, cbh, radius);
        this.counterBg.fillStyle(0xfff8e1, 1);
        this.counterBg.fillRoundedRect(x, y, cbw, cbh, radius);
        this.counterBg.lineStyle(4, 0x8d6e63, 1);
        this.counterBg.strokeRoundedRect(x, y, cbw, cbh, radius);
    }

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

    private createCropSelector(centerX: number, buttonY: number) {
        const selectorY = buttonY - 120;
        const cardW = 80;
        const cardH = 80;
        const arrowOffset = 60;

        this.carouselBg = this.add.rectangle(centerX, selectorY, cardW, cardH, 0xfff8e1)
            .setStrokeStyle(3, 0x8d6e63)
            .setDepth(5);

        this.carouselIcon = this.add.text(centerX, selectorY - 10, "", { fontSize: "32px" })
            .setOrigin(0.5)
            .setDepth(6);

        this.carouselLabel = this.add.text(centerX, selectorY + 22, "", {
            fontSize: "13px",
            fontFamily: "'Inter', sans-serif",
            color: "#6d4c41",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(6);

        this.btnPrev = this.add.text(centerX - arrowOffset, selectorY, "\u2039", {
            fontSize: "36px",
            fontFamily: "'Inter', sans-serif",
            color: "#4e342e",
            fontStyle: "bold"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        this.btnNext = this.add.text(centerX + arrowOffset, selectorY, "\u203A", {
            fontSize: "36px",
            fontFamily: "'Inter', sans-serif",
            color: "#4e342e",
            fontStyle: "bold"
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        this.dotGraphics = this.add.graphics().setDepth(6);

        this.btnPrev.on("pointerdown", () => {
            this.selectedCropIndex = (this.selectedCropIndex - 1 + this.availableCrops.length) % this.availableCrops.length;
            this.switchCrop(this.availableCrops[this.selectedCropIndex]);
        });
        this.btnNext.on("pointerdown", () => {
            this.selectedCropIndex = (this.selectedCropIndex + 1) % this.availableCrops.length;
            this.switchCrop(this.availableCrops[this.selectedCropIndex]);
        });

        this.updateCarouselVisuals(centerX, selectorY);
    }

    private updateCarouselVisuals(centerX: number, selectorY: number) {
        const crop = getCropDef(this.selectedCrop);
        this.carouselIcon.setText(crop.icon);
        this.carouselLabel.setText(crop.label);

        this.dotGraphics.clear();
        const dotSpacing = 14;
        const totalDots = this.availableCrops.length;
        const startX = centerX - ((totalDots - 1) * dotSpacing) / 2;
        const dotsY = selectorY + 52;

        this.availableCrops.forEach((_, i) => {
            const color = i === this.selectedCropIndex ? 0x4e342e : 0xbcaaa4;
            this.dotGraphics.fillStyle(color);
            this.dotGraphics.fillCircle(startX + i * dotSpacing, dotsY, 4);
        });
    }

    private switchCrop(crop: CropId) {
        if (this.isBusy || this.selectedCrop === crop) return;
        this.selectedCrop = crop;
        this.clearGrowthState();
        this.applyCropSprite(crop);

        const centerX = this.cameras.main.width / 2;
        const buttonY = this.cameras.main.height - (this.cameras.main.height * 0.1);

        this.updateCarouselVisuals(centerX, buttonY - 120);
        this.updateButtonText();
        this.updateScoreText();
    }

    private refreshAvailableCrops() {
        this.availableCrops = CROP_IDS.filter(cropId => GameState.instance.isCropUnlocked(cropId));
        if (!this.availableCrops.includes(this.selectedCrop)) {
            this.selectedCrop = this.availableCrops[0] ?? DEFAULT_CROP_ID;
            this.clearGrowthState();
            if (this.cropSprite) {
                this.applyCropSprite(this.selectedCrop);
            }
        }

        this.selectedCropIndex = Math.max(0, this.availableCrops.indexOf(this.selectedCrop));

        if (this.carouselBg) {
            const centerX = this.cameras.main.width / 2;
            const buttonY = this.cameras.main.height - (this.cameras.main.height * 0.1);
            this.updateScoreText();
            this.updateCarouselVisuals(centerX, buttonY - 120);
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
            this.buttonText.setText("Plant");
            return;
        }

        const isTrunk = crop.trunkFrames.some(trunkFrame => Number(this.cropSprite.frame.name) === trunkFrame);
        this.buttonText.setText(isTrunk ? "Break" : "Cut");
    }

    private getNextGrassFrame(): number {
        const crop = getCropDef("grass");
        if (crop.kind !== "grass") return 0;

        const rand = Math.random();
        let threshold = 0;
        const rareFrame = crop.rareFrames.find(frameDef => {
            threshold += frameDef.chance;
            return rand < threshold;
        });

        return rareFrame?.frame ?? crop.commonFrames[Math.floor(Math.random() * crop.commonFrames.length)];
    }

    private createPlantButton(x: number, y: number) {
        const shadow = this.add.rectangle(x, y + 8, 200, 80, 0x3e2723, 0.4).setOrigin(0.5);

        this.buttonBg = this.add.rectangle(x, y, 200, 80, 0x689f38)
            .setStrokeStyle(4, 0x33691e)
            .setOrigin(0.5);

        this.buttonText = this.add.text(x, y, this.getButtonText(), {
            fontSize: "28px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#ffffff",
            fontStyle: "900",
            stroke: "#33691e",
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 0, stroke: false, fill: true }
        }).setOrigin(0.5);

        this.buttonBg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.handlePlantAction(this.buttonBg, this.buttonText, shadow))
            .on("pointerover", () => {
                this.buttonBg.setFillStyle(0x7cb342);
                this.game.canvas.style.cursor = "pointer";
            })
            .on("pointerout", () => {
                this.buttonBg.setFillStyle(0x689f38);
                this.game.canvas.style.cursor = "default";
            });
    }

    private getButtonText() {
        const crop = getCropDef(this.selectedCrop);
        if (crop.kind !== "grass") return "Plant";

        const isTrunk = crop.trunkFrames.some(trunkFrame => Number(this.cropSprite.frame.name) === trunkFrame);
        return isTrunk ? "Break" : "Cut";
    }

    private setupResizeHandler() {
        this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
            const w = gameSize.width || this.cameras.main.width;
            const h = gameSize.height || this.cameras.main.height;
            const centerX = w / 2;

            this.bg.setDisplaySize(w, h);
            this.updateBackgroundScale(w);

            this.farmContainer.x = centerX;

            this.counterText.x = centerX;
            this.counterText.y = 48;
            this.updateScoreText();

            if (this.buttonBg && this.buttonText) {
                this.buttonBg.x = centerX;
                this.buttonBg.y = h - 80;
                this.buttonText.x = centerX;
                this.buttonText.y = h - 80;

                const selectorY = h - 160;
                this.carouselBg.setPosition(centerX, selectorY);
                this.carouselIcon.setPosition(centerX, selectorY - 10);
                this.carouselLabel.setPosition(centerX, selectorY + 22);
                this.btnPrev.setPosition(centerX - 60, selectorY);
                this.btnNext.setPosition(centerX + 60, selectorY);
                this.updateCarouselVisuals(centerX, selectorY);
            }
        });
    }

    private handlePlantAction(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, shadow?: Phaser.GameObjects.Rectangle) {
        const crop = getCropDef(this.selectedCrop);
        if (crop.kind === "grass") {
            this.playClickFeedback(shadow ? [bg, text, shadow] : [bg, text]);
            this.handleHarvest();
            return;
        }

        this.playClickFeedback(shadow ? [bg, text, shadow] : [bg, text]);

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
        this.tweens.add({
            targets: targets,
            y: "+=4",
            duration: 50,
            yoyo: true
        });

        const crop = getCropDef(this.selectedCrop);
        const originalScale = crop.scale;

        this.tweens.add({
            targets: this.cropSprite,
            scaleX: originalScale * 0.88,
            scaleY: originalScale * 0.88,
            duration: 60,
            ease: "Power2",
            yoyo: false,
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

            if (crop.trunkFrames.some(trunkFrame => currentFrame === trunkFrame)) {
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

    private drawProgressBar(progress: number) {
        const width = 150;
        const x = this.cameras.main.width / 2 - width / 2;

        const fullH = this.cameras.main.height;
        const cropOffset = 150;
        const y = fullH / 2 + cropOffset;

        this.progressBar.clear();
        if (progress <= 0) return;

        this.progressBar.fillStyle(0x444444).fillRect(x, y, width, 15);
        this.progressBar.fillStyle(0xffeb3b).fillRect(x, y, width * progress, 15);
    }

    private createShopButton(centerX: number, y: number) {
        const shopBtn = this.add.rectangle(centerX + 120, y, 80, 80, 0x8d6e63)
            .setStrokeStyle(4, 0x4e342e)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX + 120, y, "\u{1F6D2}", { fontSize: "32px" }).setOrigin(0.5);

        const shop = new ShopUI();

        shopBtn.on("pointerdown", () => {
            shop.open();
        });
    }

    private spawnFloatingText(amount: number, golden: boolean = false) {
        const x = this.cameras.main.width / 2 + Phaser.Math.Between(-30, 30);
        const y = this.cameras.main.height / 2 - 60;

        const crop = getCropDef(this.selectedCrop);

        const label = golden
            ? `✨ +${amount} ${crop.icon}`
            : `+${amount} ${crop.icon}`;

        const floatText = this.add.text(x, y, label, {
            fontSize: golden ? "34px" : "28px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: golden ? "#FFD700" : "#ffffff",
            fontStyle: "900",
            stroke: golden ? "#B8860B" : "#33691e",
            strokeThickness: golden ? 5 : 4,
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
