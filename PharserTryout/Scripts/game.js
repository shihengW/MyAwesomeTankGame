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
var sandbagName = "sandbag";
var tankbodyName = "tankbody";
var guntowerName = "guntower";
var bulletName = "bullet";
var particleName = "particle";
var SimpleGame = (function () {
    function SimpleGame() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
        });
    }
    SimpleGame.prototype.preload = function () {
        this.game.load.image(sandbagName, "../resources/tank.png");
        this.game.load.image(bulletName, "../resources/bullet.png");
        this.game.load.image(particleName, "../resources/particle.png");
        this.game.load.image(tankbodyName, "../resources/tankbody.png");
        this.game.load.image(guntowerName, "../resources/guntower.png");
        this.game.stage.disableVisibilityChange = true;
    };
    SimpleGame.prototype.create = function () {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.tank = new Tank(this.game);
        // Add enemy.
        this.sandbag = SimpleGame.createSandbagAndMakeItMove(this.game);
        // Inputs.
        SimpleGame.registerKey(this, Phaser.Keyboard.W, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.A, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.S, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.D, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
    };
    SimpleGame.createSandbagAndMakeItMove = function (game) {
        var sandbag = game.add.sprite(game.width, game.height / 2 - 50, sandbagName);
        // Setup
        game.physics.arcade.enable(sandbag);
        sandbag.body.collideWorldBounds = true;
        sandbag.body.bounce.x = 1;
        sandbag.body.bounce.y = 1;
        sandbag.body.mass = 100;
        sandbag.anchor.set(0.5, 0.5);
        // Make it run.
        // TODO: Should find a way to make it run randomly.
        game.physics.arcade.accelerateToXY(sandbag, game.width / 2, game.height / 2 - 50, 100);
        return sandbag;
    };
    // Don't know how to make this more acurate, actually, this is not a SimpleGame.
    SimpleGame.registerKey = function (self, key, keydownHandler, keyupHandler) {
        var realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null)
            realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null)
            realKey.onUp.add(keyupHandler, self);
        // I don't think the output is going to be used.
        return realKey;
    };
    SimpleGame.prototype.update = function () {
        // First, update tank itself.
        this.tank.tankUpdate();
        // Second, update the relationship between tank and sandbag.
        this.tank.checkCollide(this.sandbag);
        // Finally, fire if it should.
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
var Tank = (function () {
    function Tank(game) {
        this.tankSpeed = 3;
        this.direction = Directions.None;
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
        // NOT Only enable the physics for tankbody.
        // this.ownerGame.physics.arcade.enable(this.tankbody);
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.y = 1;
        this.tankbody.body.bounce.x = 1;
        this.tankbody.body.mass = 70;
        // Create bullets.
        this.bullets = game.add.group();
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
        // First, move gun tower to point to mouse.
        var angle = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, this.tankbody.body.position);
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;
        // Second, move the tank.
        if (this.direction === Directions.None) {
            this.tankbody.body.velocity.x = 0;
            this.tankbody.body.velocity.y = 0;
        }
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
        // Finally, force to coordinate the guntower and tankbody.
        // TODO: Find a smarter way to do this.
        this.guntower.position = this.tankbody.position;
    };
    Tank.prototype.tankFire = function () {
        if (this.ownerGame.time.now < this.nextFire || this.bullets.countDead() <= 0) {
            return;
        }
        // Set the cooldown time.
        this.nextFire = this.ownerGame.time.now + this.fireRate;
        // Get a random offset.
        var randomAngleOffset = (Math.random() - 0.5) * 0;
        var theta = Phaser.Math.degToRad(this.guntower.angle) + randomAngleOffset;
        // Bullet start position offset.
        var halfLength = this.guntower.height / 2;
        var xOffset = Math.sin(theta) * halfLength;
        var yOffset = -1 * Math.cos(theta) * halfLength;
        // Get bullet.
        var bullet = this.bullets.getFirstDead();
        bullet.anchor.set(0.5, 0.5);
        bullet.angle = this.guntower.angle;
        // Get the position of the tank.
        var guntowerPosition = this.tankbody.body.center;
        bullet.reset(guntowerPosition.x + xOffset, guntowerPosition.y + yOffset);
        var longway = 10000;
        xOffset = Math.sin(theta) * longway;
        yOffset = -1 * Math.cos(theta) * longway;
        this.ownerGame.physics.arcade.moveToXY(bullet, guntowerPosition.x + xOffset, guntowerPosition.y + yOffset, 1000);
    };
    Tank.prototype.checkCollide = function (another) {
        var self = this;
        this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive(function (item) {
            self.ownerGame.physics.arcade.collide(item, another, function (bullet, another) { return Tank.BulletHit(bullet, another, self.ownerGame); });
        }, this);
    };
    Tank.BulletHit = function (bullet, another, game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        var emitter = game.add.emitter((bullet.x + another.x) / 2, (bullet.y + another.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    };
    return Tank;
}());
