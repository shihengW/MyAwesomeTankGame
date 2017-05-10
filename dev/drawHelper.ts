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
                this._graphicsOuter.beginFill(0xFF3300, 0.3);
                this._graphicsOuter.lineStyle(1, 0xFF3300, 0.3);
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
        this._graphicsEnemy.lineStyle(4, 0x00AF00, 0.8);
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
        return this.getPositionCore((this._player.getBody()).position.x, (this._player.getBody()).position.y);
    }
}

class Joystick {

    private _game: Phaser.Game;
    private _r: number = 200;
    private _center: Phaser.Point;
    private _graphics: Phaser.Graphics;
    private _offset: number = 0;
    private _radMin: number = Math.PI * 0.25;

    constructor(game: Phaser.Game) {
        this._game = game;
        this._graphics = game.add.graphics(0, 0);
        this._graphics.fixedToCamera = true;
        this._center = new Phaser.Point(this._r + this._offset, this._game.camera.height - this._r - this._offset);
    }

    public drawJoystick() {
        this._graphics.lineStyle(20, 0x00AF00, 0.8);
        this._graphics.drawCircle(this._center.x, this._center.y, this._r);
    }

    public checkPointer() : { fire: boolean, drive: boolean, direction: Directions } {
        let fire = false;
        let drive = false;
        let direction = Directions.None;

        if (this._game.input.pointer1.isDown) {
            let d = this.getDirection(this._game.input.pointer1.position);
            if (d == undefined) {
                fire = true;
            }
            else {
                drive = true;
                direction = d;
            }
        }

        if (this._game.input.pointer2.isDown) {
            let d = this.getDirection(this._game.input.pointer2.position);
            if (d == undefined) {
                fire = true;
            }
            else {
                drive = true;
                direction = d;
            }
        }

        return { fire: fire, drive: drive, direction: direction };
    }

    private getDirection(point: Phaser.Point) : Directions {
        if (Phaser.Math.distance(point.x, point.y, this._center.x, this._center.y) > (this._r + this._offset)) {
            return undefined;
        }
        let rad = Phaser.Math.angleBetweenPoints(this._center, point);
        if (rad > -0.5 * this._radMin && rad < 0.5 * this._radMin) {
            return Directions.Right;
        }
        if (rad > 0.5 * this._radMin && rad < this._radMin) {
            return Directions.DownRight;
        }
        if (rad > this._radMin && rad < 1.5 * this._radMin) {
            return Directions.Down;
        }
        if (rad > 1.5 * this._radMin && rad < 2 * this._radMin) {
            return Directions.DownLeft;
        }
        if (rad > 2 * this._radMin || rad < -2 * this._radMin) {
            return Directions.Left;
        }
        if (rad < -0.5 * this._radMin && rad > -1 * this._radMin) {
            return Directions.UpRight;
        }
        if (rad < -1 * this._radMin && rad > -1.5 * this._radMin) {
            return Directions.Up;
        }
        if (rad < -1.5 * this._radMin && rad > -2 * this._radMin) {
            return Directions.UpLeft;
        }
        return Directions.None;
    }
}