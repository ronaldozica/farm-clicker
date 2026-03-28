import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { SaveSystem } from "../systems/SaveSystem";

export class ClickerScene extends Phaser.Scene {

    private counterText!: Phaser.GameObjects.Text;

    constructor() {
        super("clicker-scene");
    }

    create() {

        SaveSystem.load();

        const centerX = this.cameras.main.width / 2;

        this.counterText = this.add.text(
            centerX,
            150,
            `Clicks: ${GameState.instance.clicks}`,
            {
                fontSize: "40px"
            }
        ).setOrigin(0.5);

        const button = this.add.text(
            centerX,
            350,
            "CLICK",
            {
                fontSize: "48px",
                backgroundColor: "#3a86ff",
                padding: { x: 20, y: 10 }
            }
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on("pointerdown", () => {

            GameState.instance.addClick();

            this.counterText.setText(
                `Clicks: ${GameState.instance.clicks}`
            );

            SaveSystem.save();

        });

    }
}