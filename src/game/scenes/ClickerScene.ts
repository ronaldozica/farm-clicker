import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";

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
        this.createAnimations();
        this.initializeUI();
        this.setupEventListeners();
        SaveSystem.load();
        this.setupResizeHandler();
    }

    private setupEventListeners() {
        GameState.instance.on("scoreChanged", (points: number) => {
            this.counterText.setText(`Carrots: ${points}`);
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
        const centerX = this.cameras.main.width / 2;
        const fullH = this.cameras.main.height;

        this.createBackground();
        this.createScoreUI(centerX);
        this.createFarm(centerX);

        this.progressBar = this.add.graphics();
        this.createPlantButton(centerX, fullH - 80);
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

    private createScoreUI(centerX: number) {
        const uiY = 75;

        this.counterBg = this.add.graphics();
        this.counterText = this.add.text(centerX, uiY, `Carrots: ${GameState.instance.carrots}`, {
            fontSize: "32px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#ffffffff",
            fontStyle: "700",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.counterText.setDepth(5);
        this.updateCounterBackground();
    }

    private updateCounterBackground() {
        this.counterBg.clear();
        const cbw2 = this.counterText.width + 28;
        const cbh2 = this.counterText.height + 14;
        this.counterBg.fillStyle(0x263238, 0.6);
        this.counterBg.fillRoundedRect(this.counterText.x - cbw2 / 2, this.counterText.y - cbh2 / 2, cbw2, cbh2, 8);
    }

    private createFarm(centerX: number) {
        const carrotY = 220;
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
        this.add.rectangle(x, y + 6, 220, 86, 0x000000, 0.25).setOrigin(0.5);
        this.buttonBg = this.add.rectangle(x, y, 200, 80, 0x8d6e63).setStrokeStyle(4, 0x5d4037).setOrigin(0.5);

        this.buttonText = this.add.text(x, y, "Plant", {
            fontSize: "22px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#ffffff",
            fontStyle: "700",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.buttonBg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.handlePlantAction(this.buttonBg, this.buttonText));
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

    private handlePlantAction(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text) {
        if (this.isBusy) return;

        this.isBusy = true;
        this.playClickFeedback(bg, text);
        this.carrot.play("growing");

        this.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: 1000,
            onUpdate: (_, target) => this.drawProgressBar(target.progress),
            onComplete: () => this.handleHarvest()
        });
    }

    private playClickFeedback(bg: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text) {
        this.tweens.add({
            targets: [bg, text],
            scale: 0.95,
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
        const y = 450;

        this.progressBar.clear();
        if (progress <= 0) return;

        this.progressBar.fillStyle(0x444444).fillRect(x, y, width, 15);
        this.progressBar.fillStyle(0xffeb3b).fillRect(x, y, width * progress, 15);
    }
}