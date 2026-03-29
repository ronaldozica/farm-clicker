import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";

export class ClickerScene extends Phaser.Scene {
    private counterText!: Phaser.GameObjects.Text;
    private carrot!: Phaser.GameObjects.Sprite;
    private progressBar!: Phaser.GameObjects.Graphics;
    private isBusy: boolean = false;

    constructor() {
        super("clicker-scene");
    }

    preload() {
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
    }

    private setupEventListeners() {
        GameState.instance.on("scoreChanged", (points: number) => {
            this.counterText.setText(`Carrots: ${points}`);
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

        this.counterText = this.add.text(centerX, 80, `Carrots: ${GameState.instance.clicks}`, {
            fontSize: "40px",
            fontFamily: "Courier",
            color: "#ffca28"
        }).setOrigin(0.5);

        this.carrot = this.add.sprite(centerX, 250, "carrot-sheet")
            .setScale(0.5)
            .play("idle");

        this.progressBar = this.add.graphics();
        this.createPlantButton(centerX);
    }

    private createPlantButton(x: number) {
        const buttonBg = this.add.rectangle(x, 550, 200, 80, 0x8d6e63).setStrokeStyle(6, 0x5d4037);
        const buttonText = this.add.text(x, 550, "Plant", {
            fontSize: "32px",
            fontFamily: "Courier",
            color: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        buttonBg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.handlePlantAction(buttonBg, buttonText));
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
