import Phaser from "phaser";
import { GameState } from "./GameState";
import { getCropDef } from "./CropDefs";

export const MAX_BUNNIES = 5;

interface BunnyInstance {
    sprite: Phaser.GameObjects.Sprite;
    xOffset: number;
    yOffset: number;
}

export class BunnyAutoClicker {
    private scene: Phaser.Scene;
    private bunnies: BunnyInstance[] = [];
    private runTweens: Phaser.Tweens.Tween[] = [];
    private scheduleTimer?: Phaser.Time.TimerEvent;
    private trailTimers: Phaser.Time.TimerEvent[] = [];
    private active: boolean = false;
    private running: boolean = false;
    private bunnyCount: number = 0;

    private readonly AVG_INTERVAL_MS = 50_00;
    private readonly RUN_DURATION_MS = 2_800;
    private readonly TRAIL_COUNT = 6;
    private readonly Y_FRACTION = 0.32;
    private readonly BUNNY_SCALE = 0.18;
    private readonly DEPTH = 1.2;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public syncBunnyCount(count: number): void {
        const clamped = Phaser.Math.Clamp(count, 0, MAX_BUNNIES);
        if (clamped === this.bunnyCount) return;

        if (clamped > this.bunnyCount) {
            for (let i = this.bunnyCount; i < clamped; i++) {
                this.spawnBunny(i);
            }
        } else {
            for (let i = this.bunnyCount - 1; i >= clamped; i--) {
                this.removeBunny(i);
            }
        }

        this.bunnyCount = clamped;

        if (clamped > 0) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    public activate(): void {
        if (this.active) return;
        this.active = true;
        this.scheduleNextRun();
    }

    public deactivate(): void {
        this.active = false;
        this.cancelSchedule();
        this.abortRun();
    }

    private spawnBunny(index: number): void {
        const sprite = this.scene.add.sprite(-140, -140, "bunny-item");
        sprite.setDepth(this.DEPTH + index * 0.01);
        sprite.setScale(this.BUNNY_SCALE);
        sprite.setVisible(false);

        this.bunnies.push({
            sprite,
            xOffset: (index - 2) * 38,
            yOffset: [0, -18, 16, -6, 20][index] ?? 0,
        });
    }

    private removeBunny(index: number): void {
        const bunny = this.bunnies[index];
        if (!bunny) return;

        this.scene.tweens.killTweensOf(bunny.sprite);
        bunny.sprite.destroy();
        this.bunnies.splice(index, 1);
    }

    private scheduleNextRun(): void {
        if (!this.active) return;
        this.cancelSchedule();

        const minDelay = this.AVG_INTERVAL_MS * 0.5;
        const maxDelay = this.AVG_INTERVAL_MS * 1.5;
        const delay = Phaser.Math.Between(minDelay, maxDelay);

        this.scheduleTimer = this.scene.time.delayedCall(delay, () => {
            this.startRun();
        });
    }

    private cancelSchedule(): void {
        if (this.scheduleTimer) {
            this.scheduleTimer.remove(false);
            this.scheduleTimer = undefined;
        }
    }

    private startRun(): void {
        if (this.running) {
            this.scheduleNextRun();
            return;
        }
        if (this.bunnies.length === 0) return;

        this.running = true;

        const cam     = this.scene.cameras.main;
        const screenW = cam.width;
        const screenH = cam.height;
        const y       = screenH * this.Y_FRACTION;

        const goingRight = Math.random() < 0.5;
        const startX     = goingRight ? -120 : screenW + 120;
        const endX       = goingRight ? screenW + 120 : -120;

        this.runTweens = this.bunnies.map((bunny, index) => {
            const directionOffset = goingRight ? -bunny.xOffset : bunny.xOffset;
            bunny.sprite.setPosition(startX + directionOffset, y + bunny.yOffset);
            bunny.sprite.setActive(true).setVisible(true);
            bunny.sprite.setFlipX(!goingRight);
            bunny.sprite.play("bunny-run");

            return this.scene.tweens.add({
                targets: bunny.sprite,
                x: endX + directionOffset,
                duration: this.RUN_DURATION_MS,
                ease: "Linear",
                onComplete: () => {
                    if (index === 0) {
                        this.finishRun();
                    }
                }
            });
        });

        this.spawnCarrotTrail(y, goingRight);
    }

    private finishRun(): void {
        this.running = false;
        this.runTweens = [];
        this.bunnies.forEach(bunny => bunny.sprite.setVisible(false));
        this.clearTrailTimers();
        this.scheduleNextRun();
    }

    private abortRun(): void {
        this.runTweens.forEach(tween => tween.stop());
        this.runTweens = [];
        this.running = false;
        this.bunnies.forEach(bunny => bunny.sprite.setVisible(false));
        this.clearTrailTimers();
    }

    private spawnCarrotTrail(
        y: number,
        goingRight: boolean
    ): void {
        this.clearTrailTimers();

        const carrotDef = getCropDef("carrot");

        this.bunnies.forEach(bunny => {
            for (let i = 0; i < this.TRAIL_COUNT; i++) {
                const delay = (this.RUN_DURATION_MS * 0.1) +
                              (i * (this.RUN_DURATION_MS * 0.8) / (this.TRAIL_COUNT - 1));

                const timer = this.scene.time.delayedCall(delay, () => {
                    if (!bunny.sprite.active || !bunny.sprite.visible) return;

                    const behindOffset = goingRight ? -60 : 60;
                    const puffX = bunny.sprite.x + behindOffset +
                                  Phaser.Math.Between(-20, 20);
                    const puffY = y + bunny.yOffset - 30 + Phaser.Math.Between(-15, 15);

                    this.spawnCarrotPuff(puffX, puffY, carrotDef.icon);

                    GameState.instance.addClick("carrot", 25);
                });

                this.trailTimers.push(timer);
            }
        });
    }

    private spawnCarrotPuff(x: number, y: number, icon: string): void {
        const text = this.scene.add.text(x, y, `+25 ${icon}`, {
            fontSize: "22px",
            fontFamily: "'Nunito', 'Inter', sans-serif",
            color: "#ff8f00",
            fontStyle: "800",
            stroke: "#5d4037",
            strokeThickness: 3,
            shadow: { offsetX: 0, offsetY: 2, color: "#000", blur: 2, fill: true }
        }).setOrigin(0.5).setDepth(this.DEPTH + 1);

        this.scene.tweens.add({
            targets: text,
            y: y - 55,
            alpha: 0,
            scaleX: 0.7,
            scaleY: 0.7,
            duration: 900,
            ease: "Power2",
            onComplete: () => text.destroy()
        });
    }

    private clearTrailTimers(): void {
        for (const t of this.trailTimers) {
            t.remove(false);
        }
        this.trailTimers = [];
    }
}
