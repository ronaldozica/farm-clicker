import Phaser from "phaser";
import { GameState } from "./GameState";
import { getCropDef } from "./CropDefs";

export class BunnyPet {
    private scene: Phaser.Scene;
    private bunnySprite?: Phaser.GameObjects.Sprite;
    private runTween?: Phaser.Tweens.Tween;
    private scheduleTimer?: Phaser.Time.TimerEvent;
    private trailTimers: Phaser.Time.TimerEvent[] = [];
    private active: boolean = false;
    private running: boolean = false;

    private readonly AVG_INTERVAL_MS = 100_00;
    private readonly RUN_DURATION_MS = 2_800;
    private readonly TRAIL_COUNT = 6;
    private readonly Y_FRACTION = 0.32;
    private readonly BUNNY_SCALE = 0.32;
    private readonly DEPTH = 8;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
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
        this.running = true;

        const cam     = this.scene.cameras.main;
        const screenW = cam.width;
        const screenH = cam.height;
        const y       = screenH * this.Y_FRACTION;

        const goingRight = Math.random() < 0.5;
        const startX     = goingRight ? -120 : screenW + 120;
        const endX       = goingRight ? screenW + 120 : -120;

        if (!this.bunnySprite) {
            this.bunnySprite = this.scene.add.sprite(startX, y, "bunny-item");
            this.bunnySprite.setDepth(this.DEPTH);
            this.bunnySprite.setScale(this.BUNNY_SCALE);
        } else {
            this.bunnySprite.setPosition(startX, y);
            this.bunnySprite.setActive(true).setVisible(true);
        }

        this.bunnySprite.setFlipX(!goingRight);

        this.bunnySprite.play("bunny-run");

        this.runTween = this.scene.tweens.add({
            targets: this.bunnySprite,
            x: endX,
            duration: this.RUN_DURATION_MS,
            ease: "Linear",
            onComplete: () => {
                this.finishRun();
            }
        });

        this.spawnCarrotTrail(startX, endX, y, goingRight);
    }

    private finishRun(): void {
        this.running = false;
        this.bunnySprite?.setVisible(false);
        this.clearTrailTimers();
        this.scheduleNextRun();
    }

    private abortRun(): void {
        this.runTween?.stop();
        this.runTween = undefined;
        this.running = false;
        this.bunnySprite?.setVisible(false);
        this.clearTrailTimers();
    }

    private spawnCarrotTrail(
        _startX: number,
        _endX: number,
        y: number,
        goingRight: boolean
    ): void {
        this.clearTrailTimers();

        const carrotDef = getCropDef("carrot");

        for (let i = 0; i < this.TRAIL_COUNT; i++) {
            const delay = (this.RUN_DURATION_MS * 0.1) +
                          (i * (this.RUN_DURATION_MS * 0.8) / (this.TRAIL_COUNT - 1));

            const timer = this.scene.time.delayedCall(delay, () => {
                if (!this.bunnySprite?.active) return;

                const behindOffset = goingRight ? -60 : 60;
                const puffX = this.bunnySprite!.x + behindOffset +
                              Phaser.Math.Between(-20, 20);
                const puffY = y - 30 + Phaser.Math.Between(-15, 15);

                this.spawnCarrotPuff(puffX, puffY, carrotDef.icon);

                GameState.instance.addClick("carrot", 25);
            });

            this.trailTimers.push(timer);
        }
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
