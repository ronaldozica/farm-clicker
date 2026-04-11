import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";
import { ShopUI } from "./UI";

export class ClickerScene extends Phaser.Scene {
    private counterText!: Phaser.GameObjects.Text;
    private carrot!: Phaser.GameObjects.Sprite;
    private progressBar!: Phaser.GameObjects.Graphics;
    private isBusy: boolean = false;
    private bg!: Phaser.GameObjects.TileSprite;
    private farmContainer!: Phaser.GameObjects.Container;
    private dirtPatch!: Phaser.GameObjects.TileSprite;
    private dirtFrame!: Phaser.GameObjects.Graphics;
    private buttonBg!: Phaser.GameObjects.Rectangle;
    private buttonText!: Phaser.GameObjects.Text;
    private counterBg!: Phaser.GameObjects.Graphics;

    constructor() {
        super("clicker-scene");
    }

    preload() {
        this.load.image("grass", "grass.png");
        this.load.image("dirt", "dirt.png");

        this.load.spritesheet("carrot-sheet", "carrot.png", {
            frameWidth: 320,
            frameHeight: 640
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
        GameState.instance.on("scoreChanged", (carrots: number) => {
            this.counterText.setText(`Carrots: ${carrots}`);
            this.updateCounterBackground();
            SaveSystem.save();
        });
    }

    private createAnimations() {
        this.anims.create({
            key: "idle",
            frames: [{ key: "carrot-sheet", frame: 2 }],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: "growing",
            frames: this.anims.generateFrameNumbers("carrot-sheet", { start: 3, end: 7 }),
            frameRate: 5,
            repeat: 0
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
        this.createPlantButton(centerX, buttonY);
        this.createShopButton(centerX + shopOffset, buttonY);
    }

    private createBackground() {
        const fullW = this.cameras.main.width;
        const fullH = this.cameras.main.height;

        this.bg = this.add.tileSprite(0, 0, fullW, fullH, 'grass').setOrigin(0).setScrollFactor(0);
        this.bg.setDepth(0);
        this.updateBackgroundScale(fullW);
    }

    private updateBackgroundScale(width: number) {
        const bgScale = width >= 900 ? 1.6 : 1;
        this.bg.setTileScale(bgScale, bgScale);
    }

    private createScoreUI(centerX: number, counterY: number) {
        this.counterBg = this.add.graphics();
        this.counterText = this.add.text(centerX, counterY, `Carrots: ${GameState.instance.carrots}`, {
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
        const carrotOffset = 75
        const carrotY = fullH / 2 - carrotOffset;

        this.farmContainer = this.add.container(centerX, carrotY);

        this.carrot = this.add.sprite(0, 0, "carrot-sheet").setScale(0.5).play("idle");

        const padding = 24;
        const dirtW = Math.round(this.carrot.displayWidth + padding * 2);
        const dirtH = Math.round(this.carrot.displayHeight + padding * 2);
        const dirtOffset = 15;
        const newDirtH = Math.round(dirtH / 2);
        const originalBottom = carrotY + dirtH / 2 - dirtOffset;
        const newCenterY = originalBottom - newDirtH / 2;
        const dirtLocalY = newCenterY - carrotY;

        this.dirtPatch = this.add.tileSprite(0, dirtLocalY, dirtW, newDirtH, 'dirt').setOrigin(0.5);
        this.dirtFrame = this.add.graphics();
        this.dirtFrame.lineStyle(4, 0x3e2723, 1);
        this.dirtFrame.strokeRoundedRect(-dirtW / 2, dirtLocalY - newDirtH / 2, dirtW, newDirtH, 8);

        this.farmContainer.add([this.dirtPatch, this.dirtFrame, this.carrot]);
        this.farmContainer.setDepth(1);
        this.carrot.setDepth(3);
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
            const w = (gameSize as any).width || this.cameras.main.width;
            const h = (gameSize as any).height || this.cameras.main.height;
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
            }
        });
    }

    private handlePlantAction(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text, shadow?: Phaser.GameObjects.Rectangle) {
        if (this.isBusy) return;

        this.isBusy = true;
        this.playClickFeedback(bg, text, shadow);
        this.carrot.play("growing");

        this.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: 1000 - GameState.instance.getGlobalSpeedReduction(),
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
        GameState.instance.addClick();
        this.carrot.play("idle");
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
