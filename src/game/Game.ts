import Phaser from "phaser";
import { ClickerScene } from "./scenes/ClickerScene";

export function createGame() {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: "game-container",
        backgroundColor: "#1e1e1e",
        scene: [ClickerScene]
    };

    return new Phaser.Game(config);
}
