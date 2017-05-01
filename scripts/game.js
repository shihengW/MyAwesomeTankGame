/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
var Directions;
(function (Directions) {
    Directions[Directions["Up"] = 0] = "Up";
    Directions[Directions["Down"] = 1] = "Down";
    Directions[Directions["Left"] = 2] = "Left";
    Directions[Directions["Right"] = 3] = "Right";
    Directions[Directions["None"] = 4] = "None";
})(Directions || (Directions = {}));
var SimpleGame = (function () {
    function SimpleGame() {
        this.id = Math.random() * 10000;
        this.game = new Phaser.Game(1200, 750, Phaser.AUTO, 'content', {
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
        // Inputs.
        SimpleGame.registerKey(this, Phaser.Keyboard.W, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.A, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.S, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.D, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        // Add yourself.
        // Create the tank, give it a random location an let the server know.
        var x = Math.floor(this.game.width * Math.random());
        var y = Math.floor(this.game.height * Math.random());
        this.tank = new Tank(this.game, this.id, x, y);
        // Create socket and tell the server
        this.socket = io();
        var self = this;
        // First register everything I need.
        this.socket.on("tankUpdateGlobal", function (player) {
            var exist = false;
            if (self.enemies == undefined) {
                self.enemies = [new Tank(self.game, player.id, player.x, player.y)];
            }
            self.enemies.forEach(function (item) {
                if (player.id == item.id) {
                    item.setByJson(player);
                    exist = true;
                }
            });
            if (!exist) {
                self.enemies.push(new Tank(self.game, player.id, player.x, player.y));
            }
        });
        // Add a sandbag for testing.
        // this.sandbag = SimpleGame.createSandbagAndMakeItMove(this.game);
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
        var _this = this;
        // First, update tank itself.
        this.tank.tankUpdate();
        // Then, fire if it should.
        var firing = false;
        if (this.game.input.activePointer.isDown) {
            firing = this.tank.tankFire();
        }
        // Third, let others know your decision.
        this.socket.emit("tankUpdate", this.tank.getJson(firing));
        // Finally, check collision.
        if (this.enemies != undefined) {
            this.enemies.forEach(function (enemy) { return _this.tank.checkCollide(enemy); });
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
/// *** Game main class *** ///
window.onload = function () {
    var game = new SimpleGame();
};
/// ****** names and parameters. ****** ///
// Names
var sandbagName = "sandbag";
var tankbodyName = "tankbody";
var guntowerName = "guntower";
var bulletName = "bullet";
var particleName = "particle";
// Comm names
// just a notify.
var jointGameEventName = "tankUpdate";
// Parameters  
var playerSpeed = 100;
var fireRate = 300;
/// <reference path="../.ts_dependencies/phaser.d.ts" />
// Don't touch anything else, just refactor this class first.
var AdvancedPhysicsManager = (function () {
    function AdvancedPhysicsManager() {
    }
    // Just suppose this is right, we will test it anyway.
    AdvancedPhysicsManager.addDirection = function (sprite, direction) {
        var normalizedAngle = Phaser.Math.normalizeAngle(sprite.angle, false);
        switch (direction) {
            case Directions.Up:
                if (this.hasUpPortion(normalizedAngle)) {
                    return;
                }
                if (this.hasDownPortion(normalizedAngle)) {
                    sprite.angle = sprite.angle + 180;
                    sprite.body.velocity.y = -1 * sprite.body.velocity.y;
                }
                else {
                    sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? 45 : -1 * 45);
                    sprite.body.velocity.y = -1 * playerSpeed;
                }
                break;
            case Directions.Down:
                if (this.hasDownPortion(normalizedAngle)) {
                    return;
                }
                if (this.hasUpPortion(normalizedAngle)) {
                    sprite.angle = sprite.angle + 180;
                    sprite.body.velocity.y = -1 * sprite.body.velocity.y;
                }
                else {
                    sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? -1 * 45 : 45);
                    sprite.body.velocity.y = playerSpeed;
                }
                break;
            case Directions.Left:
                if (this.hasLeftPortion(normalizedAngle)) {
                    return;
                }
                if (this.hasRightPortion(normalizedAngle)) {
                    sprite.angle = sprite.angle + 180;
                    sprite.body.velocity.x = -1 * sprite.body.velocity.x;
                }
                else {
                    sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? -1 * 45 : 45);
                    sprite.body.velocity.x = playerSpeed;
                }
                break;
            case Directions.Right:
                if (this.hasRightPortion(normalizedAngle)) {
                    return;
                }
                if (this.hasLeftPortion(normalizedAngle)) {
                    sprite.angle = sprite.angle + 180;
                    sprite.body.velocity.x = -1 * sprite.body.velocity.x;
                }
                else {
                    sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? 45 : -1 * 45);
                    sprite.body.velocity.x = playerSpeed;
                }
                break;
            case Directions.None:
                break;
            default:
                break;
        }
    };
    AdvancedPhysicsManager.removeDirection = function (sprite, direction) {
    };
    AdvancedPhysicsManager.directionToAngle = function (direction) {
        switch (direction) {
            case Directions.Up:
                return 0;
            case Directions.Down:
                return 180;
            case Directions.Left:
                return -90;
            case Directions.Right:
                return 90;
            default:
                return -1;
        }
    };
    AdvancedPhysicsManager.hasUpPortion = function (angle) {
        return angle < 90 || angle > 270;
    };
    AdvancedPhysicsManager.hasDownPortion = function (angle) {
        return angle > 90 && angle < 270;
    };
    AdvancedPhysicsManager.hasLeftPortion = function (angle) {
        return angle > 180 && angle < 360;
    };
    AdvancedPhysicsManager.hasRightPortion = function (angle) {
        return angle > 0 && angle < 180;
    };
    return AdvancedPhysicsManager;
}());
/// ********************************************************** /// 
// TODO: Should use group when figure out how
/// *** tank class *** ///
var Tank = (function () {
    function Tank(game, id, x, y) {
        this.tankSpeed = 3;
        this.direction = Directions.None;
        this.nextFire = 0;
        this.ownerGame = game;
        this.id = id;
        // Seperate tank body and gun tower.           
        this.tankbody = game.add.sprite(x, y, tankbodyName);
        this.guntower = game.add.sprite(x, y, guntowerName);
        this.tankbody.anchor.set(0.5, 0.5);
        this.guntower.anchor.set(0.5, 0.5);
        // Setup physics
        game.physics.arcade.enable(this.tankbody);
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.y = 1;
        this.tankbody.body.bounce.x = 1;
        this.tankbody.body.mass = 100000;
        // Create bullets.
        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, bulletName);
        this.bullets.setAll("checkWorldBounds", true);
        this.bullets.setAll("outOfBoundsKill", true);
        this.bullets.forEachAlive(function (item) {
            item.body.mass = 0.1;
        }, this);
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
    Tank.prototype.tankUpdateAsPuppet = function (gunAngle, tankAngle, position, firing) {
        this.guntower.angle = gunAngle;
        this.tankbody.angle = tankAngle;
        this.tankbody.body.velocity.x = 0;
        this.tankbody.body.velocity.y = 0;
        this.tankbody.position = position;
        this.guntower.position = position;
        if (firing) {
            this.tankFire(firing);
        }
    };
    Tank.prototype.tankUpdate = function () {
        // First, move gun tower to point to mouse.
        var angle = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, this.tankbody.body.position);
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;
        // Second, move the tank.
        // TODO: Find a better way to move the tank.
        if (this.direction === Directions.None) {
            this.tankbody.body.velocity.x = 0;
            this.tankbody.body.velocity.y = 0;
        }
        switch (this.direction) {
            case Directions.None: break;
            case Directions.Up:
                this.tankbody.position.add(0, -1 * this.tankSpeed);
                break;
            case Directions.Down:
                this.tankbody.position.add(0, this.tankSpeed);
                break;
            case Directions.Left:
                this.tankbody.position.add(-1 * this.tankSpeed, 0);
                break;
            case Directions.Right:
                this.tankbody.position.add(this.tankSpeed, 0);
                break;
            default: break;
        }
        // Finally, force to coordinate the guntower and tankbody.
        // TODO: Find a smarter way to do this.
        this.guntower.position = this.tankbody.position;
    };
    Tank.prototype.tankFire = function (forceFiring) {
        if (forceFiring === void 0) { forceFiring = false; }
        if (!forceFiring
            && (this.ownerGame.time.now < this.nextFire || this.bullets.countDead() <= 0)) {
            return false;
        }
        // Set the cooldown time.
        this.nextFire = this.ownerGame.time.now + fireRate;
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
        return true;
    };
    Tank.prototype.checkCollide = function (another) {
        var self = this;
        // this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive(function (item) {
            self.ownerGame.physics.arcade.collide(item, another.tankbody, function (bullet, another) { return Tank.BulletHit(bullet, another, self.ownerGame); });
        }, this);
        another.bullets.forEachAlive(function (item) {
            self.ownerGame.physics.arcade.collide(item, self.tankbody, function (bullet, another) { return Tank.BulletHit(bullet, another, self.ownerGame); });
        }, this);
    };
    Tank.BulletHit = function (bullet, another, game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        var emitter = game.add.emitter((bullet.x + another.body.x) / 2, (bullet.y + another.body.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    };
    Tank.prototype.getJson = function (firing) {
        return {
            id: this.id,
            x: this.tankbody.position.x,
            y: this.tankbody.position.y,
            gunAngle: this.guntower.angle,
            tankAngle: this.tankbody.angle,
            firing: firing
        };
    };
    Tank.prototype.setByJson = function (params) {
        this.tankUpdateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing);
    };
    return Tank;
}());
/// ********************************************************** /// 
