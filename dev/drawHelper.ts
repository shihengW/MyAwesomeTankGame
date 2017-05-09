/// <reference path="../.ts_dependencies/phaser.d.ts" />
class DrawHelpers {
    static drawGrids(graphics: Phaser.Graphics, width: number, height: number) {
        let hnum: number = Math.floor(width / GridWidth);
        let vnum: number = Math.floor(height / GridHeight);

        graphics.lineStyle(2, 0xE03F00, 1);
        for (let i = 2; i < hnum - 2; i++) {
            let x: number = i * GridWidth;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        graphics.lineStyle(2, 0x00E05E, 1);
        for (let i = 2; i < vnum - 2; i++) {
            let y: number = i * GridHeight;
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
    }
}

class MiniMap {
    private _bounds: Phaser.Point = new Phaser.Point(100, 80);
    private _offsets: Phaser.Point = new Phaser.Point(10, 10);
    private _graphics: Phaser.Graphics;
    private _showMap: boolean = false;
    private _player: Tank;
    private _game: Phaser.Game;

    constructor(game: Phaser.Game, player: Tank) {
        this._graphics = game.add.graphics(0, 0);
        // This should not be affected by camera.
        this._graphics.fixedToCamera = true;
        this._player = player;
        this._game = game;
    }

    public updateMap(show: boolean) {
        this._graphics.clear();
        if (show) {
            this._showMap = true;
            this._graphics.lineStyle(10, 0xE03F00, 0.5);
            this._graphics.drawRect(this._offsets.x, this._offsets.y, this._bounds.x, this._bounds.y);

            let spot = this.getPlayer();
            this._graphics.lineStyle(4, 0x00AF00, 0.8);
            this._graphics.drawRect(spot.x, spot.y, 4, 4);
        }
    }

    private getPlayer() : Phaser.Point {
        let x: number = (this._player.getBody()).position.x / GameWidth * this._bounds.x + this._offsets.x;
        let y: number = (this._player.getBody()).position.y / GameHeight * this._bounds.y + this._offsets.y;
        return new Phaser.Point(x, y);
    }    
}