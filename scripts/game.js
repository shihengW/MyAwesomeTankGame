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
        for (var _i = 0, _a = [Phaser.Keyboard.W, Phaser.Keyboard.A, Phaser.Keyboard.S, Phaser.Keyboard.D]; _i < _a.length; _i++) {
            var key = _a[_i];
            SimpleGame.registerKeyInputs(this, key, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        }
        // Add player, give it an id and put it at random location. TODO: Let's pray there won't be equal Id.
        var x = Math.floor(this.game.width * Math.random());
        var y = Math.floor(this.game.height * Math.random());
        var id = Math.ceil(Math.random() * 1000);
        this._player = new Tank(this.game, id, x, y);
        // Create socket, register events and tell the server
        this._socket = io();
        var self = this;
        // TODO: Refactor. I hate these code.
        this._socket.on(tankUpdateGlobalEventName, function (player) {
            self.updateEnemyByJson(player);
            // If player has no blood, remove it from the list.
            if (player.blood <= 0) {
                self.removeEnemyByJson(player);
            }
        });
    };
    SimpleGame.prototype.update = function () {
        var _this = this;
        // First, update tank itself.
        var message = this._player.update(this.game.input.activePointer.isDown);
        this._socket.emit(tankUpdateEventName, message);
        // Then, check collision.
        if (this._enemies != undefined) {
            this._enemies.forEach(function (enemy) { return _this._player.combat(enemy); });
        }
    };
    SimpleGame.prototype.onKeyDown = function (e) {
        var addDirection = SimpleGame.mapKeyToDirection(e.event.key);
        MovementHelper.addDirectionIntegral(this._player, addDirection);
    };
    SimpleGame.prototype.onKeyUp = function (e) {
        var removeDirection = SimpleGame.mapKeyToDirection(e.event.key);
        MovementHelper.removeDirectionIntegral(this._player, removeDirection);
    };
    SimpleGame.prototype.removeEnemyByJson = function (enemy) {
        // TODO: Refactor these ugly logic.
        var foundTank = undefined;
        this._enemies.forEach(function (item) {
            if (enemy.tankId == item.id) {
                foundTank = item;
            }
        });
        var index = this._enemies.indexOf(foundTank);
        if (index > -1) {
            this._enemies.splice(index, 1);
        }
        return foundTank;
    };
    SimpleGame.prototype.updateEnemyByJson = function (enemy) {
        if (this._enemies == undefined) {
            this._enemies = [new Tank(this.game, enemy.tankId, enemy.x, enemy.y)];
        }
        else {
            var exist_1 = false;
            this._enemies.forEach(function (item) {
                if (enemy.tankId == item.id) {
                    item.updateByJson(enemy);
                    exist_1 = true;
                }
            });
            if (!exist_1) {
                this._enemies.push(new Tank(this.game, enemy.tankId, enemy.x, enemy.y));
            }
        }
    };
    // #region: statics.
    SimpleGame.registerKeyInputs = function (self, key, keydownHandler, keyupHandler) {
        var realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null)
            realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null)
            realKey.onUp.add(keyupHandler, self);
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
/// <reference path="../.ts_dependencies/phaser.d.ts" />
// TODO: Finish these logic when you have time.
var MovementHelper = (function () {
    function MovementHelper() {
    }
    MovementHelper.addDirectionIntegral = function (tank, addDirection) {
        var newDirection = MovementHelper.addDirection(tank.direction, addDirection);
        tank.drive(newDirection);
    };
    MovementHelper.removeDirectionIntegral = function (tank, removeDirection) {
        var newDirection = MovementHelper.removeDirection(tank.direction, removeDirection);
        tank.drive(newDirection);
    };
    MovementHelper.addDirection = function (direction, addDirection) {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }
        var opsiteDirection = MovementHelper.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }
        return direction | addDirection;
    };
    MovementHelper.removeDirection = function (direction, removeDirection) {
        return direction & (~removeDirection);
    };
    MovementHelper.getOpsiteDirection = function (direction) {
        switch (direction) {
            case Directions.Up: return Directions.Down;
            case Directions.Down: return Directions.Up;
            case Directions.Left: return Directions.Right;
            case Directions.Right: return Directions.Left;
        }
        return Directions.None;
    };
    MovementHelper.directionToAngle = function (direction) {
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
    MovementHelper.directionToSpeed = function (direction) {
        if (direction == Directions.None) {
            return { x: 0, y: 0 };
        }
        var angle = MovementHelper.directionToAngle(direction);
        return MovementHelper.angleToSpeed(angle);
    };
    MovementHelper.angleToSpeed = function (angle) {
        if (angle == undefined) {
            return { x: 0, y: 0 };
        }
        var angleRad = Phaser.Math.degToRad(angle);
        return { x: Math.sin(angleRad) * tankSpeed, y: 0 - Math.cos(angleRad) * tankSpeed };
    };
    return MovementHelper;
}());
/// ********************************************************** /// 
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
var bloodTextOffset = 60;
var damage = 20;
var tankSpeed = 300;
var angleOffsetBase = 0.1 * Math.PI; // degree.
// TODO: Should use group when figure out how
var Tank = (function () {
    function Tank(game, id, x, y) {
        this._gameOver = false;
        this.direction = Directions.None;
        this.nextFireTime = 0;
        this._ownerGame = game;
        this.id = id;
        this._blood = 100;
        // Seperate tank body and gun tower.           
        this._tankbody = game.add.sprite(x, y, tankbodyName);
        this._guntower = game.add.sprite(x, y, guntowerName);
        var style = { font: "20px Arial", fill: "#00A000", align: "center" };
        this._bloodText = game.add.text(x, y - bloodTextOffset, (this._blood), style);
        this._tankbody.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);
        // Setup physics
        game.physics.arcade.enable(this._tankbody);
        this._tankbody.body.collideWorldBounds = true;
        this._tankbody.body.bounce.set(0.1, 0.1);
        this._tankbody.body.mass = 100000;
        // Create bullets.
        this._bullets = game.add.group();
        this._bullets.enableBody = true;
        this._bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this._bullets.createMultiple(30, bulletName);
        this._bullets.setAll("checkWorldBounds", true);
        this._bullets.setAll("outOfBoundsKill", true);
        this._bullets.forEachAlive(function (item) {
            item.body.mass = 0.1;
        }, this);
    }
    Tank.prototype.update = function (shouldFire) {
        // If game over, do nothing.
        if (this._gameOver) {
            return this.getJson(undefined);
        }
        if (this._blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return this.getJson(undefined);
        }
        // Move.
        this.syncPosition();
        // Fire.
        var fire = undefined;
        if (shouldFire) {
            fire = this.fire(undefined);
        }
        // Return result.
        return this.getJson(fire);
    };
    Tank.prototype.updateByJson = function (params) {
        this.updateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    };
    Tank.prototype.drive = function (d) {
        if (this._gameOver) {
            return;
        }
        this.direction = d;
        var newAngle = MovementHelper.directionToAngle(d);
        var newSpeed = MovementHelper.directionToSpeed(d);
        if (newAngle != undefined) {
            this._tankbody.angle = newAngle;
        }
        this._tankbody.body.velocity.x = newSpeed.x;
        this._tankbody.body.velocity.y = newSpeed.y;
    };
    Tank.prototype.combat = function (another) {
        var _this = this;
        var self = this;
        // this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this._bullets.forEachAlive(function (item) {
            self._ownerGame.physics.arcade.collide(item, another._tankbody, function (bullet, another) { return Tank.onHit(bullet, another, self._ownerGame); });
        }, this);
        another._bullets.forEachAlive(function (item) {
            self._ownerGame.physics.arcade.collide(item, self._tankbody, function (bullet, another) {
                Tank.onHit(bullet, another, self._ownerGame);
                _this._blood -= Math.random() * damage;
            });
        }, this);
    };
    // #regions privates.
    Tank.prototype.syncPosition = function () {
        // First, move gun tower to point to mouse.
        var angle = Phaser.Math.angleBetweenPoints(this._ownerGame.input.activePointer.position, this._tankbody.body.position);
        this._guntower.angle = Phaser.Math.radToDeg(angle) - 90;
        // Second, force to coordinate the guntower, tankbody and blood text
        this._guntower.position = this._tankbody.position;
        this._bloodText.position = new Phaser.Point(this._tankbody.position.x, this._tankbody.position.y + bloodTextOffset);
        this._bloodText.text = this._blood;
    };
    Tank.prototype.shouldFire = function (firingTo) {
        return firingTo != undefined
            || (this._ownerGame.time.now > this.nextFireTime && this._bullets.countDead() > 0);
    };
    Tank.prototype.calculateTrajectory = function () {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        var randomAngleOffset = (Math.random() - 0.5) * angleOffsetBase;
        var theta = Phaser.Math.degToRad(this._guntower.angle) + randomAngleOffset;
        // Set-up constants.
        var halfLength = this._guntower.height / 2;
        var sinTheta = Math.sin(theta);
        var reverseCosTheta = -1 * Math.cos(theta);
        var tankPosition = this._tankbody.body.center;
        // Bullet start position and move to position.
        var startX = sinTheta * halfLength + tankPosition.x;
        var startY = reverseCosTheta * halfLength + tankPosition.y;
        var moveToX = startX + sinTheta * Number.MAX_VALUE;
        var moveToY = startY + reverseCosTheta * Number.MAX_VALUE;
        return { theta: theta, sinTheta: sinTheta, reverseCosTheta: reverseCosTheta,
            startX: startX, startY: startY, moveToX: moveToX, moveToY: moveToY };
    };
    Tank.prototype.fireInternal = function (startX, startY, moveToX, moveToY) {
        // Get bullet.
        var bullet = this._bullets.getFirstDead();
        bullet.angle = this._guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this._ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, bulletSpeed);
    };
    Tank.prototype.fire = function (firingTo) {
        if (firingTo === void 0) { firingTo = undefined; }
        if (!this.shouldFire(firingTo)) {
            return undefined;
        }
        // Set time.
        this.nextFireTime = this._ownerGame.time.now + fireRate;
        // Calculate the trajectory.
        var trajectory = this.calculateTrajectory();
        if (firingTo != undefined) {
            trajectory.theta = firingTo;
        }
        // Fire.
        this.fireInternal(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        // Just move the guntower a little bit to simulate the Newton's second law.
        var Newton = true;
        if (Newton) {
            var xguntowerOffset = -1 * trajectory.sinTheta * 5;
            var yguntowerOffset = -1 * trajectory.reverseCosTheta * 5;
            this._ownerGame.add.tween(this._guntower).to({ x: this._tankbody.position.x + xguntowerOffset, y: this._tankbody.position.y + yguntowerOffset }, 30, Phaser.Easing.Linear.None, true, 0, 0, true);
        }
        return trajectory.theta;
    };
    Tank.prototype.getJson = function (firingTo) {
        // If already died, just return an useless message.
        if (this._gameOver) {
            return {
                tankId: this.id,
                x: -1,
                y: -1,
                gunAngle: 0,
                tankAngle: 0,
                firing: undefined,
                blood: 0
            };
        }
        return {
            tankId: this.id,
            x: this._tankbody.position.x,
            y: this._tankbody.position.y,
            gunAngle: this._guntower.angle,
            tankAngle: this._tankbody.angle,
            firing: firingTo,
            blood: this._blood
        };
    };
    Tank.prototype.updateAsPuppet = function (gunAngle, tankAngle, position, firing, blood) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }
        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this._blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return;
        }
        this._guntower.angle = gunAngle;
        this._tankbody.angle = tankAngle;
        this._tankbody.body.velocity.x = 0;
        this._tankbody.body.velocity.y = 0;
        this._tankbody.position = position;
        this._guntower.position = position;
        this._bloodText.position = new Phaser.Point(position.x, position.y + bloodTextOffset);
        this._blood = blood;
        this._bloodText.text = blood;
        if (this._blood <= 0) {
            var self_1 = this;
            Tank.onExplode(self_1);
        }
        if (firing != undefined) {
            this.fire(firing);
        }
    };
    Tank.onExplode = function (self) {
        // Emit and destroy everything.
        var emitter = self._ownerGame.add.emitter(self._tankbody.position.x, self._tankbody.position.y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(500, 50);
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
    };
    Tank.onHit = function (bullet, another, game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        var emitter = game.add.emitter((bullet.x + another.body.x) / 2, (bullet.y + another.body.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    };
    return Tank;
}());
/// ********************************************************** /// 
