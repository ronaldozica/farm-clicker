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
    private lastGrassFrame: number = -1;
    private trunkHealth: number = 10;

    private selectedCrop: 'grass' | 'wheat' | 'carrot' = 'carrot';

    private selectedCropIndex: number = 2; // 0=grass, 1=wheat, 2=carrot
    private readonly crops: Array<'grass' | 'wheat' | 'carrot'> = ['grass', 'wheat', 'carrot'];

    private carouselBg!: Phaser.GameObjects.Rectangle;
    private carouselLabel!: Phaser.GameObjects.Text;
    private carouselIcon!: Phaser.GameObjects.Text;
    private btnPrev!: Phaser.GameObjects.Text;
    private btnNext!: Phaser.GameObjects.Text;
    private dotGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super("clicker-scene");
    }

    preload() {
        this.load.image("grass-bg", "grass-bg.png");
        this.load.image("dirt", "dirt-bg.png");

        this.load.spritesheet("grass-item", "grass.png", {
            frameWidth: 100,
            frameHeight: 100
        });

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
        const selectorY = buttonY - 150;
        const cardW = 80;
        const cardH = 80;
        const arrowOffset = 60;

        this.carouselBg = this.add.rectangle(centerX, selectorY, cardW, cardH, 0xfff8e1)
            .setStrokeStyle(3, 0x8d6e63)
            .setDepth(5);

        this.carouselIcon = this.add.text(centerX, selectorY - 10, '', { fontSize: '32px' })
            .setOrigin(0.5)
            .setDepth(6);

        this.carouselLabel = this.add.text(centerX, selectorY + 22, '', {
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            color: '#6d4c41',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        this.btnPrev = this.add.text(centerX - arrowOffset, selectorY, '‹', {
            fontSize: '36px',
            fontFamily: "'Inter', sans-serif",
            color: '#4e342e',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        this.btnNext = this.add.text(centerX + arrowOffset, selectorY, '›', {
            fontSize: '36px',
            fontFamily: "'Inter', sans-serif",
            color: '#4e342e',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        this.dotGraphics = this.add.graphics().setDepth(6);

        this.btnPrev.on('pointerdown', () => {
            this.selectedCropIndex = (this.selectedCropIndex - 1 + this.crops.length) % this.crops.length;
            this.switchCrop(this.crops[this.selectedCropIndex]);
        });
        this.btnNext.on('pointerdown', () => {
            this.selectedCropIndex = (this.selectedCropIndex + 1) % this.crops.length;
            this.switchCrop(this.crops[this.selectedCropIndex]);
        });

        this.updateCarouselVisuals(centerX, selectorY);
    }

    private updateCarouselVisuals(centerX: number, selectorY: number) {
        const icons = ['🌱', '🌾', '🥕'];
        const labels = ['Grass', 'Wheat', 'Carrot'];

        this.carouselIcon.setText(icons[this.selectedCropIndex]);
        this.carouselLabel.setText(labels[this.selectedCropIndex]);

        // this.carouselBg.setFillStyle(0xffeb3b);

        this.dotGraphics.clear();
        const dotSpacing = 14;
        const totalDots = this.crops.length;
        const startX = centerX - ((totalDots - 1) * dotSpacing) / 2;
        const dotsY = selectorY + 52;

        this.crops.forEach((_, i) => {
            const color = i === this.selectedCropIndex ? 0x4e342e : 0xbcaaa4;
            this.dotGraphics.fillStyle(color);
            this.dotGraphics.fillCircle(startX + i * dotSpacing, dotsY, 4);
        });
    }

    private switchCrop(crop: 'grass' | 'wheat' | 'carrot') {
        if (this.isBusy || this.selectedCrop === crop) return;
        this.selectedCrop = crop;

        if (crop === 'grass') {
            this.cropSprite.anims.stop();
            this.cropSprite.setTexture("grass-item");
            this.cropSprite.setFrame(this.getNextGrassFrame());
            this.cropSprite.setScale(1.2);
            this.cropSprite.y = 50;
            this.trunkHealth = 10;
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

        const centerX = this.cameras.main.width / 2;
        const buttonY = this.cameras.main.height - (this.cameras.main.height * 0.1);

        this.updateCarouselVisuals(centerX, buttonY - 150);
        this.updateButtonText();
    }

    private updateButtonText() {
        if (this.selectedCrop !== 'grass') {
            this.buttonText.setText("Plant");
        } else {
            const isTrunk = this.cropSprite.frame.name == "9";
            this.buttonText.setText(isTrunk ? "Break" : "Cut");
        }
    }

    private getNextGrassFrame(): number {
        let nextFrame: number;
        const commonFrames = [0, 1, 2, 3, 4, 5];

        do {
            const rand = Math.random();
            if (rand < 0.05) nextFrame = 6;
            else if (rand < 0.10) nextFrame = 7;
            else if (rand < 0.15) nextFrame = 8;
            else if (rand < 0.20) nextFrame = 9;
            else {
                nextFrame = commonFrames[Math.floor(Math.random() * commonFrames.length)];
            }
        } while (nextFrame === this.lastGrassFrame);

        this.lastGrassFrame = nextFrame;
        return nextFrame;
    }

    private createPlantButton(x: number, y: number) {
        const shadow = this.add.rectangle(x, y + 8, 200, 80, 0x3e2723, 0.4).setOrigin(0.5);

        this.buttonBg = this.add.rectangle(x, y, 200, 80, 0x689f38)
            .setStrokeStyle(4, 0x33691e)
            .setOrigin(0.5);

        let text = "Plant";
        if (this.selectedCrop === 'grass') {
            const isTrunk = this.cropSprite.frame.name === "9";
            text = isTrunk ? "Break" : "Cut";
        }

        this.buttonText = this.add.text(x, y, text, {
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
        if (this.isBusy) return;

        if (this.selectedCrop === 'grass') {
            this.playClickFeedback(shadow ? [bg, text, shadow] : [bg, text]);
            this.handleHarvest();
            return;
        }

        this.isBusy = true;
        this.playClickFeedback(shadow ? [bg, text, shadow] : [bg, text]);

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

    private playClickFeedback(targets: any | any[]) {
        this.tweens.add({
            targets: targets,
            y: '+=4',
            duration: 50,
            yoyo: true
        });
    }

    private handleHarvest() {
        this.drawProgressBar(0);

        if (this.selectedCrop === 'grass') {
            const currentFrame = parseInt(this.cropSprite.frame.name);

            if (currentFrame === 9) {
                this.trunkHealth--;

                if (this.trunkHealth > 0) {
                    this.playClickFeedback(this.cropSprite);
                    this.isBusy = false;
                    return;
                }

                GameState.instance.addClick('grass', 25);
                this.trunkHealth = 10;
            }
            else {
                let reward = 1;
                if (currentFrame === 6) reward = 5;
                else if (currentFrame === 7) reward = 10;
                else if (currentFrame === 8) reward = 20;

                GameState.instance.addClick('grass', reward);
            }

            this.cropSprite.setFrame(this.getNextGrassFrame());
        } else {
            GameState.instance.addClick(this.selectedCrop);
            this.cropSprite.play(`${this.selectedCrop}-idle`);
        }

        this.updateButtonText();
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