import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";
import { ShopUI } from "./UI";

export class ClickerScene extends Phaser.Scene {
    private counterText!: Phaser.GameObjects.Text;
    private cropSprite!: Phaser.GameObjects.Sprite;
    private progressBar!: Phaser.GameObjects.Graphics;
    private isBusy: boolean = false;
    private bg!: Phaser.GameObjects.TileSprite;
    private farmContainer!: Phaser.GameObjects.Container;
    private dirtPatch!: Phaser.GameObjects.TileSprite;
    private dirtFrame!: Phaser.GameObjects.Graphics;
    private buttonBg!: Phaser.GameObjects.Rectangle;
    private buttonText!: Phaser.GameObjects.Text;
    private counterBg!: Phaser.GameObjects.Graphics;

    private selectedCrop: 'grass' | 'wheat' | 'carrot' = 'carrot';
    private selectorGrassBg!: Phaser.GameObjects.Rectangle;
    private selectorWheatBg!: Phaser.GameObjects.Rectangle;
    private selectorCarrotBg!: Phaser.GameObjects.Rectangle;
    private iconGrass!: Phaser.GameObjects.Text;
    private iconWheat!: Phaser.GameObjects.Text;
    private iconCarrot!: Phaser.GameObjects.Text;

    constructor() {
        super("clicker-scene");
    }

