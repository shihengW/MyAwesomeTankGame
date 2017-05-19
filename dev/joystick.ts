/// <reference path="../.ts_dependencies/phaser.d.ts" />
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