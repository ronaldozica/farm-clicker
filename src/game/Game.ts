import Phaser from "phaser";
import { ClickerScene } from "./scenes/ClickerScene";

export function createGame() {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: "game-container",
        backgroundColor: "#1e1e1e",
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: window.innerWidth,
            height: window.innerHeight,
        },
        scene: [ClickerScene]
    };

    return new Phaser.Game(config);
}
