import Phaser from "phaser";
import { getCropDef } from "./CropDefs";
import { GameState } from "./GameState";

export const FARMER_FRAME_WIDTH = 300;
export const FARMER_FRAME_HEIGHT = 300;
export const MAX_FARMERS = 1;

const FARMER_GROW_FRAMES = { start: 0, end: 6 };
const FARMER_HARVEST_FRAMES = { start: 7, end: 11 };
const FARMER_SCALE = 0.46;
const FARMER_DEPTH = 1.35;
const FARMER_GROW_FRAME_RATE = 2.8;
const FARMER_HARVEST_FRAME_RATE = 8;
const FARMER_MATURE_WAIT_MS = 900;
const FARMER_REST_MS = 1_500;
const FARMER_WHEAT_REWARD = 100;

export class FarmerAutoClicker {
    private scene: Phaser.Scene;
    private sprite?: Phaser.GameObjects.Sprite;
    private count: number = 0;
    private active: boolean = false;
    private cycleTimer?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public registerAnimations(): void {
        if (!this.scene.anims.exists("farmer-grow")) {
            this.scene.anims.create({
                key: "farmer-grow",
                frames: this.scene.anims.generateFrameNumbers("farmer", FARMER_GROW_FRAMES),
                frameRate: FARMER_GROW_FRAME_RATE,
                repeat: 0,
            });
        }

        if (!this.scene.anims.exists("farmer-harvest")) {
            this.scene.anims.create({
                key: "farmer-harvest",
                frames: this.scene.anims.generateFrameNumbers("farmer", FARMER_HARVEST_FRAMES),
                frameRate: FARMER_HARVEST_FRAME_RATE,
                repeat: 0,
            });
        }
    }

    public syncFarmerCount(count: number): void {
        const clamped = Phaser.Math.Clamp(count, 0, MAX_FARMERS);
        if (clamped === this.count) return;

        this.count = clamped;

        if (clamped > 0) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    public onResize(width: number, height: number): void {
        if (!this.sprite) return;
        this.positionSprite(width, height);
    }

    public destroy(): void {
        this.deactivate();
        this.sprite?.destroy();
        this.sprite = undefined;
    }

    private activate(): void {
        if (this.active) return;
        this.active = true;

        if (!this.sprite) {
            this.sprite = this.scene.add.sprite(0, 0, "farmer");
            this.sprite.setScale(FARMER_SCALE);
            this.sprite.setDepth(FARMER_DEPTH);
            this.sprite.setFrame(0);
            this.positionSprite(this.scene.cameras.main.width, this.scene.cameras.main.height);
        }

        this.sprite.setVisible(true).setActive(true);
        this.startCycle();
    }

    private deactivate(): void {
        this.active = false;
        this.cycleTimer?.remove(false);
        this.cycleTimer = undefined;

        if (this.sprite) {
            this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
            this.sprite.anims.stop();
            this.sprite.setVisible(false).setActive(false);
        }
    }

    private startCycle(): void {
        if (!this.active || !this.sprite) return;

        this.cycleTimer?.remove(false);
        this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
        this.sprite.setFrame(FARMER_GROW_FRAMES.start);
        this.sprite.play("farmer-grow");
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.waitForHarvest();
        });
    }

    private waitForHarvest(): void {
        if (!this.active || !this.sprite) return;

        this.sprite.setFrame(FARMER_GROW_FRAMES.end);
        this.cycleTimer = this.scene.time.delayedCall(FARMER_MATURE_WAIT_MS, () => {
            this.harvestWheat();
        });
    }

    private harvestWheat(): void {
        if (!this.active || !this.sprite) return;

        this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
        this.sprite.play("farmer-harvest");
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!this.active || !this.sprite) return;

            GameState.instance.addClick("wheat", FARMER_WHEAT_REWARD);
            this.spawnFloatingText();
            this.sprite.setFrame(FARMER_HARVEST_FRAMES.end);
            this.cycleTimer = this.scene.time.delayedCall(FARMER_REST_MS, () => {
                this.startCycle();
            });
        });
    }

    private positionSprite(width: number, height: number): void {
        if (!this.sprite) return;

        const isSmallScreen = width <= 520;
        const x = isSmallScreen ? width * 0.28 : width / 2 + 230;
        const y = isSmallScreen ? height * 0.64 : height * 0.68;

        this.sprite.setPosition(x, y);
    }

    private spawnFloatingText(): void {
        if (!this.sprite) return;

        const wheat = getCropDef("wheat");
        const x = this.sprite.x + 30;
        const y = this.sprite.y - FARMER_FRAME_HEIGHT * FARMER_SCALE * 0.58;

        const text = this.scene.add.text(x, y, `+${FARMER_WHEAT_REWARD} ${wheat.icon}`, {
            fontSize: "26px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#ffd54f",
            fontStyle: "900",
            stroke: "#6d4c41",
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 3, fill: true },
        })
            .setOrigin(0.5)
            .setDepth(FARMER_DEPTH + 0.4);

        this.scene.tweens.add({
            targets: text,
            y: y - 70,
            alpha: 0,
            scaleX: 0.7,
            scaleY: 0.7,
            duration: 1100,
            ease: "Power2",
            onComplete: () => text.destroy(),
        });
    }
}
