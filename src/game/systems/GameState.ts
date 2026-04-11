import Phaser from "phaser";

export class GameState extends Phaser.Events.EventEmitter {
    private static _instance: GameState;

    clicks: number = 0;

    private constructor() {
        super();
    }

    static get instance(): GameState {
        if (!this._instance) {
            this._instance = new GameState();
        }
        return this._instance;
    }

    addClick() {
        this.clicks++;
        this.emit('scoreChanged', this.clicks);
    }
}
