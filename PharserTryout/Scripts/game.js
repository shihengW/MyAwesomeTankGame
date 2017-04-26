// Road map:
// [Check] 1. Collision, physics and move
//   1.1. Sand bag
//   1.2. X direction
// 2. Animation and realistic movement
//   2.1. Sprite sheet.
//   2.2. Accelerate when key down, and slow down when key up.
// [Working] 3. Gun towner controlled by mouse
// ----------------
// 4. Multi-users
var tankbodyName = "tankbody";
var guntowerName = "guntower";
var bulletName = "bullet";
var particleName = "particle";
var SimpleGame = (function () {
    function SimpleGame() {
        this.counter = 0;
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, "content", {
            create: this.create, preload: this.preload, update: this.update
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.image(tankbodyName, "../Resources/tankbody.png");
        this.game.load.image(guntowerName, "../Resources/guntower.png");
        this.game.load.image(bulletName, "../Resources/bullet.png");
        this.game.stage.disableVisibilityChange = true;
    };
    SimpleGame.prototype.create = function () {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.tank = new Tank(this.game);
        // Inputs.
        var W = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        var A = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        var S = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        var D = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        // Keydown
        W.onDown.add(SimpleGame.prototype.moveTank, this);
        A.onDown.add(SimpleGame.prototype.moveTank, this);
        S.onDown.add(SimpleGame.prototype.moveTank, this);
        D.onDown.add(SimpleGame.prototype.moveTank, this);
        // Keyup
        W.onUp.add(SimpleGame.prototype.stopTank, this);
        A.onUp.add(SimpleGame.prototype.stopTank, this);
        S.onUp.add(SimpleGame.prototype.stopTank, this);
        D.onUp.add(SimpleGame.prototype.stopTank, this);
    };
    SimpleGame.prototype.update = function () {
        this.tank.tankUpdate();
        if (this.game.input.activePointer.isDown) {
            this.tank.tankFire();
            return;
        }
    };
    SimpleGame.prototype.stopTank = function (e) {
        var shouldStop = false;
        switch (e.event.key) {
            case "w":
                shouldStop = this.tank.getDirection() === Directions.Up;
                break;
            case "a":
                shouldStop = this.tank.getDirection() === Directions.Left;
                break;
            case "s":
                shouldStop = this.tank.getDirection() === Directions.Down;
                break;
            case "d":
                shouldStop = this.tank.getDirection() === Directions.Right;
                break;
        }
        if (shouldStop) {
            this.tank.tankEndMove();
        }
    };
    SimpleGame.prototype.moveTank = function (e) {
        switch (e.event.key) {
            case "w":
                this.tank.tankStartMove(Directions.Up);
                return;
            case "a":
                this.tank.tankStartMove(Directions.Left);
                return;
            case "s":
                this.tank.tankStartMove(Directions.Down);
                return;
            case "d":
                this.tank.tankStartMove(Directions.Right);
                return;
        }
    };
    return SimpleGame;
}());
window.onload = function () {
    var game = new SimpleGame();
};
var Directions;
(function (Directions) {
    Directions[Directions["Up"] = 0] = "Up";
    Directions[Directions["Down"] = 1] = "Down";
    Directions[Directions["Left"] = 2] = "Left";
    Directions[Directions["Right"] = 3] = "Right";
    Directions[Directions["None"] = 4] = "None";
})(Directions || (Directions = {}));
var Tank = (function () {
    function Tank(game) {
        this.tankSpeed = 3;
        this.nextFire = 0;
        this.fireRate = 200;
        this.ownerGame = game;
        // Creat tank.
        this.tank = game.add.group(game, "tank", true, true, Phaser.Physics.ARCADE);
        this.tank.position.set(game.width / 2, game.height / 2);
        // Seperate tank body and gun tower.
        this.tankbody = this.tank.create(0, 0, tankbodyName);
        this.guntower = this.tank.create(0, 0, guntowerName);
        this.tank.setAll("anchor", new Phaser.Point(0.5, 0.5));
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.y = 1;
        this.tankbody.body.bounce.x = 1;
        // Create bullets.
        this.bullets = game.add.group();
        // game.physics.enable(this.bullets, Phaser.Physics.ARCADE);
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, bulletName);
        this.bullets.setAll("checkWorldBounds", true);
        this.bullets.setAll("outOfBoundsKill", true);
    }
    Tank.prototype.tankStartMove = function (d) {
        this.direction = d;
        switch (d) {
            case Directions.Up:
                this.tankbody.angle = 0;
                return;
            case Directions.Left:
                this.tankbody.angle = -90;
                return;
            case Directions.Down:
                this.tankbody.angle = 180;
                return;
            case Directions.Right:
                this.tankbody.angle = 90;
                return;
        }
    };
    Tank.prototype.getDirection = function () {
        return this.direction;
    };
    Tank.prototype.tankEndMove = function () {
        this.direction = Directions.None;
    };
    Tank.prototype.tankUpdate = function () {
        // First, move gun tower to point to pointer.
        var angle = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, new Phaser.Point(this.tank.x, this.tank.y));
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;
        // Second, move the tank.
        switch (this.direction) {
            case Directions.None:
                return;
            case Directions.Up:
                this.tank.position.add(0, -1 * this.tankSpeed);
                return;
            case Directions.Down:
                this.tank.position.add(0, this.tankSpeed);
                return;
            case Directions.Left:
                this.tank.position.add(-1 * this.tankSpeed, 0);
                return;
            case Directions.Right:
                this.tank.position.add(this.tankSpeed, 0);
                return;
            default:
        }
    };
    Tank.prototype.tankFire = function () {
        if (this.ownerGame.time.now < this.nextFire || this.bullets.countDead() <= 0) {
            return;
        }
        this.nextFire = this.ownerGame.time.now + this.fireRate;
        // Get a random offset.
        var randomAngleOffset = (Math.random() - 0.5) * 0.4;
        var theta = this.guntower.angle / 360 * 6.283 + randomAngleOffset;
        // Bullet start position offset.
        var halfLength = this.guntower.height / 2;
        var xOffset = Math.sin(theta) * halfLength;
        var yOffset = -1 * Math.cos(theta) * halfLength;
        // Get bullet.
        var bullet = this.bullets.getFirstDead();
        bullet.anchor.set(0.5, 0.5);
        bullet.angle = this.guntower.angle;
        bullet.reset(this.tank.x + xOffset, this.tank.y + yOffset);
        var longway = 10000;
        xOffset = Math.sin(theta) * longway;
        yOffset = -1 * Math.cos(theta) * longway;
        this.ownerGame.physics.arcade.moveToXY(bullet, this.tank.x + xOffset, this.tank.y + yOffset, 1000);
    };
    return Tank;
}());
//# sourceMappingURL=game.js.map