export class GameState {

    private static _instance: GameState;

    clicks: number = 0;

    private constructor() { }

    static get instance(): GameState {
        if (!this._instance) {
            this._instance = new GameState();
        }
        return this._instance;
    }

    addClick() {
        this.clicks++;
    }

}