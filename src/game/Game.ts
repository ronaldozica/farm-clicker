import Phaser from "phaser";
import { ClickerScene } from "./scenes/ClickerScene";

export function createGame() {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: "game-container",
        backgroundColor: "#1e1e1e",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600,
        },
        scene: [ClickerScene]
    };

    return new Phaser.Game(config);
}
