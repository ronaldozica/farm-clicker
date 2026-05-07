import Phaser from "phaser";
import { GameState } from "./GameState";

export const COW_FRAME_WIDTH = 260;
export const COW_FRAME_HEIGHT = 170;
const COW_WALK_FRAMES = { start: 0, end: 4 };
const COW_EAT_FRAMES = { start: 5, end: 8 };

const COW_SCALE = 0.55;
const COW_WALK_SPEED = 90; 
const COW_WALK_DURATION_MIN = 3500;
const COW_WALK_DURATION_MAX = 6500;
const COW_EAT_DURATION_MIN = 2500;
const COW_EAT_DURATION_MAX = 5000;

const COW_DEPTH_MIN = 1.5;
const COW_DEPTH_MAX = 2.5;

const COW_Y_MIN_RATIO = 0.25;
const COW_Y_MAX_RATIO = 0.80;

export const MAX_COWS = 5;

type CowState = "walking" | "eating";

interface CowInstance {
    sprite: Phaser.GameObjects.Sprite;
    floatText?: Phaser.GameObjects.Text;
    state: CowState;
    direction: 1 | -1;
    walkTimer?: Phaser.Time.TimerEvent;
    eatTimer?: Phaser.Time.TimerEvent;
    y: number;
    depth: number;
    active: boolean;
}

export class CowPet {
    private scene: Phaser.Scene;
    private cows: CowInstance[] = [];
    private cowCount: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public registerAnimations() {
        if (!this.scene.anims.exists("cow-walk")) {
            this.scene.anims.create({
                key: "cow-walk",
                frames: this.scene.anims.generateFrameNumbers("cow", COW_WALK_FRAMES),
                frameRate: 8,
                repeat: -1,
            });
        }
        if (!this.scene.anims.exists("cow-eat")) {
            this.scene.anims.create({
                key: "cow-eat",
                frames: this.scene.anims.generateFrameNumbers("cow", COW_EAT_FRAMES),
                frameRate: 6,
                repeat: -1,
            });
        }
    }

    public syncCowCount(count: number) {
        const clamped = Phaser.Math.Clamp(count, 0, MAX_COWS);
        if (clamped === this.cowCount) return;

        if (clamped > this.cowCount) {
            for (let i = this.cowCount; i < clamped; i++) {
                this.spawnCow();
            }
        } else {
            for (let i = this.cowCount - 1; i >= clamped; i--) {
                this.removeCow(i);
            }
        }

        this.cowCount = clamped;
    }

    private spawnCow() {
        const { width, height } = this.scene.cameras.main;

        const yRatio = Phaser.Math.FloatBetween(COW_Y_MIN_RATIO, COW_Y_MAX_RATIO);
        const y = height * yRatio;

        const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        const startX = direction === 1
            ? -(COW_FRAME_WIDTH * COW_SCALE) / 2 - 10
            : width + (COW_FRAME_WIDTH * COW_SCALE) / 2 + 10;

        const sprite = this.scene.add.sprite(startX, y, "cow");
        sprite.setScale(COW_SCALE);

        const depth = Phaser.Math.FloatBetween(COW_DEPTH_MIN, COW_DEPTH_MAX);
        sprite.setDepth(depth);

        sprite.setFlipX(direction === -1);

        sprite.play("cow-walk");

        const cow: CowInstance = {
            sprite,
            state: "walking",
            direction,
            y,
            depth,
            active: true,
        };

        this.cows.push(cow);
        this.beginWalking(cow);
    }

    private removeCow(index: number) {
        const cow = this.cows[index];
        if (!cow) return;
        cow.active = false;
        cow.walkTimer?.remove();
        cow.eatTimer?.remove();
        cow.floatText?.destroy();
        this.scene.tweens.killTweensOf(cow.sprite);
        cow.sprite.destroy();
        this.cows.splice(index, 1);
    }

    private beginWalking(cow: CowInstance) {
        cow.state = "walking";
        cow.sprite.setFlipX(cow.direction === -1);
        cow.sprite.play("cow-walk");

        const duration = Phaser.Math.Between(COW_WALK_DURATION_MIN, COW_WALK_DURATION_MAX);
        const { width } = this.scene.cameras.main;
        const spriteHalfW = (COW_FRAME_WIDTH * COW_SCALE) / 2;
        const targetX = cow.direction === 1
            ? width + spriteHalfW + 10 
            : -spriteHalfW - 10;       

        this.scene.tweens.killTweensOf(cow.sprite);
        this.scene.tweens.add({
            targets: cow.sprite,
            x: targetX,
            duration: (Math.abs(targetX - cow.sprite.x) / COW_WALK_SPEED) * 1000,
            ease: "Linear",
            onComplete: () => {
                if (!cow.active) return;
                cow.direction = cow.direction === 1 ? -1 : 1;
                cow.sprite.setFlipX(cow.direction === -1);
                cow.sprite.x = cow.direction === 1
                    ? -spriteHalfW - 10
                    : width + spriteHalfW + 10;
                this.beginWalking(cow);
            }
        });

        cow.walkTimer?.remove();
        cow.walkTimer = this.scene.time.delayedCall(duration, () => {
            if (!cow.active) return;
            this.scene.tweens.killTweensOf(cow.sprite);
            this.beginEating(cow);
        });
    }

    private beginEating(cow: CowInstance) {
        cow.state = "eating";
        cow.sprite.play("cow-eat");

        const duration = Phaser.Math.Between(COW_EAT_DURATION_MIN, COW_EAT_DURATION_MAX);

        const tickInterval = 1200;
        const ticks = Math.floor(duration / tickInterval);

        for (let i = 0; i < ticks; i++) {
            this.scene.time.delayedCall(i * tickInterval + 400, () => {
                if (!cow.active || cow.state !== "eating") return;
                GameState.instance.addClick("grass", 1);
                this.spawnCowFloatText(cow, "+1 🌿");
            });
        }

        cow.eatTimer?.remove();
        cow.eatTimer = this.scene.time.delayedCall(duration, () => {
            if (!cow.active) return;
            this.beginWalking(cow);
        });
    }

    private spawnCowFloatText(cow: CowInstance, label: string) {
        const x = cow.sprite.x + Phaser.Math.Between(-20, 20);
        const y = cow.sprite.y - (COW_FRAME_HEIGHT * COW_SCALE) / 2 - 10;

        const text = this.scene.add.text(x, y, label, {
            fontSize: "22px",
            fontFamily: "'Inter', Arial, sans-serif",
            color: "#a5d6a7",
            fontStyle: "900",
            stroke: "#2e7d32",
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 3, fill: true },
        })
            .setOrigin(0.5)
            .setDepth(cow.depth + 0.5);

        this.scene.tweens.add({
            targets: text,
            y: y - 55,
            alpha: 0,
            duration: 1000,
            ease: "Power2",
            onComplete: () => text.destroy(),
        });
    }

    public onResize(_width: number, height: number) {
        this.cows.forEach(cow => {
            const newY = Phaser.Math.Clamp(cow.y, height * COW_Y_MIN_RATIO, height * COW_Y_MAX_RATIO);
            cow.sprite.y = newY;
            cow.y = newY;
        });
    }

    public destroy() {
        [...this.cows].forEach((_, i) => this.removeCow(i));
        this.cows = [];
        this.cowCount = 0;
    }
}
