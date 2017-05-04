/// <reference path="../.ts_dependencies/phaser.d.ts" />
// TODO: Finish these logic when you have time.
var AdvancedInputManager = (function () {
    function AdvancedInputManager() {
    }
    AdvancedInputManager.addDirectionIntegral = function (tank, addDirection) {
        var newDirection = AdvancedInputManager.addDirection(tank.direction, addDirection);
        tank.setDirection(newDirection);
    };
    AdvancedInputManager.removeDirectionIntegral = function (tank, removeDirection) {
        var newDirection = AdvancedInputManager.removeDirection(tank.direction, removeDirection);
        tank.setDirection(newDirection);
    };
    AdvancedInputManager.addDirection = function (direction, addDirection) {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }
        var opsiteDirection = AdvancedInputManager.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }
        return direction | addDirection;
    };
    AdvancedInputManager.removeDirection = function (direction, removeDirection) {
        return direction & (~removeDirection);
    };
    AdvancedInputManager.getOpsiteDirection = function (direction) {
        switch (direction) {
            case Directions.Up: return Directions.Down;
            case Directions.Down: return Directions.Up;
            case Directions.Left: return Directions.Right;
            case Directions.Right: return Directions.Left;
        }
        return Directions.None;
    };
    AdvancedInputManager.directionToAngle = function (direction) {
        switch (direction) {
            case Directions.Up:
                return 0;
            case Directions.Down:
                return 180;
            case Directions.Left:
                return -90;
            case Directions.Right:
                return 90;
            case Directions.UpLeft:
                return -45;
            case Directions.DownLeft:
                return 225;
            case Directions.UpRight:
                return 45;
            case Directions.DownRight:
                return 135;
            default:
                return undefined;
        }
    };
    AdvancedInputManager.directionToSpeed = function (direction) {
        if (direction == Directions.None) {
            return { x: 0, y: 0 };
        }
        var angle = AdvancedInputManager.directionToAngle(direction);
        return AdvancedInputManager.angleToSpeed(angle);
    };
    AdvancedInputManager.angleToSpeed = function (angle) {
        if (angle == undefined) {
            return { x: 0, y: 0 };
        }
        var angleRad = Phaser.Math.degToRad(angle);
        return { x: Math.sin(angleRad) * tankSpeed, y: 0 - Math.cos(angleRad) * tankSpeed };
    };
    return AdvancedInputManager;
}());
/// ********************************************************** /// 
var Directions;
(function (Directions) {
    Directions[Directions["None"] = 0] = "None";
    Directions[Directions["Up"] = 2] = "Up";
    Directions[Directions["Down"] = 4] = "Down";
    Directions[Directions["Left"] = 8] = "Left";
    Directions[Directions["Right"] = 16] = "Right";
    Directions[Directions["UpLeft"] = 10] = "UpLeft";
    Directions[Directions["UpRight"] = 18] = "UpRight";
    Directions[Directions["DownLeft"] = 12] = "DownLeft";
    Directions[Directions["DownRight"] = 20] = "DownRight";
})(Directions || (Directions = {}));
/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
var SimpleGame = (function () {
    function SimpleGame() {
        this.nextUpdate = 0;
        this.game = new Phaser.Game(1200, 750, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
            // TODO: Check this http://phaser.io/docs/2.4.4/Phaser.State.html
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
        // Set-up physics.
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        // Set-up inputs.
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.W, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.A, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.S, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.D, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        // Add player, give it an id and put it at random location.
        var x = Math.floor(this.game.width * Math.random());
        var y = Math.floor(this.game.height * Math.random());
        var id = Math.ceil(Math.random() * 1000);
        this.player = new Tank(this.game, id, x, y);
        // Create socket, register events and tell the server
        this.socket = io();
        var self = this;
        // TODO: Refactor. I hate these code.
        this.socket.on(tankUpdateGlobalEventName, function (player) {
            // If player has no blood, remove it from the list.
            // TODO: At least you should merge the logic.
            if (player.blood <= 0) {
                // TODO: Refactor these ugly logic.
                var foundTank_1;
                self.enemies.forEach(function (item) {
                    if (player.tankId == item.id) {
                        foundTank_1 = item;
                    }
                });
                foundTank_1.setByJson(player);
                var index = self.enemies.indexOf(foundTank_1);
                if (index > -1) {
                    self.enemies.splice(index, 1);
                }
                // Should also try to destroy the sprite and text.
                return;
            }
            if (self.enemies == undefined) {
                self.enemies = [new Tank(self.game, player.tankId, player.x, player.y)];
            }
            else {
                var exist_1 = false;
                self.enemies.forEach(function (item) {
                    if (player.tankId == item.id) {
                        item.setByJson(player);
                        exist_1 = true;
                    }
                });
                if (!exist_1) {
                    self.enemies.push(new Tank(self.game, player.tankId, player.x, player.y));
                }
            }
        });
    };
    SimpleGame.prototype.update = function () {
        var _this = this;
        // First, update tank itself.
        var message = this.player.update(this.game.input.activePointer.isDown);
        this.socket.emit(tankUpdateEventName, message);
        // Then, check collision.
        if (this.enemies != undefined) {
            this.enemies.forEach(function (enemy) { return _this.player.checkCombatResult(enemy); });
        }
    };
    SimpleGame.prototype.onKeyDown = function (e) {
        var addDirection = SimpleGame.mapKeyToDirection(e.event.key);
        AdvancedInputManager.addDirectionIntegral(this.player, addDirection);
    };
    SimpleGame.prototype.onKeyUp = function (e) {
        var removeDirection = SimpleGame.mapKeyToDirection(e.event.key);
        AdvancedInputManager.removeDirectionIntegral(this.player, removeDirection);
    };
    SimpleGame.mapKeyToDirection = function (key) {
        var direction = Directions.None;
        switch (key) {
            case "w":
                direction = Directions.Up;
                break;
            case "a":
                direction = Directions.Left;
                break;
            case "s":
                direction = Directions.Down;
                break;
            case "d":
                direction = Directions.Right;
                break;
        }
        return direction;
    };
    SimpleGame.registerKeyInputs = function (self, key, keydownHandler, keyupHandler) {
        var realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null)
            realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null)
            realKey.onUp.add(keyupHandler, self);
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
var tankUpdateEventName = "tankUpdate";
var tankUpdateGlobalEventName = "tankUpdateGlobal";
// Parameters  
var playerSpeed = 100;
var fireRate = 300;
var bulletSpeed = 700;
var accuracy = 0;
var bloodTextOffset = 60;
var damage = 20;
var tankSpeed = 300;
// TODO: Should use group when figure out how
var Tank = (function () {
    function Tank(game, id, x, y) {
        this.gameOver = false;
        this.direction = Directions.None;
        // #endregion Move system
        // #region: Fire system
        this.nextFire = 0;
        this.ownerGame = game;
        this.id = id;
        this.blood = 100;
        // Seperate tank body and gun tower.           
        this.tankbody = game.add.sprite(x, y, tankbodyName);
        this.guntower = game.add.sprite(x, y, guntowerName);
        var style = { font: "20px Arial", fill: "#00A000", align: "center" };
        this.bloodText = game.add.text(x, y - bloodTextOffset, (this.blood), style);
        this.tankbody.anchor.set(0.5, 0.5);
        this.guntower.anchor.set(0.5, 0.5);
        this.bloodText.anchor.set(0.5, 0.5);
        // Setup physics
        game.physics.arcade.enable(this.tankbody);
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.set(0.1, 0.1);
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
    Tank.prototype.update = function (shouldFire) {
        // If game over, do nothing.
        if (this.gameOver) {
            return this.getJson(false);
        }
        if (this.blood <= 0) {
            this.gameOver = true;
            Tank.tankExplode(this);
            return this.getJson(false);
        }
        var fire = false;
        this.setPosition();
        if (shouldFire) {
            fire = this.fire();
        }
        return this.getJson(fire);
    };
    // #regions Move system
    Tank.prototype.setDirection = function (d) {
        if (this.gameOver) {
            return;
        }
        this.direction = d;
        var newAngle = AdvancedInputManager.directionToAngle(d);
        var newSpeed = AdvancedInputManager.directionToSpeed(d);
        if (newAngle != undefined) {
            this.tankbody.angle = newAngle;
        }
        this.tankbody.body.velocity.x = newSpeed.x;
        this.tankbody.body.velocity.y = newSpeed.y;
    };
    Tank.prototype.setPosition = function () {
        // First, move gun tower to point to mouse.
        var angle = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, this.tankbody.body.position);
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;
        // Second, move the tank.
        // this.tankbody.body.velocity.set(0, 0);
        // switch (this.direction) {
        //     case Directions.None: break;
        //     case Directions.Up: this.tankbody.position.add(0, -1 * tankSpeed); break;
        //     case Directions.Down: this.tankbody.position.add(0, tankSpeed); break;
        //     case Directions.Left: this.tankbody.position.add(-1 * tankSpeed, 0); break;
        //     case Directions.Right: this.tankbody.position.add(tankSpeed, 0); break;
        //     default: break;
        // }
        // Finally, force to coordinate the guntower, tankbody and blood text
        this.guntower.position = this.tankbody.position;
        this.bloodText.position = new Phaser.Point(this.tankbody.position.x, this.tankbody.position.y + bloodTextOffset);
        this.bloodText.text = this.blood;
    };
    Tank.prototype.shouldFire = function (forceFiring) {
        if (forceFiring === void 0) { forceFiring = false; }
        var shouldFire = false;
        if (forceFiring || (this.ownerGame.time.now > this.nextFire && this.bullets.countDead() > 0)) {
            shouldFire = true;
            // Set the cooldown time.
            this.nextFire = this.ownerGame.time.now + fireRate;
        }
        return shouldFire;
    };
    Tank.prototype.calculateTrajectory = function () {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        var randomAngleOffset = (Math.random() - 0.5) * accuracy;
        var theta = Phaser.Math.degToRad(this.guntower.angle) + randomAngleOffset;
        // Set-up constants.
        var halfLength = this.guntower.height / 2;
        var sinTheta = Math.sin(theta);
        var reverseCosTheta = -1 * Math.cos(theta);
        var tankPosition = this.tankbody.body.center;
        // Bullet start position and move to position.
        var startX = sinTheta * halfLength + tankPosition.x;
        var startY = reverseCosTheta * halfLength + tankPosition.y;
        var moveToX = startX + sinTheta * Number.MAX_VALUE;
        var moveToY = startY + reverseCosTheta * Number.MAX_VALUE;
        return { theta: theta, sinTheta: sinTheta, reverseCosTheta: reverseCosTheta,
            startX: startX, startY: startY, moveToX: moveToX, moveToY: moveToY };
    };
    Tank.prototype.fireCore = function (startX, startY, moveToX, moveToY) {
        // Get bullet.
        var bullet = this.bullets.getFirstDead();
        bullet.angle = this.guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this.ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, bulletSpeed);
    };
    Tank.prototype.fire = function (forceFiring) {
        if (forceFiring === void 0) { forceFiring = false; }
        if (!this.shouldFire(forceFiring)) {
            return false;
        }
        // Calculate the trajectory.
        var trajectory = this.calculateTrajectory();
        // Fire.
        this.fireCore(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        // Just move the guntower a little bit to simulate the Newton's second law.
        var Newton = true;
        if (Newton) {
            var xguntowerOffset = -1 * trajectory.sinTheta * 5;
            var yguntowerOffset = -1 * trajectory.reverseCosTheta * 5;
            this.ownerGame.add.tween(this.guntower).to({ x: this.tankbody.position.x + xguntowerOffset, y: this.tankbody.position.y + yguntowerOffset }, 30, Phaser.Easing.Linear.None, true, 0, 0, true);
        }
        return true;
    };
    // #endregion: Fire system
    // #region: Comms
    Tank.prototype.getJson = function (firing) {
        // If already died, just return an useless message.
        if (this.gameOver) {
            return {
                tankId: this.id,
                x: -1,
                y: -1,
                gunAngle: 0,
                tankAngle: 0,
                firing: false,
                blood: 0
            };
        }
        return {
            tankId: this.id,
            x: this.tankbody.position.x,
            y: this.tankbody.position.y,
            gunAngle: this.guntower.angle,
            tankAngle: this.tankbody.angle,
            firing: firing,
            blood: this.blood
        };
    };
    Tank.prototype.setByJson = function (params) {
        this.tankUpdateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    };
    Tank.prototype.tankUpdateAsPuppet = function (gunAngle, tankAngle, position, firing, blood) {
        // if already gameover, do nothing.
        if (this.gameOver) {
            return;
        }
        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
            this.gameOver = true;
            Tank.tankExplode(this);
            return;
        }
        this.guntower.angle = gunAngle;
        this.tankbody.angle = tankAngle;
        this.tankbody.body.velocity.x = 0;
        this.tankbody.body.velocity.y = 0;
        this.tankbody.position = position;
        this.guntower.position = position;
        this.bloodText.position = new Phaser.Point(position.x, position.y + bloodTextOffset);
        this.blood = blood;
        this.bloodText.text = blood;
        if (this.blood <= 0) {
            var self_1 = this;
            Tank.tankExplode(self_1);
        }
        if (firing) {
            this.fire(firing);
        }
    };
    // #endregion: Comms
    // #region: Physics and effects
    Tank.prototype.checkCombatResult = function (another) {
        var _this = this;
        var self = this;
        // this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive(function (item) {
            self.ownerGame.physics.arcade.collide(item, another.tankbody, function (bullet, another) { return Tank.bulletHit(bullet, another, self.ownerGame); });
        }, this);
        another.bullets.forEachAlive(function (item) {
            self.ownerGame.physics.arcade.collide(item, self.tankbody, function (bullet, another) {
                Tank.bulletHit(bullet, another, self.ownerGame);
                _this.blood -= damage;
            });
        }, this);
    };
    Tank.tankExplode = function (self) {
        // Emit and destroy everything.
        var emitter = self.ownerGame.add.emitter(self.tankbody.position.x, self.tankbody.position.y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(500, 50);
        self.tankbody.destroy();
        self.guntower.destroy();
        self.bloodText.destroy();
        self.bullets.destroy();
    };
    Tank.bulletHit = function (bullet, another, game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        var emitter = game.add.emitter((bullet.x + another.body.x) / 2, (bullet.y + another.body.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    };
    return Tank;
}());
/// ********************************************************** /// 