    preload() {
        this.load.image("grass-bg", "grass-bg.png");
        this.load.image("dirt", "dirt-bg.png");
        this.load.image("grass-item", "grass.png");

        this.load.spritesheet("carrot-sheet", "carrot.png", {
            frameWidth: 320,
            frameHeight: 640
        });

        this.load.spritesheet("wheat-sheet", "wheat.png", {
            frameWidth: 110,
            frameHeight: 180
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
        GameState.instance.on("scoreChanged", (crops: { grass: number; wheat: number; carrots: number }) => {
            this.counterText.setText(`🌱: ${crops.grass} | 🌾: ${crops.wheat} | 🥕: ${crops.carrots}`);
            this.updateCounterBackground();
            SaveSystem.save();
        });
    }

    private createAnimations() {
        this.anims.create({
            key: "carrot-idle",
            frames: [{ key: "carrot-sheet", frame: 2 }],
            frameRate: 1, repeat: -1
        });
        this.anims.create({
            key: "carrot-growing",
            frames: this.anims.generateFrameNumbers("carrot-sheet", { start: 3, end: 7 }),
            frameRate: 5, repeat: 0
        });

        this.anims.create({
            key: "wheat-idle",
            frames: [{ key: "wheat-sheet", frame: 0 }],
            frameRate: 1, repeat: -1
        });
        this.anims.create({
            key: "wheat-growing",
            frames: this.anims.generateFrameNumbers("wheat-sheet", { start: 0, end: 4 }),
            frameRate: 5, repeat: 0
        });
    }

    private initializeUI() {
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

        this.bg = this.add.tileSprite(0, 0, fullW, fullH, 'grass-bg').setOrigin(0).setScrollFactor(0);
        this.bg.setDepth(0);
        this.updateBackgroundScale(fullW);
    }

    private updateBackgroundScale(width: number) {
        const bgScale = width >= 900 ? 1.6 : 1;
        this.bg.setTileScale(bgScale, bgScale);
    }

    private createScoreUI(centerX: number, counterY: number) {
        this.counterBg = this.add.graphics();
        this.counterText = this.add.text(centerX, counterY, `🌱: ${GameState.instance.grass} | 🌾: ${GameState.instance.wheat} | 🥕: ${GameState.instance.carrots}`, {
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
        const carrotOffset = 75;
        const carrotY = fullH / 2 - carrotOffset;

        this.farmContainer = this.add.container(centerX, carrotY);

        this.cropSprite = this.add.sprite(0, 0, "carrot-sheet").setScale(0.5).play("carrot-idle");

        const baseSpriteW = 160;
        const baseSpriteH = 320;
        const padding = 24;

        const dirtW = Math.round(baseSpriteW + padding * 2);
        const dirtH = Math.round(baseSpriteH + padding * 2);
        const dirtOffset = 15;
        const newDirtH = Math.round(dirtH / 2);
        const originalBottom = carrotY + dirtH / 2 - dirtOffset;
        const newCenterY = originalBottom - newDirtH / 2;
        const dirtLocalY = newCenterY - carrotY;

        this.dirtPatch = this.add.tileSprite(0, dirtLocalY, dirtW, newDirtH, 'dirt').setOrigin(0.5);
        this.dirtFrame = this.add.graphics();
        this.dirtFrame.lineStyle(4, 0x3e2723, 1);
        this.dirtFrame.strokeRoundedRect(-dirtW / 2, dirtLocalY - newDirtH / 2, dirtW, newDirtH, 8);

        this.farmContainer.add([this.dirtPatch, this.dirtFrame, this.cropSprite]);
        this.farmContainer.setDepth(1);
        this.cropSprite.setDepth(3);
    }

    private createCropSelector(centerX: number, buttonY: number) {
        const selectorY = buttonY - 80;

        this.selectorGrassBg = this.add.rectangle(centerX - 120, selectorY, 60, 60, 0xfff8e1).setStrokeStyle(3, 0x8d6e63).setInteractive({ useHandCursor: true });
        this.iconGrass = this.add.text(centerX - 120, selectorY, "🌱", { fontSize: "32px" }).setOrigin(0.5);

        this.selectorWheatBg = this.add.rectangle(centerX - 40, selectorY, 60, 60, 0xfff8e1).setStrokeStyle(3, 0x8d6e63).setInteractive({ useHandCursor: true });
        this.iconWheat = this.add.text(centerX - 40, selectorY, "🌾", { fontSize: "32px" }).setOrigin(0.5);

        this.selectorCarrotBg = this.add.rectangle(centerX + 40, selectorY, 60, 60, 0xfff8e1).setStrokeStyle(3, 0x8d6e63).setInteractive({ useHandCursor: true });
        this.iconCarrot = this.add.text(centerX + 40, selectorY, "🥕", { fontSize: "32px" }).setOrigin(0.5);

        this.selectorGrassBg.on('pointerdown', () => this.switchCrop('grass'));
        this.selectorWheatBg.on('pointerdown', () => this.switchCrop('wheat'));
        this.selectorCarrotBg.on('pointerdown', () => this.switchCrop('carrot'));

        this.updateSelectorVisuals();
    }

    private switchCrop(crop: 'grass' | 'wheat' | 'carrot') {
        if (this.isBusy || this.selectedCrop === crop) return;

        this.selectedCrop = crop;

        if (crop === 'grass') {
            this.cropSprite.anims.stop();
            this.cropSprite.setTexture("grass-item");
            this.cropSprite.setScale(1);
            this.cropSprite.y = 50;
        } else {
            this.cropSprite.play(`${crop}-idle`);

            if (crop === 'carrot') {
                this.cropSprite.setScale(0.5);
                this.cropSprite.y = 0;
            } else {
                this.cropSprite.setScale(1);
                this.cropSprite.y = 50;
            }
        }

        this.updateSelectorVisuals();
    }

    private updateSelectorVisuals() {
        const selectedColor = 0xffeb3b;
        const defaultColor = 0xfff8e1;

        if (this.selectedCrop === 'carrot') {
            this.selectorGrassBg.setFillStyle(defaultColor);
            this.selectorWheatBg.setFillStyle(defaultColor);
            this.selectorCarrotBg.setFillStyle(selectedColor);
        } else if (this.selectedCrop === 'wheat') {
            this.selectorGrassBg.setFillStyle(defaultColor);
            this.selectorWheatBg.setFillStyle(selectedColor);
            this.selectorCarrotBg.setFillStyle(defaultColor);
        } else if (this.selectedCrop === 'grass') {
            this.selectorGrassBg.setFillStyle(selectedColor);
            this.selectorWheatBg.setFillStyle(defaultColor);
            this.selectorCarrotBg.setFillStyle(defaultColor);
        }
    }

    private createPlantButton(x: number, y: number) {
        const shadow = this.add.rectangle(x, y + 8, 200, 80, 0x3e2723, 0.4).setOrigin(0.5);

        this.buttonBg = this.add.rectangle(x, y, 200, 80, 0x689f38)
            .setStrokeStyle(4, 0x33691e)
            .setOrigin(0.5);

        this.buttonText = this.add.text(x, y, "Plant", {
            fontSize: "28px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#ffffff",
            fontStyle: "900",
            stroke: "#33691e",
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 0, stroke: false, fill: true }
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

    private setupResizeHandler() {
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            const w = gameSize.width || this.cameras.main.width;
            const h = gameSize.height || this.cameras.main.height;
            const centerX = w / 2;

            this.bg.setDisplaySize(w, h);
            this.updateBackgroundScale(w);

            this.farmContainer.x = centerX;

            this.counterText.x = centerX;
            this.counterText.y = 48;
            this.updateCounterBackground();

            if (this.buttonBg && this.buttonText) {
                this.buttonBg.x = centerX;
                this.buttonBg.y = h - 80;
                this.buttonText.x = centerX;
                this.buttonText.y = h - 80;

                const selectorY = h - 160;
                this.selectorGrassBg.setPosition(centerX + 80, selectorY);
                this.iconGrass.setPosition(centerX + 80, selectorY);
                this.selectorWheatBg.setPosition(centerX + 40, selectorY);
                this.iconWheat.setPosition(centerX + 40, selectorY);
                this.selectorCarrotBg.setPosition(centerX - 40, selectorY);
                this.iconCarrot.setPosition(centerX - 40, selectorY);
            }
        });
    }

    private handlePlantAction(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, shadow?: Phaser.GameObjects.Rectangle) {
        if (this.isBusy) return;

        if (this.selectedCrop === 'grass') {
            this.playClickFeedback(bg, text, shadow);
            this.handleHarvest();
            return;
        }

        this.isBusy = true;
        this.playClickFeedback(bg, text, shadow);

        const baseDurations = { carrot: 1000, wheat: 500, grass: 0 };
        const baseTime = baseDurations[this.selectedCrop];
        const currentDuration = Math.max(50, baseTime - GameState.instance.getGlobalSpeedReduction());

        const totalFrames = this.selectedCrop === 'carrot' ? 5 : 4;
        const dynamicFrameRate = (totalFrames / currentDuration) * 1000;

        this.cropSprite.play({
            key: `${this.selectedCrop}-growing`,
            frameRate: dynamicFrameRate
        });

        this.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: currentDuration,
            onUpdate: (_, target) => this.drawProgressBar(target.progress),
            onComplete: () => this.handleHarvest()
        });
    }

    private playClickFeedback(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, shadow?: Phaser.GameObjects.Rectangle) {
        const targets = shadow ? [bg, text, shadow] : [bg, text];
        this.tweens.add({
            targets: targets,
            y: '+=4',
            duration: 50,
            yoyo: true
        });
    }

    private handleHarvest() {
        this.drawProgressBar(0);
        GameState.instance.addClick(this.selectedCrop);

        if (this.selectedCrop !== 'grass') {
            this.cropSprite.play(`${this.selectedCrop}-idle`);
        }

        this.isBusy = false;
    }

    private drawProgressBar(progress: number) {
        const width = 150;
        const x = this.cameras.main.width / 2 - width / 2;

        const fullH = this.cameras.main.height;
        const carrotOffset = 150;
        const y = fullH / 2 + carrotOffset;

        this.progressBar.clear();
        if (progress <= 0) return;

        this.progressBar.fillStyle(0x444444).fillRect(x, y, width, 15);
        this.progressBar.fillStyle(0xffeb3b).fillRect(x, y, width * progress, 15);
    }

    private createShopButton(centerX: number, y: number) {
        const shopBtn = this.add.rectangle(centerX + 120, y, 80, 80, 0x8d6e63)
            .setStrokeStyle(4, 0x4e342e)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX + 120, y, "🛒", { fontSize: "32px" }).setOrigin(0.5);

        const shop = new ShopUI();

        shopBtn.on("pointerdown", () => {
            shop.open();
        });
    }
}