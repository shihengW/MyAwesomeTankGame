class MiniMap {
    private _bounds: Phaser.Point = new Phaser.Point(100, 80);
    private _offsets: Phaser.Point = new Phaser.Point(10, 10);
    private _graphicsOuter: Phaser.Graphics;
    private _graphicsPlayer: Phaser.Graphics;
    private _graphicsEnemy: Phaser.Graphics;
    private _player: Tank;
    private _game: Phaser.Game;
    private _show: boolean = false;
    private _isBlinkingEnemy: boolean = false;

    constructor(game: Phaser.Game, player: Tank) {
        this._graphicsOuter = game.add.graphics(this._offsets.x, this._offsets.y);
        this._graphicsPlayer = game.add.graphics(this._offsets.x, this._offsets.y);
        this._graphicsEnemy = game.add.graphics(this._offsets.x, this._offsets.y);
        // This should not be affected by camera.
        this._graphicsOuter.fixedToCamera = true;
        this._graphicsPlayer.fixedToCamera = true;
        this._graphicsEnemy.fixedToCamera = true;
        this._player = player;
        this._game = game;
    }

    public updateMap(show: boolean) {
        this._graphicsPlayer.clear();
        if (show || this._isBlinkingEnemy) {
            if (!this._show) {
                this._show = true;
                this._graphicsOuter.beginFill(0x4D5300, 0.5);
                this._graphicsOuter.lineStyle(1, 0x4D5359, 0.5);
                this._graphicsOuter.drawRect(this._offsets.x, this._offsets.y, this._bounds.x, this._bounds.y);
                this._graphicsOuter.endFill();
            }

            let spot = this.getPlayer();
            this._graphicsPlayer.lineStyle(4, 0x00AF00, 0.8);
            this._graphicsPlayer.drawRect(spot.x, spot.y, 4, 4);
        }
        else {
            this._show = false;
            this._graphicsOuter.clear();
        }
    }

    public blinkEnemy(x: number, y: number) {
        this._isBlinkingEnemy = true;

        if (!this._show) {
            this.updateMap(true);
        }
        
        let spot = this.getPositionCore(x, y);
        this._graphicsEnemy.lineStyle(4, 0xAF0000, 0.8);
        this._graphicsEnemy.drawRect(spot.x, spot.y, 4, 4);

        let self = this;
        setTimeout(() => { 
            self._graphicsEnemy.clear();
            self._isBlinkingEnemy = false;
         }, 500);
    }

    private getPositionCore(x: number, y: number) : Phaser.Point {
        return new Phaser.Point(x / GameWidth * this._bounds.x + 10, y / GameHeight * this._bounds.y + 10);
    }

    private getPlayer() : Phaser.Point {
        return this.getPositionCore((<Phaser.Sprite>this._player).position.x, (<Phaser.Sprite>this._player).position.y);
    }
}